# design — shell-nav fragment

How the shell/nav/audio layer is built and WHY. The top-level engine⇄runtime⇄
lessons architecture overview and the route GRAPH are synthesis-owned; this fragment
covers the router mechanics, stage scaling, the concept-tree composition, the intro
narration sync, and the audio routing/ducking design.

---

## Router & shell (`Shell.jsx`)

**What:** a hand-rolled hash router with no router library. `useHashRoute` reads
`#/<route>` (default `title`), subscribes to `hashchange`, and exposes `go(r)`.
`Shell` computes a single `screen` variable from the route (a long if/else over
`settings`/`concepts`/`title`/`mom`/`review`/room-or-not), then renders it ALONGSIDE
the always-mounted globals.

**Why hash routing:** the URL hash makes the tablet's back gesture work for free, and
every screen also has an explicit back button. No server means no need for history
routing.

**Why a computed `screen` instead of early returns:** `BackgroundMusic`,
`TapToRead`, and `EngineSurfaces` must stay mounted across navigation (music must not
restart when you change rooms), so the render tree is `<>{screen}<TapToRead/>
<EngineSurfaces/><BackgroundMusic/>{fab}</>` — the screen swaps underneath the
persistent layer.

**Overlay return-to-origin:** `settings`/`concepts` are overlay routes; a
`prevRouteRef` records the last non-overlay route (`useEffect` on route change) so
"Done" returns the player exactly where they opened it from.

**Room dispatch:** for a room route, `Shell` resolves `ROOMS.find(id)`, decides
intro-vs-lesson (`seenIntros` set), computes the scaffold-entry beat
(`entryScaffoldFor`→`toBeatForLevel`), reads/clears the `stumpingRecipeId`, and
hands a common prop bag to the room component (`AppR1`, `LessonUnlikeDen` with a
`lesson` config, etc.). Rooms themselves are owned by lessons-rooms (pointer).

## Stage scaling (`useStageFit`)

**What:** a single uniform-scale fit of the 1280×800 stage to the viewport.
`scale = min(vw/1280, vh/800)` on `#stage`; `#fit` is `position:fixed`, sized to the
scaled box, and centered against the visual viewport rect.

**Why `visualViewport` (not `innerHeight`):** on iOS/iPadOS Safari the layout
viewport includes the area behind the dynamic toolbar, so fitting/centering to it
slides the stage bottom under the toolbar ("can't see the controls"). Fitting to the
actually-visible `visualViewport` rect (offset included) keeps the whole stage on
screen on every device. Re-fits on `resize`/`orientationchange`/`visualViewport`
resize+scroll. (Constitution §6.)

## Mastery load timing (pointer: engine-core)

**What:** `loadMasteryMap()` folds the engine log to a per-node MasteryEstimate map.
It runs on mount and whenever the route returns to `world`/`title`/`review`.

**Why on return only:** keeps the WorldMap badges live WITHOUT a real-time engine
subscription — the map only needs fresh data when the child comes back from a room.
`Date.now()` is injected here (the React boundary) so the engine fold stays
wall-clock-free.

**Retention probe settle (U7):** opening a room with a due probe stashes its node in
`probingNodeRef`; the next return re-folds and calls
`recordRetentionProbe(node, isMastered(fresh))`. This is the only place the shell
writes to the log — and it does so at the navigation boundary, consistent with the
boundary-only decisions rule (constitution §5.3; the decision call itself lives in
`useLessonEngine`, pointer: runtime-affect).

## World map two-level design (`WorldMap.jsx`)

**What:** a TOP level of three shelf nodes (STRANDS) around the kitchen joined by
"recipe trail" SVG paths, and a SUBMENU of one strand's lesson cards as a centered
row. `submenuPositions(n)` lays N 250px cards centre-anchored; `trailPath` draws a
soft quadratic between node centres.

**Why two levels:** ten lessons no longer fit one radial ring without overlap, so
they group into three contiguous-curriculum strands; the recipe-trail aesthetic and
per-lesson card survive the regrouping. Per-room status, the suggested-next "Next"
badge, and the shelf rollup (`mastered/total`, "Done") all read the engine via
`kitchenProgress` helpers; `masteryMap == null` degrades to the no-data rendering.

## Concept-tree composition (`conceptTree.js` + `ConceptMap.jsx`)

