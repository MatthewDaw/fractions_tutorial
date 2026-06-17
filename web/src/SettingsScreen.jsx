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
//
// ARCHITECTURE (wireframe alignment): the page chrome is now the shared scene
// kit — <SceneFrame> (paper/foxing/frame/4 corners), <HeaderLayout>,
// <PrimaryButton>, <SectionLabel>, the woodcut <icons>, and useRevealStagger —
// instead of inline markup. Identity copy comes from the scenes registry. The
// INTERACTIVE mechanics (slider pointer/keyboard math, mode-card selection,
// settings store wiring) stay in React components here; only chrome + copy moved.
import { useState, useEffect } from "react";
import { getSettings, setSettings, subscribeSettings } from "./settings.js";
import SCENES from "./scenes.js";
import SceneFrame from "./components/scene/SceneFrame.jsx";
import HeaderLayout from "./components/scene/HeaderLayout.jsx";
import PrimaryButton from "./components/scene/PrimaryButton.jsx";
import SectionLabel from "./components/scene/SectionLabel.jsx";
import useRevealStagger from "./components/scene/useRevealStagger.js";
import { VoiceIcon, MusicIcon, StylusIcon, TypingIcon, Check } from "./components/scene/icons.jsx";
import "./styles/settings.css";

/* ── dough-strip volume slider ──────────────────────────────────────── */
/* MECHANIC: pointer-drag (client→track coord) + keyboard (arrows/Home/End),
   clamped 0-100, muted "Off" at 0. Logic lives here, NOT in data. */
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
  const Icon = icon;
  return (
    <div className={"st-vrow rv " + cls}>
      <div className="st-vlabel">
        <div className="st-vicon"><Icon muted={muted} /></div>
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
/* MECHANIC: select stylus|typing, aria-pressed reflects state. */
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
  const ready = useRevealStagger(90);
  const [s, setS] = useState(getSettings);

  useEffect(() => subscribeSettings(setS), []);

  const set = (patch) => setSettings(patch);
  const back = () => { if (onBack) onBack(); else window.location.hash = "#/world"; };

  const id = SCENES.settings;

  return (
    <SceneFrame className="settings-scene" ready={ready} data-vox-speaker="cook">
      <div className="st-inner">
        <HeaderLayout
          kicker={id.kicker}
          title={id.title}
          subCyr={id.subCyr}
          subLat={id.subLat}
          right={<PrimaryButton className="rv d1" onClick={back}>{id.backLabel}</PrimaryButton>}
        />

        {/* sound */}
        <div className="st-section">
          <SectionLabel num="1" className="rv d2">Sound</SectionLabel>
          <VolumeRow cls="d3" icon={VoiceIcon} name="Voice lines" hint="Spoken hints and praise from the characters"
            value={s.voiceVol} onChange={(v) => set({ voiceVol: v })} />
          <VolumeRow cls="d4" icon={MusicIcon} name="Music" hint="Background music throughout the game"
            value={s.musicVol} onChange={(v) => set({ musicVol: v })} />
        </div>

        {/* writing */}
        <div className="st-section">
          <SectionLabel num="2" className="rv d5">How you answer</SectionLabel>
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
    </SceneFrame>
  );
}
