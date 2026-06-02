// music.js — which background track(s) play on which screen.
//
// Files live in public/music/<slug> (download them with `npm run music-fetch`,
// which keeps these slugs in sync). A screen ("scene") maps to a list: one entry
// loops; several entries play as a rotation (advance on each track's end).
//
// Picks (all public-domain / free-licensed):
//   map     — Borodin, In the Steppes of Central Asia
//   kitchen — Tchaikovsky, Waltz of the Flowers (USAF Band, PD)
//   rooms   — calm/ambient rotation: Old Castle · Borodin · Bydlo · Sym. 4 Andantino
//             (Borodin is in the rooms rotation too, as requested)
// Title (Trepak) has no screen yet — add a "title" scene here when one exists.
//
// To change a pick: swap the slug here AND in scripts/fetch-music.mjs, then
// `npm run music-fetch -- --force`.

export const MUSIC_BASE = import.meta.env.BASE_URL + "music/";

// All tracks are MP3: Ogg Vorbis is not universally decoded by browsers (notably
// silent in some Chrome/tablet setups and unsupported on iOS Safari), whereas MP3
// plays everywhere. fetch-music.mjs downloads the Commons .ogg sources and
// transcodes them to these .mp3 slugs.
export const MUSIC = {
  map:     ["borodin-steppes.mp3"],
  kitchen: ["waltz-flowers.mp3"],
  rooms:   ["old-castle.mp3", "borodin-steppes.mp3", "bydlo.mp3", "sym4-andantino.mp3"],
};

// Map a Shell route to a music scene. Intros are self-narrated "videos" — no
// music under them. World map (and any fallback) gets the map theme.
export function sceneFor(route, showingIntro) {
  if (showingIntro) return null;
  if (route === "mom") return "kitchen";
  if (/^r[1-9]\d*$/.test(route)) return "rooms";
  return "map";
}
