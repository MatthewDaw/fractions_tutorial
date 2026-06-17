# Wireframe → App Lesson-Room Distillation Spec

Authoritative, read-only structural distillation of how the **real app's lesson
rooms** diverge from the **wireframe** (the source of truth), plus a sequenced
execution plan a fan-out of fix agents can run from.

- Wireframe (source of truth): `docs/wireframe/src/**`
- App (must change): `web/src/**`
- Scope: the 12 lesson rooms `m1, m3, den, num, nl, s1, r4, simp, r3, r2, cmp, r5`.
- **Out of scope / DO NOT TOUCH** (an in-flight kitchen rebuild owns these):
  `web/src/kitchen/*`, `web/src/components/kitchen/*`, `web/src/MomsRoom.jsx`,
  `web/src/momsProblems.js`, `web/src/lessons/mom.js`, `web/src/styles/kitchen.css`.

> Status note: this document is the spec. It plans an eventual distillation; it
> does not itself change any code.

---

## 0. The one-paragraph problem

The wireframe expresses each lesson **step** as a tiny **data module** (≈40–150
lines) — four verbatim HTML slots (`stageHTML / railHTML / answerHTML /
tutorHTML`) fed into one shared `<LessonScreen>` chrome, with shared **string
builders** (`eqBox.js`, `manip.js`, `cookSvg.js`, `showWork.js`, `compare.js`)
emitting the visual primitives. The app expresses each lesson as a **single large
stateful React component** (`AppM1.jsx` ≈820 lines, `LessonUnlikeDen.jsx`
≈1359 lines) that branches per stage and renders bespoke React assets. They are
**not the same architecture, not the same chrome semantics, not the same
assets, and not the same per-step structure.** The wireframe also made three
deliberate chrome decisions the app never adopted: (a) the **top goal banner is
removed**, (b) the **tutor ribbon is hidden by default** (corrective-only), and
(c) **all instructions live in the rail panel**, with **Read-aloud relocated into
the rail**. The app still renders a persistent `<LessonGoal>` banner and an
always-on `<TutorRibbon>` in every room.

---

## 1. SCHEMA DIFF — board/chrome contract

### 1.1 Wireframe contract (`docs/wireframe/src/shell/LessonScreen.jsx`)

Data-shape (LessonScreen.jsx:21–32). A page is **data**:

```
{ kind:"lesson", lesson:"<id>",         // identity resolved from lessons.js
  railW=396, footH=196, lboardClass,    // board dimensions/variant
  goalHTML,                             // (vestigial — see 1.3)
  stageHTML, railHTML, answerHTML, tutorHTML,  // 4 verbatim HTML slots
  belowHTML }                           // escape hatch (display:contents)
```

Rendering model (LessonScreen.jsx:95–161):
- **Toolbar** + **topbar identity** (num-mark / tag / title / controls) + shared
  `<StageTabs lesson tabs>` — chrome rendered once.
- The **top goal banner is intentionally gone** (LessonScreen.jsx:129–131).
- The board is one CSS-grid `.lboard` with **four named slots** rendered as
  `dangerouslySetInnerHTML` of the room's HTML strings (LessonScreen.jsx:144–154),
  sized by `--lboard-rail-w` / `--lboard-foot-h` (railW/footH), `footH` floored to
  196 (LessonScreen.jsx:93).
- **Read-aloud is injected as the rail's first child** (`READ_ALOUD` const +
  `READ_ALOUD + data.railHTML`, LessonScreen.jsx:38–43, 150).
- `belowHTML` is the escape hatch for pages that don't fit the 4-slot grid
  (wide word-problem / practice frame), rendered `display:contents`
  (LessonScreen.jsx:141–142).

### 1.2 App contract (`web/src/components/lesson/*` + `useLessonScaffold.js`)

