# Babushka's Fractions — UI Wireframe

A **high-fidelity, fully clickable** wireframe of the existing tutor app. It lives entirely
under `docs/wireframe/` and is **completely separate from the real app** — edit it freely to
rework layout and flow without touching `web/`.

It is a **React + Vite SPA**. All shared lesson chrome (toolbar, topbar, stage-tab strip,
read-aloud goal banner, and the LessonBoard split grid) lives in **one** component —
`src/shell/LessonScreen.jsx` — so a change there lands on all 43 lesson screens at once. Each
screen is a tiny **data module** under `src/screens/` that only declares its unique content.

## Open it

```
cd docs/wireframe
npm install      # first time only
npm run dev      # opens http://localhost:5180
```

> **Port:** the wireframe runs on **5180** on purpose. The real app (`web/`) owns
> **5173**, so `localhost:5180` is always the wireframe and `localhost:5173` is always
> the real app — no confusion. Routes are keyed by filename: the number-line screen is
> **`http://localhost:5180/#/room-nl`** (the `#/nl` shown in the toolbar is just a label
> mirroring the app's real hash route).

`npm run build` produces a static bundle in `dist/` if you want to host it.

Every navigation control (START, lesson cards, back buttons, kitchen, shelves, rewatch-intro,
return-to-kitchen, **and the per-lesson stage tabs**) navigates via the SPA router, so the
click-through matches the app's hash routes. Functional behavior (answer checking, dragging,
animation, audio, the mastery engine) is intentionally **not** implemented — structure + flow
only.

**Coverage:** all 96 screens — 19 shell/scene screens + 77 lesson steps. 43 lesson steps use
the shared `LessonScreen`; the other 53 (kitchen states, world/title/intro/settings, and the
practice/words/applied steps that have bespoke layouts) are `RawScreen` modules that carry
their own verbatim markup.

## Architecture

```
docs/wireframe/
  index.html              ← Vite entry (mounts the SPA + loads app fonts)
  package.json            ← React + Vite + react-router-dom
  src/
    main.jsx              ← imports every app stylesheet in cascade order, then wf-shell LAST
    App.jsx               ← router + screen registry (import.meta.glob of src/screens/*.js)
    Navigator.jsx         ← the "/" index (screen list)
    shell/
      LessonScreen.jsx    ← THE shared lesson chrome — edit shared layout/structure here
      RawScreen.jsx       ← shell for one-off scenes (verbatim body)
      Toolbar.jsx         ← the fixed wireframe toolbar
      useStageFit.js      ← scales the 1280×800 stage to the viewport (was js/fit.js)
      routeFromHref.js    ← "room-nl.html" → "/room-nl"
      prepHtml.js         ← normalizes asset paths in raw-HTML slots
    screens/              ← ONE data module per screen (96 files)
      room-nl.js          ← reference lesson module
      _CONVERSION_SPEC.md ← spec used to extract lesson modules from the old HTML
  css/
    wf-shell.css          ← wireframe design tokens + overrides (loaded LAST; edit look here)
    wireframe.css         ← navigator styling
    app/                  ← the real app's CSS, copied verbatim
  public/assets/          ← static assets (settings-gear.png)
  screens/                ← the ORIGINAL static HTML (kept as the extraction source)
  scripts/gen-raw.mjs     ← generator that built the RawScreen modules
```

### Lesson data module shape

A lesson screen is just data (`src/screens/room-nl.js` is the reference). The shared
`LessonScreen` renders the chrome; these fields fill the unique bits:

```js
export default {
  kind: "lesson",
  toolbarTitle, route, num, tag, title,
  tabs: [{ n, name, sub, href|null, active, title }],
  railW, footH, lboardClass,        // board geometry / variant (e.g. "is-norail")
  goalHTML, stageHTML, railHTML, answerHTML, tutorHTML,   // verbatim inner-HTML slots
};
```

### Screens (mapped to source + hash route)

