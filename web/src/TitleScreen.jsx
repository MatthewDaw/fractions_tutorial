// TitleScreen.jsx — "Babushka's Fractions" (Бабушкины доли) game title / intro.
// The first thing a player sees, before the world map. Vintage Moscow-Puzzles
// print look: cream paper, a single Soviet red, woodcut cast (Babushka in front),
// English-first title with Cyrillic subtext, a hero ½+⅓=? motif, and one big
// START. Ported from the design handoff (design_handoff_babushkas_fractions_intro).
//
// Architecture: this is a standalone scene (no LessonShell). Like the wireframe
// (docs/wireframe/screens/title.html) it now drives the shared scene chrome —
// <SceneFrame> (paper/foxing/frame/4 corners), useRevealStagger (the 120ms load
// reveal), the shared <FStrip> glyph, and the shared <FabBar> (Concepts +
// Settings) which the title screen renders itself rather than relying on Shell.
//
// The Cook (tutor) greets the player aloud on load — "Welcome to Babushka's
// Fractions!" Browsers gate autoplay behind a user gesture, so we greet on mount
// and, if that's blocked, retry once on the first tap/key (same trick as
// BackgroundMusic).
import { useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Mom from "./components/Mom.jsx";
import { Kid, Grandpa, Cat } from "./components/momsroom/cast.jsx";
import SceneFrame from "./components/scene/SceneFrame.jsx";
import useRevealStagger from "./components/scene/useRevealStagger.js";
import FStrip from "./components/scene/FStrip.jsx";
import FabBar from "./components/scene/FabBar.jsx";
import { useVoice } from "./voice.js";
import "./styles/title.css";

/* absolutely-positioned figure wrapper */
function Figure({ children, style, cls = "" }) {
  return <div className={"fig " + cls} style={style}>{children}</div>;
}

export default function TitleScreen({ onStart, onConcepts, onSettings }) {
  const ready = useRevealStagger(120);
  const { say, speaking } = useVoice();

  // Greet on load. Track whether the greeting ever actually started so the
  // gesture-retry doesn't double-speak when autoplay wasn't blocked.
  const startedRef = useRef(false);
  useEffect(() => { if (speaking) startedRef.current = true; }, [speaking]);
  useEffect(() => {
    say("titleWelcome");
    const retry = () => {
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("keydown", retry);
      if (!startedRef.current) say("titleWelcome"); // autoplay was blocked → greet on first touch
    };
    document.addEventListener("pointerdown", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
    return () => {
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("keydown", retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SceneFrame className="titlescreen" ready={ready} data-vox-speaker="cook">
      {/* giant ghosted fraction motif behind everything */}
      <div className="ghost-half rv d3">½</div>

      {/* left type block */}
      <div className="title-block">
        <div className="kicker rv d1"><span className="k-dot" />Moscow Puzzles · No.&nbsp;1</div>
        <h1 className="ru-title rv d2" style={{ fontSize: 82, marginTop: 16 }}>Babushka&rsquo;s</h1>
        <h1 className="ru-title rv d3" style={{ fontSize: 120, color: "var(--red)", marginTop: -8 }} data-vox="titleWelcome">Fractions</h1>
        <div className="subtitle-row rv d4">
          <span className="cyr-sub">Бабушкины доли</span>
          <span className="latin-sub">Babushkiny Doli</span>
        </div>
        <div className="gloss rv d4" style={{ fontSize: 21, marginTop: 12, maxWidth: 540 }}>
          Slice the dough and <span className="gloss-em">add up the shares.</span>
        </div>

        {/* hero strip equation */}
        <div className="strip-eq rv pop d5">
          <FStrip num={1} den={2} width={150} height={48} />
          <span className="op">+</span>
          <FStrip num={1} den={3} width={150} height={48} />
          <span className="op">=</span>
          <span className="q"><span className="qbounce">?</span></span>
        </div>

        <div className="rv pop d6" style={{ marginTop: 34 }}>
          <button className="start" onClick={onStart} autoFocus>
            <span className="s-ru">Let&rsquo;s Slice!</span>
            <span className="s-en">Начать · let&rsquo;s add fractions</span>
          </button>
        </div>
      </div>

      {/* character cluster bottom-right (Babushka front; Kid offset right of the Cat) */}
      <div className="grp-floor" />
      <Figure cls="rv figIn d5 bob3" style={{ left: 828, bottom: 104, width: 120, zIndex: 1 }}><Cook expr="idle" width={120} /></Figure>
      <Figure cls="rv figIn d5 bob2" style={{ left: 876, bottom: 86, width: 150, zIndex: 3 }}><Grandpa expr="happy" width={150} /></Figure>
      <Figure cls="rv figIn d6 bob3" style={{ left: 1140, bottom: 92, width: 116, zIndex: 3 }}><Kid expr="happy" width={116} /></Figure>
      <Figure cls="rv figIn d6 bob2" style={{ left: 1064, bottom: 50, width: 130, zIndex: 6 }}><Cat expr="happy" width={130} /></Figure>
      <Figure cls="rv figIn d5 bob" style={{ left: 944, bottom: 66, width: 248, zIndex: 5 }}><Mom expr="cheer" width={248} /></Figure>

      {/* shared chrome — the title screen renders its own FabBar (matches the
          wireframe), keeping programmatic routing via the host's handlers */}
      <FabBar onConcepts={onConcepts} onSettings={onSettings} />
    </SceneFrame>
  );
}