The app already ships the equivalent shared layer — **and the board grid is the
same CSS** (`web/src/styles/lesson-board.css` `.lboard`, split + wide + is-norail
variants), so the play-area layout is NOT the divergence. The divergence is in
the **chrome React tree** and the **per-stage render model**:

- `LessonShell` (LessonShell.jsx:61–108): renders topbar identity, `<StageTabs>`,
  then `{band}{goal}{children}{extra}` in order. It **always renders the goal
  node** if passed and has **no notion of "instructions live in the rail."**
- `LessonBoard` (LessonBoard.jsx:38–74): React-node slots `stage/rail/answer/
  tutor/content` (vs the wireframe's 4 HTML strings) — variants `split` / `wide`
  / `is-norail`. Sizing via `railWidth/footHeight/tutorWidth` props (vs
  `railW/footH` data fields). **Structurally equivalent; props vs data fields.**
- `LessonGoal` (LessonGoal.jsx): a standalone `.goal` banner with its own
  Read-aloud speaker + voiced caption — the exact block the wireframe **deleted**
  and **relocated into the rail**.
- `TutorRibbon` (TutorRibbon.jsx): Cook + ribbon, **always mounted** by every
  room. Wireframe `wf-shell.css:247–249` hides `.lboard-tutor .ribbon` by default.
- `HintRail` / `AnswerBar`: faithful React equivalents of the wireframe's
  `.panel` and `.lbar` HTML; these MATCH.
- `useLessonScaffold.js`: the controller backbone (engine wiring, stage nav,
  outcome state, generated-practice + adaptive-teaching). **No wireframe analog**
  — the wireframe is static snapshots with no engine. This is additive app logic
  that the distillation must PRESERVE, not remove.

### 1.3 Where they structurally diverge

| Concern | Wireframe (truth) | App (today) | Action |
|---|---|---|---|
| Per-step unit | data module, 4 HTML slots | one big stateful component, per-stage React branches | keep app's stateful model; re-skin slots to match |
| Goal banner | **removed**; LessonScreen never renders `goalHTML` (LessonScreen.jsx:129) | `<LessonGoal>` rendered every stage (e.g. AppM1.jsx:421–425, 802) | **remove the goal banner**; move its copy into the rail panel |
| Instructions | live in the **rail `.panel .hint`** (room-m1.js:30) | split across LessonGoal banner + HintRail + QuestionBand | consolidate into the rail |
| Read-aloud | injected into the **rail** (LessonScreen.jsx:150) | lives on the **goal banner** (LessonGoal.jsx:18–21) | relocate Read-aloud into the rail |
| Tutor ribbon | **hidden by default**, corrective-only (wf-shell.css:247) | always visible (TutorRibbon mounted every stage) | hide ribbon unless `status.tone === "warn"` / corrective |
| In-canvas captions | **removed** (`#stage .lboard-stage [class*="-cap"]{display:none}` wf-shell.css:240) | rooms still render `*-cap` notes inside the stage (e.g. m1-numbers-cap AppM1.jsx:652) | drop in-stage captions |
| QuestionBand | **does not exist** anywhere in the wireframe | mounted under tabs on most stages (AppM1.jsx:401, 801) | **delete** — it is an app-only block (see §2.3) |
| Sizing | `railW`/`footH` data, footH floored ≥196 | `railWidth`/`footHeight` props, ad-hoc per stage (160/140/150…) | normalize to wireframe values per room |
| Answer caption | dropped site-wide in wireframe (`#stage .lbar-cap{display:none}` wf-shell.css:156) | `<AnswerBar cap=…>` rendered | drop or hide caption |

**What the shared shell needs so a room can be a faithful distillation of the
wireframe's 4 slots:**

1. `LessonShell` must support **no goal banner** (a flag / simply stop passing
   `goal`), and instead accept the instruction copy as the **first rail card**.
2. A shared **`RailReadAloud`** affordance (the wireframe's `READ_ALOUD` pill) to
   live at the top of the rail column (mirror `wf-shell.css:251–257`).
3. `TutorRibbon` must default to **hidden/idle** and only show on a corrective
   `status` (mirror wf-shell.css:247–249); rooms stop relying on it for the
   resting instruction.
4. Confirm `LessonBoard` prop→CSS-var mapping equals the wireframe's
   railW/footH semantics (it does today; just need to pass the wireframe values).
5. Keep `belowHTML`'s equivalent: the app already has `variant="wide"` for the
   word-problem layout — that is the app's escape hatch and matches intent.

---

## 2. ASSET / PRIMITIVE DIFF

### 2.1 Builder → app-component mapping

| Wireframe builder (file) | Emits | App counterpart | Status |
|---|---|---|---|
| `eqBox(cols,rows,shaded)` (eqBox.js:11) | `.eq-box` grid of `.eq-cell` + guide edge | inline `EqBox` in AppR4.jsx:65, `GroupBar`/`SimpBox` in AppSimp.jsx | RE-IMPLEMENTED per-room (not shared) |
| `cellBox(n,k)` (eqBox.js:27) | square that tiles n, first k inked | inline `CellBox` (AppCompare.jsx:454, SVG rects) | STRUCTURALLY DIFFERENT (SVG vs grid divs) |
| `eqFrac(n,d)` (eqBox.js:37) | `.eq-frac` big glyph | `BigFrac.jsx` / inline `EqFrac` (AppR4.jsx:100) | DIVERGENT markup; multiple copies |
| `mixRuler(num,den,wholes)` (eqBox.js:45) | `.mix-ruler` strip + labels | inline `MixRuler` (AppR5.jsx:93) | RE-IMPLEMENTED per-room |
| `mixedNum / mixedSlots` (eqBox.js:60,81) | mixed-number glyph + fill slots | inline `MixedNumDisplay` (AppR5.jsx:132) | RE-IMPLEMENTED |
| `digitGrid(on)` (eqBox.js:67) | 0–9 two-column pill picker | inline `DigitGrid` copied into AppR4 (135), AppR5 (65), AppDen (92), AppNum (129) | **DUPLICATED 4×**, no shared owner |
| `fracSlots(n,d,active)` (eqBox.js:78) | fill-in fraction with active slot | app uses `Slate`/`FracSlate` + a den→num **gate** (AppR5.jsx:285) | DIVERGENT (app adds an ordering gate not in WF) |
| `eqTools(sizes)` (eqBox.js:89) | ×k / ÷k knife rack | inline `EqTool` (AppR4.jsx:116) | RE-IMPLEMENTED |
| `jar(k)` / `plum` / `tray` / `rep` / `pickle` / `pebble` (manip.js) | kitchen tokens | `SkipJar.jsx`, `PlateGroup.jsx`, `SkipLine.jsx` | STRUCTURALLY DIFFERENT (interactive React vs static SVG) |
| `tutor(ribbon)` + `COOK_SVG` (cookSvg.js) | Cook + ribbon HTML | `Cook.jsx` + `TutorRibbon.jsx` | MATCH in spirit; app version always-visible (see §1) |
| `showWork(hint)` (showWork.js) | full-bleed BlankSlate scratch sheet | `BlankSlate.jsx` | MATCH in spirit |
| `symbin()` / `cmpDrag()` (compare.js) | `< = >` drag bin + drop slot | inline `DragAnswer`/`ChoiceAnswer` (AppCompare.jsx:502,597) | RE-IMPLEMENTED per-room |
| ruler (room-den.js / room-num.js local helper) | partition ruler strip | inline `Ruler`/`RulerStrip` (AppNum.jsx:86, AppCompare.jsx:484) | RE-IMPLEMENTED |

### 2.2 Systemic finding

The wireframe has **one shared builder per primitive**; the app has the **same
primitive re-implemented inline in each room** (`DigitGrid` exists as a private
component in 4 files, `EqBox`/`eqFrac`/`mixRuler`/`eqTools`/`cellBox`/`cmpDrag`
each re-implemented). There is **no shared eqBox/manip/compare equivalent in
`web/src/components/*`** — the app's shared layer covers chrome (lesson/*) but NOT
the visual primitives. Distillation should port the wireframe builders into a
small shared **app asset module** (React components or class-emitting helpers)
so every room draws the box/fraction/ruler/digit-grid identically.

### 2.3 App element blocks with NO wireframe equivalent (deletion / consolidation candidates)

- **`QuestionBand`** (`web/src/components/QuestionBand.jsx`) — mounted under tabs
  in m1/m3/nl/s1/r1/den/num/simp. **No wireframe analog.** Either delete or fold
  the question into the rail/stage to match the wireframe.
- **Persistent `LessonGoal` banner** — see §1.3.
- **Always-on `TutorRibbon`** — see §1.3.
- **Applied "setup gate"** (count×size / a+b transcription, AppM1.jsx:306–326,
  660–716; LessonUnlikeDen Applied beat) — app-only interaction gate, no WF slot.
- **`FitStage` wrapper** in AppR5 (no wireframe equivalent; wireframe relies on
  `useStageFit`).
- **Custom HUD layout** for Workbench stage in AppM1.jsx:611–636 / AppR1 stage 4 —
  bypasses `LessonBoard` entirely, breaking the uniform 4-zone grid.
- **`DenominatorPicker` / `InkPad`** in LessonUnlikeDen — app-only; the WF r2/r3
  snapshot only has the knife drag.
- **den→num answer gate** in AppR5 (the wireframe `fracSlots` is always open).

### 2.4 Wireframe blocks with NO app equivalent (must be ADDED)

- The wireframe's **rail-as-instruction** model (the `.panel .hint` carrying the
  task copy) — app rail is a thinner HintRail.
- The wireframe's **concept "lock card"** in the rail (`.m1-lockcard`,
  `.lockcard` in room-s1.js:58) — present in some app rails, missing in others;
  audit per room.
