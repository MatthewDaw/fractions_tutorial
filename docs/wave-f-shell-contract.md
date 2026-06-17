# Wave-F Shell Contract — Room Migration Brief

This is the brief for the room agents (Wave 1 + Wave 2). Wave F has landed the
shared foundation: the chrome semantics now match the wireframe's three chrome
decisions, and a shared asset library replaces the per-room inline primitives.
This doc tells you EXACTLY how to migrate one room onto it.

You own ONLY your room's `App*.jsx` (or `LessonUnlikeDen.jsx`) and your room's
`web/src/styles/<id>.css`. Do NOT edit any shared file in
`web/src/components/lesson/*`, `web/src/components/assets/*`, or
`web/src/styles/{lesson,lesson-board,slate,assets}.css` — Wave F owns those.

---

## 0. TL;DR — the three chrome moves + the asset swap

1. **Delete the goal banner.** Stop passing `goal` to `<LessonShell>` and stop
   importing `LessonGoal`. Put the task copy in a `<RailInstruction>` at the TOP
   of the rail column.
2. **Delete the QuestionBand.** Stop passing `band` and stop importing
   `QuestionBand`. Fold the question into the rail/stage.
3. **Make the tutor corrective-only.** The Cook stays visible but his ribbon is
   now hidden unless the status is corrective. You don't need to do anything for
   the resting state — `<TutorRibbon>` + `lesson.css` handle it. Just make sure
   wrong/feedback states set `status.tone = "warn"` (most rooms already do).
4. **Swap inline primitives for the shared asset library.** Delete your room's
   private `EqBox` / `EqFrac` / `EqTool` / `DigitGrid` / `MixRuler` /
   `MixedNumDisplay` / `CellBox` / `cmpDrag` / `Ruler` copies and import them from
   `./components/assets`.
5. **Drop in-stage captions** (`[class*="-cap"]` inside the stage) — `lesson.css`
   now hides them, so just remove the dead markup.
6. **Normalize `railWidth` / `footHeight`** to the wireframe values for your room
   (see §5).

---

## 1. The new shell API

### `<LessonShell>` — `web/src/components/lesson/LessonShell.jsx`

Unchanged signature; two props are now DEPRECATED:

```jsx
<LessonShell
  no={no} tag={tag} title={title}
  onBack={…} onRewatchIntro={…} onReset={…} resetTitle={…}
  speaker="cook"
  tabs={{ stages, current, onSelect, label }}
  /* band={…}  ← DEPRECATED: do NOT pass. No wireframe analog. */
  /* goal={…}  ← DEPRECATED: do NOT pass. The goal banner was removed. */
  extra={…}
>
  <LessonBoard … />
</LessonShell>
```

- `goal` and `band` are still *accepted* (so un-migrated rooms compile), but a
  migrated room passes **neither**. If you leave a `goal` in, the old banner will
  render and your room will NOT match the wireframe — remove it.
- Everything else (`tabs`, identity, controls) is exactly as before.

### `<RailInstruction>` — NEW, `web/src/components/lesson/RailInstruction.jsx`

The replacement for the goal banner. It renders, in order:

1. a compact **Read aloud** pill (only if you pass `say`), and
2. a `.panel` card with an uppercase heading + the instruction copy.

Put it as the FIRST node of `<LessonBoard>`'s `rail` slot.

```jsx
import { RailInstruction } from "./components/lesson";

const rail = (
  <>
    <RailInstruction
      say={say} speaking={speaking}
      voiceKey="r4.double.goal"      // the same voice key the old goal used
      voxSpeaker="cook"
      heading="Step"                 // optional; default "Step"
    >
      Drag the <b>×2</b> knife across the box to cut every cell in two.
    </RailInstruction>

    {/* …your other rail cards (tool rack, lock card, picker) below… */}
    <HintRail heading="…" hint="…" />
  </>
);
```

Props: `say`, `speaking`, `voiceKey`, `voxSpeaker`, `heading` (default `"Step"`),
`children` (the copy), `className`, `extra` (cards rendered below the instruction
card — equivalent to just appending siblings).

If a stage has NO narration, omit `say` and the Read-aloud pill won't render.

### `<RailReadAloud>` — NEW, `web/src/components/lesson/RailReadAloud.jsx`

The standalone Read-aloud pill, in case you build a custom first rail card and
want the pill without the panel. `<RailInstruction>` already includes it; you
rarely need this directly. Props: `say`, `speaking`, `voiceKey`, `className`.

### `<TutorRibbon>` — corrective-only, `web/src/components/lesson/TutorRibbon.jsx`

Same props as before, plus `forceShow`. The ribbon is now hidden by default and
shown only when corrective:

- `status.tone === "warn"`  → shown (red) — your wrong-answer / hint state.
- `status.show === true`    → shown — caller opts in for a non-warn beat.
- `forceShow` prop          → shown regardless — for a guided/teaching beat.
- otherwise                 → hidden (`.ribbon.is-idle` → `display:none`).

