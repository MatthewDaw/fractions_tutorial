---
name: wireframe-from-code
description: >-
  Reconstruct a full UI wireframe from source code (no running app needed): enumerate every
  route/screen from the router, extract each screen's component tree, and emit a structured
  per-screen wireframe (ASCII layout + Wireloom component blocks) plus Mermaid navigation and
  flow diagrams. Use when reverse-prompting a codebase needs a "full wireframe", or when asked
  to "wireframe the UI from the code", "extract the screens", or "document the app's layout".
---

# wireframe-from-code

Produce a **complete, rebuildable wireframe of an application's UI** from its source code —
deterministically, without running the app. Companion to [[reverse-prompt-codebase]]; this is
what fills `ui-wireframes.md` and `diagrams/key-flows.mmd`. The goal is a wireframe detailed
enough that a fresh agent could rebuild the screen layout and navigation from it alone.

## Method

### 1. Enumerate every screen
Find the source of truth for routes — React Router / Next.js `app/` or `pages/`, Vue Router,
SvelteKit routes, a navigation config, or the equivalent. List every route: path, the
component it renders, its params, and its guard/auth requirement. Include modal/overlay states
and meaningful empty/loading/error states — they are screens too.

### 2. Extract each screen's component tree
For each route's top component, walk the JSX/template down through child components. Capture
the **structural hierarchy** and the **content type** of each node (heading, table, form
field, button, list, image, chart). Use props, labels, and placeholder text as content hints.
Don't transcribe styling — structure and content only.

### 3. Emit the wireframe per screen
For every screen, write two representations:

**(a) ASCII layout** — cheap, diff-able structural sketch with box-drawing characters and
labeled regions:

```
┌─────────────────────────────────────────┐
│ [Logo]            [Nav: Home Lessons ▾] │
├─────────────────────────────────────────┤
│  Practice: Adding Fractions             │
│  ┌───────────────┐  ┌──────────────────┐│
│  │ [Problem card]│  │ [Answer input]   ││
│  │   3/4 + 1/8   │  │ [____] [Submit]  ││
│  └───────────────┘  └──────────────────┘│
│  [Progress bar ▓▓▓▓░░░░ 4/10]           │
└─────────────────────────────────────────┘
```

**(b) Wireloom block** — richer component detail, LLM-authored indented syntax:

```
window "Practice — Adding Fractions":
  navbar:
    text "Logo"
    menu "Home" "Lessons"
  section:
    text "Adding Fractions" heading
    panel "Problem":
      text "3/4 + 1/8"
    panel "Answer":
      input placeholder="your answer"
      button "Submit" primary
    progress value=4 max=10
```

Wireloom components you can use: containers (`window`, `header`, `footer`, `panel`, `section`,
`tabs`, `row`, `col`, `grid`), interactive (`button`, `input`, `combo`, `slider`, `toggle`,
`checkbox`), content (`text`, `kv`, `image`, `chart`, `progress`), nav (`navbar`, `tabbar`,
`breadcrumb`, `menu`). Keep to structure + content; no colors or pixel spacing.

### 4. Map navigation and key flows (Mermaid)
- A **navigation graph** — `stateDiagram-v2` or `flowchart` of screen → screen transitions,
  edges labeled with the action that triggers them (link, button, redirect, guard).
- A **sequence diagram** for the 2–3 most complex interactive flows (e.g. submit-answer →
  validate → score → advance), derived from event handlers and the calls they make.

### 5. Note dynamic & conditional UI
Record conditional rendering (auth'd vs anonymous, empty vs populated, role-gated regions),
list/repeated items (show one representative item + "× N"), and which components are driven by
which data from the data model. A rebuild needs to know *when* each piece appears, not just
that it exists.

## Output contract

Write `ui-wireframes.md` ordered by primary user journey (entry screen first), one section per
screen containing: route + guard, ASCII layout, Wireloom block, and the data/state that drives
it. Put the navigation graph at the top and the flow sequence diagrams in
`diagrams/key-flows.mmd`. If the project has no UI (library/CLI), say so explicitly and emit a
command/output sketch instead.

## Optional fidelity boost

For a verification artifact, additionally emit a single self-contained `wireframe.html`
(HTML + Tailwind, no JS, semantic labels) per key screen — useful to eyeball that the
extracted structure matches the real app. The Wireloom/ASCII blocks remain the canonical spec.
