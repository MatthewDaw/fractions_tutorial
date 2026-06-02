// voice.js — the shared narration channel.
//
// useVoice() returns { soundOn, speaking, say, stopVoice, toggleSound }:
//   say(keyOrText, { speaker }) — speak a line. Resolution order:
//     1. a baked clip key (an entry in voiceLines.js) → play public/voice/<key>.mp3
//     2. the EXACT text of a baked line → resolve back to its key → same clip
//     3. anything else (arbitrary on-screen text) → synthesize it IN CHARACTER via
//        the dev /api/tts service (cached to disk), picking the voice from
//        `speaker` (or the line's prefix, default: the Cook).
//     There is NO robotic Web Speech fallback — if synthesis is unavailable we
//     stay SILENT rather than ever speaking in the browser's default voice.
//   stopVoice()   — silence whatever is playing (call on every board-advance).
//   toggleSound() — mute/unmute the whole app.
//
// ONE voice plays at a time across the ENTIRE app: every useVoice() instance and
// the global tap-to-read layer (TapToRead.jsx) share a single module-level
// channel, so a new line always cuts off the last and nothing ever overlaps —
// even across components. Sound on/off and "is speaking" are app-wide too.
import { useState, useRef, useEffect, useCallback } from "react";
import { LINES, speakerOf } from "./voiceLines.js";
import { audioBus } from "./audioBus.js";
import { speechify } from "./speechify.js";

const VOICE_BASE = import.meta.env.BASE_URL + "voice/";
const TTS_URL = import.meta.env.BASE_URL + "api/tts";
const TEXT_TO_KEY = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [v, k]));

// ── App-wide single channel (module state) ──────────────────────────────────
let current = null;       // { audio, url } currently playing, or null
let currentId = null;     // id of the playing/pending source ("clip:<key>" / "tts:<speaker>|<text>")
let busActive = false;    // mirrors audioBus start/end so they always balance
let soundOn = true;       // app-wide mute
let lastAppSayAt = 0;     // last app-driven say() — taps yield to it (no talk-over)

const speakingSubs = new Set(); // each useVoice()'s setSpeaking (UI pulse)
const soundSubs = new Set();    // each useVoice()'s setSoundOn (mute button)
const emit = (subs, v) => { for (const fn of subs) { try { fn(v); } catch (_) {} } };

function setBus(on) {
  if (on === busActive) return;
  busActive = on;
  on ? audioBus.voiceStart() : audioBus.voiceEnd();
}

// Stop the playing AUDIO only, leaving the play-intent (currentId / token) alone —
// used by playUrl to replace the previous clip without dropping the new intent.
function haltAudio() {
  const c = current; current = null;
  if (c) {
    try { c.audio.pause(); } catch (_) {}
    if (c.url) { try { URL.revokeObjectURL(c.url); } catch (_) {} }
  }
  // cancel any in-flight Web Speech too (defensive — we never start it ourselves)
  if (typeof speechSynthesis !== "undefined") { try { speechSynthesis.cancel(); } catch (_) {} }
  setBus(false); emit(speakingSubs, false);
}

// Fully stop: halt audio AND clear the play-intent (so the next identical request
// plays fresh rather than toggling) and cancel any in-flight TTS fetch.
export function stopVoiceGlobal() {
  currentId = null;
  playArbitrary._token++;
  haltAudio();
}

// Play a clip/object URL through the shared channel.
function playUrl(url, objectUrl = null) {
  haltAudio();
  const audio = new Audio(url);
  const entry = { audio, url: objectUrl };
  current = entry;
  const finish = () => {
    if (current !== entry) return;
    current = null; currentId = null;   // ended naturally → next tap replays
    if (entry.url) { try { URL.revokeObjectURL(entry.url); } catch (_) {} }
    setBus(false); emit(speakingSubs, false);
  };
  audio.addEventListener("playing", () => { if (current === entry) { setBus(true); emit(speakingSubs, true); } });
  audio.addEventListener("ended", finish);
  audio.addEventListener("error", finish);
  audio.play().catch((e) => { if (e && e.name === "AbortError") return; finish(); });
  return audio;
}

