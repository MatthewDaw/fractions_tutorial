# Hyperresponsive-UI Re-assessment → Mounting batch (UI7–UI11)

Round-2 re-assessment of the app vs hyper_responsive_ui.pdf after the UI1–UI6 batch merged.
Verdict ~82% (up from ~75%). CLOSED: R2 (engine-paced teaching, all 9 rooms), R10 (UI metrics + static control arm), R11 (docs). STILL-OPEN: R1 voice-input, R7 coherence — because the built components are NEVER MOUNTED.

Headline finding: the remaining gap is missing WIRING, not missing code. UI3 OrientationProbe + UI6 VoicePredictionBeat are complete + tested but have zero imports/JSX usages; recordCoherence() has no caller; the pre-existing AffectProbe is also orphaned. Mounting these → ~90%.

Live-UX caveat: keep every mounted probe OCCASIONAL, SKIPPABLE, NON-BLOCKING (the components already enforce this); reversible. Do not make a child reorient every turn (R12 taste). Pedagogy-curriculum-reviewer signs off cadence/copy.

## UI7 [P1] — Mount VoicePredictionBeat into the room prediction beat (close R1 voice input)
VoicePredictionBeat.jsx (UI6) + runtime/voicePrediction.js are complete/tested but never mounted. Mount the beat
above the manipulative in the generated-practice surface for fraction/integer skills (supportsVoicePrediction filters
mixed/relation). onPredict(result, signal) is advisory — feed `signal` as a pre-commitment anti-pattern-match Signal,
NOT a gate input. Web Speech API with the existing typing fallback (jsdom-safe). Opt-in (no auto-mic). route: plan-implementer + lesson-room-author.

## UI8 [P1] — Mount OrientationProbe at an occasional boundary + wire recordCoherence (close R7)
OrientationProbe.jsx + orientationReport.js grader + engineStore.recordCoherence (no caller) all exist. Add a single
occasional parent-governed cadence boundary (e.g. once every N problems, never mid-attempt) that renders
<OrientationProbe open=… onReport={k => recordCoherence(evaluateOrientationReport(k, expected).coherent)} />. Skippable,
non-blocking. The expected goal/why comes from the current room/engine decision. route: plan-implementer + pedagogy-curriculum-reviewer (cadence/copy).

## UI9 [P2] — Mount AffectProbe via the SAME cadence governor (pre-existing orphan)
AffectProbe.jsx (the sibling pattern) is also never mounted. Reuse UI8's cadence governor so one boundary serves both
self-report probes (don't double-prompt). Keep it occasional/skippable. route: plan-implementer + pedagogy.
(UI8 + UI9 are best built together — one governor, two probes.)

## UI10 [P2] — DONE (fixed on main dba4616): UI5 arm-comparison converted from a dead-path doc generator to a CI-safe smoke test.

## UI11 [P3] — Enforce the R4 "refuses to auto-change" policy with a guard test
ui-adaptation-policy.md documents the stability tiers but nothing tests that the engine refuses T3 auto-changes
off-boundary. Add a guard test asserting no structural morph occurs mid-attempt / outside the judged boundary. route: plan-implementer + eng.

## Also still dormant (not in this batch): R5 gate-hardening flags are merged but DEFAULT-OFF pending T28 certification.
