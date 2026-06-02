// settings.js — single source of truth for user preferences.
//
// Persists one object to localStorage under `bf_settings_v1` (the contract the
// Settings screen design handoff defined):
//   { voiceVol: 0-100, musicVol: 0-100, inputMode: "stylus" | "typing" }
//
// Everything that consumes a preference reads it from HERE and subscribes for
// live updates, so dragging a slider in Settings updates the music player, the
// voice channel, and every mounted answer Slate without a reload:
//   • BackgroundMusic.jsx → musicVol   (0 = muted)
//   • voice.js            → voiceVol    (applied to each clip's audio.volume)
//   • components/Slate.jsx → inputMode  (stylus handwriting vs typed digits)
//
// inputMode defaults to "stylus" to preserve the app's handwriting-first
// pedagogy; "typing" is the opt-in path for devices without a stylus.
const STORE = "bf_settings_v1";

export const SETTINGS_DEFAULTS = { voiceVol: 80, musicVol: 55, inputMode: "stylus" };

// Volumes are integers 0-100. Clamp + tolerate bad/missing values.
function clampVol(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
function normMode(m) { return m === "typing" ? "typing" : "stylus"; }

function normalize(s) {
  return {
    voiceVol: clampVol(s.voiceVol),
    musicVol: clampVol(s.musicVol),
    inputMode: normMode(s.inputMode),
  };
}

function loadInitial() {
  let s = { ...SETTINGS_DEFAULTS };
  let hadStored = false;
  try {
    const raw = localStorage.getItem(STORE);
    if (raw != null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") { s = { ...s, ...parsed }; hadStored = true; }
    }
  } catch (_) {}
  // First run only: migrate the legacy BackgroundMusic keys so existing players
  // keep their chosen music level/mute when they upgrade.
  if (!hadStored) {
    try {
      const mv = parseFloat(localStorage.getItem("musicVolume"));   // legacy 0-1
      const muted = localStorage.getItem("musicMuted") === "1";
      if (muted) s.musicVol = 0;
      else if (Number.isFinite(mv)) s.musicVol = clampVol(mv * 100);
    } catch (_) {}
  }
  return normalize(s);
}

let state = loadInitial();
const subs = new Set();

/** Current settings object (treat as read-only; use setSettings to change). */
export function getSettings() { return state; }
export function getInputMode() { return state.inputMode; }

/** Merge a partial patch, persist, and notify subscribers. */
export function setSettings(patch) {
  state = normalize({ ...state, ...patch });
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) {}
  for (const fn of subs) { try { fn(state); } catch (_) {} }
}

/** Subscribe to settings changes. Returns an unsubscribe fn. */
export function subscribeSettings(fn) { subs.add(fn); return () => subs.delete(fn); }
