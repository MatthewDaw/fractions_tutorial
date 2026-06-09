# ui-wireframes — shell-nav fragment (CHROME screens)

Per-screen layouts for the chrome/overlay screens owned by this slice. The NAV
GRAPH connecting these screens (and the rooms) is SYNTHESIS-OWNED — not drawn here.
Room/lesson layouts belong to lessons-rooms (pointer). All screens render in the
1280×800 stage; coordinates below are in that space.

Legend: ASCII boxes show structure; `Wireloom` blocks give the layout tree
(node : description, indentation = nesting).

---

## TitleScreen (`route ''/title`) — `TitleScreen.jsx`

```
┌───────────────────────────── 1280×800 (cream paper, engraved frame, 4 corners) ──┐
│ ½ (giant ghosted motif, behind)                                                   │
│  ● Moscow Puzzles · No. 1                                                          │
│  Babushka’s                                                                        │
│  FRACTIONS  (red, huge)                          [character cluster bottom-right:  │
│  Бабушкины доли · Babushkiny Doli                 Cook · Grandpa · Mom(front) ·    │
│  Slice the dough and add up the shares.           Cat · Kid — woodcut figures]     │
│                                                                                    │
│  [½ strip] + [⅓ strip] = ( ? )   ← hero equation                                   │
│                                                                                    │
│  ┌──────────────────────────────┐                                                 │
│  │  Let’s Slice!                 │  (START → world)                               │
│  │  Начать · let’s add fractions │                                                │
│  └──────────────────────────────┘                                                 │
└────────────────────────────────────────────────────────────────────────────────-┘
   FAB bar (shared, bottom): [▤ Concepts] [⚙ Settings]
```

```Wireloom
titlescreen [scene, data-vox-speaker=cook]
  paper-fill / foxing / frame / Corners(tl,tr,bl,br)
  ghost-half : giant ½ motif behind everything
  title-block (left)
    kicker : "Moscow Puzzles · No. 1"
    h1.ru-title : "Babushka’s"
    h1.ru-title (red) : "Fractions" [data-vox=titleWelcome]
    subtitle-row : Cyrillic + Latin transliteration
    gloss : "Slice the dough and add up the shares."
    strip-eq : FStrip(1/2) + FStrip(1/3) = ? (bouncing)
    button.start [autoFocus] → onStart() → world
  figures (bottom-right) : Cook, Grandpa, Kid, Cat, Mom(front)
```
Behavior: Cook greets via `say("titleWelcome")` on mount; retried once on first
gesture if autoplay was blocked.

---

## WorldMap — TOP level (`route world`) — `WorldMap.jsx`

```
┌───────────────────────────── 1280×800 (paper) ───────────────────────────────────┐
│                         LESSON MAP                                                 │
│                    Babushka's Fractions      [🧺 Mixed Basket ▸] → review          │
│                                                                                    │
│     ┌──shelf "found"──┐                       ┌──shelf "build"──┐                  │
│     │ №1–2  [Next?]   │        recipe          │ №3–6  [Next?]  │                  │
│     │ Counting & Times│        trails          │ Building Frac. │                  │
│     │ x/2 mastered ▸  │  ╲      (SVG)     ╱     │ x/4 mastered ▸ │                  │
│     └─────────────────┘   ╲              ╱      └────────────────┘                 │
│                        ┌── kitchen node (CENTER 640,420) ──┐                       │
│                        │ Babushka's Kitchen                 │ → mom                │
│                        │ ▸ Cook with Babushka  (Mom medal)  │                      │
│                        └────────────────────────────────────┘                     │
│                          ┌──shelf "combine" (640,648)──┐                           │
│                          │ №7–10   Combining & Renaming │                          │
│                          └──────────────────────────────┘                         │
│   Three shelves, ten lessons, in order — start at the kitchen, or open any shelf.  │
└────────────────────────────────────────────────────────────────────────────────-┘
   FAB bar (shared): [▤ Concepts] [⚙ Settings]
```

