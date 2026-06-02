---
title: "feat: Student-observation layer — behavioral telemetry, corroboration, self-report, and a presence-only camera"
type: feat
status: draft
date: 2026-06-01
phase: companion to 002
origin:
  - docs/ideation/2026-06-01-student-observation-ideation.md
  - docs/design/student-state-measurement.md (§1.1, §4.5, §4.7, §6.1)
  - docs/design/fraction-app-state-model.md (§5.5, §6)
  - docs/plans/2026-05-31-002-feat-mastery-adaptive-flow-plan.md (owns the engine seams)
stack: Headless TS engine (web/src/engine/) + React UI; on-device MediaPipe (deferred to Phase 4)
---

# feat: Student-Observation Layer (Affect, Attention & Behavior)

## Summary

Turn the **affect/signal seams** that plan 002's workflow is building into a working
observation layer — **without** turning it into the gimmicky emotion-camera the brief warns
against. The throughline from ideation: **watch behavior first, demote the camera to a
non-biometric gate, ask the child when unsure, judge everything by whether it beats
behavior-only, and make the firewall a build-time invariant.**

This plan sequences seven decisions into a dependency-ordered rollout. Each phase emits only
`Signal` events (no-ops on game state per the firewall) and feeds the `recentBehavior` buffer
that `policy.ts`/`tier2.js` already read. Nothing here can touch the mastery gate — and Phase 0
makes that mechanical rather than promised.

## Coordination constraint (read first)

A running build workflow **owns** these files; this plan must **not** edit them directly:
`web/src/engine/{types,observation,dimensions,mastery,gate,policy}.ts`, `web/src/runtime/tier2.js`.
They define `Signal`, the `affect_window` stub, the firewall asserts, and the `recentBehavior`
affect slot. Where a phase below needs a change *inside* those files (e.g. a new `Signal` type, a
`context_hash` field), it is written as a **typed request to that workflow**, not a direct edit.
Everything else lands in **new** files (`web/src/engine/observe/*`, `web/src/runtime/affect/*`,
`web/src/ui/*`) that consume the seams.

## Locked decisions (from ideation survivors)

1. **Sequencing: behavior-first.** The behavioral telemetry layer is the floor; the camera is a
   challenger that must beat behavior-only on a held-out ablation before it ships. (S1)
