// Shell.jsx — owns stage scaling + hash routing, and switches between the title
// screen, the world map, and the rooms. Routes: '' (title), 'world', 'mom',
// 'r1'..'r5'. The hash means the tablet's back gesture works, and rooms also have
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
import { useState, useEffect, useLayoutEffect } from "react";
import TitleScreen from "./TitleScreen.jsx";
import WorldMap from "./WorldMap.jsx";
import EmptyRoom from "./EmptyRoom.jsx";
import RoomIntro from "./RoomIntro.jsx";
import LessonUnlikeDen from "./LessonUnlikeDen.jsx";
import AppR1 from "./AppR1.jsx";
import AppR4 from "./AppR4.jsx";
import AppR5 from "./AppR5.jsx";
import MomsRoom from "./MomsRoom.jsx";
import BackgroundMusic from "./BackgroundMusic.jsx";
import r2Unit from "./lessons/r2-unit.js";
import r3NonUnit from "./lessons/r3-nonunit.js";
import { ROOMS } from "./rooms.js";
import { sceneFor } from "./music.js";
import { entryScaffoldFor } from "./kitchenProgress.js";
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

  // ---- Engine mastery map (U11) --------------------------------------------
  // We load the mastery map once on mount, and re-load whenever the route
  // changes back to "world" (i.e. when the child returns from a room).
  // This keeps the WorldMap badges live without a real-time engine subscription.
  const [masteryMap, setMasteryMap] = useState(null);

  useEffect(() => {
    // Refresh mastery map whenever the child returns to the world map.
    if (route === "world" || route === "title") {
      setMasteryMap(loadMasteryMap());
    }
  }, [route]);

  // Pick the screen + whether an intro is showing (drives the music scene). The
  // screen is computed into a variable rather than early-returned so the single
  // <BackgroundMusic> below stays mounted across navigation (music never restarts
  // just because we changed rooms).
  let screen, showingIntro = false;
  const room = (route === "title" || route === "mom") ? null : ROOMS.find((r) => r.id === route);

  if (route === "title") {
    // Title / intro screen — the app's landing. START drops into the world map.
    screen = <TitleScreen onStart={() => go("world")} />;
  } else if (route === "mom") {
    // Babushka's Room (the central kitchen): story / word problems. Not a ROOMS
    // entry — it's the hub itself, opened from the kitchen medallion on the map.
    screen = <MomsRoom onBack={toWorld} onOpenRoom={(id) => go(id)} />;
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

    // `no` + `title` come from rooms.js so the in-room header matches the map.
    const p = { no: room.no, title: room.title, onBack: toWorld, onRewatchIntro, initialBeat };
    if (room.id === "r1") screen = <AppR1 {...p} />;
    else if (room.id === "r2") screen = <LessonUnlikeDen {...p} lesson={r2Unit} />;
    else if (room.id === "r3") screen = <LessonUnlikeDen {...p} lesson={r3NonUnit} />;
    else if (room.id === "r4") screen = <AppR4 {...p} />;
    else if (room.id === "r5") screen = <AppR5 {...p} />;
    else screen = <EmptyRoom room={room} onBack={toWorld} />;
  }

  return (
    <>
      {screen}
      <BackgroundMusic scene={sceneFor(route, showingIntro)} />
    </>
  );
}