```Wireloom
world (top level)
  world-head : tag "Lesson Map", h1, button.mixbasket-btn → onOpen("review")
  svg.wedges : trailPath(CENTER → each strand.pos) + centre dot
  button.kitchen-node → onOpen("mom") : Mom medallion + "Cook with Babushka"
  STRANDS.map → button.shelf [--suggested if hasSuggested, --done if allMastered]
    shelf-head : №range + "Next"badge? + "Done"badge?
    shelf-title / shelf-blurb
    shelf-foot : "{mastered}/{total} mastered" · "Open shelf ▸"
  world-foot
```

## WorldMap — SUBMENU level (one strand open)

```
┌───────────────────────────── 1280×800 ───────────────────────────────────────────┐
│ [← All lessons]                                                                    │
│        Shelf · Lessons 3–6                                                         │
│        Building Fractions                                                          │
│        (blurb)                                                                     │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   ← centred row, chain trail under │
│   │№3 [tag]│  │№4 [tag]│  │№5 [tag]│  │№6 [tag]│     (250px cards, GAP 42, Y=438)   │
│   │ title  │  │ title  │  │ title  │  │ title  │                                    │
│   │concept │  │concept │  │concept │  │concept │                                    │
│   │verb:ex │  │verb:ex │  │verb:ex │  │verb:ex │                                    │
│   └────────┘  └────────┘  └────────┘  └────────┘                                    │
│        Tap a lesson to begin — or go back to pick another shelf.                   │
└────────────────────────────────────────────────────────────────────────────────-┘
```
Card tag = status ("Mastered"/"In progress"/"Cook again") OR "Ready"/"Coming soon"
(by `built`); a `Next` tag marks the suggested room. Click → `onOpen(room.id)`.

---

## EmptyRoom (unbuilt room fallback) — `EmptyRoom.jsx`

```
┌───────────────────────────── 1280×800 ───────────────────────────────────────────┐
│                         №{no}                                                      │
│                       Lesson {no}                                                  │
│                       {room title}                                                 │
│   This room isn't built yet. Head back to Babushka's kitchen and pick a lesson     │
│   that's ready.                                                                    │
│                  [← Back to the kitchen map]                                       │
└────────────────────────────────────────────────────────────────────────────────-┘
```

---

## RoomIntro (first room entry) — `RoomIntro.jsx`

```
┌───────────────────────────── 1280×800 ──────────────────────────┬─ transcript ───┐
│  ┌── iframe (room.intro HTML, silent animated video) ─────────┐ │ Transcript [⚙]  │
│  │                                                            │ │ ▸ Start of video │
│  │                  (the intro "video")                       │ │ • cue line 1     │
│  │                                                            │ │ • cue line 2 ◀on │
│  └────────────────────────────────────────────────────────────┘ │ • cue line …     │
│  intro-bar:  [←] [⏸/▶]  Lesson N · Title — intro      [Skip ▸]   │ Narrated by Cook │
│                                                                 │ click to jump    │
│  …on completion → intro-endcard:                                └────────────────-┘
│      "Watch the intro again, or start the lesson?"
│      [↺ Watch again]   [Continue to the lesson →]
└──────────────────────────────────────────────────────────────────────────────────┘
```

```Wireloom
intro [has-transcript if cues, data-novox]
  intro-main
    iframe.intro-frame (key=replayKey, src=room.intro)
    intro-bar (when !ended) : back ← / pause-play / label / "Skip ▸"
    intro-endcard (when ended) : back ← / "Watch again" / "Continue"
  intro-transcript (when hasNarration)
    tr-head : "Transcript" + SettingsButton(tr-mute)
    tr-list : "Start of the video" + one li per cue (active highlight)
    tr-foot
```
Narration is gated to the iframe playhead (`localStorage[STAGE_PERSIST_KEY:t]`);
clicking a transcript line seeks; completion is a pause-aware timer.

---

## SettingsScreen (`route settings`) — `SettingsScreen.jsx`

