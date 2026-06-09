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
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { INTRO_CUES as INTRO_CUES_R1, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R1 } from "./introR1.js";
import { INTRO_CUES as INTRO_CUES_R2, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R2 } from "./introR2.js";
import { INTRO_CUES as INTRO_CUES_R3, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R3 } from "./introR3.js";
import { INTRO_CUES as INTRO_CUES_R4, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R4 } from "./introR4.js";
import { INTRO_CUES as INTRO_CUES_R5, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_R5 } from "./introR5.js";
import { INTRO_CUES as INTRO_CUES_M1, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_M1 } from "./introM1.js";
import { INTRO_CUES as INTRO_CUES_M2, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_M2 } from "./introM2.js";
import { INTRO_CUES as INTRO_CUES_M3, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_M3 } from "./introM3.js";
import { INTRO_CUES as INTRO_CUES_NL, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_NL } from "./introNL.js";
import { INTRO_CUES as INTRO_CUES_S1, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_S1 } from "./introS1.js";
import { INTRO_CUES as INTRO_CUES_CMP, STAGE_PERSIST_KEY as STAGE_PERSIST_KEY_CMP } from "./introCmp.js";
import SettingsButton from "./SettingsButton.jsx";
import { getSettings } from "./settings.js";

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
  m2: { cues: INTRO_CUES_M2, persistKey: STAGE_PERSIST_KEY_M2 },
  m3: { cues: INTRO_CUES_M3, persistKey: STAGE_PERSIST_KEY_M3 },
  nl: { cues: INTRO_CUES_NL, persistKey: STAGE_PERSIST_KEY_NL },
  s1: { cues: INTRO_CUES_S1, persistKey: STAGE_PERSIST_KEY_S1 },
  cmp: { cues: INTRO_CUES_CMP, persistKey: STAGE_PERSIST_KEY_CMP },
};

