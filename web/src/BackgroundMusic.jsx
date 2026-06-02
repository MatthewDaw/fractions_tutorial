// BackgroundMusic.jsx — persistent background-music PLAYER (no UI).
//
// Mounted once in Shell (it never unmounts, so music continues across screens).
// Given the current `scene`, it plays that scene's track list from music.js —
// one track loops, several rotate. It ducks (fades out + pauses) whenever a
// character is speaking (via audioBus) and resumes when they stop, so there's
// always music EXCEPT under narration.
//
// Volume/mute now live in the shared Settings store (settings.js → musicVol,
// 0-100; 0 = muted). This component subscribes so dragging the Settings slider
// changes the level live. It renders nothing — the control moved to the Settings
// screen, reachable from the gear button on the title/world screens.
import { useState, useRef, useEffect } from "react";
import { MUSIC, MUSIC_BASE } from "./music.js";
import { audioBus } from "./audioBus.js";
import { getSettings, subscribeSettings } from "./settings.js";

// HTMLMediaElement.volume must stay in [0,1]; fade ramps can over/undershoot due
// to float rounding. Clamp every assignment so we never throw IndexSizeError.
const clampVol = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

export default function BackgroundMusic({ scene }) {
  // musicVol is 0-100 in the store; the player works in 0-1.
  const [musicVol, setMusicVol] = useState(() => getSettings().musicVol);
  const [voiceActive, setVoiceActive] = useState(() => audioBus.isVoiceActive());

  const volume = musicVol / 100;
  const muted = musicVol === 0;

  const audioRef = useRef(null);
  const idxRef = useRef(0);
  const tracksRef = useRef([]);
  const wantRef = useRef(false);
  const fadeRef = useRef(0);
  const volRef = useRef(volume); // latest volume for fades that fire outside render

  if (!audioRef.current && typeof Audio !== "undefined") {
    const a = new Audio(); a.preload = "auto"; a.volume = 0; audioRef.current = a;
  }

  useEffect(() => audioBus.subscribe(setVoiceActive), []);
  useEffect(() => subscribeSettings((s) => setMusicVol(s.musicVol)), []);

  // Apply volume changes live while music is playing (no fade, so dragging the
  // Settings slider tracks instantly). Muting/ducking is handled separately.
  useEffect(() => {
    volRef.current = volume;
    const a = audioRef.current;
    if (a && wantRef.current) { cancelAnimationFrame(fadeRef.current); a.volume = clampVol(volume); }
  }, [volume]);

  function fade(to, ms, after) {
    const a = audioRef.current; if (!a) return;
    cancelAnimationFrame(fadeRef.current);
    const from = a.volume, t0 = performance.now();
    const step = (now) => {
      const k = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      a.volume = clampVol(from + (to - from) * k); // clamp: float ramp can dip <0 or >1
      if (k < 1) fadeRef.current = requestAnimationFrame(step);
      else if (after) after();
    };
    fadeRef.current = requestAnimationFrame(step);
  }

  // Play; if the browser blocks autoplay, retry on the first user gesture.
  function tryPlay() {
    const a = audioRef.current; if (!a) return;
    const p = a.play();
    if (p && p.catch) p.catch((err) => {
      if (err && err.name === "NotAllowedError") {
        const resume = () => {
          document.removeEventListener("pointerdown", resume);
          document.removeEventListener("keydown", resume);
          if (wantRef.current) a.play().catch(() => {});
        };
        document.addEventListener("pointerdown", resume, { once: true });
        document.addEventListener("keydown", resume, { once: true });
      }
    });
  }

  // Load the scene's playlist when the scene changes (not when navigating within
  // the same scene — so room→room music keeps playing without a restart).
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const tracks = (MUSIC[scene] || []).map((f) => MUSIC_BASE + f);
    tracksRef.current = tracks;
    a.loop = tracks.length === 1; // single track loops natively; rotation uses onended
    a.onended = () => {
      const t = tracksRef.current; if (!t.length) return;
      idxRef.current = (idxRef.current + 1) % t.length;
      a.src = t[idxRef.current]; a.volume = 0;
      if (wantRef.current) { tryPlay(); fade(volRef.current, 800); }
    };
    if (tracks.length) {
      if (!tracks.some((u) => a.src.endsWith(u))) { idxRef.current = 0; a.src = tracks[0]; a.volume = 0; }
    } else {
      try { a.pause(); } catch (e) {}
    }
  }, [scene]);

  // Play / duck control: music plays unless muted, scene has no tracks, or a
  // voice is talking.
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const tracks = tracksRef.current;
    const want = !muted && tracks.length > 0 && !voiceActive;
    wantRef.current = want;
    if (want) {
      if (!a.src) { a.src = tracks[0]; a.volume = 0; }
      tryPlay(); fade(volRef.current, 700);
    } else {
      fade(0, 350, () => { try { a.pause(); } catch (e) {} });
    }
  }, [scene, muted, voiceActive]);

  useEffect(() => () => {
    const a = audioRef.current;
    cancelAnimationFrame(fadeRef.current);
    if (a) { try { a.pause(); } catch (e) {} }
  }, []);

  // No UI: playback is driven by the JS <Audio> above (a ref, not a DOM node).
  // The volume/mute control lives on the Settings screen.
  return null;
}
