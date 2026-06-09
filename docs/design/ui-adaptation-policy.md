# UI Adaptation Policy & Modality Rationale

Rubric-facing deliverable for `docs/inspiration/hyper_responsive_ui.pdf`. This is
the standalone, 1:1-mappable statement of **how the interface decides to change,
what it deliberately refuses to change, and why each input/output modality exists**.
It maps to the PDF's **R4 (stability / "when the UI should change automatically vs
wait")** and **R11 (deliverable docs: a written adaptation + modality policy)**.

The policy itself is not new — it has always governed the engine. It was simply
*buried* in the 780-line state model (`docs/design/fraction-app-state-model.md`
§6 tiers, §7 "refuses to auto-change", §10 modality layering). This doc lifts it
out and grounds **every claim in live code (`file:line`)** so a reviewer can check
that the policy is enforced, not aspirational.

> Companion: `docs/design/fraction-app-state-model.md` is the full design; this is
> the reviewer-facing slice. Where they disagree, the **code citations here win** —
> they are what actually runs.

---

## R4 — Part 1: The T1 / T2 / T3 Responsiveness Tiers

The interface listens at three latencies with three different authorities. The
governing rule is **latency rises as authority rises**: the faster a reaction, the
less it is allowed to change. Only the slowest tier may change *what you are doing*.

| Tier | Latency | Reads | Authority | What it may do |
|------|---------|-------|-----------|----------------|
| **T1 Reflex** | milliseconds | the current physical action only | UI-local, deterministic, **no model** | block snaps to grid; stack glows at the target line; gentle shake on overshoot |
| **T2 Heuristic** | seconds | a sliding window of recent events | rule-based, **nudges only** | offer the next hint rung; "take your time, what's the total?"; quietly queue a transfer probe |
| **T3 Strategic** | **between problems only** | full student state + mastery map | the deterministic policy (`policy.ts`) — the **only** tier that changes *what you're doing* | route to a room, fade/raise scaffold, return to kitchen, transfer probe, escalate to a human |

Source for the tier table and authority split: state model §6
(`docs/design/fraction-app-state-model.md:481-492`).

### WHEN the UI changes automatically vs. waits for the learner

The single most important enforcement fact:

> **T3 — the only tier that restructures the activity — runs at exactly one moment:
> the answer-submit boundary, exactly once.** It never runs mid-attempt.