export default function RoomIntro({ room, onContinue, onBack }) {
  const DURATION = room.introDurationMs ?? 35000;
  const intro = INTROS[room.id] || { cues: [], persistKey: "" };
  const cues = intro.cues;
  const STAGE_PERSIST_KEY = intro.persistKey;
  const hasNarration = cues.length > 0;

  const [ended, setEnded] = useState(false);
  const [replayKey, setReplayKey] = useState(0); // bump → remount iframe → replay
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);
  const frameRef = useRef(null);     // the video iframe (same-origin → window.__anim)
  const pausedRef = useRef(false);
  const seekReqRef = useRef(null);   // set to a cue index when a transcript line is clicked

  // One <audio> per cue, created once.
  const audiosRef = useRef(null);
  if (hasNarration && !audiosRef.current) {
    audiosRef.current = cues.map((c) => { const a = new Audio(VOICE_BASE + c.key + ".mp3"); a.preload = "auto"; return a; });
  }
  const curRef = useRef(null);                 // currently-playing clip
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  function stopClip() { const a = curRef.current; if (a) { try { a.pause(); } catch (e) {} curRef.current = null; } }

  // Reset the shared playhead to 0 before the iframe's <Stage> reads it on (re)load.
  useLayoutEffect(() => {
    try { localStorage.setItem(STAGE_PERSIST_KEY + ":t", "0"); } catch (e) {}
  }, [replayKey]);

  // ── narration gated to the video's animation ──────────────────────────────
  // Poll the video's playhead. A line starts when the playhead passes its `gate`
  // (the beat it narrates) AND no clip is mid-play, so lines never overlap the
  // wrong visual or clip each other. Reading the video's own clock means Pause
  // "just works": a paused video freezes the playhead → the gates freeze too, and
  // we pause the current clip's audio alongside.
  useEffect(() => {
    if (!hasNarration || ended) { stopClip(); return; }
    let raf = 0, nextIdx = 0, busy = false, lastT = 0, prevEnd = 0;
    const readT = () => { try { return parseFloat(localStorage.getItem(STAGE_PERSIST_KEY + ":t")) || 0; } catch (e) { return 0; } };
    const loop = () => {
      const t = readT();
      // A transcript line was clicked: jump the narration straight to that line so
      // it plays from the clicked beat instead of replaying everything in between.
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
        const advance = () => { prevEnd = readT(); busy = false; nextIdx = i + 1; };
        if (!a) { setTimeout(advance, 1500); }
        else {
          const done = () => { a.removeEventListener("ended", done); advance(); };
          stopClip();
          a.volume = getSettings().voiceVol / 100;
          try { a.currentTime = 0; } catch (e) {}
          a.addEventListener("ended", done);
          curRef.current = a;
          const p = a.play();
          if (p && p.catch) p.catch(() => {           // can't play (autoplay block) → advance on an estimate
            a.removeEventListener("ended", done);
            setTimeout(advance, Math.round(((a.duration && isFinite(a.duration)) ? a.duration : 2.5) * 1000));
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stopClip(); };
  }, [hasNarration, ended, replayKey]);

  // Finish → end card. The video has no "finished" event, so a wall-clock timer
  // shows the card after the intro's length (or immediately on "Skip ▸"). It's
  // pause-aware (see setPlay) so the card never pops while the intro is paused.
  const finishRef = useRef({ id: null, remaining: 0, startedAt: 0 });
  useEffect(() => {
    if (ended) return;
    const f = finishRef.current;
    f.remaining = DURATION; f.startedAt = Date.now();
    f.id = setTimeout(() => setEnded(true), f.remaining);
    return () => { if (f.id) clearTimeout(f.id); f.id = null; };
  }, [ended, replayKey, DURATION]);

  useEffect(() => () => stopClip(), []); // stop on unmount

  // Pause/resume the whole intro: the video (via the iframe's window.__anim) and
  // the current narration clip together. The gated loop above freezes on its own,
  // because the paused video stops advancing the playhead it watches.
  function setPlay(next) {
    pausedRef.current = !next;
    const w = frameRef.current && frameRef.current.contentWindow;
    try { if (w && w.__anim) (next ? w.__anim.play() : w.__anim.pause()); } catch (e) {}
    const a = curRef.current;
    const f = finishRef.current;
    if (next) {
      if (a && !a.ended) { a.volume = getSettings().voiceVol / 100; a.play().catch(() => {}); }
      if (!f.id && f.remaining > 0) { f.startedAt = Date.now(); f.id = setTimeout(() => setEnded(true), f.remaining); }
    } else {
      if (a) { try { a.pause(); } catch (e) {} }
      if (f.id) { clearTimeout(f.id); f.id = null; f.remaining = Math.max(0, f.remaining - (Date.now() - f.startedAt)); }
    }
    setPlaying(next);
  }
  function togglePlay() { setPlay(!playing); }

  // Jump the video to `timeSec` and have the gated narration resume at cue `cueIdx`.
  // We seek the iframe's animation clock (window.__anim.seek), prime the shared
  // playhead, and hand the loop a {idx,t} request so it fires the right line next.
  function seekTo(timeSec, cueIdx) {
    stopClip();
    const w = frameRef.current && frameRef.current.contentWindow;
    try { if (w && w.__anim) w.__anim.seek(timeSec); } catch (e) {}
    try { localStorage.setItem(STAGE_PERSIST_KEY + ":t", String(timeSec)); } catch (e) {}
    seekReqRef.current = { idx: cueIdx, t: timeSec };
    setActiveIdx(timeSec >= cues[cueIdx].gate ? cueIdx : -1);
    if (ended) setEnded(false);   // clicking from the end card resumes the intro
    if (!playing) setPlay(true);  // resume so the jump actually plays
  }
  // Click a transcript line → jump to its beat. Click the "start" marker → restart.
  function seekToLine(i) { seekTo(cues[i].gate, i); }
  function seekToStart() { seekTo(0, 0); }

  // Mute silences narration without disturbing the timing (volume, not pause).
  function toggleMute() {
    setMuted((m) => { const nm = !m; const a = curRef.current; if (a) a.volume = nm ? 0 : 1; return nm; });
  }
  function skip() { stopClip(); setEnded(true); }
  function watchAgain() { stopClip(); setActiveIdx(-1); setReplayKey((k) => k + 1); setEnded(false); }

  const Spk = ({ off }) => (
    <svg width="18" height="16" viewBox="0 0 16 14" aria-hidden="true">
      <path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="currentColor" />
      {off
        ? <path d="M11 5 L15 9 M15 5 L11 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        : <path d="M11 4 Q14 7 11 10" stroke="currentColor" strokeWidth="1.4" fill="none" />}
    </svg>
  );

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
          <div className="intro-bar">
            <button className="ctrl-btn intro-back" title="Back to the lesson map" onClick={onBack}>←</button>
            <button className="ctrl-btn intro-pause" title={playing ? "Pause" : "Play"}
              aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
              {playing
                ? <svg width="13" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="3" height="10" fill="currentColor" /><rect x="8" y="2" width="3" height="10" fill="currentColor" /></svg>
                : <svg width="13" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2l9 5-9 5V2z" fill="currentColor" /></svg>}
            </button>
            <div className="intro-label">Lesson {room.no} · {room.title} — intro</div>
            <button className="intro-continue" onClick={skip}>Skip ▸</button>
          </div>
        ) : (
          <div className="intro-endcard">
            <button className="ctrl-btn intro-back intro-endcard-back" title="Back to the lesson map" onClick={onBack}>←</button>
            <div className="intro-endcard-card">
              <div className="intro-endcard-tag">Lesson {room.no} · {room.verb ?? room.title}</div>
              <div className="intro-endcard-title">{room.title}</div>
              <div className="intro-endcard-q">Watch the intro again, or start the lesson?</div>
              <div className="intro-endcard-btns">
                <button className="intro-again" onClick={watchAgain}>↺ Watch again</button>
                <button className="intro-continue" onClick={onContinue}>Continue to the lesson →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasNarration && (
        <aside className="intro-transcript">
          <div className="tr-head">
            <span>Transcript</span>
            <SettingsButton className="tr-mute" />
          </div>
          <ol className="tr-list">
            <li className={"tr-line tr-start" + (activeIdx < 0 ? " active" : "")}
              onClick={seekToStart} title="Start from the beginning">▸ Start of the video</li>
            {cues.map((c, i) => (
              <li key={c.key} className={"tr-line" + (i === activeIdx ? " active" : "")}
                onClick={() => seekToLine(i)} title="Jump to this line">{c.text}</li>
            ))}
          </ol>
          <div className="tr-foot">Narrated by the Cook · click a line to jump there</div>
        </aside>
      )}
    </div>
  );
}