- `showwork` step parity: wireframe has show-work steps for m1/m3/nl(r1)/r2/r3
  (`room-*-sw-showwork.js`); app has them too but some rooms (r4/simp/r5/cmp)
  **lack the showwork step the registry doesn't list** — that's consistent, no
  action, but verify against `web/src/lessons/<id>.js` tabs.

---

## 3. PER-ROOM DELTA (severity: 🟥 high / 🟧 med / 🟩 low)

Registry tab arcs are **shared/identical** (`web/src/lessons/<id>.js` mirrors
`docs/wireframe/src/lessons.js`), so the divergence is in chrome + assets +
per-step rendering, not the step list.

### m1 — Equal Groups · `AppM1.jsx` ↔ `room-m1*.js` — 🟥
- Goal banner present (AppM1.jsx:421–425, 802) vs WF rail-only (room-m1.js:30).
- QuestionBand mounted (AppM1.jsx:401, 801) — no WF analog.
- Tutor always on (AppM1.jsx:428).
- Stage 4 Workbench uses **custom HUD**, bypasses LessonBoard (AppM1.jsx:611–636).
- Setup gate on Applied (AppM1.jsx:660–716) — app-only.
- Assets: `PlateGroup`/`BlockSandbox` vs WF `jar()`/inline pelmeni (room-m1.js:18).

