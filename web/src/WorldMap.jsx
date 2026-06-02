// WorldMap.jsx — the lesson map / home screen. Now TWO levels:
//
//   TOP LEVEL  — Babushka's kitchen at the centre, three "shelf" nodes (the
//                STRANDS) around it, joined by ink "recipe trails". Tap a shelf
//                to open it.
//   SUBMENU    — one strand's lessons laid out as a centred row of cards (the
//                familiar lesson cards), with a back button to the shelves.
//
// Why two levels: ten lessons no longer fit one radial ring without overlap, so
// the lessons are grouped into three contiguous-curriculum strands (see
// STRANDS in rooms.js). The recipe-trail aesthetic and per-lesson card are kept.
//
// U11 behaviour preserved:
//   • Per-room mastery status comes from the engine via masteryStatusFor().
//   • The engine's SUGGESTED next room is highlighted — and its shelf carries a
//     "Next" badge at the top level so the child knows where to go.
//   • masteryMap is optional: absent → original "no engine data" rendering.
import { useState } from "react";
import Mom from "./components/Mom.jsx";
import { ROOMS, STRANDS, CENTER, KITCHEN } from "./rooms.js";
import { masteryStatusFor, suggestedNextRoom } from "./kitchenProgress.js";

// ---------------------------------------------------------------------------
// Status → display helpers
// ---------------------------------------------------------------------------

/**
 * Map a mastery status to a CSS class suffix and a short label.
 * @param {'not-started'|'in-progress'|'mastered'|'needs-review'} status
 */
function statusMeta(status) {
  switch (status) {
    case 'mastered':      return { cls: 'mastered',     label: 'Mastered' };
    case 'in-progress':   return { cls: 'in-progress',  label: 'In progress' };
    case 'needs-review':  return { cls: 'needs-review', label: 'Cook again' };
    case 'not-started':
    default:              return { cls: 'not-started',  label: null };
  }
}

// Resolve a strand's lesson ids to the real ROOMS objects, in strand order.
function strandRooms(strand) {
  return strand.lessons.map((id) => ROOMS.find((r) => r.id === id)).filter(Boolean);
}

// Lay a strand's N cards out as one centred horizontal row in the 1280×800 stage.
// Cards are 250px wide and centre-anchored, so we return centre points.
function submenuPositions(n) {
  const CARD_W = 250, GAP = 42, Y = 438;
  const total = n * CARD_W + (n - 1) * GAP;
  const startCx = (1280 - total) / 2 + CARD_W / 2;
  return Array.from({ length: n }, (_, i) => ({ x: startCx + i * (CARD_W + GAP), y: Y }));
}

// A soft quadratic "recipe trail" path between two points (used for both the
// kitchen→shelf spokes and the lesson→lesson chain inside a strand).
function trailPath(ax, ay, bx, by, lift = 28) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - lift;
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
}

// ---------------------------------------------------------------------------
// Lesson card (shared by the submenu)
// ---------------------------------------------------------------------------

