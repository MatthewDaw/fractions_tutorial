// Shell.jsx — owns stage scaling + hash routing, and switches between the title
// screen, the world map, and the rooms. Routes: '' (title), 'world', 'mom',
// and the per-room ids. The hash means the tablet's back gesture works, and rooms also have
// explicit back buttons. The app opens on the title screen; START → world map.
//
// U11 additions:
//   • Shell loads the persisted engine log + masteryMap once on mount.
//   • WorldMap receives the live masteryMap so it can render per-room status and
//     the suggestion badge.
//   • On entering a room, Shell computes the scaffold-entry level from the engine
//     (entryScaffoldFor) and passes it as the `initialBeat` prop (via scaffoldMap's
//     toBeatForLevel) so each lesson starts at the right support level.
//   • The hash route is already id-agnostic — it is unchanged.
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import TitleScreen from "./TitleScreen.jsx";
import WorldMap from "./WorldMap.jsx";
import SettingsScreen from "./SettingsScreen.jsx";
import ConceptMap from "./ConceptMap.jsx";
import EmptyRoom from "./EmptyRoom.jsx";
import RoomIntro from "./RoomIntro.jsx";
import LessonUnlikeDen from "./LessonUnlikeDen.jsx";
import AppR1 from "./AppR1.jsx";
import AppR4 from "./AppR4.jsx";
import AppR5 from "./AppR5.jsx";
import AppM1 from "./AppM1.jsx";
import AppM3 from "./AppM3.jsx";
import AppNumberLine from "./AppNumberLine.jsx";
import AppSubtract from "./AppSubtract.jsx";
import AppCompare from "./AppCompare.jsx";
import MomsRoom from "./MomsRoom.jsx";
import MixedReview from "./MixedReview.jsx";
import BackgroundMusic from "./BackgroundMusic.jsx";
import TapToRead from "./TapToRead.jsx";
import EngineSurfaces from "./ui/EngineSurfaces.jsx";
import r2Unit from "./lessons/r2-unit.js";
import r3NonUnit from "./lessons/r3-nonunit.js";
import { ROOMS } from "./rooms.js";
import { sceneFor } from "./music.js";
import { entryScaffoldFor, eligibleMixSkills } from "./kitchenProgress.js";
import { toBeatForLevel } from "./runtime/scaffoldMap.js";
import { loadLog, migrateFromKitchenProgress } from "./engine/index.js";
import { measurementReduce } from "./engine/measurementReduce.js";

function useStageFit() {
  useLayoutEffect(() => {
    const stage = document.getElementById("stage");
    if (!stage) return;
    const fit = stage.parentElement; // #fit — sized to the scaled stage box
    const vv = window.visualViewport;
    const apply = () => {
      // Use the VISUAL viewport, not window.innerHeight: on iOS/iPadOS Safari the
      // layout viewport (innerHeight / 100vh) includes the area behind the dynamic
      // toolbar, so fitting to it slides the stage's bottom under the toolbar
      // ("can't see the bottom"). visualViewport is the actually-visible box.
      const vw = (vv && vv.width) || window.innerWidth;
      const vh = (vv && vv.height) || window.innerHeight;
      const s = Math.min(vw / 1280, vh / 800);
      stage.style.transform = `scale(${s})`;
      // Transforms don't change layout size, so without this the page would lay
      // out the un-scaled 800px box (clipping the bottom on short screens). Pin
      // #fit to the scaled footprint AND center it against the actually-visible
      // rect. We can't just lean on the body's flex centering: on iOS/iPadOS the
      // dynamic toolbar makes the layout viewport (100vh) taller than what's
      // visible, so layout-centering pushed the stage's bottom — the video
      // controls — down under the toolbar ("can't see the controls" on a tablet).
      // Fixed-positioning to visualViewport (offset included) keeps the whole
      // stage, controls and all, inside the visible area on every device.
      if (fit) {
        const w = 1280 * s, h = 800 * s;
        fit.style.position = "fixed";
        fit.style.width = `${w}px`;
        fit.style.height = `${h}px`;
        fit.style.left = `${(vv ? vv.offsetLeft : 0) + (vw - w) / 2}px`;
        fit.style.top = `${(vv ? vv.offsetTop : 0) + (vh - h) / 2}px`;
      }
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    if (vv) { vv.addEventListener("resize", apply); vv.addEventListener("scroll", apply); }
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      if (vv) { vv.removeEventListener("resize", apply); vv.removeEventListener("scroll", apply); }
    };
  }, []);
}