### m3 — Times Facts · `AppM3.jsx` ↔ `room-m3*.js` — 🟥
- Same chrome trio (goal AppM3.jsx:404, QuestionBand 431, tutor 438).
- Stage 4 Workbench BlockSandbox (AppM3.jsx:588).
- Assets: `SkipJar`/`SkipLine` (AppM3.jsx:475,552) vs WF `pebble()`/inline jars.

### den — The Bottom Number · `AppDen.jsx` ↔ `room-den*.js` — 🟧
- Goal banner (AppDen.jsx:310), tutor (314), QuestionBand (318, hidden stage 6+).
- Inline `DigitGrid` (AppDen.jsx:92) + `SquareBox` (114) duplicate WF `digitGrid()`
  / `eqBox` (room-den.js:21).
- Inline per-stage rulers (AppDen.jsx:409+) vs WF `ruler()` helper.
- footHeight=150/railWidth=340 vs WF defaults — normalize.

### num — The Top Number · `AppNum.jsx` ↔ `room-num*.js` — 🟧
- Goal (AppNum.jsx:372), tutor (376), QuestionBand (380).
- Inline `Frac`/`Ruler`/`SquareBox`/`DigitGrid`/`FracSlate` (AppNum.jsx:75–148,
  353–368) all duplicate WF builders.

