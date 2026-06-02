// SettingsScreen.jsx — the game's Settings screen (route "settings").
//
// Ported from the design handoff (design_handoff_babushkas_fractions_settings).
// Three controls, persisted via settings.js (bf_settings_v1):
//   1. Voice lines volume   (0-100)  → voice.js applies it to narration
//   2. Music volume          (0-100)  → BackgroundMusic.jsx (0 = muted)
//   3. How you answer        stylus | typing → components/Slate.jsx
//
// The screen reads/writes the shared store, so changes apply live across the app.
// "Done" calls onBack() — Shell returns the player to the screen they came from.
import { useState, useEffect } from "react";
import { getSettings, setSettings, subscribeSettings } from "./settings.js";
import "./styles/settings.css";

/* ── icons (woodcut line style) ─────────────────────────────────────── */
function VoiceIcon({ muted }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 6 H26 Q29 6 29 9 V18 Q29 21 26 21 H15 L9 26 V21 H6 Q3 21 3 18 V9 Q3 6 6 6 Z"
        fill="#e3d4b1" stroke="#1c1612" strokeWidth="2.1" strokeLinejoin="round" />
      <g stroke="#a32a22" strokeWidth="2" strokeLinecap="round"><path d="M7 11 H25" /><path d="M7 16 H19" /></g>
      {muted && <path d="M5 5 L27 25" stroke="#6b5a47" strokeWidth="2.4" strokeLinecap="round" />}
    </svg>
  );
}
function MusicIcon({ muted }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M13 22 V8 L25 5 V19" fill="none" stroke="#1c1612" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13 8 L25 5" stroke="#1c1612" strokeWidth="2.1" strokeLinecap="round" />
      <ellipse cx="10" cy="23" rx="4" ry="3" fill="#a32a22" stroke="#1c1612" strokeWidth="2" transform="rotate(-18 10 23)" />
      <ellipse cx="22" cy="20" rx="4" ry="3" fill="#a32a22" stroke="#1c1612" strokeWidth="2" transform="rotate(-18 22 20)" />
      {muted && <path d="M5 6 L29 27" stroke="#6b5a47" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}
function TypingIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 56 56" aria-hidden="true">
      <rect x="8" y="26" width="40" height="20" rx="3" fill="none" stroke="#1c1612" strokeWidth="2.4" />
      <rect x="16" y="10" width="24" height="13" rx="2" fill="#e3d4b1" stroke="#1c1612" strokeWidth="2.2" />
      <line x1="13" y1="23" x2="43" y2="23" stroke="#1c1612" strokeWidth="2.2" />
      <g fill="#a32a22" stroke="#1c1612" strokeWidth="1.4">
        <circle cx="16" cy="34" r="2.6" /><circle cx="24" cy="34" r="2.6" /><circle cx="32" cy="34" r="2.6" /><circle cx="40" cy="34" r="2.6" />
      </g>
      <rect x="20" y="40" width="16" height="3.4" rx="1.7" fill="#1c1612" />
    </svg>
  );
}
function StylusIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 56 56" aria-hidden="true">
      <path d="M40 8 L48 16 L24 40 L14 42 L16 32 Z" fill="#e3d4b1" stroke="#1c1612" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M40 8 L48 16" stroke="#1c1612" strokeWidth="2.4" />
      <path d="M16 32 L24 40" stroke="#1c1612" strokeWidth="2" />
      <path d="M14 42 L16 38 L18 40 Z" fill="#a32a22" stroke="#1c1612" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 48 Q20 44 30 48 T50 48" fill="none" stroke="#a32a22" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function Check() {
  return <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6 L4.5 10 L11 1.5" fill="none" stroke="#6e1c16" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Corner() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" strokeWidth="1.8" />
      <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" strokeWidth="1.2" opacity="0.7" />
      <circle cx="6" cy="6" r="2.4" fill="#a32a22" />
    </svg>
  );
}

