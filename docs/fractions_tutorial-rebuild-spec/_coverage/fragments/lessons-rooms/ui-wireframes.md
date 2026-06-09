<!-- FRAGMENT: lessons-rooms / ui-wireframes.md
     PER-SCREEN layouts ONLY (structure + content, no styling). The NAV GRAPH
     connecting screens is SYNTHESIS-OWNED. ASCII + Wireloom block per screen.
     Stage coordinate space is 1280x800 (constitution §6). -->

# Lessons & Rooms — per-screen wireframes

> Shared chrome reference (every room): `LessonShell` provides the outer frame.
> The same skeleton wraps every lesson body; per-room wireframes below show only
> what differs in the body / stage.

## Shared lesson chrome skeleton (`LessonShell` + `LessonBoard`)

```
+--------------------------------------------------------------------------+
| [№no]  Lesson {no} · {tag}                     [←][▷ rewatch][⚙][⟲]      |  topbar
|        {Big Title}                                                        |
+--------------------------------------------------------------------------+
| ( Manipulate | Bind | Fade | Workbench | Numbers | Applied | … | ★ )      |  StageTabs
+--------------------------------------------------------------------------+
| the question:   2/7  +  3/7  =  [ ? / solved ]                           |  QuestionBand
+--------------------------------------------------------------------------+
| [🔊 Read aloud]  Goal copy in Babushka's-kitchen language …              |  LessonGoal
+--------------------------------------------------------------------------+
| LessonBoard (variant="split"):                                           |
|  +-------------------------------+  +----------------------------------+  |
|  | STAGE (play space)            |  | RAIL (HintRail: signature rule)  |  |
|  |                               |  |                                  |  |
|  +-------------------------------+  +----------------------------------+  |
|  +-------------------------------+  +----------------------------------+  |
|  | ANSWER (AnswerBar: eq+Check)  |  | TUTOR (Cook + ribbon)            |  |
|  +-------------------------------+  +----------------------------------+  |
+--------------------------------------------------------------------------+
```

```wireloom
Shell.LessonShell
  topbar[ numMark, tag, title, controls{back?, rewatchIntro?, settings, reset?} ]
  StageTabs{ stages[], current, onSelect }
  band?: QuestionBand{ lead, expr, answer }
  goal: LessonGoal{ speaker, text }
  body: LessonBoard
    variant=split: { stage, rail, answer:AnswerBar, tutor:TutorRibbon }
    variant=wide:  { content:WordProblem(FitStage axis=y), tutor:TutorRibbon(narrow) }
```

---

## R1 · Same Denominators (`AppR1`)

Stage 1 (Manipulate) — the canonical play space:

```
+-- STAGE (.r1-s1-canvas, clipped) ----------------+   +-- RAIL ------------+
|  [🔒 bottom stays /7]                            |   | KEEP THE BOTTOM    |
|                                                  |   | both stacks cut    |
|   [stack A: 2/7]   <drag→merge→>   [stack B:3/7] |   | into 7ths …        |
|   ───────── ruler 0  1/7 … 1 ───────────────     |   | [ +  /7 (locked) ] |
|                                                  |   | add the tops /     |
|   (after merge: one uniform stack = ?/7  [↺])    |   | keep the 7         |
+--------------------------------------------------+   +--------------------+
+-- ANSWER (AnswerBar) ----------------------------+   +-- TUTOR -----------+
|  2/7  +  3/7  =  [top][/7 locked]      [Check]   |   | (Cook) "…"         |
|  cap: count the pieces — write the top number    |   |                    |
+--------------------------------------------------+   +--------------------+
```

Stage 4 (Workbench) — rail-less `BlockSandbox` + a sibling `.hud`:

```
+-- BlockSandbox (own .play: bin + ruler + diagram + its own rail) ---------+
|  bin:[7,2,3]   target = 2/7 + 3/7    pull blocks → stack on line → count   |
+--------------------------------------------------------------------------+
| .hud:  (Cook) ribbon …                         [Build it ▸ / Next ▸]      |
+--------------------------------------------------------------------------+
```

