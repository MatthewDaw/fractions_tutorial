// BackgroundMusic.jsx — persistent background-music player + global mute button.
//
// Mounted once in Shell (it never unmounts, so music continues across screens).
// Given the current `scene`, it plays that scene's track list from music.js —
// one track loops, several rotate. It ducks (fades out + pauses) whenever a
// character is speaking (via audioBus) and resumes when they stop, so there's
// always music EXCEPT under narration. The fixed control toggles music on/off and
// sets how loud it plays — both persisted, and independent of the per-lesson
// voice toggle. Since the control lives here and Shell mounts this once, it shows
// on every screen.
import { useState, useRef, useEffect } from "react";
import { MUSIC, MUSIC_BASE } from "./music.js";
import { audioBus } from "./audioBus.js";

const DEFAULT_VOL = 0.4; // backgrounds sit well under the voices at ~40%
const BASE_VOL = DEFAULT_VOL; // base/un-ducked level; alias kept defined to avoid ReferenceError

// HTMLMediaElement.volume must stay in [0,1]; fade ramps can over/undershoot due
// to float rounding. Clamp every assignment so we never throw IndexSizeError.
const clampVol = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

// Volume persisted in localStorage; clamp + tolerate a bad/missing value.
function loadVolume() {
  try {
    const v = parseFloat(localStorage.getItem("musicVolume"));
    if (Number.isFinite(v)) return Math.min(1, Math.max(0, v));
  } catch (e) {}
  return DEFAULT_VOL;
}

export default function BackgroundMusic({ scene, showControl = true }) {
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem("musicMuted") === "1"; } catch (e) { return false; } });
  const [volume, setVolume] = useState(loadVolume);
  const [voiceActive, setVoiceActive] = useState(() => audioBus.isVoiceActive());

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
  useEffect(() => { try { localStorage.setItem("musicMuted", muted ? "1" : "0"); } catch (e) {} }, [muted]);

  // Persist volume; while music is actively playing, apply changes live (no fade,
  // so dragging the slider tracks instantly). Muting/ducking is handled separately.
  useEffect(() => {
    volRef.current = volume;
    try { localStorage.setItem("musicVolume", String(volume)); } catch (e) {}
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

  // Audio is driven by the JS <Audio> above (a ref, not a DOM node), so hiding the
  // UI never stops playback. We only render the CONTROL on the world map / title —
  // lessons keep a single audio button (the per-lesson voice toggle); music keeps
  // playing and is turned on/off from the world map.
  if (!showControl) return null;

  return (
    <div className={"music-control" + (muted ? " off" : "")}>
      <input
        className="music-vol"
        type="range" min="0" max="1" step="0.05"
        value={muted ? 0 : volume}
        aria-label="Music volume"
        title="Music volume"
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          setVolume(v);
          // Dragging up from silence un-mutes; dragging to zero mutes.
          if (v > 0 && muted) setMuted(false);
          else if (v === 0 && !muted) setMuted(true);
        }}
      />
      <button className={"music-toggle" + (muted ? " off" : "")}
        onClick={() => setMuted((m) => !m)}
        title={muted ? "Turn music on" : "Turn music off"} aria-pressed={!muted}>
        <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 12 V2.2 L13 0.8 V10.4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="12" r="2.2" fill="currentColor" />
          <circle cx="11" cy="10.4" r="2.2" fill="currentColor" />
          {muted && <path d="M1.5 1.5 L15 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
        </svg>
      </button>
    </div>
  );
}