| Wireframe file | App screen | Route | Source |
|---|---|---|---|
| `title.html` | Title / landing | `#/` | `TitleScreen.jsx` |
| `world.html` | World map (3 shelves + kitchen) | `#/world` | `WorldMap.jsx` |
| `shelf-found.html` | Shelf · Counting & Times | `#/world ▸ found` | `WorldMap.jsx` (submenu) |
| `shelf-build.html` | Shelf · Building Fractions | `#/world ▸ build` | `WorldMap.jsx` (submenu) |
| `shelf-combine.html` | Shelf · Combining & Renaming | `#/world ▸ combine` | `WorldMap.jsx` (submenu) |
| `kitchen.html` | Babushka's Kitchen (word problems) | `#/mom` | `MomsRoom.jsx` |
| `review.html` | Mixed Basket review | `#/review` | `MixedReview.jsx` |
| `settings.html` | Settings | `#/settings` | `SettingsScreen.jsx` |
| `concepts.html` | Concept Mastery Map | `#/concepts` | `ConceptMap.jsx` |
| `intro.html` | Room intro (video) | (first entry) | `RoomIntro.jsx` |
| `empty-room.html` | Empty room (fallback) | (unbuilt id) | `EmptyRoom.jsx` |
| `room-m1.html` | №1 Equal Groups | `#/m1` | `AppM1.jsx` |
| `room-m3.html` | №2 Times Facts | `#/m3` | `AppM3.jsx` |
| `room-nl.html` | №3 On the Number Line | `#/nl` | `AppNumberLine.jsx` |
| `room-r1.html` | №4 Same Denominators | `#/r1` | `AppR1.jsx` |
| `room-s1.html` | №5 Taking Away | `#/s1` | `AppSubtract.jsx` |
| `room-cmp.html` | №6 Compare & Check | `#/cmp` | `AppCompare.jsx` |
| `room-r3.html` | №7 Scale One | `#/r3` | `LessonUnlikeDen.jsx` + `lessons/r3-nonunit.js` |
| `room-r2.html` | №8 Cross-Multiply | `#/r2` | `LessonUnlikeDen.jsx` + `lessons/r2-unit.js` |
| `room-r4.html` | №9 Simplify | `#/r4` | `AppR4.jsx` |
| `room-r5.html` | №10 Mixed Numbers | `#/r5` | `AppR5.jsx` |

## Navigation map

```
title ──START──▶ world ──┬─▶ shelf-found ──▶ room-m1 / room-m3
                         ├─▶ shelf-build ──▶ room-nl / room-r1 / room-s1 / room-cmp
                         ├─▶ shelf-combine ─▶ room-r3 / room-r2 / room-r4 / room-r5
                         ├─▶ kitchen  ──(open room)──▶ room-XX
                         └─▶ review

each room-XX:  ← Map → world   ·   ↻ Rewatch → intro   ·   ▸ Return → kitchen
title & world also expose:  ⚙ settings   ·   ▦ concepts
any unbuilt id → empty-room
```

(The dark bar across the top of every page is **prototype-only chrome** — it is not part
of the real app. Use its "⌂ All screens" link to jump anywhere.)

## How to edit

- **Change shared lesson chrome** (toolbar, topbar, tab strip, goal banner, board grid)
  for ALL lesson screens at once: edit **`src/shell/LessonScreen.jsx`**.
- **Restyle everything at once** (typography, spacing, colors, overflow): edit the `--wf-*`
  tokens at the top of **`css/wf-shell.css`** — it loads last and wins over app CSS.
- **Change one lesson's content:** edit its data module in `src/screens/` (the `*HTML`
  slots hold that screen's unique interactive markup).
- **Rewire the flow:** change a tab `href` or control href in a screen's data module.
- **Add a screen:** drop a new `src/screens/<name>.js` exporting `{ kind, … }`; it auto-
  registers at route `/<name>` and the dev server hot-reloads.

The original static HTML under `screens/*.html` is retained as the source the data modules
were extracted from (see `src/screens/_CONVERSION_SPEC.md`); it's no longer served.
