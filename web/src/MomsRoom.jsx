// MomsRoom.jsx — Babushka's Kitchen, a PURE MIRROR of the wireframe KitchenScreen
// (docs/wireframe/src/shell/KitchenScreen.jsx). The old adaptive/mastery ENGINE is
// gone: no useLessonEngine, no kitchenProgress, no attempt reporting, no mirror/
// combine/look-ahead flow, no decorative prop animations. Each kitchen room is a
// tiny story problem; the child reads it and answers; we grade LOCALLY (see
// kitchen/grade.js) and, on a miss, surface the "Learn it" link to that lesson.
//
// LAYOUT (mirrors KitchenScreen exactly):
//   • topbar:  ★ heart + tag/title + a demo tool/scratch toggle + back/settings/reset
//   • StageTabs strip — one tab per kitchen room in KITCHEN_ORDER, the current
//     one active; clicking a tab switches the active room. Landing = m1.
//   • kq two-column:
//       kq-main (left):  kq-play (mode "tool" → <KitchenTool/>, "write" → scratch)
//                        kq-answer (the <KitchenAnswer/> surface + "▸ Learn it"
//                        link + Check button, pinned to the bottom)
//       kq-rail (right): kq-question (cook's order + story + Read aloud)
//                        mr-asker (cook portrait by room.cook)
//                        kq-tutor (Babushka portrait + ribbon = room.tutorLine)
//
// The data source of truth is kitchen/rooms.js (12 rooms + KITCHEN_ORDER); the
// lesson identity for each tab / "Learn it" link comes from the lesson registry
// (lessons/index.js) — exactly as the wireframe's lessonOf() does.

import { useState } from "react";
import Mom from "./components/Mom.jsx";
import { CAST } from "./components/momsroom/cast.jsx";
import ScratchCanvas from "./components/momsroom/ScratchCanvas.jsx";
import StageTabs from "./components/StageTabs.jsx";
import SettingsButton from "./SettingsButton.jsx";
import KitchenTool from "./components/kitchen/KitchenTool.jsx";
import KitchenAnswer, { isAnswerComplete } from "./components/kitchen/KitchenAnswer.jsx";
import { ROOMS, KITCHEN_ORDER, LANDING_ID, roomById } from "./kitchen/rooms.js";
import { gradeRoom } from "./kitchen/grade.js";
import { LESSONS } from "./lessons/index.js";
import { useVoice } from "./voice.js";
import "./styles/kitchen.css";

const MOM = LESSONS.mom;

// ── Back-compat shims ───────────────────────────────────────────────────────
// The engine-driven kitchen is gone, but a few legacy importers (older runtime
// tests) still import these names from MomsRoom. They are inert here — the
// kitchen no longer uses any engine binding — and are re-exported only so those
// modules keep resolving. Safe to delete once nothing imports them.
export const ROOM_TO_NODE = MOM.roomToNode || {};
export const NODE_TO_ROOM = MOM.nodeToRoom || {};
/** Legacy no-op: the kitchen no longer reports error signatures to any engine. */
export function slipToErrorSignature() { return null; }

// Who brought the order — the cook portrait component, keyed by room.cook.
const COOK_NAME = { kid: "the Kid", grandpa: "Grandpa", cat: "the Cat" };