Stage 6/7 (Applied / Words) — `LessonBoard variant="wide"`:

```
+-- WordProblem (FitStage axis=y) -----------------+   +-- TUTOR (narrow) --+
|  [tag] Babushka's kitchen                        |   | (Cook) "…"         |
|  story: Babushka needs 2/7 + 3/7 …               |   |                    |
|  setupLead: First, write the question as a sum   |   |                    |
|   [ ExpressionSlate: a/7 + b/7 ]  [Check the sum]|   |                    |
|  answerLead: Now write the total                 |   |                    |
|   [ Slate: top /7 ]                    [Check]    |   |                    |
+--------------------------------------------------+   +--------------------+
```
(Stage 7 Words: same wide layout, no QuestionBand, optional ungraded `BlankSlate`
scratch, answer Slate always enabled.)

---

## s1 · Taking Away (`AppSubtract`)

Stage 2 (Take Away): a draggable `UnitRow` over a "used" tray.

```
+-- STAGE (.s1-canvas-takeaway) -------------------+   +-- RAIL ------------+
|  [🔒 bottom stays /8]                            |   | TAKE IT AWAY       |
|  on the line — what's left:                      |   | drag 2 pieces off; |
|  [1/8][1/8][slot][1/8][1/8]   (drag down ↓)      |   | count what's left  |
|  ── used by Babushka — drag pieces here ──       |   | [ − /8 (locked) ]  |
|  [1/8][1/8]                                      |   |                    |
|  3 left on the line · 2 taken away               |   |                    |
+--------------------------------------------------+   +--------------------+
| ANSWER: 5/8 − 2/8 = [top][/8 locked]   [Check]   |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
```
(Stage 1 Decompose: one solid stack + a "Break apart ✂" button; the AnswerBar
shows `5/8 = 1/8+1/8+…`. Stage 3 Numbers: bare `7/8 − 3/8`. Stage 4 Words: wide.)

---

## nl · On the Number Line (`AppNumberLine`)

```
+-- STAGE (FitStage > .nl-canvas) -----------------+   +-- RAIL ------------+
|  band: where on the line?  3/4                   |   | A FRACTION IS A    |
|  0 ─────●──────── 1   (draggable point)          |   | NUMBER             |
|  drag the point — each tick is 1/4               |   | cut 0→1 into 4 …   |
+--------------------------------------------------+   | [3/4] 3 parts/¼    |
| ANSWER (Place): 3/4 = [n/4 of the way] [Drag…]   |   +--------------------+
| ANSWER (Write): the point is [Slate n/d] [Check] |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
```
(Stage 3 Numbers: a 0→2 line, drag 5/3 PAST 1.)

---

## cmp · Compare & Check (`AppCompare`)

Choice-button answer card (`ChoiceAnswer`), no Slate:

```
+-- STAGE (.cmp-canvas) ---------------------------+   +-- RAIL ------------+
|  band: 3/8  [?]  5/8                             |   | COMPARE            |
|  3/8 ──────●──────── 1                           |   | farther right =    |
|  5/8 ──────────●──── 1   (two stacked lines)     |   | bigger; pick sign  |
|  ● ●  (item dots)                                |   |                    |
+--------------------------------------------------+   +--------------------+
| ANSWER: 3/8 ? 5/8   [ < ][ = ][ > ]   [Pick one] |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
```
(Stage 2 Benchmark: one line w/ ½ tick called out, choices {0,½,1}. Stage 3
Reason: 1/2+2/3 on two lines, choices {less/about/more than 1}, wide buttons.)

---

## m1 · Equal Groups (`AppM1`) — full 7-stage R1-shaped arc

Stage 1 (Manipulate): `PlateGroup` + a numeric count box.

