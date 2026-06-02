# Handoff: finish engine-surfaces wiring + validation

## What's already done (do NOT redo)
Closing plan-002 gaps against `docs/inspiration/hyper_responsive_ui.pdf`. All 517 tests + build green as of handoff.

**New files (mine):**
- `web/src/runtime/engineStore.js` — React-free observable singleton (decision, rationale, masteryMap, decisionLog, metrics.uiChurn, nudge). publish/subscribe/reset.
- `web/src/runtime/useEngineStore.js` — useSyncExternalStore binding.
- `web/src/ui/EngineSurfaces.jsx` — mounts RationaleBanner + Tier-2 nudge toast + MasteryInspector from the store. Banner gated to CHANGE_KINDS (Fade/Raise/TransferProbe/RouteToRoom/ReturnToKitchen/Escalate) so routine PresentProblem doesn't churn.
- `web/src/styles/engine-surfaces.css`
- `web/tests/runtime/test_engine_surfaces.test.jsx` (11 tests)

**Edited (mine — leave other pre-existing working-tree changes alone):**
- `web/src/runtime/useLessonEngine.js` — publishDecision at boundary; too_fast_correct→pendingTransferProbe via tier2; **scaffold-sync on problem_present** (policy currentScaffold now tracks lesson stage).
- `web/src/runtime/useLessonScaffold.js` — wrapped emit tracks lastInteractionT; idle/oscillation Tier-2 watcher publishes nudges.
- `web/src/Shell.jsx` — mounts `<EngineSurfaces>`; inspector gated to import.meta.env.DEV.
- `web/src/AppR4.jsx` — Numbers/Words/Applied stages: engine `correct` gated on full reduction (`fully = gcd===1`); not-simplified → correct:false + not_simplified + stars:2 (UX unchanged). **This is the bug fix; verified in browser: log shows correct:false, sig not_simplified, stars 2.**
- `web/tests/runtime/test_stage_lessons_emission.test.jsx` + `web/tests/e2e/playability_smoke.test.jsx` — stale-selector fixes (drag-merge helper via MouseEvent, tab indices, WordProblem mock slots default, footer copy).

**Already verified in browser (localhost:5173, dev server running):**
- App boots, no console errors. World map renders. Lesson board renders.
- Mastery Inspector mounts (toggle bottom-left), shows per-node table + counter-metrics + decision log.
- Rationale banner renders. After the anti-churn + scaffold-sync fix, RaiseScaffold banner fires live: "After N errors, adding more support…".
- AppR4 fix confirmed in engine log.

Browse binary: `$HOME/.claude/skills/gstack/browse/dist/browse`. To get text inputs instead of stylus: Settings → click "Typing" (or the lesson slate stays handwriting-canvas). Skip intros via buttons matching /skip/i then /continue to the lesson/i.

## Remaining work
1. **Investigate the "5 errors" count.** On the Numbers stage I submitted two wrong answers (1/5) but the RaiseScaffold rationale said "After 5 errors". Confirm whether consecutiveErrors is over-counting (e.g. a wrong submit fires reportAttempt more than once, or gradeSlate path double-reports) or it's just accumulated session state. Check AppR4 `gradeSlate`/`submitNumbers` and `useLessonEngine._updatePolicyState`. Fix if it's a real double-count.
2. **Polish surface positioning.** In a live lesson the RationaleBanner (bottom-center) overlaps the cook character and the inspector panel overlaps the board. Screenshot a lesson with the banner up and confirm nothing critical (answer area, Check button, manipulatives) is covered. Adjust z-index/offsets in `engine-surfaces.css` if needed. Keep it tasteful (Soviet/old-paper theme).
3. **Validate the happy path end-to-end.** Drive a Numbers-stage correct, fully-simplified answer (2/3 for 8/12) → confirm engine log `correct:true`, sig null, stars 3. Then drive a clean streak if feasible to see a FadeScaffold ("reducing support") banner live. Screenshot.
4. **Spot-check other lessons:** R1 (drag merge in real browser — confirm Stage 1 merge works with real pointer events), and MomsRoom wall routing if reachable. No console errors.
5. **Tier-2 nudges live:** confirm the oscillation/idle toast actually appears (e.g. wiggle place/remove >3 times on a manipulative stage, or idle 8s) — screenshot. If the watcher never fires in practice, note why.
6. **Final:** `cd web && npx vitest run` (expect all green) and `npx vite build` (expect success). Report a concise findings summary with screenshots and any fixes applied. Do NOT commit unless asked.

## Constraints
- Stay within `web/`. Don't touch the unrelated pre-existing working-tree changes (intros, WorldMap, ConceptMap, conceptTree, world.css, rooms.js) except where they intersect your task.
- R4 equivalence framing is a locked design (memory `r4-simplify-equivalence-reframe`): the lesson UX staying encouraging on a 2-star equivalent is intentional; only the engine signal is gated. Don't change the lesson's felt flow.
- All object manipulation is drag-only (tap-to-place is a bug).