```
┌───────────────────────────── 1280×800 (paper, frame, corners) ────────────────────┐
│  ● Babushka’s Fractions                                          [‹ Done]          │
│  Settings                                                                          │
│  Настройки · Nastroyki                                                             │
│                                                                                    │
│  1  Sound ─────────────────────────────────────────────                           │
│     🔊 Voice lines   [████████░░░░░░░░] knob          80%                          │
│         Spoken hints and praise from the characters                               │
│     🎵 Music         [█████░░░░░░░░░░░] knob          55%                          │
│         Background music throughout the game                                      │
│                                                                                    │
│  2  How you answer ────────────────────────────────────                           │
│     ┌─ ✎ Stylus ───────────────┐   ┌─ ⌨ Typing ──────────────┐                    │
│     │ Write numbers by hand ✓  │   │ Tap numbers on keyboard  │                    │
│     │            [✓ Selected]  │   │              ( ◯ radio )  │                    │
│     └──────────────────────────┘   └──────────────────────────┘                   │
└────────────────────────────────────────────────────────────────────────────────-┘
```

```Wireloom
settings-scene [data-vox-speaker=cook]
  paper-fill / foxing / frame / corners
  st-inner
    st-head : kicker / h1 "Settings" / Cyrillic sub · button.st-back "Done" → onBack
    st-section "1 Sound"
      VolumeRow(Voice lines) : icon / name+hint / slider(role=slider, kbd ±5) / value%|"Off"
      VolumeRow(Music)
    st-section "2 How you answer"
      ModeCard(Stylus)  [aria-pressed] → setSettings({inputMode:"stylus"})
      ModeCard(Typing)  → setSettings({inputMode:"typing"})
```
Sliders write `voiceVol`/`musicVol` (0=Off); cards toggle `inputMode`. All persist to
`bf_settings_v1` and apply live. "Done" returns to the opening route.

`SettingsButton.jsx`: a single `.ctrl-btn` gear (settings-gear.png) that sets
`location.hash = "#/settings"`; it sits in lesson/intro header clusters.

---

## ConceptMap (`route concepts`) — `ConceptMap.jsx`

```
┌───────────────────────────── 1280×800 (paper, frame, corners) ────────────────────┐
│  ● Babushka’s Fractions                       [● Live engine data] [‹ Done]        │
│  Concept Mastery Map                                                               │
│  Pick a concept up top to open its subconcepts…                                    │
│  legend: ■ Mastered(85%+)  ■ Partial(50%+)  ■ Weak(15%+)  □ Not started            │
│                                                                                    │
│  ┌─ TOP NAV (tabs) ────────────────────────────────────────────────────────────┐  │
│  │ (◌42) Multiplication  (◌70) Fractions as #  (◌..) Adding & Subtracting  …    │  │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ DETAIL (selected concept) ─────────────────────────────────────────────────┐  │
│  │ (◌ring) {Concept title}   {blurb}                                            │  │
│  │  ▾ (◌ring) Node title  NODE_ID   concept…   [example]  {n} cards             │  │
│  │       Builds on: [prereq][prereq]   aligned to 4.NF.B.3a                      │  │
│  │       ┌card┐ ┌card┐ ┌card┐ ┌card┐  (chip Visual/…/Transfer, Lk, formId, bar) │  │
│  │  ▸ (◌ring) Next node …                                                        │  │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────-┘
```

```Wireloom
cm-scene [data-vox-speaker=cook]
  cm-head : kicker / h1 / sub · cm-source(live|placeholder) · button.cm-back "Done"
  cm-legend : strong / partial / weak / empty swatches
  nav.cm-nav (role=tablist) : per-concept tab = Ring(mastery) + title + "{k} skills"
  cm-detail (active concept)
    cm-detail-head : Ring + title + blurb
    cm-scroll : NodeRow per child
      cm-node-head : caret / Ring / title+NODE_ID / concept / example / "{n} cards"
      cm-node-body (when open)
        cm-prereqs "Builds on" pills + cm-node-ccss "aligned to {codes}"
        cm-cards : AtomicCards (chip levelName/Transfer, L{level}, formId, CardBar)
```
Mastery rolls up card → node → concept; banding strong/partial/weak/empty. Header
chip reflects `isLiveMastery()`.

---

## Shared chrome — FAB bar + global mounts (rendered by `Shell.jsx`)

Shown ONLY on `title` and `world`:
```
.fab-bar (bottom):  [ ▤ Concepts ] [ ⚙ Settings ]   → #/concepts , #/settings
```
Always mounted (no visible chrome of their own here): `BackgroundMusic` (UI-less),
`TapToRead` (injects per-block speaker buttons), `EngineSurfaces` (pointer:
ui-surfaces — banner/nudge/inspector).