// A baked clip key for this key/text, or null when there's no baked clip.
function clipKeyFor(keyOrText) {
  if (LINES[keyOrText]) return keyOrText;            // already a clip key
  if (TEXT_TO_KEY[keyOrText]) return TEXT_TO_KEY[keyOrText]; // exact line text → key
  return null;
}

// Synthesize already-normalized text in-character via the dev TTS service, then
// play it. `id` is this request's play-intent: if it's been superseded (newer
// request) or toggled off (stopVoiceGlobal) by the time the fetch resolves, we
// don't play. On any failure we stay silent — never the robotic Web Speech voice.
async function playArbitrary(spoken, speaker, id) {
  // remember which request we're serving, so a newer say()/stop wins the race
  const token = ++playArbitrary._token;
  const live = () => token === playArbitrary._token && currentId === id;
  try {
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: spoken, speaker: speaker || "cook" }),
    });
    if (!live()) return;
    if (!res.ok) { if (currentId === id) currentId = null; return; } // 204 (cat) / error → silent
    const blob = await res.blob();
    if (!live()) return;
    if (!blob || blob.size === 0) { if (currentId === id) currentId = null; return; }
    const url = URL.createObjectURL(blob);
    playUrl(url, url); // pass as objectUrl so finish()/haltAudio revokes it
  } catch (_) { if (currentId === id) currentId = null; }
}
playArbitrary._token = 0;

// Core speak: clip key OR exact line OR arbitrary text. `speaker` picks the
// character voice for arbitrary text (ignored when a baked clip exists — the
// clip already owns its voice). RE-REQUESTING THE SAME SOURCE while it's already
// playing/loading TOGGLES IT OFF (stop), rather than restarting it.
function speak(keyOrText, opts = {}) {
  if (!soundOn) return;
  const key = clipKeyFor(keyOrText);
  let id, run;
  if (key) {
    id = "clip:" + key;
    run = () => playUrl(VOICE_BASE + key + ".mp3");
  } else {
    const speaker = opts.speaker || (typeof keyOrText === "string" ? speakerOf(keyOrText) : "cook");
    const spoken = speechify(String(keyOrText));
    if (!spoken) return;
    id = "tts:" + speaker + "|" + spoken;
    run = () => playArbitrary(spoken, speaker, id);
  }
  if (currentId === id) { stopVoiceGlobal(); return; } // same source playing → stop (toggle off)
  stopVoiceGlobal();   // stop whatever else is playing
  currentId = id;
  run();
}

// Used by the global tap-to-read layer. Like speak(), but YIELDS to app-driven
// narration: if the app just spoke (e.g. a Check result fired on the same tap),
// we don't read the tapped control's label over it.
export function readAloud(textOrKey, speaker) {
  if (!soundOn) return;
  if (Date.now() - lastAppSayAt < 250) return;
  speak(textOrKey, { speaker });
}

function setSoundOnGlobal(v) {
  soundOn = v;
  if (!v) stopVoiceGlobal();
  emit(soundSubs, v);
}

export function useVoice() {
  const [soundOnState, setSoundOnState] = useState(soundOn);
  const [speaking, setSpeaking] = useState(busActive);

  // track the shared channel for this instance's UI (pulse + mute button)
  useEffect(() => {
    speakingSubs.add(setSpeaking);
    soundSubs.add(setSoundOnState);
    setSpeaking(busActive); setSoundOnState(soundOn);
    return () => { speakingSubs.delete(setSpeaking); soundSubs.delete(setSoundOnState); };
  }, []);

  const say = useCallback((keyOrText, opts) => {
    if (!soundOn) return;
    lastAppSayAt = Date.now();      // app-driven speech wins over taps
    speak(keyOrText, opts || {});
  }, []);

  const stopVoice = useCallback(() => { stopVoiceGlobal(); }, []);
  const toggleSound = useCallback(() => { setSoundOnGlobal(!soundOn); }, []);

  useEffect(() => () => stopVoiceGlobal(), []); // silence on unmount / navigation

  return { soundOn: soundOnState, speaking, say, stopVoice, toggleSound };
}