```
+-- STAGE (.m1-canvas) ----------------------------+   +-- RAIL ------------+
|  Drag the same 4 onto every plate                |   | EQUAL GROUPS       |
|  [plate ●●●●][plate ●●●●][plate ●●● ]            |   | all 3 plates get   |
|  drag pelmeni from the pile · right-click empties|   | the SAME 4 [×]     |
+--------------------------------------------------+   +--------------------+
| ANSWER: 3 plates × 4 = [count box ?]   [Check]   |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
```
(2 Bind: tap plates to build 4+4+4 strip, write 12. 3 Fade: ghost plates +
collapse-to-3×4 button. 4 Workbench: BlockSandbox number mode + .hud. 5 Numbers:
bare 3×4. 6 Applied/7 Words: wide WordProblem; sw Show Work: blank slate.)

---

## m3 · Times Facts (`AppM3`) — 7-stage arc

Stage 1 (`SkipJar`), Stage 3 (`SkipLine`):

```
+-- STAGE (FitStage > .m3-fz-canvas) --------------+   +-- RAIL ------------+
|  band: 7 × 8                                     |   | COUNT BY EIGHTS    |
|  [ SkipJar: drag scoop in; tally 8,16,24… ]      |   | [7×8] 7 scoops/8   |
+--------------------------------------------------+   +--------------------+
| ANSWER: 7 × 8 = [Slate product]        [Check]   |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
```
(2 Bind: jar + skip-count ribbon. 3 Fade: ghost jar + SkipLine w/ 2 blanks.
4 Workbench: rail-less BlockSandbox. 5 Numbers: cycles fact → ×1 → ×0 micro-prompts
w/ progress dots. 6 Applied/7 Words: wide.)

---

## r4 · Simplify (`AppR4`)

Stage 1/2 (`GroupBar` + drag ÷K chips), portaled drag ghost:

```
+-- STAGE (.r4-s-canvas, drop target) -------------+   +-- RAIL ------------+
|  band: 8/12 = [? / 2⁄3]                          |   | GROUP TOOL         |
|  [✓ simplest name / group it down]   |same amount|   | drag a group size  |
|  0 ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐ 1        |   | [2 Group][3 Group] |
|    │██│██│██│██│██│██│██│██│  │  │  │  │ ‖edge    |   | filled cells: 8    |
|    8 of 12          ÷k top & bottom = ÷1          |   | ● ● ● ● ● ● ● ●    |
+--------------------------------------------------+   +--------------------+
| ANSWER: 8/12 = [Slate n/d]             [Check]   |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
```
(3 Fade: bar dims, drag ÷ factor chip onto `8/12 = ?/?` equation. 4 Numbers: bare
8/12. 5 Applied/6 Words: split, story card + simplest-name Slate, rail-less; sw
Show Work: full-width blank slate. Drag ghost portaled to <body>.)

---

## r5 · Mixed Numbers (`AppR5`)

Stage 1/2 (overflow column → whole-unit frame + leftover tray), portaled ghost:

```
+-- STAGE (FitStage > .r5-canvas) -----------------+   +-- RAIL ------------+
|  band: write as a mixed number  9/7 = [? / 1 and 2/7]|| GROUP INTO WHOLES |
|  [9/7]        ┌─ whole-unit frame ─┐              |   | 7 pieces = 1 whole |
|  [1/7]        │ drop a piece here  │              |   | [▢▢▢▢▢▢▢] = 1      |
|  [1/7]  drag→ └────────────────────┘              |   | 9 ÷ 7 = 1 r 2      |
|  …            ┌─ leftover tray ────┐              |   +--------------------+
|  0 ──┬──┬─ 1 ─┬──┬─ 2  (0→2 ruler) │              |   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
| ANSWER: 9/7 = [w wholes] and [n /7]    [Check]   |
+--------------------------------------------------+
```
(3 Fade: ghost board + "how many wholes?" pick buttons in rail. 4 Numbers: bare
9/7 (14/7 exact-whole trap). W Workbench / A Applied / sw Show Work / 5 Words use
the legacy `.play/.hud` layout, not LessonBoard.)

---

## r2 · Cross-Multiply / r3 · Scale One (`LessonUnlikeDen`, config-driven)

