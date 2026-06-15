# Lesson-screen conversion spec (for the React wireframe refactor)

Convert a static lesson page `screens/<name>.html` into a **data-only** module
`src/screens/<name>.js` consumed by the shared `<LessonScreen>` component.

**Reference template:** read `src/screens/room-nl.js` — your output must match its
shape and style exactly. **Contract:** read `src/shell/LessonScreen.jsx` (the
`data shape` comment) for the exact field meanings.

## Hard rules
- ONLY create/edit files under `docs/wireframe/src/screens/`. NEVER touch
  `web/`, `screens/*.html`, or any shell component.
- Output must be valid JavaScript (an ES module with `export default { … }`).
- Provide **INNER HTML only** for each slot — do NOT include the wrapping
  `<div class="lboard-stage">` etc. `<LessonScreen>` renders those wrappers.
- Copy interactive markup **verbatim** (every SVG path, inline style, class).
  Do not "clean up", reformat, or re-indent the markup.
- Escaping for template literals: if any slot string contains a backtick,
  a backslash, or the sequence `${`, escape them as `` \` ``, `\\`, `\${`.
  (Most pages contain none — check anyway.)

## Fields to extract
- `kind: "lesson"` (always).
- `toolbarTitle`: text of `<span class="wf-tb-title">` BEFORE its `<small>`.
- `route`: text inside that `<small>`, with leading `· ` / spaces stripped (e.g. `#/nl`).
- `num`: text of `.num-mark` (e.g. `№3`).
- `tag`: text of `.puzzle-tag`.
- `title`: text of `.puzzle-title`.
- `speaker`: the `data-vox-speaker` on `<div class="page" …>`. Omit the field if it is `"cook"` (the default).
- Controls — read the `.controls` anchors and set:
  - `backHref`: href of the `←` ctrl-btn (usually `world.html`).
  - `introHref`: href of the play/▶ ctrl-btn (usually `intro.html`).
  - `returnHref`: href of the `⟲` ctrl-btn (usually `kitchen.html`).
  Omit any that equals its default (world.html / intro.html / kitchen.html).
- `tabs`: array, in document order, one per `.stage-tab`:
  - `n`: text of `.stage-tab-n`.
  - `name`: text of `.stage-tab-name`.
  - `sub`: text of `.stage-tab-sub`.
  - `title`: the element's `title` attribute.
  - If the tab is the active one (a `<button>` with `is-active` / `aria-selected="true"`):
    set `active: true` and OMIT `href`.
  - Else (an `<a>`): set `href` to its `href`, and OMIT `active`.
- `railW`, `footH`: integers parsed from the `.lboard` inline style
  `--lboard-rail-w:<N>px; --lboard-foot-h:<N>px`. Omit a field if absent
  (defaults are 396 / 196).
- `goalHTML`: the INNER HTML of `.goal-text` (verbatim; drop the wrapper div and
  its `data-vox*` attributes).
- `stageHTML`: INNER HTML of `.lboard-stage`.
- `railHTML`: INNER HTML of `.lboard-rail`.
- `answerHTML`: INNER HTML of `.lboard-answer`.
- `tutorHTML`: INNER HTML of `.lboard-tutor`.

## Output skeleton
```js
export default {
  kind: "lesson",
  toolbarTitle: "…",
  route: "#/…",
  num: "…", tag: "…", title: "…",
  // backHref/introHref/returnHref/speaker only if non-default
  tabs: [ { n: "1", name: "…", sub: "…", active: true, title: "…" }, … ],
  railW: 396, footH: 196,   // only if present in source
  goalHTML: `…`,
  stageHTML: `…`,
  railHTML: `…`,
  answerHTML: `…`,
  tutorHTML: `…`,
};
```

Do not emit any prose — just write the module file.