### nl — Same Denominators · `AppNumberLine.jsx` ↔ `room-nl*.js` — 🟥
- **Merges the r1 addition stages inline** by delegating to `<AppR1 mergeHost>`
  (AppNumberLine.jsx:168–196) — a structural coupling with no WF analog (WF keeps
  `room-nl*.js` and `room-r1*.js` separate). High blast radius.
- Goal (321), tutor (334), QuestionBand (543).
- Assets: `NumberLine.jsx`/`BigFrac` vs WF hand-coded `.nbar`/`.plank`/`.nl-ghost-slot`
  (room-nl.js:22–61).

### s1 — Taking Away · `AppSubtract.jsx` ↔ `room-s1*.js` — 🟧
- Goal (327), tutor (350), QuestionBand (632, hidden stage 4+).
- Inline `UnitRow` (AppSubtract.jsx:86–111) vs WF inline `.s1-piece` rows
  (room-s1.js:27–48). footH=140 matches WF (room-s1.js:10).

### r4 — Equivalent Fractions · `AppR4.jsx` ↔ `room-r4*.js` — 🟧
- Goal (AppR4.jsx:523), tutor (528). No QuestionBand here (good).
- Inline `EqBox`/`EqFrac`/`EqTool`/`DigitGrid`/`BigFracInline` (AppR4.jsx:65–168)
  duplicate WF `eqBox`/`eqFrac`/`eqTools`/`digitGrid` (room-r4-2-bind.js:6).
- Sort stage: app uses a **drag-ghost portal** (AppR4.jsx:913–936); WF uses the
  4-slot model (room-r4-7-sort.js).

### simp — Simplify · `AppSimp.jsx` ↔ `room-simp*.js` — 🟧
- Goal (AppSimp.jsx:381), tutor (395), **QuestionBand (387–393) — no WF analog**.
- Inline `GroupBar`/`SimpBox` (AppSimp.jsx:58–102,766) vs WF `eqBox()` + `eqTools`
  divide-mode (room-simp.js, room-simp-4-gcf.js).
- App-only "fewest/meter" display (AppSimp.jsx:655–666).

### r3 — Scale One · `LessonUnlikeDen.jsx` (id "r3") ↔ `room-r3*.js` — 🟥
- **Beat model, not stage tabs.** `BEAT_WIRING` / `NEXT_BEAT`
  (LessonUnlikeDen.jsx:40–51,174) define a 10-beat ladder
  (L0,L2,L4,L5,L6,SMP,LA,SW,L7,practice); the WF has per-step rooms keyed to the
  registry tab arc (room-r3.js + room-r3-*.js). Mapping is **not 1:1**.
- App-only: `DenominatorPicker`, `InkPad`, `Combined()` strip, SMP/LA/SW beats as
  bespoke layouts. Partial adopter of useLessonScaffold (its own beat nav).
- Goal IS rendered for r3 (WF room-r3.js:13 has goalHTML) — but per §1.3 the WF
  shell hides the banner anyway; still move copy to rail.

### r2 — Cross-Multiply · `LessonUnlikeDen.jsx` (id "r2") ↔ `room-r2*.js` — 🟥
- Same beat-model divergence as r3 (shared file).
- Goal **suppressed** for r2 (LessonUnlikeDen.jsx:875 `goal={showCross?null:Goal}`)
  — matches WF room-r2.js (no goalHTML). One correct case; keep.
