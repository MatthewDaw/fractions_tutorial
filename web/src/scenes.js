// scenes.js — central registry of standalone (non-lesson) scenes so their routes
// + identity are enumerable in ONE place, mirroring the wireframe's screen data
// modules (docs/wireframe/src/screens/*.js) and the lessons registry
// (src/lessons/index.js).
//
// Lessons carry their identity + tab strip in src/lessons/<id>.js. The raw scenes
// (Settings, Title, …) have no tab strip, so their "identity" is just the chrome
// copy a scene renders in its header. Keeping it here means routes are
// discoverable and the header copy is data, not inline strings.
//
// PURELY ADDITIVE: the router (Shell.jsx) is unchanged; a scene component imports
// the entry it needs. Add scenes here as they are migrated onto SceneFrame.
export const SCENES = {
  settings: {
    id: "settings",
    route: "#/settings",
    kind: "raw",
    title: "Settings",
    kicker: "Babushka’s Fractions",
    subCyr: "Настройки", // Настройки
    subLat: "Nastroyki",
    // back/Done returns to the screen the player opened Settings from (Shell owns
    // the actual target via onBack); this label is the visible control copy.
    backLabel: "Done",
  },
};

export default SCENES;