2. **The camera is a presence/validity gate, not an emotion classifier.** MediaPipe emits two
   booleans — `present` (one child's face oriented at screen) and `sensor_valid` — and **no**
   valence/FACS/emotion label, ever. (S2)
3. **Self-report is a first-class, consented signal** and the gold-standard label the inferred
   layer is graded against. (S3)
4. **Baselines are per-child and relative.** Act on the latency *residual* and its derivative,
   never a cohort threshold. (S4)
5. **No single channel intervenes.** A weighted composite crosses a band; every affect hypothesis
   is logged-vs-confirmed in a precision ledger that *is* the "earn its place" counter-metric. (S5)
6. **The firewall is a CI invariant** (strip-affect-replay diff + provenance lint), not a doc. (S6)
7. **One signal path** serves real children, the replay log, and the persona harness; observation
   compounds into a warm-start param file and a teacher dashboard. (S7)

---

## Phased work

### Phase 0 — Decide-now seams & guardrails (S6 + S7, cheap-now/impossible-later)

These are small but **irreversible if skipped**, so they go first. Mostly typed requests to the
seam-owning workflow + new CI.

- **`context_hash` on every `Signal`** — a compact hash of `{item_id, scaffold_level, hint_state,
  P_known_at_emission}`. Trivial at emit; unlocks unlimited after-the-fact slicing for tuning, the
  dashboard, and harness validation. *(Request to `types.ts` owner.)*
- **`sensor_unavailable` as a distinct signal type** reserved now, so Phase 4 occlusion never
  masquerades as `attention:away`. *(Request to `types.ts` owner.)*
- **Derived-label TTL** — affect-derived labels expire in seconds; the system cannot accumulate a
  longitudinal affect dossier (privacy-by-construction).
- **Firewall CI** (new, lands immediately): (a) a test that replays a stored log with all affect
  fields stripped and **fails the build if any `MasteryEstimate` field changes**; (b) a lint that
  fails if any affect-tagged `Signal` has a static code path into `gate.ts`; (c) an "anti-pattern"
  assertion banning engagement-farming hooks (variable-ratio reward tied to detected boredom, dwell
  maximization). New file: `web/src/engine/__firewall__/`.

**Exit:** affect cannot reach mastery without turning CI red; every Signal is queryable by context.

### Phase 1 — Behavioral telemetry completion + per-child baseline (S1, S4)

The sensor-free floor. All new files under `web/src/engine/observe/`.

- Emit the **named-but-unbuilt** behavioral signals as `Signal`s: `idle`, `latency_stall`,
  `rapid_submit` (submit without working), and **`orphaned_interaction`** (a piece dragged and
  abandoned, a numerator typed then deleted — the silent wheel-spin logs miss).
- **Latency-residual baseline:** model expected latency from item difficulty + the child's rolling
  EWMA; the residual is the signal *and* its own calibration. **Replaces** the fixed
  `latencyFloorMs = 1200` in `too_fast_correct` with a per-child residual (request: have the seam
  read a residual fn, default to today's constant when no baseline yet).
- **Cold-start = observe-only:** signals are logged but raise zero nudges until N attempts establish
  a baseline; fall back to within-session drift (first ~3 problems as the control).
- **Transient detector** in parallel with smoothing, so one sharp event (violent scribble-out, an
  8-second freeze) survives the low-pass filter.

**Exit:** the app detects boredom/stall/wheel-spinning from interaction alone, per-child, with no
camera — the baseline the camera must beat.

### Phase 2 — Corroboration engine + precision ledger (S5)

New: `web/src/runtime/affect/`. This is what fills the `recentBehavior` affect slot.

- **Composite early-warning score** (NEWS2-style): weighted points for idle + latency-creep +
  hint-spend + (later) presence-away; banded → T1/T2/T3. **No single channel at max can cross a
  band alone** — corroboration as arithmetic.
- **`AffectState` produced from behavior** first: `{engagement, attention, confidence}` derived from
  the composite (valence stays `neutral` until self-report/camera exist). Smoothed ~1–2 Hz, windowed
  onto each attempt's `affect_window`.
- **Precision ledger:** every affect-raised hypothesis logged with `{trigger, hypothesis, action,
  behavior_confirmed?, severity}`. This is the **counter-metric artifact** — affect's
  precision-without-behavior, weighted by intervention cost.
- **Nudge-fatigue governor:** a per-child intervention budget; dismissed offers throttle further
  offers so the watcher can't manufacture the disengagement it then detects.

**Exit:** behavior-only adaptation runs end-to-end through T2/T3, and the ledger can report whether
any added signal earns its place.

### Phase 3 — Self-report companion (S3)

New UI: `web/src/ui/AffectProbe.*`. Highest value-per-effort; also produces the labels everything
else is graded on.

- At rare T3 boundaries (where the child already paused), Babushka asks "tricky, or easy-peasy?"
  with two big tappable faces (reader-safe, in-fiction).
- The tap is a **corroborated `Signal`** — discarded if behavior flatly contradicts (an "easy!"
  after three wrong answers).
- The tap is the **gold label** written to the ledger and the harness, so inferred affect (Phase 2,
  Phase 4) is scored against the child's own report.

**Exit:** a consented, non-biometric affect channel exists, and the counter-metric has ground truth.

### Phase 4 — Presence/validity camera gate (S2) — gated on the Phase 2 ledger

Only now, and only if the ledger says a presence signal would resolve real ambiguity. New:
`web/src/runtime/affect/presence.ts` + opt-in consent UI.

- **On-device MediaPipe Face Landmarker** computing two booleans: `present` (head-pose oriented at
  screen) and `sensor_valid`; emit `sensor_unavailable` when invalid. **Lock a single primary face**
  (largest/closest box) and **suppress** on `multiple_faces`/`face_switched` so a helping parent
  never feeds the child's signal. **No emotion/valence channel exists in the code path** — auditable
  by inspection (ties to Phase 0 lint).
- Its only job: disambiguate `idle` = *thinking/stuck* (present) vs. *left the room* (absent),
  resolving the one signal behavior alone can't.
- **Opt-in**, on-device, no raw frames stored/transmitted, derived booleans only.
- **Ablation gate:** ships only if presence-gating measurably cuts false idle-nags / improves
  intervention precision in the ledger vs. behavior-only. If not, it's cut — as the design demands.

**Exit:** a defensible, regulator-legible camera use — or a logged decision not to ship one.

### Phase 5 — Compounding payoff (S7)

- **One signal path:** real children and the synthetic personas emit through the identical codepath,
  so every detector is born with a harness fixture and a calibration label.
- **Warm-start param file:** personas (anxious/distractible/stuck/normal-but-slow) write a versioned
  emission/transition parameter set that real-child inference boots from — pre-launch calibration
  behind the stable `MasteryEstimate` interface.
- **Teacher/parent dashboard** rendered from the escalation **decision journal**
  (`trigger → hypothesis → action → child_response_after`) — and, as a fallback if in-loop adaptation
  never beats behavior-only, observation can earn its place on *insight value alone* (caregiver report
  only, zero gameplay effect — the firewall taken to its limit).

**Exit:** observation compounds into calibration, transparency, and policy-improvement data.

---

## Validation (the persona harness is the test bench)

- Every detector is exercised by the synthetic personas through the Phase 5 shared path **before** any
  real child: the *distractible* persona stress-tests false `away`/idle; *normal-but-slow* must **not**
  fire stall/escalation; *immovably-stuck* must trip escalation; *guesser* must trip rapid-submit.
- The **precision ledger** is the running scorecard for "must earn its place." Each new signal (and the
  camera) is kept only if it improves precision/outcomes over the behavior-only baseline.
- Phase 0 firewall CI runs every build.

## Privacy & regulatory posture

On-device only; derived labels with short TTL; no raw video; opt-in camera. The camera carries **no
emotion-inference code path** (EU AI Act Art. 5), and presence booleans are not biometric templates
(COPPA-2025) since nothing is retained. Self-report (Phase 3) is a survey, outside the emotion-
recognition prohibition. The strip-affect-replay CI test is the artifact a COPPA/AI-Act reviewer can
run themselves.

## Success metrics / counter-metrics

- **Primary counter-metric:** does each added signal (esp. the camera) beat behavior-only on
  intervention precision and downstream outcomes? (ledger) If no → cut.
- False-intervention rate weighted by severity (a false escalation ≫ a false "take your time").
- Escalation: false-escalation rate (human says child was fine) and miss rate; `normal-but-slow` must
  not fire.
- Nudge-fatigue: interventions-per-child capped; dismissal rate trends down, not up.

## Open questions

- O1 — Latency-residual difficulty model: per-item calibration source pre-pilot (lean on persona
  warm-start)?
- O2 — Composite weight table: hand-seeded from personas, or learned? Start hand-seeded.
- O3 — Self-report cadence: how rare is "rare" before it reads as nagging? A/B in the harness.
- O4 — Does presence-gating clear the ablation bar at all, or is behavior-only sufficient? (Phase 4
  is explicitly allowed to end in "don't ship the camera.")
- O5 — Dashboard surface: in-app for a parent, or an export? Out of scope until Phase 5.