function LessonCard({ r, pos, status, isSuggested, onOpen }) {
  const { cls: statusCls, label: statusLabel } = statusMeta(status);
  const classNames = [
    'wcard',
    !r.built && 'soon',
    statusCls !== 'not-started' && `wcard--${statusCls}`,
    isSuggested && 'wcard--suggested',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      style={{ left: pos.x, top: pos.y }}
      onClick={() => onOpen(r.id)}
      title={r.built ? `Open Lesson ${r.no}` : `Lesson ${r.no} (not built yet)`}
      data-mastery-status={status}
      data-suggested={isSuggested || undefined}
    >
      <div className="whead">
        <span className="wno">№{r.no}</span>
        {statusLabel ? (
          <span className={`wtag ${statusCls}`}>{statusLabel}</span>
        ) : (
          <span className={"wtag " + (r.built ? "ready" : "soon")}>
            {r.built ? "Ready" : "Coming soon"}
          </span>
        )}
        {isSuggested && (
          <span className="wtag suggested" aria-label="Suggested next lesson">Next</span>
        )}
      </div>
      <h2>{r.title}</h2>
      <p>{r.concept}</p>
      {r.example && (
        <div className="wex">
          <span className="wex-label">{r.verb || "Example"}</span>
          <span className="wex-frac">{r.example}</span>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WorldMap
 *
 * @param {{ onOpen: (id: string) => void, masteryMap?: Record<string, import('./engine/types.js').MasteryEstimate> | null }} props
 */
export default function WorldMap({ onOpen, masteryMap = null }) {
  const [openStrandId, setOpenStrandId] = useState(null);
  const suggestedRoomId = suggestedNextRoom(masteryMap);
  const openStrand = STRANDS.find((s) => s.id === openStrandId) || null;

  // ---- SUBMENU: one strand's lessons -------------------------------------
  if (openStrand) {
    const rooms = strandRooms(openStrand);
    const positions = submenuPositions(rooms.length);

    return (
      <div className="world world--submenu">
        <div className="foxing" />

        <button className="world-back" onClick={() => setOpenStrandId(null)} aria-label="Back to all shelves">
          <span aria-hidden="true">←</span> All lessons
        </button>

        <div className="world-head">
          <div className="tag">{`Shelf · Lessons ${rooms[0]?.no}–${rooms[rooms.length - 1]?.no}`}</div>
          <h1>{openStrand.title}</h1>
          <div className="sub">{openStrand.blurb}</div>
        </div>

        {/* chain trail linking the strand's lessons left→right (under the cards) */}
        <svg className="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
          {positions.slice(0, -1).map((p, i) => {
            const q = positions[i + 1];
            const d = trailPath(p.x, p.y, q.x, q.y, 22);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
                <path d={d} fill="none" stroke="var(--red)" strokeWidth="1.3" strokeDasharray="1 8" strokeLinecap="round" opacity="0.8" />
              </g>
            );
          })}
        </svg>

        {rooms.map((r, i) => (
          <LessonCard
            key={r.id}
            r={r}
            pos={positions[i]}
            status={masteryStatusFor(r.nodeId, masteryMap)}
            isSuggested={r.id === suggestedRoomId}
            onOpen={onOpen}
          />
        ))}

        <div className="world-foot">Tap a lesson to begin — or go back to pick another shelf.</div>
      </div>
    );
  }

  // ---- TOP LEVEL: the three shelves around the kitchen --------------------
  return (
    <div className="world">
      <div className="foxing" />

      <div className="world-head">
        <div className="tag">Lesson Map</div>
        <h1>Babushka's Fractions</h1>
      </div>

      {/* recipe trails from the kitchen to each shelf (under the nodes) */}
      <svg className="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
        {STRANDS.map((s) => {
          const d = trailPath(CENTER.x, CENTER.y, s.pos.x, s.pos.y);
          return (
            <g key={s.id}>
              <path d={d} fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
              <path d={d} fill="none" stroke="var(--red)" strokeWidth="1.3" strokeDasharray="1 8" strokeLinecap="round" opacity="0.85" />
            </g>
          );
        })}
        <circle cx={CENTER.x} cy={CENTER.y} r="5" fill="var(--ink)" />
      </svg>

      {/* central kitchen — tap to enter Babushka's Room (story / word problems) */}
      <button
        className="kitchen-node kitchen-open"
        style={{ left: CENTER.x, top: CENTER.y }}
        onClick={() => onOpen("mom")}
        title="Cook with Babushka — story problems"
      >
        <div className="kitchen-label">
          <div className="kitchen-name">{KITCHEN.title}</div>
          <div className="kitchen-cta">▸ Cook with Babushka</div>
        </div>
        <div className="kitchen-medallion"><Mom expr="idle" width={94} /></div>
      </button>

      {/* shelf nodes */}
      {STRANDS.map((s) => {
        const rooms = strandRooms(s);
        const masteredCount = rooms.filter((r) => masteryStatusFor(r.nodeId, masteryMap) === 'mastered').length;
        const hasSuggested = rooms.some((r) => r.id === suggestedRoomId);
        const allMastered = rooms.length > 0 && masteredCount === rooms.length;

        return (
          <button
            key={s.id}
            className={['shelf', hasSuggested && 'shelf--suggested', allMastered && 'shelf--done'].filter(Boolean).join(' ')}
            style={{ left: s.pos.x, top: s.pos.y }}
            onClick={() => setOpenStrandId(s.id)}
            title={`Open ${s.title}`}
          >
            <div className="shelf-head">
              <span className="shelf-range">№{rooms[0]?.no}–{rooms[rooms.length - 1]?.no}</span>
              {hasSuggested && <span className="wtag suggested">Next</span>}
              {allMastered && <span className="wtag mastered">Done</span>}
            </div>
            <h2 className="shelf-title">{s.title}</h2>
            <p className="shelf-blurb">{s.blurb}</p>
            <div className="shelf-foot">
              <span className="shelf-count">{masteredCount} / {rooms.length} mastered</span>
              <span className="shelf-open">Open shelf ▸</span>
            </div>
          </button>
        );
      })}

      <div className="world-foot">Three shelves, ten lessons, in order — start at the kitchen, or open any shelf.</div>
    </div>
  );
}