- SMP example differs by lesson (r2: 14/30→7/15; r3: 3/6→1/2).

### cmp — Compare & Check · `AppCompare.jsx` ↔ `room-cmp*.js` — 🟧
- Goal (AppCompare.jsx:128–134, per-stage `stageGoal()`), tutor (134). No AnswerBar
  — inline `ChoiceAnswer`/`DragAnswer` (502,597).
- Inline `CellBox`/`RulerStrip`/`DigitPicker`/`MulRow` (AppCompare.jsx:454–591)
  duplicate WF `cellBox()`/`cmpChoices`/`cmpDrag` (room-cmp.js:5–20, room-cmp-scale.js).

### r5 — Mixed Numbers · `AppR5.jsx` ↔ `room-r5*.js` — 🟥
- Goal (AppR5.jsx:402–413), tutor (400). Custom `NEXT_STAGE` advance map (30–37).
- `FitStage` wrapper (440) — no WF analog. den→num **answer gate** (285) — WF
  `fracSlots` always open (room-r5.js:18).
- Inline `MixRuler`/`MixedNumDisplay`/`BigFracDisplay`/`DigitGrid` (AppR5.jsx:65–142)
  duplicate WF `mixRuler`/`mixedNum`/`eqFrac`/`digitGrid`.

---

## 4. EXECUTION PLAN

The work is sequenced so a **shared foundation** lands first, then per-lesson
waves run in **parallel with disjoint file ownership**. Each lesson's `App*.jsx`
is owned by exactly one unit; shared files are touched only in the foundation
wave or by a single named owner.

### Wave F (Foundation — must land FIRST, sequential, single owner)

Shared files (one owner — no parallelism here):
1. **Chrome semantics** — `web/src/components/lesson/LessonShell.jsx`,
   `LessonGoal.jsx`, `TutorRibbon.jsx`, `HintRail.jsx`, `web/src/styles/lesson.css`,
   `web/src/styles/lesson-board.css`:
   - add a "no goal banner" path (rooms stop passing `goal`);
   - add a shared **Rail Read-aloud** affordance + rail-as-instruction card slot;
   - default `TutorRibbon` to hidden/idle, show only on corrective `status`;
   - hide `.lbar-cap` and in-stage `[class*="-cap"]` (mirror `wf-shell.css`
     156, 240, 247).
2. **Shared asset module** — NEW `web/src/components/assets/*` (or extend
   `web/src/components/*`): port `eqBox`, `cellBox`, `eqFrac`, `mixRuler`,
   `mixedNum/mixedSlots`, `digitGrid`, `fracSlots`, `eqTools`, `symbin/cmpDrag`,
   `ruler` as shared React components, plus shared CSS in `slate.css` / new
   `assets.css`. This kills the per-room duplication (esp. `DigitGrid` ×4).
3. Verify `LessonBoard` railWidth/footHeight ≡ wireframe railW/footH (no code
   change expected; document the mapping).

Gate: F is reviewed and merged before any lesson wave starts (every wave imports
the new shared shell + assets).

### Wave 1 (parallel — disjoint App files, the "clean split" rooms)

Each agent owns ONE App file + its room-specific CSS only:

| Unit | Owns (App) | Owns (CSS) |
|---|---|---|
| 1A | `web/src/AppM1.jsx` | `web/src/styles/m1.css` |
| 1B | `web/src/AppM3.jsx` | `web/src/styles/m3.css` |
| 1C | `web/src/AppDen.jsx` | `web/src/styles/den.css` |
| 1D | `web/src/AppNum.jsx` | `web/src/styles/num.css` |
| 1E | `web/src/AppSubtract.jsx` (s1) | `web/src/styles/s1.css` |
| 1F | `web/src/AppR4.jsx` | `web/src/styles/r4.css` |
| 1G | `web/src/AppSimp.jsx` | `web/src/styles/simp.css` |
| 1H | `web/src/AppCompare.jsx` | `web/src/styles/cmp.css` |

