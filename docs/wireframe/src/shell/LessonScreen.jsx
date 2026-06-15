import { Link, useLocation } from "react-router-dom";
import Toolbar from "./Toolbar.jsx";
import StageTabs from "./StageTabs.jsx";
import { useStageFit } from "./useStageFit.js";
import { LESSONS } from "../lessons.js";
import { prepHtml } from "./prepHtml.js";
import { routeFromHref } from "./routeFromHref.js";

/* ───────────────────────────────────────────────────────────────────────────
   LessonScreen — the ONE shared chrome for every lesson room/step.

   This is the single source of truth the user asked for: toolbar, topbar
   (№ mark, tags, ← / intro / settings / ⟲ controls), the stage-tab strip, the
   read-aloud goal banner, and the LessonBoard split grid. Edit any of these
   here and the change lands on all ~80 lesson screens at once.

   Each screen file under src/screens/ is just DATA (see room-nl.js) declaring
   its unique bits; the raw interactive markup lives in the *HTML slots, kept
   verbatim from the hand-tuned originals.

   data shape:
     {
       kind: "lesson",
       toolbarTitle, route,             // toolbar text  (e.g. "№3 … · Place", "#/nl")
       speaker = "cook",                // data-vox-speaker on .page
       num, tag, title,                 // topbar identity
       backHref, introHref, returnHref, // control destinations (sensible defaults)
       tabs: [{ n, name, sub, href|null, active, title }],
       goalHTML,                        // inner HTML of .goal-text
       railW = 396, footH = 196,        // LessonBoard split dimensions
       stageHTML, railHTML, answerHTML, tutorHTML,
     }
   ─────────────────────────────────────────────────────────────────────────── */

/* "Read aloud" control — the instructions now live ONLY in the side panel, so
   the read-to-me affordance moves there too. Injected as the rail's first child
   (an HTML string, so it sits as a real flex sibling above the hint panel). */
const READ_ALOUD =
  '<button class="speaker wf-rail-speaker" type="button">' +
  '<svg width="16" height="14" viewBox="0 0 16 14">' +
  '<path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)"></path>' +
  '<path d="M11 4 Q14 7 11 10" stroke="var(--red)" stroke-width="1.4" fill="none"></path>' +
  "</svg> Read aloud</button>";

const PLAY_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M10 8.4 L16 12 L10 15.6 Z" fill="currentColor" />
  </svg>
);

function Slot({ className, html, style }) {
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: prepHtml(html) }}
    />
  );
}

export default function LessonScreen({ data }) {
  const { pathname } = useLocation();
  useStageFit(pathname);

  const {
    speaker = "cook",
    backHref = "world.html",
    introHref = "intro.html",
    returnHref = "kitchen.html",
    railW = 396,
  } = data;

  // Identity lives ONCE per lesson in lessons.js. A page declares only
  // `lesson: "<id>"`; the № / tag / title / route come from there (a page may
  // still override any field). The toolbar title is derived from the active step,
  // so pages don't repeat "№3 … · <Step>" either.
  const L = (data.lesson && LESSONS[data.lesson]) || {};
  const num = data.num ?? L.num;
  const tag = data.tag ?? L.tag;
  const title = data.title ?? L.title;
  const route = data.route ?? L.route;
  const activeStep = (L.tabs || []).find((t) => routeFromHref(t.href) === pathname);
  const toolbarTitle =
    data.toolbarTitle ||
    [num, title].filter(Boolean).join(" ") + (activeStep ? " · " + activeStep.name : "");

  // Normalize the foot band to the standard height everywhere. Several pages
  // declared a short foot (140–150px) that cramped the answer slate; floor it to
  // 196 so the fraction the kid fills in renders large (and the foot band lines
  // up consistently page to page). The stage row auto-fits the reclaimed space.
  const footH = Math.max(data.footH ?? 196, 196);

  return (
    <>
      <Toolbar title={toolbarTitle} route={route} />

      <div id="fit">
        <div id="stage">
          <div className="page" data-vox-speaker={speaker}>
            <div className="foxing" />

            {/* ── TOPBAR ─────────────────────────────────────────────── */}
            <div className="topbar">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="num-mark">{num}</span>
                <div>
                  <div className="puzzle-tag">{tag}</div>
                  <div className="puzzle-title">{title}</div>
                </div>
              </div>
              <div aria-hidden="true" />
              <div className="controls">
                <Link className="ctrl-btn" to={routeFromHref(backHref)} title="Back to the lesson map">←</Link>
                <Link className="ctrl-btn" to={routeFromHref(introHref)} title="Rewatch the intro video" aria-label="Rewatch the intro video">
                  {PLAY_SVG}
                </Link>
                <button className="ctrl-btn" title="Settings" aria-label="Settings">
                  <img src="/assets/settings-gear.png" width="18" height="18" alt="" aria-hidden="true" style={{ display: "block", objectFit: "contain" }} />
                </button>
                <Link className="ctrl-btn" to={routeFromHref(returnHref)} title="Start this stage over">⟲</Link>
              </div>
            </div>

            {/* ── STAGE TABS (shared component) ──────────────────────── */}
            <StageTabs lesson={data.lesson} tabs={data.tabs} />

            {/* The top goal banner is intentionally gone: the instructions live
                ONLY in the side panel now (Read-aloud moved there), and the tutor
                speaks only for corrective hints — so the play area gets that space. */}

            {/* ── BELOW THE TABS ─────────────────────────────────────────
                Standard lesson = the LessonBoard split (four named slots). Pages
                whose content doesn't fit that grid (the is-wide word-problem
                layout, the practice frame, …) provide `belowHTML` — their own
                markup for everything under the tabs — rendered transparently
                (display:contents) so it stays a direct flex child of .page. Either
                way the page flows through the SAME shared chrome (toolbar +
                StageTabs); no page re-implements the strip. */}
            {data.belowHTML ? (
              <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: prepHtml(data.belowHTML) }} />
            ) : (
              <div
                className={("lboard " + (data.lboardClass || "")).trim()}
                style={{ "--lboard-rail-w": railW + "px", "--lboard-foot-h": footH + "px" }}
              >
                <Slot className="lboard-stage" html={data.stageHTML} />
                {data.railHTML != null && (
                  <Slot className="lboard-rail" html={READ_ALOUD + data.railHTML} />
                )}
                <Slot className="lboard-answer" html={data.answerHTML} />
                <Slot className="lboard-tutor" html={data.tutorHTML} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
