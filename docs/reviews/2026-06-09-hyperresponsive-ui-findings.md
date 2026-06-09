# Hyperresponsive Mastery UI — Rubric Gap Analysis (UI1–UI6)

Read-only audit of main 35743a4 vs docs/inspiration/hyper_responsive_ui.pdf. Verdict ~75%: STRONG on the
mastery/transfer axis (R5/R6/R8 — a 4-D gate with no back door, BKT, scaffold ladder, deterministic escalation,
a real-in-UX transfer moment, wired+tested skip-ahead), THIN on the "interface" axis the PDF foregrounds.
User decisions (2026-06-09): UI1 → build across ALL rooms; UI6 → build voice input.

## Requirement matrix (R1-R12)
PRESENT: R1 multimodal I/O, R3 manipulables, R5 mastery model, R6 false-positive+transfer, R7 coherence,
R8 adaptive remediation+skip-ahead, R9 content correctness, R12 taste. PARTIAL: R2 dynamic surface (UI1),
R4 stability policy (doc good, enforcement by-convention), R10 metrics (learning ones present; UI-responsiveness
ones absent → UI2), R11 deliverable docs (buried/missing → UI4/UI5).

## UI1 [P1] — Route scripted teaching stages through the adaptive engine (ALL rooms)
GAP (the headline): each room's hand-tuned teaching stages advance on a single correct through a FIXED ordered
STAGES arc (e.g. AppR4.jsx:64 "the five stages of the arc"); only the final ★Practice stage is engine-paced
(useGeneratedPractice.js). So the hyperresponsive surface is real on ~1 of ~5 stages. The team's own
docs/harness/limitations-memo.md admits it: "the live scripted-stage runtime advances on a single correct and
underuses this engine." FIX: route the scripted-stage advance/back through useLessonEngine's decision — at minimum
let RaiseScaffold/FadeScaffold move the stage index, so a child who stumbles on a TEACHING stage gets the same
morph the practice stage gives, and a strong child can skip ahead within the room. Build across all rooms
(AppR1/AppR4/AppM1/AppM2/AppM3/AppNumberLine/AppCompare/AppSubtract/LessonUnlikeDen + shared hooks). Preserve
work on every transition (preserveWork). route: plan-implementer + lesson-room-author (per-room stage↔scaffold map).
Evidence: AppR4.jsx:64, policy.ts (fade/raise never drives scripted stage advance), useGeneratedPractice.js.

## UI2 [P2] — Instrument UI-responsiveness counter-metrics
GAP: only learning counter-metrics exist (engineStore.js:29 metrics:{uiChurn}; MasteryInspector CounterMetrics =
3 learning metrics). None of the PDF's interface counter-metrics are measured: time-to-UI-change, intent→UI routing
accuracy, "did the learner understand why the UI changed", visual-helped-reasoning-vs-decorated,
responsiveness→dependence, sensor→false-confidence. FIX: add a UI-metrics record to engineStore — time-from-trigger
-to-decision (timestamp delta at the judged boundary), count of decisions whose RationaleBanner was acknowledged/
dismissed (proxy for "understood why"), stability-vs-churn rate; surface in MasteryInspector. route: plan-implementer.

## UI3 [P3] — In-product orientation check (HOLD for UI1)
GAP: state-model "Success Criteria" specifies "Orientation: can the child state goal / next / why-changed" but
nothing measures it. FIX: a lightweight, occasional 1-tap "what are you working on right now?" self-report (reuse
the AffectProbe.jsx pattern) logged as a Signal → a coherence counter-metric. route: plan-implementer + pedagogy.
ORDERING: touches room/shell layer — build AFTER UI1 merges.

## UI4 [P2] — Standalone UI-adaptation-policy + modality-rationale doc (docs only)
GAP: the (excellent) responsiveness/stability policy + modality choices are buried in the 780-line
docs/design/fraction-app-state-model.md (§6-7 tiers, §7 "refuses to auto-change", §10 modality layering); no
rubric-facing doc maps 1:1 to the PDF. FIX: author docs/design/ui-adaptation-policy.md — the T1/T2/T3 tiers, the
"refuses to auto-change" list, modality layering + WHY each modality (incl. camera-presence rationale), citing live
code. Also note UI6 voice-input status. route: docs.

## UI5 [P2] — Comparison vs static/chat baseline
GAP: the PDF requires a comparison against a static/chat baseline. The planned LLM-vs-deterministic comparison was
mooted when the LLM brain was cut (state-model:649); no static-UI baseline substituted. FIX: add a NO-ADAPTATION
control arm to the harness (engine path vs a fixed-scaffold/no-morph path over the synthetic personas — the harness
already runs the adaptive arm) and write up the delta (does adaptation reduce false-mastery / improve transfer?).
route: harness-triage (control arm) + docs (write-up).

## UI6 [P3] — Voice-prediction input (USER: BUILD; HOLD for UI1)
GAP: state-model §10 build-seq item 3 ("Voice prediction: say the sum before stacking — verbal pre-commitment is a
strong anti-pattern-match signal") was specced but never built; modality:'voice' exists only in the synthetic
persona library, never as a live control. FIX: implement a voice-prediction beat using the Web Speech API
(webkitSpeechRecognition) → transcribe the spoken number → verify against the expected answer BEFORE the manipulate
step; graceful fallback to typing where the API is unavailable; the prediction is a pre-commitment signal feeding the
engine (anti-pattern-match). route: plan-implementer. ORDERING: touches the room prediction beat — build AFTER UI1.

## Build order
NOW (parallel, conflict-safe): UI1 (rooms-wide), UI2 (engineStore metrics), UI4 (docs), UI5 (harness control+docs).
AFTER UI1 merges (they touch the room layer UI1 churns): UI3, UI6.
