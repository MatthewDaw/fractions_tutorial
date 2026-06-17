// RoomIntro.jsx — plays a room's intro "video" (a self-contained animated HTML
// page in an iframe) the first time you enter that room.
//
// Voice + transcript (R2): the bundled video is silent. The <Stage> persists its
// playhead to localStorage["samesize.v1:t"]; we read that clock and play each
// pre-baked clip when the playhead passes the cue's `gate` (the animation beat it
// narrates), once the previous clip has finished — so a line never talks over the
// wrong visual or clips the one before it (see src/introR2.js for the gates). The
// matching transcript line highlights as each plays. Pause/Play (intro-bar)
// freezes the video via the same-origin iframe's window.__anim; the narration
// freezes with it because its gates ride that same (now-frozen) playhead.
//
// Completion is timer-driven (the video has no "finished" event): after
// `introDurationMs` (default 30s) — or on "Skip ▸" — an end card offers WATCH
// AGAIN / CONTINUE. "Watch again" remounts the iframe (key bump) and resets the
// shared playhead so video + narration replay from the top, together.
//
// ARCHITECTURE (wireframe parity): identity (lesson №/tag/title) is DATA pulled
// from the lessons registry (src/lessons/index.js) — the endcard tag is dynamic,
// never hardcoded. The intro chrome is broken into reusable pieces — <IntroBar>,
// <IntroEndcard>, <TranscriptRail>, <CtrlButton> — and the three-clock narration
// sync lives in the useGatedNarration hook. Interactive logic (iframe window.__anim
// pause/seek, audio clips, the localStorage playhead poll, the pause-aware finish
// timer) stays in React — only copy/identity is sourced from data.
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { INTRO_CUES as INTRO_CUES_R1, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R1 } from "./introR1.js";
import { INTRO_CUES as INTRO_CUES_R2, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R2 } from "./introR2.js";
import { INTRO_CUES as INTRO_CUES_R3, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R3 } from "./introR3.js";
import { INTRO_CUES as INTRO_CUES_R4, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R4 } from "./introR4.js";
import { INTRO_CUES as INTRO_CUES_R5, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R5 } from "./introR5.js";
import { INTRO_CUES as INTRO_CUES_M1, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_M1 } from "./introM1.js";
import { INTRO_CUES as INTRO_CUES_M3, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_M3 } from "./introM3.js";
import { INTRO_CUES as INTRO_CUES_NL, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_NL } from "./introNL.js";
import { INTRO_CUES as INTRO_CUES_S1, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_S1 } from "./introS1.js";
import { INTRO_CUES as INTRO_CUES_DEN, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_DEN } from "./introDen.js";
import { INTRO_CUES as INTRO_CUES_NUM, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_NUM } from "./introNum.js";
import { INTRO_CUES as INTRO_CUES_SIMP, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_SIMP } from "./introSimp.js";
import SettingsButton from "./SettingsButton.jsx";
import { getSettings } from "./settings.js";
import { LESSONS } from "./lessons/index.js";

const VOICE_BASE = import.meta.env.BASE_URL + "voice/";

// Per-room intro narration: each room loads ITS cue sheet + the persistKey its
// video writes the playhead to. The intro HTML itself comes from room.intro.
const INTROS = {
  r1: { cues: INTRO_CUES_R1, persistKey: STAGE_PERSIST_KEY_R1 },
  r2: { cues: INTRO_CUES_R2, persistKey: STAGE_PERSIST_KEY_R2 },
  r3: { cues: INTRO_CUES_R3, persistKey: STAGE_PERSIST_KEY_R3 },
  r4: { cues: INTRO_CUES_R4, persistKey: STAGE_PERSIST_KEY_R4 },
  r5: { cues: INTRO_CUES_R5, persistKey: STAGE_PERSIST_KEY_R5 },
  m1: { cues: INTRO_CUES_M1, persistKey: STAGE_PERSIST_KEY_M1 },
  m3: { cues: INTRO_CUES_M3, persistKey: STAGE_PERSIST_KEY_M3 },
  nl: { cues: INTRO_CUES_NL, persistKey: STAGE_PERSIST_KEY_NL },
  s1: { cues: INTRO_CUES_S1, persistKey: STAGE_PERSIST_KEY_S1 },
  den: { cues: INTRO_CUES_DEN, persistKey: STAGE_PERSIST_KEY_DEN },
  num: { cues: INTRO_CUES_NUM, persistKey: STAGE_PERSIST_KEY_NUM },
  simp: { cues: INTRO_CUES_SIMP, persistKey: STAGE_PERSIST_KEY_SIMP },
};

