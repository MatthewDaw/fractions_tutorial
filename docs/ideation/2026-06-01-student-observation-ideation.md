---
date: 2026-06-01
topic: student-observation-affect
focus: best standard techniques for watching a student use the app
mode: repo-grounded
---

# Ideation: Watching the Student — Observation, Affect & Attention

## Grounding Context (Codebase)

The app is a client-side Vite + React fraction tutor for a young early-elementary
child on a **tablet**. An in-progress **affect/signal layer** exists only as *seams*:
`Signal{type,payload,confidence,t,actor}` and an `affect_window` stub on `Observation`
(currently `readonly never[]`), a structural **firewall** asserting affect never reaches
the mastery gate, and a `recentBehavior` buffer with an empty affect slot read by
`policy.ts`/`tier2.js`. No MediaPipe, capture, AffectState, smoothing, or Signal emission
exists yet. (These seam files are owned by a running build workflow.)

Load-bearing constraints from `student-state-measurement.md` §6.1 and
`fraction-app-state-model.md` §6:
- **Firewall:** every passive observation is a `Signal` (no-op on game state); the mastery
  gate (`P_known≥0.95 ∧ scaffold-independent ∧ transfer-passed ∧ fluency-OK`) has **no affect
  term, by construction**. Affect may influence pacing/scaffold/hint/escalation/disambiguation
  only.
- **Corroboration:** "affect raises a hypothesis; behavior confirms it." Affect alone never
  triggers anything consequential; escalation needs behavioral corroboration.
- **Must earn its place:** a counter-metric tracks whether affect beats behavior-only; if not,
  it gets cut.
- **Privacy:** on-device inference, derived labels only, **no raw video stored/transmitted**.
- Already-coded behavioral signals: `too_fast_correct` (latency<1200ms), `self_corrections`
  (oscillation), `error_signature` fingerprints, `hint_dependence`. Named-but-unbuilt: idle,
  latency-stall, rapid-submit, attention-away.

External grounding: Baker **sensor-free affect detection** (boredom/confusion/frustration/
engagement from logs, AUC 0.61–0.87, often ≈ cameras); wheel-spinning detectable by attempt 3;
gaming-the-system = fast random guessing; D'Mello (intervene at **boredom** before the cascade);
control-theory **derivative > level**; SRE **per-host (per-child) baselining**; multimodal
fusion beats single sensor; Duolingo infers struggle camera-free at scale. Regulatory: **EU AI
Act Art. 5 bans emotion recognition from biometrics in education**; **COPPA-2025** makes facial
templates → verifiable parental consent; **head-pose presence ≠ emotion inference** (far safer).

## Topic Axes

- A1 Sensor-free behavioral telemetry
- A2 Camera / affect sensing (what MediaPipe should compute / avoid)
- A3 Signal fusion & inference (corroboration, windowing, per-child baselining, transitions)
- A4 Observation → pedagogy mapping (watching becomes a tutoring move, under the firewall)
- A5 Trust, privacy & accountability (consent UX, counter-metrics, dashboards, regulatory fit)

## Ranked Ideas

### 1. Behavioral layer first; the camera must *beat $0* to ship
**Description:** Finish the cheap, timestamp-only signals (idle, latency-stall, rapid-submit,
abandoned/"orphaned" manipulations) before any MediaPipe. The camera becomes a challenger
scored by ablation against behavior-only, not a premise.
**Axis:** A1
**Basis:** `direct:` the doc's "if affect doesn't beat behavior-only, it gets cut" + coded
`too_fast_correct`/`self_corrections`/`hint_dependence`; `external:` Baker sensor-free (≈ cameras),
Duolingo camera-free at 600M users.
**Rationale:** Makes the most-scrutinized, most-regulated component optional-by-evidence and
de-risks the whole feature; the behavioral layer is also the corroboration the camera depends on.
**Downsides:** Delays the demo-friendly camera work.
**Confidence:** 92% · **Complexity:** Low–Med · **Status:** Unexplored

### 2. Camera (if any) = non-biometric presence + validity gate, never an emotion classifier
**Description:** MediaPipe answers two booleans only — "is one child's face oriented at the
screen?" and "is the sensor valid right now?" A distinct `sensor_unavailable` state (so occlusion
≠ `attention:away`); a single locked primary face (so a helping parent's frown can't nudge the
child). No valence, FACS, or emotion label. Sole job: disambiguate idle = thinking vs. left.
**Axis:** A2
**Basis:** `external:` EU AI Act bans education emotion inference; COPPA-2025 biometric consent;
"head-pose presence ≠ emotion inference"; `reasoned:` a 6-year-old's tablet is the worst-case mount.
**Rationale:** Removes the banned/inaccurate part of the camera and keeps one defensible,
behavior-complementary signal.
**Downsides:** Abandons the "delight/frustration camera" ambition.
**Confidence:** 88% · **Complexity:** Med · **Status:** Unexplored