**What:** `buildConceptTree()` composes the engine skill graph (`allNodes`), room
metadata (`rooms.js`), and CCSS tags (`ccssStandards.js`) into
`Concept → Node → Atomic card`. Atomic cards come from each node's
`scaffold_ladder` rungs + `transfer_forms`; mastery is MEASURED only at the card and
rolled up (`rollup`/`collectLeafMastery` average) to node and concept.

**Why grade-free:** the app is pace-agnostic — concepts are ordered by the prereq
graph, not by grade. CCSS codes appear as reference labels only and never organize or
gate. A `More` bucket guarantees no engine node is silently hidden.

**The mastery seam:** `getMastery(key, nodeId)` is the single seam — LIVE (node
`P_known` rolled to cards when a log exists) or a deterministic placeholder hash
otherwise. `ConceptMap.jsx` is pure presentation (Ring/CardBar, banding strong/
partial/weak/empty, a live-vs-placeholder header chip).

## Intro narration sync (`RoomIntro.jsx` + `intro*.js`)

**What:** the intro is a silent self-contained animated HTML page in a same-origin
iframe. The iframe `<Stage>` writes its playhead to
`localStorage[STAGE_PERSIST_KEY + ":t"]`; `RoomIntro` polls that clock in a
`requestAnimationFrame` loop and fires each pre-baked narration clip when the
playhead passes BOTH the cue's `gate` and `prevEnd + pause`.

**Why drive narration off the video's own clock:** Pause "just works" — a paused
video freezes the playhead, so the gates freeze and the loop naturally stalls; we
pause the current clip alongside via `iframe.contentWindow.__anim.pause()`. Seeking
(transcript click) primes the clock + hands the loop an `{idx,t}` request so the
right line plays next. Completion is a pause-aware wall-clock timer because the video
emits no "finished" event.

**Why narration lives outside the video:** the bundled videos are silent, so the
voice + transcript layer (R2) is bolted on without re-rendering the video; the cue
`key`s/`text` are stable so baked mp3s are reused across timeline edits.

## Audio routing & ducking

**Three coordinated modules:**
- `audioBus.js` — a count-based global signal of "is any voice active?". Voice
  start/end bracket each utterance; the count handles overlapping/relaunched voices.
- `music.js` — `MUSIC[scene]` track lists + `sceneFor(route, showingIntro)` mapping
  routes to scenes (`mom`→kitchen, rooms→rooms rotation, intro→null, else map).
- `BackgroundMusic.jsx` — a UI-less player (a JS `<Audio>` ref, not a DOM node).
  Single-track scenes loop natively; multi-track scenes rotate on `ended`. It plays
  unless muted / no tracks / a voice is active, fading out+pausing under narration
  and fading back in — realizing "whenever there is no voice, there is music".

**Voice channel (`voice.js`):** a module-level single channel shared by every
`useVoice()` and `TapToRead`, so exactly one voice plays app-wide and a new line cuts
the last. Resolution: baked clip key → exact-line-text → arbitrary-text TTS via
`/api/tts` (in-character by `speaker`). A `currentId` token toggles a repeated source
off and wins races against late TTS fetches. **No robotic Web Speech fallback** — on
failure it stays silent (constitution §5.9). `readAloud` yields to app-driven
`say()` within 250ms so a tapped label never talks over a Check result.

**Tap-to-read (`TapToRead.jsx`):** a root-mounted `MutationObserver` injects a
speaker button next to each LEAF readable copy block in `#stage`, skipping
interactive/manipulative surfaces and `[data-novox]`. A capture-phase click handler
reads the block (`[data-vox]` clip or synthesized own-text, voiced by nearest
`[data-vox-speaker]`, default Cook) and toggles off on re-press — no per-page wiring.

**Speech normalization (`speechify.js`):** spells fractions ("5/7"→"five sevenths"),
reads `№`, strips UI glyphs, collapses whitespace. The normalized string doubles as
the TTS cache key, so a visible string maps to exactly one baked clip.

## CSS / scene-scoping convention

Each chrome screen scopes its styles under a single scene class (`.titlescreen`,
`.settings-scene`, `.cm-scene`, `.world`) so generic class names (`.frame`,
`.corner`, `.paper-fill`, `.rv`, `.foxing`) never leak between screens.
`styles/tokens.css` holds the shared design tokens (the Soviet/old-paper palette +
fonts); `voicetap.css` styles the injected speaker buttons. All scenes share the
1280×800 paper-fill + engraved-frame + corner-filigree motif.