The Cook sprite is ALWAYS visible; only his speech ribbon toggles. You normally
do nothing here: keep emitting your existing `status` and let wrong answers set
`tone: "warn"`. If your room currently relies on the resting ribbon to show the
instruction, move that copy into `<RailInstruction>` (the ribbon is no longer the
resting voice).

### `<LessonBoard>` — unchanged

The 4-zone grid is unchanged. Pass `stage`, `rail`, `answer`, `tutor` (or
`content` + `tutor` for `variant="wide"`). Sizing via `railWidth` / `footHeight` /
`tutorWidth` (see §5).

---

## 2. Canonical room skeleton (after migration)

```jsx
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail,
         RailInstruction } from "./components/lesson";
import { EqBox, EqFrac, EqTools, DigitGrid } from "./components/assets";
// NOTE: no LessonGoal, no QuestionBand imports.

…

return (
  <LessonShell no={no} tag={tag} title={title} tabs={tabs}
               onBack={onBack} onReset={sc.resetStage}>
    <LessonBoard
      railWidth={396} footHeight={196}
      stage={<EqBox cols={3} rows={cut} shaded={1} guide />}
      rail={
        <>
          <RailInstruction say={say} speaking={speaking}
                           voiceKey={status.voiceKey} voxSpeaker="cook">
            {status.instruction}
          </RailInstruction>
          <EqTools sizes={[2,3]} on={tool} onPick={pick} />
        </>
      }
      answer={<AnswerBar eq={…} onCheck={check} checkLabel={…} solved={solved} />}
      tutor={<TutorRibbon cook={cook} status={status} />}
    />
  </LessonShell>
);
```

---

## 3. Shared asset library — `web/src/components/assets`

Import from `./components/assets` (the index auto-imports `styles/assets.css`, so
you get the geometry/look for free — you may then delete the duplicate `.eq-*` /
`.mix-*` / `.den-ruler` / `.cmp-*` rules from your room CSS). All components are
faithful ports of the wireframe builders (same classes, same geometry).

| Component | Wireframe builder | Signature (key props) |
|---|---|---|
| `EqBox` | `eqBox(cols,rows,shaded,opts)` | `<EqBox cols rows={1} shaded guide={false} target={false} small={false} />` |
| `CellBox` | `cellBox(n,k)` | `<CellBox n k />` (auto-tiles n; first k inked) |
| `EqFrac` | `eqFrac(n,d,cls)` | `<EqFrac n d className big? />` (wrapped .eq-frac glyph) |
| `BigFrac` | inline `.bignum` | `<BigFrac n d big? />` (bare glyph for equation rows) |
| `FracSlots` | `fracSlots(n,d,active,big)` | `<FracSlots n d active="n"\|"d" big={56} onPick? />` |
| `EqTools` | `eqTools(sizes,opts)` | `<EqTools sizes={[2,3]} on frozen divide onPick renderTool? />` |
| `DigitGrid` | `digitGrid(on)` | `<DigitGrid on onPick disabled max={9} />` (two-column 0–9 pills) |
| `MixRuler` | `mixRuler(num,den,wholes,opts)` | `<MixRuler num den wholes w={560} />` |
| `MixedNum` | `mixedNum(whole,n,d)` | `<MixedNum whole n d />` |
| `MixedSlots` | `mixedSlots(whole,n,d,active)` | `<MixedSlots whole n d active="w"\|"n"\|"d" onPick? />` |
| `Ruler` | room-den/num inline ruler | `<Ruler parts on={k\|[i]} labels={["0","1"]} segLabel? w={560} small target onSeg? />` |
| `CmpDrag` | `cmpDrag(n1,d1,n2,d2,big)` | `<CmpDrag n1 d1 n2 d2 big={34} dropped onPick onSymDown disabled />` |
| `SymBin` | `symbin()` | `<SymBin onPick onSymDown disabled />` (just the < = > bin) |

### Mapping the old inline copies

- **`DigitGrid`** (inline in AppR4/AppR5/AppDen/AppNum): replace with
  `<DigitGrid on={picked} onPick={setPicked} />`. The classes are identical
  (`.eq-numgrid` / `.den-numcol` / `.den-num`) so it looks the same.
- **`EqBox`** (AppR4) / **`SquareBox`** (AppDen) / **`SimpBox`/`GroupBar`**
  (AppSimp): replace with `<EqBox … />`. For simplify's ÷ mode use
  `<EqTools divide />`.
- **`EqFrac` / `BigFrac` / `BigFracInline`**: replace with `<EqFrac />` (boxed) or
  `<BigFrac />` (inline in an equation row).
- **`EqTool`/`EqTools`** (AppR4): use `<EqTools sizes={…} onPick={…} />`. If your
  knife is DRAG-capable, pass `renderTool={(k, st) => <YourKnife … />}` so you
  keep the drag behavior while reusing the rack layout/classes.
- **`MixRuler` / `MixedNumDisplay`** (AppR5): `<MixRuler />` + `<MixedNum />` /
  `<MixedSlots />`. (AppR5 also has a den→num answer GATE — see §4, drop it.)