// ── reusable chrome ─────────────────────────────────────────────────────────
// Shared control button — mirrors LessonShell's .ctrl-btn back affordance.
function CtrlButton({ className = "", title, onClick, children }) {
  return (
    <button className={"ctrl-btn " + className} title={title} aria-label={title} onClick={onClick}>
      {children}
    </button>
  );
}

const PauseGlyph = () => (
  <svg width="13" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="3" height="10" fill="currentColor" /><rect x="8" y="2" width="3" height="10" fill="currentColor" /></svg>
);
const PlayGlyph = () => (
  <svg width="13" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2l9 5-9 5V2z" fill="currentColor" /></svg>
);

// Bottom overlay shown while the intro is playing.
function IntroBar({ label, playing, onBack, onTogglePlay, onSkip }) {
  return (
    <div className="intro-bar">
      <CtrlButton className="intro-back" title="Back to the lesson map" onClick={onBack}>←</CtrlButton>
      <button className="ctrl-btn intro-pause" title={playing ? "Pause" : "Play"}
        aria-label={playing ? "Pause" : "Play"} onClick={onTogglePlay}>
        {playing ? <PauseGlyph /> : <PlayGlyph />}
      </button>
      <div className="intro-label">{label}</div>
      <button className="intro-continue" onClick={onSkip}>Skip ▸</button>
    </div>
  );
}

// End card (modal-ish overlay) shown when the intro finishes / is skipped.
// `tag` and `title` are DATA — sourced from the lessons registry, never hardcoded.
function IntroEndcard({ tag, title, onBack, onWatchAgain, onContinue }) {
  return (
    <div className="intro-endcard">
      <CtrlButton className="intro-back intro-endcard-back" title="Back to the lesson map" onClick={onBack}>←</CtrlButton>
      <div className="intro-endcard-card">
        <div className="intro-endcard-tag">{tag}</div>
        <div className="intro-endcard-title">{title}</div>
        <div className="intro-endcard-q">Watch the intro again, or start the lesson?</div>
        <div className="intro-endcard-btns">
          <button className="intro-again" onClick={onWatchAgain}>↺ Watch again</button>
          <button className="intro-continue" onClick={onContinue}>Continue to the lesson →</button>
        </div>
      </div>
    </div>
  );
}

// The narration transcript rail (rendered only when the room has cues).
function TranscriptRail({ cues, activeIdx, onSeekStart, onSeekLine }) {
  return (
    <aside className="intro-transcript">
      <div className="tr-head">
        <span>Transcript</span>
        <SettingsButton className="tr-mute" />
      </div>
      <ol className="tr-list">
        <li className={"tr-line tr-start" + (activeIdx < 0 ? " active" : "")}
          onClick={onSeekStart} title="Start from the beginning">▸ Start of the video</li>
        {cues.map((c, i) => (
          <li key={c.key} className={"tr-line" + (i === activeIdx ? " active" : "")}
            onClick={() => onSeekLine(i)} title="Jump to this line">{c.text}</li>
        ))}
      </ol>
      <div className="tr-foot">Narrated by the Cook · click a line to jump there</div>
    </aside>
  );
}

