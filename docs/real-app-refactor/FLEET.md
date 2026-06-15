# FLEET — Ready-to-Launch Fan-Out

Execute `PLAN.md` §B Foundation FIRST (solo, sequential). Then fan out page agents per the waves below. **Every agent runs in its own git worktree** (`git worktree add ../wt-<key> -b refactor/<key> <integration-branch>`), runs the mandatory Playwright recipe (PLAN.md §D), and opens a PR against the integration branch. Definition of done = PLAN.md §G.

---

## Phase 0 — Foundation (SEQUENTIAL, lands first)

One agent, one branch `refactor/foundation`:
- **F1** Create `web/src/lessons/{m1,m3,nl,r1,r2,r3,r4,r5,s1,cmp,den,num}.js` + `index.js` (LESSONS). Port from `docs/wireframe/src/lessons/*.js`; AUTHOR new `r1.js` and `nl.js` (no wireframe source). Additive only — no component imports it yet.
- **F2** Verify/JSDoc `LessonShell` `tabs:{stages:{key,badge,title,sub},current,onSelect}` + `band`/`goal` contract; confirm `LessonBoard` split/wide unchanged.
- **F3** Add helpers `useLessonIdentity` / `stagesFromRegistry` (new files, additive).
- **F4** Gate: build clean · vitest green · dev boots 5173 · Playwright `#/world` zero errors.

**No page agent launches until F4 passes.**

---

## File-ownership matrix

| Key | Owns (edit) | Reads (frozen) | Contention |
|-----|-------------|----------------|-----------|
| m1 | AppM1.jsx, m1.css | lessons/m1.js, LessonShell, LessonBoard | none |
| m3 | AppM3.jsx, m3.css | lessons/m3.js, shell | none |
| nl | AppNumberLine.jsx | lessons/nl.js (authored F1) | none |
| r1 | AppR1.jsx | lessons/r1.js (authored F1) | none |
| r2 | **LessonUnlikeDen.jsx**, r2 css | lessons/r2.js | **SHARED w/ r3** |
| r3 | **LessonUnlikeDen.jsx**, r3 css | lessons/r3.js | **SHARED w/ r2** |
| r4 | AppR4.jsx, r4.css | lessons/r4.js | none |
| r5 | AppR5.jsx, r5.css | lessons/r5.js | none |
| s1 | AppSubtract.jsx, s1.css | lessons/s1.js | none |
| cmp | AppCompare.jsx, cmp.css | lessons/cmp.js | none |
| den | **AppDen.jsx (new)**, den.css, **Shell.jsx**, WorldMap.jsx | lessons/den.js | **Shell.jsx + WorldMap (router/map)** |
| num | **AppNum.jsx (new)**, num.css, **Shell.jsx**, WorldMap.jsx | lessons/num.js | **Shell.jsx + WorldMap (router/map)** |
| world-map | WorldMap.jsx, world.css, **NEW shared chrome** | rooms.js | **FabBar/CardNode/MasteryBadge (shared)** |
| title | TitleScreen.jsx, title.css | shared chrome | **FabBar/Corner/FStrip/reveal (shared)** |
| settings | SettingsScreen.jsx, settings.css | settings.js | **SceneFrame/HeaderLayout/useRevealStagger (shared)** |
| intro | RoomIntro.jsx, world.css | rooms.js/registry | **CtrlButton + registry cues (shared)** |
| mom | MomsRoom.jsx, momsroom.css | kitchenProgress.js, engine | **KitchenShell/AnswerCard/MasteryDisplay (shared); engine** |
| review | MixedReview.jsx, mixreview.css | generators | **SceneFrame/TutorRibbon (shared)** |

**Frozen for all page agents:** `web/src/lessons/*.js`, `LessonShell.jsx`, `LessonBoard.jsx`, `lesson-board.css`, `tokens.css`. Any needed change there = flag contention, serialize, do NOT edit silently.

---

## Launch waves

### Wave 1 — Lesson shell-wiring (PARALLEL, fully disjoint files)
`m1` · `m3` · `s1` · `cmp` · `r4` · `r5` · `nl` · `r1`
- All consume the registry + LessonShell; no shared component files. Safe to run concurrently. (nl is XL — Stage-1 redesign; r1 authors-then-consumes lessons/r1.js already created in F1.)

### Wave 2 — Serialized shared-component pair
`r2` → then `r3`
- Same `LessonUnlikeDen.jsx`. Run r2 to completion + land, then r3 rebases onto it. NEVER concurrent. (Or assign BOTH to one agent.)

### Wave 3 — NEW lessons (serialized on router)
`den` → then `num`
- Both edit `Shell.jsx` + `WorldMap.jsx`. den first (adds route + map card), num rebases. Verify engine skill nodes exist before practice wiring.

### Wave 4 — Standalone scenes + shared chrome extraction (LATE, partly serialized)
`settings` (extract SceneFrame/HeaderLayout/useRevealStagger) → `title` (FabBar/Corner/FStrip) → `world-map` (FabBar/CardNode/MasteryBadge/TrailSVG) → `intro` (CtrlButton + registry cues) → `mom` (KitchenShell/AnswerCard) → `review` (SceneFrame/TutorRibbon).
- These create/modify SHARED chrome components → serialize to avoid churn. Order chosen so the most-reused primitives (SceneFrame, FabBar) land first and later scenes consume them. `world-map` must coordinate with den/num for the new lesson cards (land den/num first if possible).

---

## Counts
- **Foundation steps:** F1–F4 (registry, shell contract, helpers, gate).
- **Page work orders:** 16 (m1, m3, nl, r1, r2, r3, r4, r5, s1, cmp, world-map, title, settings, intro, mom, review) **+ 2 NEW** (den, num) = **18 total**.
- **Waves:** 1 parallel (8) · 2 serialized pair · 3 serialized new-lessons (2) · 4 serialized scenes (6).
