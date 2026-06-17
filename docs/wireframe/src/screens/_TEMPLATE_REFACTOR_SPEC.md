# Template-refactor spec — fold EVERY lesson page onto the shared `<LessonScreen>` grid

Goal: every room page renders through the ONE shared chrome (toolbar + topbar +
stage-tab strip) and the ONE shared 4-zone board grid. Per-page files become thin
DATA modules that only fill the structured zones. Net result: a LOT less code —
no page re-implements the toolbar, topbar, tab strip, goal banner, or board grid.

## Where things live (read these first)
- Shell that renders the chrome + grid: `src/shell/LessonScreen.jsx` (read the
  `data shape` comment — it is the contract).
- Centralized identity + tab strip per lesson family: `src/lessons.js` aggregates
  `src/lessons/<id>.js` family modules.
- GOLDEN reference (the target shape, 4 zones): `src/screens/room-r1-5-numbers.js`.
- Tab strip component: `src/shell/StageTabs.jsx` (resolves strip from `lesson` id).

## Hard rules
- ONLY create/edit files under `docs/wireframe/src/`. NEVER touch `web/`,
  `docs/wireframe/screens/*.html`, or any shell component (`src/shell/*`).
- Output must be valid JS (ES module `export default { … }`).
- Copy interactive markup VERBATIM (every SVG path, inline style, class). Do not
  reformat, re-indent, or "clean up" the markup you move between slots.
- Escaping inside template-literal slots: escape any backtick as `` \` ``,
  backslash as `\\`, and the sequence `${` as `\${`. (Most pages have none.)
- The shell renders the top goal banner NO LONGER — instructions live in the rail
  panel now. Do NOT emit a `.goal`/`.goal-text` block in any slot. (`goalHTML`
  may be set but is currently ignored; you may keep or drop it.)
- The shell injects a "Read aloud" button as the rail's first child — do NOT add
  your own `.speaker` button inside `railHTML`.
- The shell renders the toolbar, topbar (№/tag/title + ← / ▶ / settings / ⟲),
  and the stage-tab strip. Your module must NOT contain any `<div class="topbar">`,
  `<div class="stage-tabs">`, or toolbar markup.

## Step 1 — centralize your family's identity + tabs (ONE file per family)
Create `src/lessons/<id>.js` (id = family slug, e.g. `m1`, `m3`, `r2`, `r3`, `r4`,
`r5`, `s1`, `cmp`). Extract the identity + the full ordered tab strip from the
family's existing page markup (the `<span class="num-mark">`, `.puzzle-tag`,
`.puzzle-title`, the toolbar `<small>` route, and the `.stage-tab` strip). Shape:

```js
export default {
  id: "m1",
  num: "№1",
  tag: "Lesson 1 · Equal Groups",
  title: "Equal Groups",
  route: "#/m1",
  tabs: [
    { n: "1", name: "Manipulate", sub: "…", href: "room-m1.html" },
    { n: "2", name: "Bind",       sub: "…", href: "room-m1-2-bind.html" },
    // … every step in document order, each as the existing strip lists it …
    { n: "★", name: "Practice",   sub: "…", href: "room-m1-practice.html" },
  ],
};
```
The active tab is resolved automatically by route — do NOT set `active` here.
`nl` already exists in `lessons.js`; if your family is `nl`/`r1`, do NOT create a
file or touch `lessons.js` — `nl` is centralized already.

## Step 2 — make every page in your family a THIN structured module
Each `src/screens/room-<id>-*.js` becomes:

```js
export default {
  kind: "lesson",
  lesson: "<id>",            // pulls num/tag/title/route + tab strip + active from lessons.js
  // speaker: "kid",         // ONLY if the original .page data-vox-speaker !== "cook"
  // backHref/introHref/returnHref ONLY if they differ from world.html/intro.html/kitchen.html
  railW: 396, footH: 196,    // ONLY if the original .lboard set non-default --lboard-rail-w / --lboard-foot-h
  stageHTML: `…`,            // INNER html of the play-area zone (verbatim interactive markup)
  railHTML:  `…`,            // INNER html of the instruction/hint panel zone
  answerHTML:`…`,            // INNER html of the answer (equation + Check) zone
  tutorHTML: `…`,            // INNER html of the Cook + ribbon zone
};
```
Do NOT include the wrapping `<div class="lboard-stage">` etc. — the shell adds them.
Remove the per-page `num`/`tag`/`title`/`route`/`tabs`/`toolbarTitle` (now central).
Pages already structured (numbers/bind/fade) just need `lesson:"<id>"` swapped in
for their inline identity/tabs; keep their existing 4 slots.

## Step 3 — restructure the WORD-PROBLEM pages (applied / words / show-work)
These currently use the OLD full-width `lboard is-wide` + `lboard-wp` layout with a
duplicate text box (the goal banner AND a `.wp-card` story). Map them onto the
4 zones, deleting the duplication:

- `railHTML`  ← the story/question + the hint. Wrap as a `.panel`:
  `<div class="panel"><h3>…short title…</h3><div class="hint">…the question/story
  text (move the `.wp-story` / `.wp-card` text here, ONCE)…</div></div>`.
  Drop the old `.wp-card` chrome and its inner read-aloud button.
- `stageHTML` ← the FIRST interactive step (the play area). For "applied" this is
  the `.wp-setup` "First, write the question as a sum" block (the `expr-slate` +
  "Check the sum" button) — move its inner markup here verbatim. For "words"
  pages, the primary writing surface; for "show-work", the worked-steps surface.
- `answerHTML` ← the FINAL answer surface (the `.wp-answer` "Now write the total"
  slate + its Check button). Wrap it in the standard `<div class="lbar"> … </div>`
  card shape used by `room-r1-5-numbers.js` (lbar-eq / lbar-cap / lbar-marks)
  when it fits; otherwise keep the slate markup verbatim inside the slot.
- `tutorHTML` ← the Cook SVG + `.ribbon`. Use `<div class="ltutor"> … </div>`
  (NOT `is-narrow`) — copy the Cook `<svg>` verbatim and keep the ribbon text.

If a page genuinely has only ONE interactive surface (no separate setup gate), put
it in `stageHTML` and put the equation/Check in `answerHTML`; the rail still holds
the instruction. Never leave two copies of the same prompt text.

## Step 4 — practice & workbench pages
- Practice (`*-practice`) and workbench (`*-workbench`) pages whose unique layout
  does NOT map cleanly to stage/rail/answer/tutor may keep their special body via
  the `belowHTML` escape hatch — BUT still convert them to `kind:"lesson"` +
  `lesson:"<id>"` so they get the shared chrome (toolbar + topbar + tab strip)
  and drop their inline copies of all of it. Strip the old `.goal` banner from
  `belowHTML` (instructions are not shown at the top anymore). Prefer the 4-zone
  slots if the content fits; use `belowHTML` only when it does not.

## Verify before finishing
- `npm run build` (from `docs/wireframe/`) must succeed — fix any JS/escaping error.
- No page in your family still contains `topbar`, `stage-tabs`, `is-wide`,
  `wp-card`, or a `.goal` banner.
- Spot-check the file shape against `src/screens/room-r1-5-numbers.js`.