// ── narration sync hook ─────────────────────────────────────────────────────
// Encapsulates the three-clock sync: read the video's playhead from localStorage,
// play/highlight each baked clip when the playhead passes BOTH its `gate` and a
// breath after the previous line, never overlapping. Returns { activeIdx, ... }
// plus seek/pause/replay handles. Pause "just works": the paused video freezes
// the playhead it watches; we pause the current clip alongside.
function useGatedNarration({ cues, persistKey, hasNarration, ended, setEnded, replayKey, playing, setPlaying, muted, frameRef }) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const pausedRef = useRef(false);
  const seekReqRef = useRef(null);   // {idx,t} when a transcript line is clicked

  // One <audio> per cue, created once.
  const audiosRef = useRef(null);
  if (hasNarration && !audiosRef.current) {
    audiosRef.current = cues.map((c) => { const a = new Audio(VOICE_BASE + c.key + ".mp3"); a.preload = "auto"; return a; });
  }
  const curRef = useRef(null);                 // currently-playing clip
  const pendingRef = useRef(null);             // a clip whose play() was autoplay-blocked
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  function stopClip() { const a = curRef.current; if (a) { try { a.pause(); } catch (e) {} curRef.current = null; } }

  // Reset the shared playhead to 0 before the iframe's <Stage> reads it on (re)load.
  useLayoutEffect(() => {
    try { localStorage.setItem(persistKey + ":t", "0"); } catch (e) {}
  }, [replayKey, persistKey]);

  // ── narration gated to the video's animation ──
  useEffect(() => {
    if (!hasNarration || ended) { stopClip(); return; }
    let raf = 0, nextIdx = 0, busy = false, lastT = 0, prevEnd = 0;
    const readT = () => { try { return parseFloat(localStorage.getItem(persistKey + ":t")) || 0; } catch (e) { return 0; } };
    const loop = () => {
      const t = readT();
      // A transcript line was clicked: jump narration straight to that line.
      if (seekReqRef.current !== null) {
        const { idx, t: tgt } = seekReqRef.current; seekReqRef.current = null;
        stopClip(); nextIdx = idx; busy = false; prevEnd = 0; lastT = tgt; setActiveIdx(-1);
      } else {
        if (t < lastT - 0.5) { nextIdx = 0; busy = false; prevEnd = 0; stopClip(); setActiveIdx(-1); } // looped/seeked back
        lastT = t;
      }

      // A line waits for BOTH its animation beat (gate) and a real pause after the
      // previous line (prevEnd + pause), measured on the same playhead clock.
      const c = cues[nextIdx];
      const readyAt = c && Math.max(c.gate, prevEnd + (c.pause || 0));
      if (!pausedRef.current && !busy && nextIdx < cues.length && t >= readyAt) {
        const i = nextIdx;
        busy = true;
        setActiveIdx(i);
        const a = audiosRef.current && audiosRef.current[i];
        let settled = false;
        const advance = () => {
          if (settled) return; settled = true;
          if (a) a.removeEventListener("ended", done);
          prevEnd = readT(); busy = false; nextIdx = i + 1;
        };
        function done() { advance(); }
        if (!a) { setTimeout(advance, 1500); }
        else {
          stopClip();
          a.volume = mutedRef.current ? 0 : getSettings().voiceVol / 100;
          // Narrator speed: play faster with pitch preserved (no chipmunk). The
          // video's playhead is sped by the same rate (see the intro html), so the
          // narration stays gated to the animation — just compressed in wall-clock.
          const rate = Number(getSettings().voiceRate) || 1;
          try { a.preservesPitch = true; a.mozPreservesPitch = true; a.webkitPreservesPitch = true; a.playbackRate = rate; } catch (e) {}
          try { a.currentTime = 0; } catch (e) {}
          a.addEventListener("ended", done);
          curRef.current = a;
          const estMs = Math.round(((a.duration && isFinite(a.duration)) ? a.duration : 2.5) / rate * 1000);
          const p = a.play();
          if (p && p.catch) p.catch(() => {
            // Autoplay blocked — happens on the FIRST clip when the page is loaded
            // straight to the intro (no prior user gesture). Don't drop the line:
            // stash it so the first user interaction replays it (see the unlock
            // effect). Safety net: if no interaction comes, advance on an estimate
            // so the rest of the narration isn't held up.
            pendingRef.current = a;
            setTimeout(() => { if (pendingRef.current === a) { pendingRef.current = null; advance(); } }, Math.max(estMs, 5000));
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stopClip(); };
  }, [hasNarration, ended, replayKey, persistKey]);

  useEffect(() => () => stopClip(), []); // stop on unmount

  // First-clip autoplay rescue: a page loaded straight to the intro has no prior
  // user gesture, so the browser blocks the opening clip's play(). Replay the
  // stashed clip on the first interaction anywhere on the page. The clip keeps its
  // "ended" listener, so narration advances normally once it finishes.
  useEffect(() => {
    if (!hasNarration) return;
    const unlock = () => {
      const a = pendingRef.current; if (!a) return; pendingRef.current = null;
      try { a.currentTime = 0; } catch (e) {}
      a.volume = mutedRef.current ? 0 : getSettings().voiceVol / 100;
      a.play().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [hasNarration]);

  // Pause/resume the whole intro: video (iframe window.__anim) + current clip.
  function setPlay(next, finishRef, DURATION) {
    pausedRef.current = !next;
    const w = frameRef.current && frameRef.current.contentWindow;
    try { if (w && w.__anim) (next ? w.__anim.play() : w.__anim.pause()); } catch (e) {}
    const a = curRef.current;
    const f = finishRef.current;
    if (next) {
      if (a && !a.ended) { a.volume = mutedRef.current ? 0 : getSettings().voiceVol / 100; a.play().catch(() => {}); }
      if (!f.id && f.remaining > 0) { f.startedAt = Date.now(); f.id = setTimeout(() => setEnded(true), f.remaining); }
    } else {
      if (a) { try { a.pause(); } catch (e) {} }
      if (f.id) { clearTimeout(f.id); f.id = null; f.remaining = Math.max(0, f.remaining - (Date.now() - f.startedAt)); }
    }
    setPlaying(next);
  }

  return { activeIdx, setActiveIdx, seekReqRef, curRef, stopClip, setPlay };
}

export default function RoomIntro({ room, onContinue, onBack }) {
  const DURATION = room.introDurationMs ?? 35000;
  const intro = INTROS[room.id] || { cues: [], persistKey: "" };
  const cues = intro.cues;
  const persistKey = intro.persistKey;
  const hasNarration = cues.length > 0;

  // Identity is DATA: pull the lesson tag (e.g. "Lesson 8 · Adding Fractions")
  // from the registry. Fall back to a composed tag if a room lacks an entry, so
  // the endcard is never hardcoded to one lesson's strand.
  const L = LESSONS[room.id];
  const endcardTag = (L && L.tag) || `Lesson ${room.no}`;
  const barLabel = `Lesson ${room.no} · ${room.title} — intro`;

  const [ended, setEnded] = useState(false);
  const [replayKey, setReplayKey] = useState(0); // bump → remount iframe → replay
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const frameRef = useRef(null);     // the video iframe (same-origin → window.__anim)

  const nar = useGatedNarration({
    cues, persistKey, hasNarration, ended, setEnded, replayKey,
    playing, setPlaying, muted, frameRef,
  });
  const { activeIdx, setActiveIdx, seekReqRef, curRef, stopClip } = nar;

  // Finish → end card. Pause-aware wall-clock timer (the video has no "finished").
  const finishRef = useRef({ id: null, remaining: 0, startedAt: 0 });
  useEffect(() => {
    if (ended) return;
    const f = finishRef.current;
    // The intro animation runs at the narrator speed, so the whole video finishes
    // proportionally sooner — scale the end-card timer by the same rate.
    const rate = Number(getSettings().voiceRate) || 1;
    f.remaining = DURATION / rate; f.startedAt = Date.now();
    f.id = setTimeout(() => setEnded(true), f.remaining);
    return () => { if (f.id) clearTimeout(f.id); f.id = null; };
  }, [ended, replayKey, DURATION]);

  const setPlay = (next) => nar.setPlay(next, finishRef, DURATION);
  function togglePlay() { setPlay(!playing); }

  // Jump the video to `timeSec` and have the gated narration resume at cue `cueIdx`.
  function seekTo(timeSec, cueIdx) {
    stopClip();
    const w = frameRef.current && frameRef.current.contentWindow;
    try { if (w && w.__anim) w.__anim.seek(timeSec); } catch (e) {}
    try { localStorage.setItem(persistKey + ":t", String(timeSec)); } catch (e) {}
    seekReqRef.current = { idx: cueIdx, t: timeSec };
    setActiveIdx(timeSec >= cues[cueIdx].gate ? cueIdx : -1);
    if (ended) setEnded(false);   // clicking from the end card resumes the intro
    if (!playing) setPlay(true);  // resume so the jump actually plays
  }
  function seekToLine(i) { seekTo(cues[i].gate, i); }
  function seekToStart() { seekTo(0, 0); }

  // Mute silences narration without disturbing timing (volume, not pause).
  function toggleMute() {
    setMuted((m) => { const nm = !m; const a = curRef.current; if (a) a.volume = nm ? 0 : 1; return nm; });
  }
  function skip() { stopClip(); setEnded(true); }
  function watchAgain() { stopClip(); setActiveIdx(-1); setReplayKey((k) => k + 1); setEnded(false); }

  return (
    <div className={"intro" + (hasNarration ? " has-transcript" : "")} data-novox>
      <div className="intro-main">
        <iframe
          key={replayKey}
          ref={frameRef}
          className="intro-frame"
          src={room.intro}
          title={`Lesson ${room.no} — ${room.title} intro`}
        />

        {!ended ? (
          <IntroBar label={barLabel} playing={playing}
            onBack={onBack} onTogglePlay={togglePlay} onSkip={skip} />
        ) : (
          <IntroEndcard tag={endcardTag} title={room.title}
            onBack={onBack} onWatchAgain={watchAgain} onContinue={onContinue} />
        )}
      </div>

      {hasNarration && (
        <TranscriptRail cues={cues} activeIdx={activeIdx}
          onSeekStart={seekToStart} onSeekLine={seekToLine} />
      )}
    </div>
  );
}