ONE component; the beat tabs carry the L0→L7 ladder. L0 (Manipulate):

```
+-- STAGE (.r2canvas, knife slice + drag-join) ----+   +-- RAIL/TUTOR ------+
|  band: solve  1/2 + 1/3 = [? / numStr/denStr]    |   | (rail varies by    |
|  [Plank A: 1/2] ───────                          |   |  beat; L2/L4 use a |
|  [Plank B: 1/3] ────                             |   |  DenominatorPicker)|
|  0 ─┬───┬───┬─ 1 ─ 2   [Knife: drag onto a strip]|   | TUTOR: Cook "…"    |
+--------------------------------------------------+   +--------------------+
| ANSWER: two-stage gate — write BOTTOM first      |
|  1/2 + 1/3 = [Slate/InkPad num over den] [Check] |
+--------------------------------------------------+
```
(L2 Bind: pick common size, join by hand, write. L4 Fade: generated transfer pairs,
numbers lead. r2 only: cross-multiply crossing-arrows on L5/L6. LW Workbench /
LA Applied (ExpressionSlate setup gate) / SW Show Work / L7 Words (wide
LessonBoard, config word-problem bank) / practice. Stylus ✎ marks write beats.)

---

## mom · Babushka's Kitchen (`MomsRoom`)

Words-only; bespoke fixed-zone layout (`.mr-s`), NOT LessonShell/LessonBoard. No
QuestionBand (prose IS the question):

```
+--------------------------------------------------------------------------+
| [★] Babushka's Kitchen · Story Problems     ● ● ◐ ○ ○ (pips) [←][⚙][⟲]   |  topbar
|     Show Babushka What You Know                                           |
+--------------------------------------------------------------------------+
| [🔊 Read aloud]  «prose recipe story — the question»                     |  goal (primary)
+--------------------------------------------------------------------------+
| .mr-s grid:                                                              |
|  +-------------------------------+  +----------------------------------+  |
|  | STAGE: [skill tag]            |  | RAIL: Today's Cook (owner art)   |  |
|  |  prop SVG (state-driven)      |  |       The Skill (label/blurb)    |  |
|  |  ScratchCanvas (show work)    |  |       n/5 skills mastered        |  |
|  +-------------------------------+  +----------------------------------+  |
|  +-------------------------------+  +----------------------------------+  |
|  | ANSWER: Write your answer     |  | TUTOR: speaking char + ribbon    |  |
|  |  [Slate frac / w and n/d]     |  |  (Kid/Grandpa/Cat/Mom banter)    |  |
|  |  [▸ Learn it: <skill>]? [Check]| |                                  |  |
|  +-------------------------------+  +----------------------------------+  |
+--------------------------------------------------------------------------+
```
(On a wrong answer the engine may show the "▸ Learn it: <skill>" wall button
routing to the most-upstream unmastered room. Mixed answers use a `w and n/d`
composer. Done state: finale art + "Play again".)

---

## review · Mixed Basket (`MixedReview`)

Standalone, minimal chrome. Two phases per trial: identify → solve.

```
+--------------------------------------------------------------------------+
| [←]  Mixed Basket                                                        |
|      Babushka mixed the recipes together — solved {n} so far.            |
+--------------------------------------------------------------------------+
|  «generated problem prompt»                                             |
+--------------------------------------------------------------------------+
| phase=identify:  Which recipe is this?                                   |
|    [ Same Denominators ][ Scale One ][ Cross-Multiply ][ … ]             |
| phase=solve:  renderInput(shape):                                       |
|    fraction → [Slate n/d]   integer → [Slate v]                          |
|    relation → [ < ][ > ] or [less ½][= ½][more ½]                        |
|    mixed → [w] and [n/d]                                                 |
+--------------------------------------------------------------------------+
|  ribbon: status (Yes — now solve it / Correct! / Not quite…)            |
+--------------------------------------------------------------------------+
```
(Empty state when <2 introduced recipes: "Cook a few more recipes first…".)
