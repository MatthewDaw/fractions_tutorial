# Wireframe → Real-App Parity Checklist

**Source of truth:** `docs/wireframe/` (React+Vite hi-fi wireframe).
**Target:** `web/` (the real app).
**Goal:** every wireframe screen/step is reproduced in the real app with **identity, structure, layout, AND fully-built-out interactivity** — not static stand-ins.

This is the rubric every audit/verify agent uses. Be **aggressive**: assume a gap exists until proven otherwise, and treat a step that *looks* right but isn't truly interactive as a FAILURE.

Per-lesson wireframe identity lives in `docs/wireframe/src/lessons/<id>.js` (and the inline `nl` in `docs/wireframe/src/lessons.js`). Per-step markup lives in `docs/wireframe/src/screens/room-<id>-*.js` in four slots: `stageHTML` (play area), `railHTML` (instruction/hint panel), `answerHTML` (equation/answer + Check), `tutorHTML` (Cook + ribbon).

> **Out of scope (owned elsewhere / already settled):** lesson `№` numbers, the "Lesson N ·" numeric prefix, and shelf/world ordering — do NOT change these; only flag if internally inconsistent. `backHref`/`href` registry fields are vestigial (app navigates via `onSelect`, not `href`) — tidy if editing the file anyway, never a blocker.

---

## A. Lesson set, merges & deletions (curriculum-level)

- [ ] **12 lessons exist** and resolve: m1, m3, den, num, nl, s1, r4, simp, r3, r2, cmp, r5.
- [ ] **nl absorbs r1** — nl is ONE 8-step lesson; steps 3–7 render the real r1 stages inline (NO "continues in another lesson" bridge/dead-end). r1 is **not** a standalone selectable world lesson (only a step host).
- [ ] **r4 has NO "Identify" step** (wireframe dropped it) — 7 steps starting at "Double".
- [ ] **cmp has the "Scale Up" step** (multiply to common bottom) — 7 steps.
- [ ] **m2 is deleted** (no AppM2/introM2/m2.css references anywhere).
- [ ] No orphaned/unreachable stages left behind by a merge or deletion.

## B. Identity & registry (per lesson)

- [ ] `id`, `title`, `route` match wireframe.
- [ ] tab strip: **count, order, `n` badges, `name`, `sub`** match wireframe exactly.
- [ ] tag descriptive suffix (text after "·") matches wireframe concept name.
- [ ] practice (`★`) step present and last.

## C. Step set & wiring (per lesson)

- [ ] Every wireframe step → exactly one app stage; **no missing, no extra**.
- [ ] App stage order == tab order.
- [ ] Stage-key map (`STAGE_BY_BADGE` / `STAGE_KEY_BY_BADGE` / `STAGE_IDS` / `BEAT_WIRING`) is consistent with the registry and `initialStage` is the first real step.
- [ ] Practice stage wired to the correct generator skill; show-work step present where the wireframe has one.

## D. Per-step interactivity — **THE CORE CHECK** (per step)

For each step, classify the app implementation as **FULLY_INTERACTIVE / PARTIAL / STATIC / MISSING** with evidence, against the wireframe's `stageHTML`/`answerHTML`. The wireframe markup is a static snapshot of an *intended interaction* — your job is to confirm the app builds out that interaction for real.

- [ ] **Manipulative present & live:** the play-area object exists AND does what's implied — draggable / tappable / sliceable / paintable / fillable / sortable / scoopable. A static picture where the wireframe implies manipulation = **FAIL**.
- [ ] **Core mechanic works:** the specific interaction (drag blocks onto a line, slice with the knife, paint 1/N cells, bundle every-2 cells, drag pieces off, pick a digit, write on the slate, drag < = >) is implemented and correctly gated.
- [ ] **Answer surface matches:** equation/slate/choice layout matches; locked vs editable slots correct; Check button + correct/incorrect feedback + stars/credit.
- [ ] **Progression:** solving advances to the next stage; engine attempt reported; mastery credited.
- [ ] **Guards/edge cases:** invalid input rejected, spill-back/over-fill handled, reset works.
- [ ] **Rail instruction + hint** present (instructions live in the rail now, not a top goal banner).
- [ ] **Tutor:** Cook/character + ribbon narration present; per-stage intro/status text matches intent.

## E. Visual / layout fidelity (per step)

- [ ] Renders through the shared shell (LessonShell + 4-zone LessonBoard).
- [ ] No overflow/collision (Slate cells capped; canvas/diagram clipped; Cook+ribbon clear of Check; `.joinbtn` positioned correctly).
- [ ] Stage scales to viewport (FitStage); proportions match the wireframe.

## F. Audio / voice (per lesson)

- [ ] Per-stage voice cue keys wired; intro cue sheet (`intro<ID>.js`) + video present where the wireframe has an intro.
- [ ] Referenced clips exist under `web/public/voice/` (or degrade silently, never crash).
- [ ] Settings volume + background music respected.

## G. Engine / mastery (per lesson)

- [ ] `nodeId` maps to a real skill node; practice generator exists (den/num ride FRACTION_ON_LINE with a documented placeholder — acceptable, flag only).
- [ ] Scaffold-level mapping present; mastery map drives world badges; concept map reflects skills.

## H. Non-lesson screens

- [ ] title, world, shelf-found/build/combine, kitchen (+ per-lesson kitchen word problems), review, settings, concepts, intro, empty-room each match their wireframe (layout, controls, navigation targets).
- [ ] Every navigation control routes to the correct hash route; no dead links; unbuilt ids → empty-room.

## I. Gates (whole app)

- [ ] `npm run build` clean (from `web/`).
- [ ] `npm run test` (vitest) green.
- [ ] No runtime console/page errors on a click-through of each screen.
- [ ] Playwright/visual click-through of changed screens confirms the mechanic actually runs.

---

### Severity rubric
- **BLOCKER** — step missing, mechanic absent/broken, dead-end navigation, build/test failure.
- **MAJOR** — wrong/partial interactivity, wrong step set, visible identity/copy mismatch, layout collision.
- **MINOR** — cosmetic text, vestigial field, comment drift.