function useHashRoute() {
  const read = () => (window.location.hash.replace(/^#\/?/, "") || "title").toLowerCase();
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (r) => { window.location.hash = (!r || r === "title") ? "#/" : "#/" + r; };
  return [route, go];
}

/**
 * Load the current mastery map from the engine log (pure fold).
 * Returns null if the log is empty (no data yet).
 */
function loadMasteryMap() {
  try {
    const log = loadLog();
    if (!log || log.length === 0) return null;
    const seedPriors = migrateFromKitchenProgress();
    const { mastery } = measurementReduce(log, Date.now(), seedPriors);
    return mastery;
  } catch (_) {
    return null;
  }
}

export default function Shell() {
  useStageFit();
  const [route, go] = useHashRoute();
  // Rooms whose intro has already been watched this session (first-entry only).
  const [seenIntros, setSeenIntros] = useState(() => new Set());
  const toWorld = () => go("world");

  // Remember the last non-settings screen so the Settings "Done" button returns
  // the player exactly where they opened it from (title, world, a room…).
  const prevRouteRef = useRef("world");
  useEffect(() => { if (route !== "settings" && route !== "concepts") prevRouteRef.current = route; }, [route]);
  const openSettings = () => go("settings");
  const closeSettings = () => go(prevRouteRef.current || "world");
  const openConcepts = () => go("concepts");
  const closeConcepts = () => go(prevRouteRef.current || "world");

  // ---- Engine mastery map (U11) --------------------------------------------
  // We load the mastery map once on mount, and re-load whenever the route
  // changes back to "world" (i.e. when the child returns from a room).
  // This keeps the WorldMap badges live without a real-time engine subscription.
  const [masteryMap, setMasteryMap] = useState(null);

  useEffect(() => {
    // Refresh mastery map whenever the child returns to the world map, or enters
    // mixed review (U8 — its eligible-skill set is derived from the live map).
    if (route === "world" || route === "title" || route === "review") {
      setMasteryMap(loadMasteryMap());
    }
  }, [route]);

  // Pick the screen + whether an intro is showing (drives the music scene). The
  // screen is computed into a variable rather than early-returned so the single
  // <BackgroundMusic> below stays mounted across navigation (music never restarts
  // just because we changed rooms).
  let screen, showingIntro = false;
  const room = (route === "title" || route === "mom" || route === "review") ? null : ROOMS.find((r) => r.id === route);

  if (route === "settings") {
    // Settings screen — voice/music volume + answer input mode. Overlay-style: it
    // remembers where it was opened from and returns there on "Done".
    screen = <SettingsScreen onBack={closeSettings} />;
  } else if (route === "concepts") {
    // Concept Mastery Map — the visual connection to the measurement engine:
    // CCSS grade → cluster → standard → skill node → atomic card, with rolled-up
    // mastery. Overlay-style, like Settings: returns to where it was opened from.
    screen = <ConceptMap onBack={closeConcepts} />;
  } else if (route === "title") {
    // Title / intro screen — the app's landing. START drops into the world map.
    screen = <TitleScreen onStart={() => go("world")} />;
  } else if (route === "mom") {
    // Babushka's Room (the central kitchen): story / word problems. Not a ROOMS
    // entry — it's the hub itself, opened from the kitchen medallion on the map.
    screen = <MomsRoom onBack={toWorld} onOpenRoom={(id) => go(id)} />;
  } else if (route === "review") {
    // U8: interleaved "mixed basket" across the recipes the learner has met.
    screen = <MixedReview skills={eligibleMixSkills(masteryMap)} onExit={toWorld} />;
  } else if (!room) {
    // World map (home) for the 'world' route / anything unrecognised.
    screen = <WorldMap onOpen={(id) => go(id)} masteryMap={masteryMap} />;
  } else if (room.intro && !seenIntros.has(room.id)) {
    // First time entering a room that has an intro: play it before the room.
    showingIntro = true;
    screen = (
      <RoomIntro room={room} onBack={toWorld}
        onContinue={() => setSeenIntros((s) => new Set(s).add(room.id))} />
    );
  } else {
    // Rooms with an intro video get a "rewatch" affordance in the lesson header:
    // dropping the room from seenIntros re-renders RoomIntro (which replays from
    // the top), and its onContinue drops us back into the lesson. undefined for
    // rooms without a video, so the lesson apps simply don't render the button.
    const onRewatchIntro = room.intro
      ? () => setSeenIntros((s) => { const n = new Set(s); n.delete(room.id); return n; })
      : undefined;

    // Compute scaffold-entry level for this room from the engine (U11).
    // entryScaffoldFor returns a design level 0-4; toBeatForLevel maps that to
    // the lesson's native beat/stage key.
    // When masteryMap is null (no data yet), entryScaffoldFor returns 0 → beat "L0"/"1"/etc.
    const nodeId = room.nodeId;
    const entryDesignLevel = entryScaffoldFor(nodeId, masteryMap);
    const initialBeat = toBeatForLevel(room.id, entryDesignLevel);

    // U3 wall→room→return: the kitchen stashes the stumping recipe id in
    // sessionStorage before routing here (the hash route is stateless). Read it
    // ONCE (then clear, so a stale key can't mislabel a later direct entry) and
    // pass it down: a non-null value makes ReturnToKitchen legal in the lesson's
    // policy, and onReturnToKitchen navigates back to the kitchen on mastery.
    let stumpingRecipe = null;
    try {
      stumpingRecipe = sessionStorage.getItem("stumpingRecipeId") || null;
      if (stumpingRecipe) sessionStorage.removeItem("stumpingRecipeId");
    } catch { /* no sessionStorage available */ }
    const onReturnToKitchen = () => go("mom");

    // `no` + `title` come from rooms.js so the in-room header matches the map.
    const p = { no: room.no, title: room.title, onBack: toWorld, onRewatchIntro, initialBeat, stumpingRecipe, onReturnToKitchen };
    if (room.id === "r1") screen = <AppR1 {...p} />;
    else if (room.id === "r2") screen = <LessonUnlikeDen {...p} lesson={r2Unit} />;
    else if (room.id === "r3") screen = <LessonUnlikeDen {...p} lesson={r3NonUnit} />;
    else if (room.id === "r4") screen = <AppR4 {...p} />;
    else if (room.id === "r5") screen = <AppR5 {...p} />;
    else if (room.id === "m1") screen = <AppM1 {...p} />;
    else if (room.id === "m3") screen = <AppM3 {...p} />;
    else if (room.id === "nl") screen = <AppNumberLine {...p} />;
    else if (room.id === "s1") screen = <AppSubtract {...p} initialStage={initialBeat} />;
    else if (room.id === "cmp") screen = <AppCompare {...p} />;
    else screen = <EmptyRoom room={room} onBack={toWorld} />;
  }

  // Engine model surfaces (banner + Tier-2 nudge + inspector). The learner-facing
  // banner/nudge are active inside a lesson or the kitchen (where attempts run);
  // the inspector toggle is available there too as on-the-spot evidence.
  const inLesson = Boolean(room) && !showingIntro;
  const engineActive = inLesson || route === "mom";

  return (
    <>
      {screen}
      <TapToRead />
      <EngineSurfaces
        active={engineActive}
        showInspector={engineActive && import.meta.env.DEV}
        fallbackMasteryMap={masteryMap}
      />
      <BackgroundMusic scene={sceneFor(route, showingIntro)} />
      {(route === "title" || route === "world") && (
        <div className="fab-bar">
          <button className="settings-fab concepts-fab" onClick={openConcepts} title="Concept Mastery Map" aria-label="Concepts">
            <span className="settings-fab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
                <rect x="2" y="3" width="20" height="6" rx="1" fill="none" stroke="#1c1612" strokeWidth="2" />
                <rect x="5" y="13" width="14" height="5" rx="1" fill="none" stroke="#a32a22" strokeWidth="2" />
                <rect x="8" y="20" width="8" height="3" rx="1" fill="#a32a22" />
              </svg>
            </span>
            <span className="settings-fab-label">Concepts</span>
          </button>
          <button className="settings-fab" onClick={openSettings} title="Settings" aria-label="Settings">
            <span className="settings-fab-icon">
              <img src="/settings-gear.png" width="20" height="20" alt="" aria-hidden="true" style={{ display: "block", objectFit: "contain" }} />
            </span>
            <span className="settings-fab-label">Settings</span>
          </button>
        </div>
      )}
    </>
  );
}