// Turn a room's raw-HTML story into the plain text we actually speak, so the
// Read-aloud button (and tap-to-read on the story block) voices EXACTLY the
// words shown in the box. The old per-room `readVox` ids ("mr_kitchen_*") were
// never baked into voiceLines/clips, so say(readVox) fell through to TTS on the
// raw id — reading something unrelated. Speaking the story text instead keeps
// the audio and the on-screen copy in sync. speechify() (in voice.js) spells the
// fractions/symbols for the neural voice.
function storyToSpeech(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, " ")   // drop <b> etc.
    .replace(/&lt;/g, " less than ")
    .replace(/&gt;/g, " greater than ")
    .replace(/&amp;/g, " and ")
    .replace(/&mdash;/g, " — ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Each kitchen room mirrors a lesson, so its name / № / "Learn it" room come
   straight from that lesson in the registry (the single source of truth) — the
   tab can never drift from the lesson number. Mirrors KitchenScreen.lessonOf. */
function lessonOf(id) {
  const L = LESSONS[id] || {};
  return {
    name: L.title || id,
    badge: L.num ? L.num.replace(/\D/g, "") || "★" : "★",
    // the lesson's first room is the "Learn it" target. In the app the room id IS
    // the route ( go(id) → #/id ), so we route straight to the lesson by its id.
    learnRoomId: id,
  };
}

// One StageTabs entry per kitchen room, in KITCHEN_ORDER, named from the registry.
const KITCHEN_STAGES = KITCHEN_ORDER.map((id) => {
  const L = lessonOf(id);
  return { key: id, badge: L.badge, title: L.name, sub: "story problem" };
});

const SPEAKER = (
  <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
    <path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" />
    <path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" />
  </svg>
);

export default function MomsRoom({ onBack, onOpenRoom }) {
  // active kitchen room (landing = m1) and the working answer value.
  const [activeId, setActiveId] = useState(LANDING_ID);
  // play-area mode: "tool" (concept manipulative) or "write" (scratch sheet).
  // Default to tool mode with a scratch toggle, per the wireframe demo toggle.
  const [mode, setMode] = useState("tool");
  const [value, setValue] = useState({});
  // feedback after a Check: null | "correct" | "wrong" | "incomplete".
  const [verdict, setVerdict] = useState(null);

  const { speaking, say, stopVoice } = useVoice();

  const room = roomById(activeId) || ROOMS[LANDING_ID];
  const storyText = storyToSpeech(room.story);
  const lesson = lessonOf(activeId);
  const CookArt = CAST[room.cook] || CAST.kid;
  const cookName = COOK_NAME[room.cook] || COOK_NAME.kid;
  const ready = isAnswerComplete(room.answer, value);
  // The strip+knife rooms (cross-multiply, scale-one) put their knife rack BESIDE
  // the bonus character (the mr-asker box) so it fits — the strips stay in the
  // play area. StripCutter portals its rack into the slot rendered below.
  const usesKnifeTool = mode === "tool" && (activeId === "r2" || activeId === "r3");

  function selectRoom(id) {
    if (!id || id === activeId) return;
    stopVoice();
    setActiveId(id);
    setValue({});
    setVerdict(null);
    setMode("tool");
  }

  function check() {
    const res = gradeRoom(room, value);
    setVerdict(res.state);
  }

  function goLearn() {
    stopVoice();
    onOpenRoom && onOpenRoom(lesson.learnRoomId);
  }

  // Babushka's ribbon: her tutor line normally; a celebratory / corrective line
  // after a Check. Her portrait mood follows suit.
  const ribbon =
    verdict === "correct" ? "That's it — beautifully cooked!" :
    verdict === "wrong"   ? "Not quite — peek at the lesson, then try again." :
    verdict === "incomplete" ? "Fill in your answer first, then press Check." :
    room.tutorLine;
  const momMood = verdict === "correct" ? "cheer" : verdict === "wrong" ? "think" : "idle";
  const showLearn = verdict === "wrong";

  return (
    <div className="page kitchen momsroom" data-vox-speaker="mom">
      <div className="foxing" />

      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark mr-heart">{MOM.badge}</span>
          <div>
            <div className="puzzle-tag">{MOM.tag}</div>
            <div className="puzzle-title">{MOM.title}</div>
          </div>
        </div>
        <div aria-hidden="true" />
        <div className="controls">
          {/* demo toggle: swap the play area between the helper tool and scratch */}
          <button
            className="ctrl-btn kq-modebtn"
            type="button"
            title="Swap the play area between the helper tool and the scratch pad"
            onClick={() => setMode(mode === "tool" ? "write" : "tool")}
          >
            {mode === "tool" ? "✎ Scratch pad" : "🎲 Helper tool"}
          </button>
          {onBack && (
            <button className="ctrl-btn" title="Back to the kitchen map" onClick={() => { stopVoice(); onBack(); }}>←</button>
          )}
          <SettingsButton />
          <button className="ctrl-btn" title="Start over" onClick={() => selectRoom(LANDING_ID)}>⟲</button>
        </div>
      </div>

      {/* ── STEP STRIP — one tab per kitchen room, the current one active ──── */}
      <StageTabs
        stages={KITCHEN_STAGES}
        current={activeId}
        onSelect={selectRoom}
        label="Kitchen story problems"
      />

      {/* ── TWO-COLUMN PLAY AREA ───────────────────────────────────────────── */}
      <div className="kq">
        {/* LEFT: play area (tool | scratch) + answer surface pinned to bottom */}
        <div className="kq-main">
          <div className="kq-play">
            {mode === "tool" ? (
              <div className="kq-toolwrap">
                {/* The helper tool is a PURE MANIPULATIVE / scratch space. It is
                    intentionally NOT wired to the answer: the game space must
                    never edit the answer space (and vice-versa) — the child reads
                    what they build here and writes the answer themselves. We pass
                    onProgress only (telemetry), never value/onChange. */}
                <KitchenTool room={room} onProgress={() => {}} />
              </div>
            ) : (
              <ScratchCanvas key={activeId} />
            )}
          </div>

          <div className="kq-answer">
            <KitchenAnswer
              answer={room.answer}
              value={value}
              onChange={(next) => { setValue(next); if (verdict) setVerdict(null); }}
            />
            <div className="kq-answer-marks">
              {showLearn && (
                <button className="mr-wallbtn" type="button" onClick={goLearn} title={"Open " + lesson.name}>
                  ▸ Learn it: {lesson.name}
                </button>
              )}
              <button
                className={"check" + (verdict === "correct" ? " done" : ready ? " ready" : "")}
                type="button"
                onClick={check}
              >
                {verdict === "correct" ? "Correct ✓" : "Check"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: question panel + cook portrait + Babushka tutor */}
        <div className="kq-rail">
          <div className="panel kq-question">
            <div className="kq-question-head">
              <h3>{cookName}'s Order</h3>
              <button
                className={"speaker" + (speaking ? " speaking" : "")}
                type="button"
                onClick={() => storyText && say(storyText, { speaker: "mom" })}
              >
                {SPEAKER} Read aloud
              </button>
            </div>
            <div
              className="kq-story"
              data-vox={storyText}
              data-vox-speaker="mom"
              dangerouslySetInnerHTML={{ __html: room.story }}
            />
          </div>

          {/* cook portrait — plus, for the strip+knife rooms, the knife rack slid
              in beside the character (StripCutter portals its rack into the slot). */}
          <div className={"panel mr-asker" + (usesKnifeTool ? " mr-asker--tools" : "")}>
            {usesKnifeTool && <div className="mr-asker-knives" id="kq-knife-slot" />}
            <div className="mr-asker-art">
              <CookArt expr={verdict === "correct" ? "happy" : "asking"} width={120} />
            </div>
          </div>

          {/* tutor: Babushka + ribbon (her tutorLine, or check feedback) */}
          <div className="kq-tutor">
            <div className="cook-stage">
              <Mom expr={momMood} width={110} />
            </div>
            <div
              className={"ribbon" + (verdict === "wrong" || verdict === "incomplete" ? " warn" : "")}
              data-vox-speaker="mom"
            >
              {ribbon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