Per-unit task: remove goal banner + QuestionBand, move instructions into the rail,
make tutor corrective-only, replace inline asset components with the Wave-F shared
assets, drop in-stage captions, normalize railW/footH to wireframe values. **Do
not touch any other App file or shared file.**

### Wave 2 (after Wave 1 — the coupled/beat rooms, lower parallelism)

| Unit | Owns | Note |
|---|---|---|
| 2A | `web/src/AppR5.jsx` + `web/src/styles/r5.css` | drop FitStage/gate divergence; shared mixRuler/digitGrid |
| 2B | `web/src/LessonUnlikeDen.jsx` + `web/src/styles/lesson-unlike.css` | owns BOTH r2 + r3 (one file); reconcile beat-model chrome to the new shell; keep engine logic |
| 2C | `web/src/AppNumberLine.jsx` + `web/src/AppR1.jsx` + `web/src/styles/nl.css`, `r1.css` | **same owner** because nl mergeHosts r1 (AppNumberLine.jsx:168–196) — they cannot be split across agents |

Wave 2 is separated because 2B and 2C each span tightly-coupled logic and must not
run concurrently with anything sharing their files.

### Shared-file ownership matrix (collision control)

| Shared file | Owner |
|---|---|
| `web/src/components/lesson/*` | Wave F only |
| `web/src/components/assets/*` (new) | Wave F only |
| `web/src/styles/lesson.css`, `lesson-board.css`, `slate.css`, `assets.css` | Wave F only |
| `web/src/runtime/scaffoldMap.js`, `web/src/lessons/index.js` | **no change expected**; if needed, Wave F owner only |
| `web/src/styles/<id>.css` | that lesson's wave unit |
| kitchen files (see §0) | **nobody — in-flight kitchen rebuild owns them** |

### Verify

- Per unit: launch the app room (`/run`-style) and diff against the matching
  `docs/wireframe` screen — confirm no goal banner, rail carries the instructions,
  tutor idle/hidden, assets visually match, no QuestionBand.
- Cross-cutting: grep `web/src/components/QuestionBand.jsx` usages → expect zero
  in lesson rooms after the waves; confirm no remaining inline `DigitGrid`/`EqBox`
  duplicates; confirm `LessonGoal` import dropped from every `App*.jsx`.
- Engine/regression: `useLessonScaffold` behavior (advance/fade/raise, generated
  practice, adaptive teaching) must be unchanged — this is chrome/asset re-skin,
  not a logic rewrite. LessonUnlikeDen's beat nav stays intact.

---

## Appendix — key citations

- Wireframe chrome contract: `docs/wireframe/src/shell/LessonScreen.jsx:21–161`
  (data shape, goal-banner removal 129–131, rail Read-aloud 38–43/150, belowHTML
  141–142, footH floor 93).
- Wireframe chrome CSS decisions: `docs/wireframe/css/wf-shell.css:156` (hide
  lbar-cap), `:240` (hide in-stage caps), `:244–257` (one voice — hide tutor
  ribbon, rail Read-aloud).
- Wireframe builders: `eqBox.js`, `manip.js`, `cookSvg.js`, `showWork.js`,
  `compare.js`.
- App shared chrome: `web/src/components/lesson/{LessonShell,LessonBoard,
  AnswerBar,TutorRibbon,HintRail,LessonGoal,index}` ; layout CSS
  `web/src/styles/lesson-board.css`.
- App controller: `web/src/runtime/useLessonScaffold.js`, `scaffoldMap.js`.
- Representative app rooms: `AppM1.jsx`, `AppNumberLine.jsx`+`AppR1.jsx`,
  `LessonUnlikeDen.jsx`, `AppR5.jsx`, `AppCompare.jsx`.
