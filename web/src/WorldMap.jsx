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
// Shared chrome (this pass): the map now composes the extracted scene chrome —
// <FabBar>, <CardNode>, <MasteryBadge>, <TrailSVG>/<TrailSpoke> — instead of
// inlining its own card/badge/trail markup. WorldMap also OWNS its FabBar (it is
// no longer overlaid by Shell), so the landing surfaces render the same way.
//
// U11 behaviour preserved:
//   • Per-room mastery status comes from the engine via masteryStatusFor().
//   • The engine's SUGGESTED next room is highlighted — and its shelf carries a
//     "Next" badge at the top level so the child knows where to go.
//   • masteryMap is optional: absent → original "no engine data" rendering.
import { useState } from "react";
import Mom from "./components/Mom.jsx";
import FabBar from "./components/scene/FabBar.jsx";
import CardNode from "./components/scene/CardNode.jsx";
import MasteryBadge from "./components/scene/MasteryBadge.jsx";
import TrailSVG from "./components/scene/TrailSVG.jsx";
import { ROOMS, STRANDS, CENTER, KITCHEN } from "./rooms.js";
import { masteryStatusFor, suggestedNextRoom } from "./kitchenProgress.js";

// ---------------------------------------------------------------------------
// Layout helpers (pure)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WorldMap
 *
 * @param {{
 *   onOpen: (id: string) => void,
 *   onConcepts?: () => void,
 *   onSettings?: () => void,
 *   masteryMap?: Record<string, import('./engine/types.js').MasteryEstimate> | null,
 * }} props
 */
export default function WorldMap({ onOpen, onConcepts, onSettings, masteryMap = null }) {
  const [openStrandId, setOpenStrandId] = useState(null);
  const suggestedRoomId = suggestedNextRoom(masteryMap);
  const openStrand = STRANDS.find((s) => s.id === openStrandId) || null;

  // The FabBar (Concepts + Settings) is part of the world map's own chrome now.
  // When the host doesn't pass handlers (e.g. unit tests), it is simply omitted.
  const fab = (onConcepts || onSettings)
    ? <FabBar onConcepts={onConcepts} onSettings={onSettings} />
    : null;

  // ---- SUBMENU: one strand's lessons -------------------------------------
  if (openStrand) {
    const rooms = strandRooms(openStrand);
    const positions = submenuPositions(rooms.length);
    // chain trail linking the strand's lessons left→right (under the cards)
    const segments = positions.slice(0, -1).map((p, i) => ({ a: p, b: positions[i + 1] }));

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

        <TrailSVG segments={segments} lift={22} inkOpacity={0.75} redOpacity={0.8} />

        {rooms.map((r, i) => (
          <CardNode
            key={r.id}
            r={r}
            pos={positions[i]}
            status={masteryStatusFor(r.nodeId, masteryMap)}
            isSuggested={r.id === suggestedRoomId}
            onOpen={onOpen}
          />
        ))}

        <div className="world-foot">Tap a lesson to begin — or go back to pick another shelf.</div>

        {fab}
      </div>
    );
  }

  // ---- TOP LEVEL: the three shelves around the kitchen --------------------
  const spokes = STRANDS.map((s) => ({ a: CENTER, b: s.pos }));

  return (
    <div className="world">
      <div className="foxing" />

      <div className="world-head">
        <div className="tag">Lesson Map</div>
        <h1>Babushka's Fractions</h1>
        <button
          className="mixbasket-btn"
          onClick={() => onOpen("review")}
          title="Mixed basket — practice all your recipes together"
        >
          🧺 Mixed Basket ▸
        </button>
      </div>

      {/* recipe trails from the kitchen to each shelf (under the nodes) */}
      <TrailSVG segments={spokes} lift={28} inkOpacity={0.8} redOpacity={0.85} hub={CENTER} />

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
              {hasSuggested && <MasteryBadge variant="suggested" label="Next" />}
              {allMastered && <MasteryBadge variant="mastered" label="Done" />}
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

      {fab}
    </div>
  );
}