- **`CellBox`** (AppCompare, currently SVG rects): replace with `<CellBox />`
  (grid divs, matching the wireframe — this is a deliberate markup change).
- **`cmpDrag`/`DragAnswer`** (AppCompare): `<CmpDrag />`. The choice-button form
  (`ChoiceAnswer`, `.cmp-choice`) is room-specific and stays in your room.
- **`Ruler`/`RulerStrip`** (AppNum, AppCompare): `<Ruler parts={…} on={…} />`.

### Interaction wiring

The asset components are presentational with light tap handlers (`onPick`,
`onSeg`, `onSymDown`). Keep ALL your engine wiring (`useLessonScaffold`,
`reportAttempt`, stage nav, drag-ghost portals) in the room — only the visual
markup moves to the shared components. For complex drag (knife-onto-box, sort
bins, symbol-to-slot drop) keep the room's pointer logic and feed state into the
asset props (`on`, `active`, `dropped`, `renderTool`).

---

## 4. App-only blocks to DELETE (no wireframe analog)

- The **`<LessonGoal>`** import + usage (the goal banner). → `<RailInstruction>`.
- The **`<QuestionBand>`** import + usage. → fold into rail/stage.
- **In-stage caption markup** (`*-cap`, `*-numbers-cap`, `*-tally-cap`, `nl-cap`
  inside `.lboard-stage`). `lesson.css` hides them; remove the dead nodes.
- The **answer-bar caption** (`cap=` on `<AnswerBar>`): `lesson.css` hides
  `.lbar-cap`; drop the prop.
- Room-specific divergences the spec calls out: AppR5's **`FitStage` wrapper** and
  **den→num answer gate** (the shared `FracSlots`/`MixedSlots` are always open);
  AppM1's **custom Workbench HUD** that bypasses LessonBoard (re-home it into the
  4-zone grid, `rail={null}` for the no-rail Workbench); LessonUnlikeDen's
  `DenominatorPicker`/`InkPad` extras not in the WF snapshot.

---

## 5. Sizing — normalize to the wireframe `railW` / `footH`

The wireframe declares `railW` / `footH` per room/step (`docs/wireframe/src/
screens/room-*.js`); `footH` is floored to ≥196 by the shell
(LessonScreen.jsx:93). Map them to `<LessonBoard>`:

- `railW` → `railWidth` (default **396**).
- `footH` → `footHeight`, floored to **196** (so pass `Math.max(footH, 196)`;
  rooms that declared 140/150 should now use 196).

Check your room's `room-<id>*.js` for any non-default `railW`/`footH` and pass the
same values. When in doubt, use `railWidth={396} footHeight={196}`.

---

## 6. Gotchas

- **Read-aloud voice key:** reuse the EXACT voice key the old `<LessonGoal>` used
  (its `voiceKey` / `data-vox`) on `<RailInstruction>`, so tap-to-read keeps
  working. Don't invent a new key.
- **Rail order:** `<RailInstruction>` MUST be the rail's first child (it emits the
  Read-aloud pill, which is styled to sit flush top-left via
  `.lboard-rail .wf-rail-speaker`). Put tool racks / lock cards AFTER it.
- **Multiple rail cards:** the rail slot accepts any node; wrap your cards in a
  fragment. If they should keep natural heights, add `className="is-stack"` on the
  rail (see `lesson-board.css` `.lboard-rail.is-stack`).
- **Don't hide the Cook.** Corrective-only applies to the ribbon, not the sprite.
  Keep `<TutorRibbon cook={cook} status={status} />` mounted every stage.
- **Forced ribbon beats:** if a teaching beat legitimately needs the ribbon while
  not "warn", pass `status={{ tone:"ok", text:"…", show:true }}` or `forceShow`.
  Use sparingly — the default is silent.
- **assets.css vs your `<id>.css`:** `assets.css` defines the shared `.eq-*` /
  `.mix-*` / `.den-ruler` / `.cmp-*` look. You may delete the now-duplicate rules
  from your room CSS. Keep ONLY the rules unique to your room (layout wrappers like
  `.eq-stage`, `.den-play`, choice buttons, etc.).
- **Don't touch kitchen files** (`web/src/kitchen/*`, `MomsRoom.jsx`,
  `momsProblems.js`, `lessons/mom.js`, `styles/kitchen.css`) — out of scope.
- **The cook-alignment fix is already shared:** `lesson.css .cook-stage > svg`
  now bottom-anchors the figure. Don't add per-room cook offsets.

---

## 7. Verify your room

1. `cd web && npm run build` passes.
2. No `LessonGoal` / `QuestionBand` import remains in your `App*.jsx`.
3. No inline `DigitGrid` / `EqBox` / `EqFrac` / `EqTool` / `MixRuler` / `CellBox`
   / `cmpDrag` / `Ruler` definition remains (they come from `./components/assets`).
4. Rail shows the instruction + Read-aloud; no top goal banner; tutor ribbon is
   silent until a wrong answer.
5. Engine behavior (advance/fade/raise, generated practice, adaptive teaching) is
   unchanged — this is a chrome/asset re-skin, not a logic rewrite.
```
