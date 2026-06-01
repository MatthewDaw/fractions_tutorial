// voice.js — the shared narration hook. One copy of the play-a-clip-or-fall-back-
// to-Web-Speech logic that every room used to duplicate.
//
// useVoice() returns { soundOn, speaking, say, stopVoice, toggleSound }:
//   say(keyOrText) — play the pre-baked clip public/voice/<key>.mp3 (keys are the
//     entries in voiceLines.js); a missing clip or an unknown key falls back to the
//     browser's Web Speech voice reading the text. Accepts either a clip key or the
//     raw line text (resolved back to its key).
//   stopVoice()    — silence any in-flight clip / Web Speech (call it on every
//     board-advance so a new question doesn't talk over the last).
//   toggleSound()  — mute/unmute (also stops the current clip when muting).
// The hook silences itself on unmount, so leaving a room never leaves audio playing.
import { useState, useRef, useEffect } from "react";
import { LINES } from "./voiceLines.js";
import { audioBus } from "./audioBus.js";

const VOICE_BASE = import.meta.env.BASE_URL + "voice/";
const TEXT_TO_KEY = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [v, k]));

export function useVoice() {
  const [soundOn, setSoundOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const soundRef = useRef(true);
  const audioRef = useRef(null); // the currently-playing clip, so we can stop it
  const activeRef = useRef(false); // mirrors our audioBus start/end so they balance
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);

  // Single source of truth for "this voice is talking": drives both the local
  // `speaking` flag (UI pulse) and the global audioBus (music ducking).
  function mark(on) {
    setSpeaking(on);
    if (on === activeRef.current) return;
    activeRef.current = on;
    on ? audioBus.voiceStart() : audioBus.voiceEnd();
  }

  function stopVoice() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) {} audioRef.current = null; }
    if (typeof speechSynthesis !== "undefined") { try { speechSynthesis.cancel(); } catch (e) {} }
    mark(false);
  }
  function speakFallback(text) {
    if (typeof speechSynthesis === "undefined") return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.rate = 0.96; u.pitch = 1.06;
      u.onstart = () => mark(true); u.onend = () => mark(false); speechSynthesis.speak(u);
    } catch (e) {}
  }
  function say(keyOrText) {
    if (!soundRef.current) return;
    stopVoice();
    const key = LINES[keyOrText] ? keyOrText : TEXT_TO_KEY[keyOrText];
    const text = LINES[key] || keyOrText;
    if (!key) { speakFallback(text); return; }
    const a = new Audio(VOICE_BASE + key + ".mp3");
    audioRef.current = a;
    let settled = false;
    const fallback = () => { if (settled) return; settled = true; if (audioRef.current === a) audioRef.current = null; speakFallback(text); };
    a.addEventListener("playing", () => { settled = true; mark(true); });
    a.addEventListener("ended", () => { mark(false); if (audioRef.current === a) audioRef.current = null; });
    a.addEventListener("error", fallback);
    a.play().catch((e) => { if (e && e.name === "AbortError") return; fallback(); });
  }
  function toggleSound() { setSoundOn((v) => { const nv = !v; if (!nv) stopVoice(); return nv; }); }

  useEffect(() => () => stopVoice(), []); // silence on unmount / navigation

  return { soundOn, speaking, say, stopVoice, toggleSound };
}