/* ── dough-strip volume slider ──────────────────────────────────────── */
function VolumeRow({ icon, name, hint, value, onChange, cls }) {
  const setFromClient = (el, clientX) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    let t = (clientX - r.left) / r.width;
    t = Math.max(0, Math.min(1, t));
    onChange(Math.round(t * 100));
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.focus();
    setFromClient(el, e.clientX);
    const move = (ev) => setFromClient(el, ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const onKey = (e) => {
    let v = value;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= 5;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") v += 5;
    else if (e.key === "Home") v = 0;
    else if (e.key === "End") v = 100;
    else return;
    e.preventDefault();
    onChange(Math.max(0, Math.min(100, v)));
  };

  const muted = value === 0;
  return (
    <div className={"st-vrow rv " + cls}>
      <div className="st-vlabel">
        <div className="st-vicon">{icon({ muted })}</div>
        <div className="st-vtext">
          <div className="st-vt-name">{name}</div>
          <div className="st-vt-hint">{hint}</div>
        </div>
      </div>

      <div className="st-slider" tabIndex={0} role="slider"
        aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}
        onPointerDown={onPointerDown} onKeyDown={onKey}>
        <div className="st-track">
          <div className="st-fill" style={{ width: value + "%" }} />
          <div className="st-ticks">
            {Array.from({ length: 11 }).map((_, i) => (
              <i key={i} style={{ left: (i * 10) + "%", height: i % 5 === 0 ? 7 : 4 }} />
            ))}
          </div>
        </div>
        <div className="st-knob" style={{ left: value + "%" }} />
      </div>

      <div className={"st-vval" + (muted ? " muted" : "")}>
        {muted ? "Off" : <>{value}<small>%</small></>}
      </div>
    </div>
  );
}

/* ── input-mode card ────────────────────────────────────────────────── */
function ModeCard({ icon, name, hint, on, onSelect }) {
  return (
    <button className={"st-mode" + (on ? " on" : "")} onClick={onSelect} aria-pressed={on}>
      <div className="st-m-ico">{icon}</div>
      <div>
        <div className="st-m-name">{name}</div>
        <div className="st-m-hint">{hint}</div>
      </div>
      {on
        ? <div className="st-m-stamp"><Check />Selected</div>
        : <div className="st-m-radio" />}
    </button>
  );
}

/* ── screen ─────────────────────────────────────────────────────────── */
export default function SettingsScreen({ onBack }) {
  const [ready, setReady] = useState(false);
  const [s, setS] = useState(getSettings);

  useEffect(() => { const t = setTimeout(() => setReady(true), 90); return () => clearTimeout(t); }, []);
  useEffect(() => subscribeSettings(setS), []);

  const set = (patch) => setSettings(patch);
  const back = () => { if (onBack) onBack(); };

  return (
    <div className={"scene settings-scene" + (ready ? " ready" : "")} data-vox-speaker="cook">
      <div className="paper-fill" style={{ position: "absolute", inset: 0 }} />
      <div className="foxing" />
      <div className="frame" />
      <div className="corner tl"><Corner /></div>
      <div className="corner tr"><Corner /></div>
      <div className="corner bl"><Corner /></div>
      <div className="corner br"><Corner /></div>

      <div className="st-inner">
        {/* header */}
        <div className="st-head">
          <div className="st-head-l">
            <div className="st-kicker rv d1"><span className="st-k-dot" />Babushka&rsquo;s Fractions</div>
            <h1 className="st-h-title rv d2">Settings</h1>
            <div className="st-h-sub rv d2"><span className="cyr">Настройки</span><span className="lat">Nastroyki</span></div>
          </div>
          <button className="st-back rv d1" onClick={back}>
            <span className="ar">&lsaquo;</span> Done
          </button>
        </div>

        {/* sound */}
        <div className="st-section">
          <div className="st-sec-label rv d2"><span className="st-sl-num">1</span>Sound<span className="st-sl-rule" /></div>
          <VolumeRow cls="d3" icon={VoiceIcon} name="Voice lines" hint="Spoken hints and praise from the characters"
            value={s.voiceVol} onChange={(v) => set({ voiceVol: v })} />
          <VolumeRow cls="d4" icon={MusicIcon} name="Music" hint="Background music throughout the game"
            value={s.musicVol} onChange={(v) => set({ musicVol: v })} />
        </div>

        {/* writing */}
        <div className="st-section">
          <div className="st-sec-label rv d5"><span className="st-sl-num">2</span>How you answer<span className="st-sl-rule" /></div>
          <div className="st-modes">
            <div className="rv d6" style={{ display: "contents" }}>
              <ModeCard icon={<StylusIcon />} name="Stylus" hint="Write the numbers by hand with a pen."
                on={s.inputMode === "stylus"} onSelect={() => set({ inputMode: "stylus" })} />
            </div>
            <div className="rv d7" style={{ display: "contents" }}>
              <ModeCard icon={<TypingIcon />} name="Typing" hint="Tap the numbers on the keyboard."
                on={s.inputMode === "typing"} onSelect={() => set({ inputMode: "typing" })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