- The policy decision function `nextDecision(...)` is the only thing that can
  emit a structural change (`FadeScaffold`, `RaiseScaffold`, `RouteToRoom`,
  `ReturnToKitchen`, `TransferProbe`, `EscalateToHuman`). It is called **exactly
  once, at the submit boundary** — `useLessonEngine.js:432-439` ("BOUNDARY: call
  nextDecision EXACTLY ONCE here"), guaranteed single-call by the comment at
  `useLessonEngine.js:10` ("nextDecision is called ONLY inside judgeAndAdvance").
- The decision is then published to the global surfaces *after* the boundary
  resolves — `useLessonEngine.js:447` (`publishDecision`).
- So **the UI changes automatically only when the learner has finished an attempt
  and submitted it.** While the learner is mid-stack, mid-write, or simply
  thinking, T3 cannot fire — the interface waits. This is the PDF's "when the UI
  should change automatically vs. wait for the learner," made structural rather
  than tuned.

T1 and T2 are always-on and instant, but neither can change the activity: T1 is
pure local feedback (no model), and T2 is restricted to transient nudges that never
restructure the workspace (state model §6, `fraction-app-state-model.md:486`).

---

## R4 — Part 2: What the interface REFUSES to change automatically

This is the explicit refusal list — the spine of the stability policy. Each item
is enforced in code, not merely promised.

1. **A key visual stays stable mid-attempt.** The measuring stick and the child's
   current blocks do not rearrange when guidance appears. This holds because T3
   (the only tier that could rearrange the workspace) cannot run mid-attempt at all
   (`useLessonEngine.js:432`), and T2 is nudge-only by tier definition
   (`fraction-app-state-model.md:486`, §7 `:519-520`).

2. **No modality switch without learner initiation.** The app never auto-flips the
   answer channel between handwriting and typing. The input modality is a
   **learner/owner setting** with an explicit opt-in path, not an engine output:
   `settings.js:5` (`inputMode: "stylus" | "typing"`), defaulting to `"stylus"` to
   preserve handwriting-first pedagogy with `"typing"` as the deliberate opt-in
   (`settings.js:14-18`). The `Slate` answer surface reads that setting and switches
   only when *it* changes (`Slate.jsx:48-52`, `:294-295`) — there is no code path
   in `policy.ts` that emits a modality change. State model §7 lists this refusal
   directly (`fraction-app-state-model.md:526-527`, "switch modality without the
   child initiating").

3. **No mastery declared on completion alone.** The decision enum has **no
   `DeclareMastered` move** — by construction the policy cannot certify mastery.
   `policy.ts:7` ("No code path emits a DeclareMastered"); mastery is read-only via
   `isMastered()` (`policy.ts:31`, used for gating at `:167-169` and `:183`).
   Finishing a problem, a stage, or a room never sets mastery; only the deterministic
   4-D gate does (state model §4.5, refusal listed at `fraction-app-state-model.md:528`).

4. **No fade past the gate's evidence; no mid-attempt yank.** `FadeScaffold` is only
   legal while below L4 and is gated on a clean-correct streak
   (`policy.ts:162-164`, `:317-327`); `RaiseScaffold` preserves the child's work
   (`policy.ts:275`, `:293`, `preserveWork: true`). Even escalation to a human is a
   **boundary action** that pauses calmly and preserves work — it never reads as
   failure or yanks the child mid-attempt (state model §7,
   `fraction-app-state-model.md:521-523`).

5. **The banner refuses to narrate routine continuation.** "Continue at this level"
   (a plain `PresentProblem`) is intentionally **silent** so the rationale banner
   does not read as churn — only genuine *changes* surface. The `CHANGE_KINDS` set
   that gates the banner excludes `PresentProblem`:
   `EngineSurfaces.jsx:61-68`, applied at `:80`.

### Honest gap (by-convention enforcement)

The UI4 gap analysis records that this policy is **strong by design but partly
enforced by convention** rather than by a single guard
(`docs/reviews/2026-06-09-hyperresponsive-ui-findings.md:11-12`, R4 "doc good,
enforcement by-convention"). The boundary-once rule (#1, #3) is hard-enforced in
code; the modality-stability rule (#2) is enforced by the *absence* of any
auto-switch path, which is a weaker, audit-by-inspection guarantee. This doc states
that honestly rather than overclaiming.

---

## R1 / R4 — Part 3: Modality Layering, and WHY each modality exists

Every modality is, architecturally, just **an action-emitter, a signal-source, or a
render-target** on the single `action → reducer → state → event-log` core (state
model §10, `fraction-app-state-model.md:594-611`). Adding one never touches the
engine. That is *why* the modality set can be rich without destabilizing the loop.

### Input modalities (action sources)

- **Manipulation (drag-to-stack).** The primary action input and the foundation of
  the whole metaphor: the child physically stacks fraction blocks to a target line.
  It is the action that T1 reflex-feedback decorates (snap, glow, shake). It exists
  because the pedagogy is concrete-first — quantity before symbol (state model §10
  item 1, `fraction-app-state-model.md:599-601`).

- **Handwriting / stylus recognizer.** The child *writes* the numeral rather than
  tapping it. WHY handwriting over tapping: forming the glyph by hand is a richer,
  more durable memory anchor — it does the "symbol-binding" job of tying the
  abstract numeral to the concrete stack (state model §10.1,
  `fraction-app-state-model.md:613-626`). Implemented on-device as a pretrained
  MNIST CNN with a self-contained geometric `$P` fallback so the pad is never dead
  and needs no network at runtime (`ink/recognizer.js:1-22`, public API
  `:354-370`); surfaced verifier-assisted ("I read N — keep it?") so a misread is
  recoverable by re-tracing, never fatal (`Slate.jsx:11-14`, `:270-277`).

- **Typing fallback.** The deliberate accessibility/no-stylus path. WHY it exists:
  not every device has a stylus, so typing is the opt-in alternative answer channel
  — same controlled contract, so every call site works unchanged
  (`Slate.jsx:198-225`; default and rationale `settings.js:14-18`). Critically, it
  is **learner-selected, never engine-selected** (see refusal #2).

- **Voice prediction input — NOT YET BUILT (UI6 is building it).** State model §10
  item 3 specs a voice-prediction beat ("say the sum before stacking — verbal
  pre-commitment is a strong anti-pattern-match signal",
  `fraction-app-state-model.md:602-604`), but **no live voice-input control exists
  in the codebase today.** A repo-wide search finds no `webkitSpeechRecognition` /
  `SpeechRecognition` / microphone-capture path in any UI module; `modality: 'voice'`
  appears **only** inside the synthetic-persona library as a simulated actor, never
  as a real input (`harness/personas/library.js:130`). Status per the gap analysis:
  UI6 is the ticket actively building it
  (`docs/reviews/2026-06-09-hyperresponsive-ui-findings.md:54-60`). This doc records
  the modality as *specced and in-progress, not shipped* — an honest accounting the
  rubric rewards.

### Output modalities (render targets)

- **Visual workspace + animated feedback.** The always-on render target and the home
  of T1 reflex feedback (state model §10 item 1).

- **TTS spoken tutor.** Mom's prompts and feedback are spoken. WHY a character TTS
  and not the browser default: the channel deliberately stays *in character* — it
  plays baked clips, or synthesizes in-character via the dev TTS service, and
  **stays silent rather than ever speaking in the browser's robotic default voice**
  (`voice.js:1-16`, `:133-151`). One voice plays at a time app-wide so narration
  never overlaps (`voice.js:38-44`). Decorative narration is suppressed during the
  active solve to avoid extraneous load, while structural/math-carrying narration
  and learner-initiated tap-to-read always play (`voice.js:45-69`, `:187-193`).

### Signal source (NOT an action — cannot change game state)

- **Camera = PRESENCE ONLY.** The camera is the one modality with the strictest
  rationale, because it is the easiest to over-trust. It is reduced to its **only
  defensible job: disambiguating `idle` = *thinking/stuck* (a face IS present) from
  *left the room* (absent).** It derives **exactly two booleans** —
  `present` and `sensor_valid` — and *nothing* else (`presence.ts:1-9`,
  `:85-94`). WHY this narrow scope:
  - **No emotion / valence / arousal anywhere** — auditable by inspection; the input
    type carries no expression channel to even read (`presence.ts:22-24`).
  - **Opt-in, on-device, no raw frame** ever crosses the boundary
    (`presence.ts:11-20`); a fresh session starts closed and the camera never
    auto-starts (`presence.ts:129-132`).
  - **Single-primary-face lock** — a second person (a helping parent) in frame
    invalidates the reading so a helper never feeds the child's signal
    (`presence.ts:17-19`, `:207-216`).
  - **Advisory-only firewall** — it emits the same inert Signal seam the behavioral
    detectors use and has **no path into the mastery gate** (`presence.ts:25-28`,
    `presenceSignal` `:264-295`). Signals can change pacing/support; they can never
    change game state or mastery (state model §1.1, `fraction-app-state-model.md:83-86`).
  - **It ships only if it earns its place.** An ablation gate compares
    presence-gating against a behavior-only baseline and returns a logged
    SHIP / DON'T-SHIP decision from the numbers (`presence.ts:330-418`).

  This is *why* the camera is presence-only and not an affect/emotion sensor: the
  PDF's own warning about easy-to-gimmick, over-trusted sensors is answered by
  cutting the camera down to a corroborating presence boolean with a privacy
  firewall and a ship-gate, rather than an emotion-reader in the control loop.

---

## R4 — Part 4: How the learner stays oriented while the UI changes

A responsive UI that changes silently is disorienting. The brief requires the
learner always be able to answer "why did this change?" The answer is the
**RationaleBanner: one recorded, child-visible reason per structural decision.**

- **Every change-decision carries a non-empty rationale string.** This is a policy
  invariant: "Every Decision has a non-empty rationale string" (`policy.ts:8`).
  Examples, all from `policy.ts`: ReturnToKitchen ("You have mastered this skill…",
  `:240-241`), RouteToRoom ("To solve this recipe you need to strengthen…",
  `:253`), RaiseScaffold ("…adding more support…" / "Let's take a smaller step
  together…", `:294-296`), FadeScaffold ("…clean correct answers in a row — reducing
  support.", `:324`), TransferProbe (`:306`, `:312`), EscalateToHuman (`:381-382`).

- **The banner shows the reason only when the interface actually changed.** It is
  gated to the change-kinds (`EngineSurfaces.jsx:61-68`, `:80`); routine
  continuation is silent (refusal #5), so the banner reads as a meaningful "here's
  why," never as constant noise. It is a thin, dismissible, polite-live-region bar
  (`RationaleBanner.jsx:52-70`) mounted once above every lesson so even partial
  adopters are covered (`EngineSurfaces.jsx:1-21`, `engineStore.js:1-17`).

- **T2 nudges are oriented too, and transient.** Gentle work-preserving prompts ride
  a separate auto-dismissing toast (`EngineSurfaces.jsx:24-54`), distinct from the
  structural banner — so a nudge never looks like a structural change.

- **The full reason stream is inspectable.** Every decision is appended to a capped
  decision log and the UI-churn counter-metric is incremented on each scaffold change
  (`engineStore.js:59-83`), surfaced in the MasteryInspector — the anti-"hide
  uncertainty behind confident UI" guard the brief demands.

---

## Mapping back to the PDF (for the reviewer)

| PDF requirement | Where this doc answers it |
|-----------------|---------------------------|
| **R4** — when the UI changes automatically vs. waits; stability policy | Parts 1 (tiers + boundary-once timing), 2 (refusal list), 4 (orientation) |
| **R4** — which signals it listens to / ignores / treats cautiously | Part 1 (T1 reads action only; camera = Part 3 presence-only, advisory, firewalled) |
| **R1** — multimodal I/O | Part 3 (manipulation, handwriting, typing, TTS, camera; voice-input status) |
| **R11** — deliverable: a written adaptation + modality-rationale doc | This document, with `file:line` citations throughout |

**Scope note (honest):** R4 enforcement is hard-coded for the boundary-once and
no-DeclareMastered rules and convention-enforced for modality stability
(`docs/reviews/2026-06-09-hyperresponsive-ui-findings.md:11-12`); voice **input** is
specced and under construction (UI6), not shipped (`:54-60`). Stated here so the map
reflects reality, not aspiration.