### 3. Ask, don't infer: a diegetic self-report companion that doubles as the gold label
**Description:** Rarely, at a T3 boundary the child already paused on, Babushka asks "tricky, or
easy-peasy?" with two tappable faces. The tap is a corroborated Signal (discarded if behavior
contradicts) — consented, reader-friendly, and the ground-truth label any inferred affect model
must beat.
**Axis:** A4 / A2
**Basis:** `external:` D'Mello (boredom/confusion are reportable; intervene early); a solicited tap
is a survey, not biometric emotion recognition; `reasoned:` self-report *generates* the validation
labels.
**Rationale:** Sidesteps the inference ban entirely and turns the counter-metric from a vibe into a
measurement.
**Downsides:** Over-use interrupts flow; position-bias risk (testable via the distractible persona).
**Confidence:** 80% · **Complexity:** Low · **Status:** Unexplored

### 4. Per-child self-baseline on the latency residual; act on the derivative
**Description:** Never cohort thresholds. Model expected latency from item difficulty + the child's
rolling baseline; the **residual** is both the signal and its own calibration. Run **observe-only**
during cold-start; keep a transient detector so a single sharp event isn't smoothed away.
**Axis:** A1 / A3
**Basis:** `external:` SRE per-host baselining, control-theory derivative>level, Baker; `direct:`
replaces the fixed `latencyFloorMs=1200` that mislabels naturally slow/fast kids.
**Rationale:** Cuts the #1 source of false labels in young children (baseline variance) and makes
the signal sensitive to *change*, which prior art says is what predicts.
**Downsides:** Cold-start blindness in session one (mitigated by within-session drift).
**Confidence:** 85% · **Complexity:** Med · **Status:** Unexplored

### 5. Corroboration as arithmetic + an affect precision ledger (the counter-metric)
**Description:** No single channel trips an intervention — a weighted composite (idle + latency-creep
+ presence-away + hint-spend) crosses a band mapped to T1/T2/T3. Every affect-raised hypothesis is
logged with whether behavior later confirmed it, weighted by intervention severity. Includes a
nudge-fatigue governor (dismissed offers throttle further offers).
**Axis:** A3 / A5
**Basis:** `external:` hospital NEWS2 track-and-trigger, Kalman sensor-fusion, multimodal fusion;
`direct:` the firewall's "affect raises, behavior confirms."
**Rationale:** One artifact serves three jobs — the "earn its place" number, threshold-tuning data,
and the regulatory audit trail — and stops the watcher from doom-looping the child it's "helping."
**Downsides:** Weight table needs tuning (persona harness can seed it).
**Confidence:** 83% · **Complexity:** Med · **Status:** Unexplored

### 6. Make the firewall a CI invariant, not a promise
**Description:** Each build, replay a stored session with affect fields stripped; if any
`MasteryEstimate` changes, fail the build. Add a lint that fails if an affect-tagged Signal has a
code path into the gate, plus an enforced anti-pattern suite banning engagement-farming. Short TTL
on derived labels so no longitudinal affect dossier accumulates.
**Axis:** A5
**Basis:** `reasoned:` the firewall is currently prose-asserted; `direct:` `mastery.ts` already
claims structural impossibility — mechanize it.
**Rationale:** Converts the COPPA/AI-Act story from "we promise" to "verifiable by inspection."
**Downsides:** Modest CI plumbing.
**Confidence:** 86% · **Complexity:** Low · **Status:** Unexplored

### 7. One signal path for real + synthetic children → calibration warm-start + teacher dashboard
**Description:** Make `Signal` self-describing with a `context_hash` (item, scaffold, hint state,
Chain-A estimate) and route one stream to live inference, a replay log, and the persona harness's
assertions. Personas then ship a versioned warm-start parameter file; the escalation **decision
journal** (`trigger → hypothesis → action → child_response_after`) becomes the dashboard's data
model and the policy-improvement dataset.
**Axis:** A3 / A4
**Basis:** `direct:` the persona harness is a core asset meant to calibrate the factorial-HMM behind
`MasteryEstimate`; `reasoned:` a join key is cheap now, impossible to backfill.
**Rationale:** Observation compounds into calibration, transparency, and debuggability instead of
evaporating.
**Downsides:** Schema discipline up front.
**Confidence:** 81% · **Complexity:** Med · **Status:** Unexplored

## Rejection Summary

| # | Idea | Reason |
|---|------|--------|
| 1 | Sterile-cockpit phase gating | Folded → #1/#5 (where to spend inference budget) |
| 2 | Boredom-budget ("time-since-last-reactable-moment") | Folded → #3/#4 as a cheap target metric |
| 3 | WoZ-tutor imitation & "perfect free camera" oracle benchmark | Folded → #1 as ablation/validation method |
| 4 | Human-tutor "glance" (low-rate, salience-gated, decay TTL) | Folded → #2/#6 (no-dossier design) |
| 5 | Orphaned-object / abandoned-manipulation signal | Folded → #1 (a concrete cheap signal) |
| 6 | System-watches-itself (tutor spend ledger) | Folded → #5 composite (hint-spend channel) |
| 7 | Discrete facial-emotion classification (valence/FACS) | Rejected — AI-Act/COPPA exposure + poor child accuracy; superseded by #2 |
| 8 | Cloud session-replay/heatmap tools (FullStory, Hotjar) | Rejected — COPPA-hostile, overkill; kept only their signal taxonomy |
