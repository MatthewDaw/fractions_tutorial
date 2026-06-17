import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Toolbar from "./Toolbar.jsx";
import { useStageFit } from "./useStageFit.js";
import { prepHtml } from "./prepHtml.js";
import { routeFromHref } from "./routeFromHref.js";
import StageTabs from "./StageTabs.jsx";
import { LESSONS } from "../lessons.js";
import { BABUSHKA, CAST, KITCHEN_SKILLS } from "../kitchen/cast.js";
import { renderAnswer, renderTool } from "../kitchen/answer.js";
import { showWork } from "../showWork.js";

/* Each kitchen question mirrors a lesson, so its name / № / "Learn it" room come
   straight from that lesson in lessons.js (the single source of truth) — the
   question is NAMED exactly like its lesson, and can never drift from it. */
function lessonOf(id) {
  const L = LESSONS[id] || {};
  return {
    name: L.title || id,
    num: L.num || "",
    room: (L.tabs && L.tabs[0] && L.tabs[0].href) || "world.html",
  };
}

/* The kitchen's step strip is the SAME <StageTabs> every lesson uses — one tab
   per question, named after its lesson, the current one active. Built once from
   KITCHEN_SKILLS so adding a question needs no nav wiring. */
const KITCHEN_TABS = KITCHEN_SKILLS.map((s) => {
  const L = lessonOf(s.id);
  return {
    n: L.num.replace(/\D/g, "") || "★",
    name: L.name,
    sub: "story problem",
    href: "kitchen-" + s.id + ".html",
    title: L.name,
  };
});

/* ───────────────────────────────────────────────────────────────────────────
   KitchenScreen — the ONE shared template for every Babushka's Kitchen question.

   Babushka's Kitchen is the "show what you know" room: each question is a tiny
   story problem that asks the SAME concept as a lesson's final question (so a
   miss can route the child back to that lesson's room). The questions are
   mostly WORDS — a cook brings a problem to the counter, the child reads it and
   writes the answer; an optional small visual may help.

   A question file is pure DATA (see src/screens/kitchen-nl.js). It declares only:
     {
       kind: "kitchen",
       id,            // a KITCHEN_SKILLS id — supplies № / skill / "Learn it" room
       cook,          // "kid" | "grandpa" | "cat" — who brought it
       story,         // the word problem (prose, the primary question) — HTML ok
       recipe,        // the skill blurb in the side panel — HTML ok
       answer,        // { type, … } — see answer.js
       tutorLine,     // Babushka's ribbon line
       visual,        // OPTIONAL small helper SVG (HTML string)
       readVox,       // optional data-vox id for read-aloud
     }
   Everything structural (topbar, pips, cook portrait, Babushka, Check, the
   "Learn it" wall) is rendered HERE, once.
   ─────────────────────────────────────────────────────────────────────────── */

function Html({ className, html, style }) {
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: prepHtml(html) }} />;
}

const SPEAKER = (
  <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
    <path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" />
    <path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" />
  </svg>
);

export default function KitchenScreen({ data }) {
  const { pathname } = useLocation();

  const idx = Math.max(0, KITCHEN_SKILLS.findIndex((s) => s.id === data.id));
  const lesson = lessonOf(data.id); // name / № / "Learn it" room, straight from the lesson
  const cook = CAST[data.cook] || CAST.kid;
  const tabs = KITCHEN_TABS.map((t, i) => ({ ...t, active: i === idx }));

  // Two answer states: free entry ("write") and a concept-matched manipulative
  // ("tool"). The real app picks one; for this demo a button swaps between them.
  const [mode, setMode] = useState("write");

  // Re-fit the play area whenever the question OR the mode changes, so the helper
  // tool (which can be larger than the box) is auto-scaled down to fit.
  useStageFit(pathname + ":" + mode);

  return (
    <>
      <Toolbar title="Babushka's Kitchen" route={"#/mom · " + lesson.name} />
      <div id="fit">
        <div id="stage">
          <div className="page kitchen momsroom" data-vox-speaker="mom">
            <div className="foxing" />

            {/* ── TOPBAR ───────────────────────────────────────────────── */}
            <div className="topbar">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="num-mark mr-heart">★</span>
                <div>
                  <div className="puzzle-tag">Babushka's Kitchen · Story Problems</div>
                  <div className="puzzle-title">Show Babushka What You Know</div>
                </div>
              </div>
              <div aria-hidden="true" />
              <div className="controls">
                {/* DEMO-only toggle (removed in the real app) — lives up here so it
                    never affects the play/answer sizing below. */}
                <button className="ctrl-btn kq-modebtn" type="button" title="Demo: swap the play area between the scratch pad and the helper tool"
                        onClick={() => setMode(mode === "tool" ? "write" : "tool")}>
                  {mode === "tool" ? "✎ Scratch pad" : "🎲 Helper tool"}
                </button>
                <Link className="ctrl-btn" to={routeFromHref("world.html")} title="Back to the kitchen map">←</Link>
                <span className="ctrl-btn" title="Settings">⚙</span>
                <span className="ctrl-btn" title="Start over (clears progress)">⟲</span>
              </div>
            </div>

            {/* ── STEP STRIP — same nav as every lesson, one tab per question ── */}
            <StageTabs tabs={tabs} />

            {/* ── BELOW THE TOPBAR ───────────────────────────────────────
                The question now lives in the right rail (like the rest of the
                app); the left is the answer surface + any optional visual. */}
            <div className="kq">
              <div className="kq-main">
                {/* play area — either the shared "show your work" sheet (free entry)
                    or, in tool mode, the concept-matched helper tool lives HERE in
                    the drawing space. The answer form below is unchanged either way. */}
                <div className="kq-play">
                  {data.visual ? <Html className="kq-visual" html={data.visual} /> : null}
                  {mode === "tool" ? (
                    <div className="kq-toolwrap">
                      <div className="fit-stage"><Html className="fit-stage-content" html={renderTool(data)} /></div>
                    </div>
                  ) : (
                    <Html className="kq-sheet" html={showWork("scratch space — draw your work here ✎")} />
                  )}
                </div>

                {/* the answer is always the free-entry form, pinned to the bottom */}
                <div className="kq-answer">
                  <Html className="kq-answer-write" html={renderAnswer(data.answer)} />
                  <div className="kq-answer-marks">
                    <Link className="mr-wallbtn" to={routeFromHref(lesson.room)} title={"Open " + lesson.name}>
                      ▸ Learn it: {lesson.name}
                    </Link>
                    <button className="check" type="button">Check</button>
                  </div>
                </div>
              </div>

              {/* ── RAIL — the question, who's cooking, the skill, Babushka ── */}
              <div className="kq-rail">
                <div className="panel kq-question">
                  <div className="kq-question-head">
                    <h3>{cook.name}'s Order</h3>
                    <button className="speaker" type="button">{SPEAKER} Read aloud</button>
                  </div>
                  <div className="kq-story" data-vox={data.readVox} data-vox-speaker="mom"
                       dangerouslySetInnerHTML={{ __html: prepHtml(data.story) }} />
                </div>
                {/* the cook's portrait only — never any caption text in this box */}
                <div className="panel mr-asker">
                  <Html className="mr-asker-art" html={cook.art} />
                </div>
                <div className="kq-tutor">
                  <Html className="cook-stage" html={BABUSHKA} />
                  <div className="ribbon" data-vox-speaker="mom">{data.tutorLine}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
