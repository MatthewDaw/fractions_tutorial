// WorldMap.jsx — the lesson map / home screen. Babushka's kitchen at the centre,
// each lesson a neighbour node connected by an ink "recipe trail". Click a
// node to open that room.
//
// U11 additions:
//   • Reads per-room mastery status from the engine via masteryStatusFor().
//   • Highlights the engine's SUGGESTED next room (most-upstream unmastered).
//   • Keeps the existing spoke layout, card structure, and all existing fields.
//   • masteryMap prop is optional: when absent the map renders in the original
//     "no engine data" style (identical to before U11).
import Mom from "./components/Mom.jsx";
import { ROOMS, CENTER, KITCHEN } from "./rooms.js";
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
    case 'needs-review':  return { cls: 'needs-review', label: 'Review' };
    case 'not-started':
    default:              return { cls: 'not-started',  label: null };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WorldMap
 *
 * @param {{ onOpen: (id: string) => void, masteryMap?: Record<string, import('./engine/types.js').MasteryEstimate> | null }} props
 *
 * masteryMap is the live measurementReduce().mastery result injected by Shell.
 * When absent (undefined/null) the map behaves identically to the pre-U11 version.
 */
export default function WorldMap({ onOpen, masteryMap = null }) {
  // Derive suggestion from the engine (or null when no data).
  const suggestedRoomId = suggestedNextRoom(masteryMap);

  return (
    <div className="world">
      <div className="foxing" />

      <div className="world-head">
        <div className="tag">Babushka's Kitchen · Lesson Map</div>
        <h1>Babushka's Fractions</h1>
        <div className="sub">Every recipe leads to a lesson. Pick a room to begin.</div>
      </div>

      {/* connecting trails (under the nodes) */}
      <svg className="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
        {ROOMS.map((r) => {
          const mx = (CENTER.x + r.pos.x) / 2;
          const my = (CENTER.y + r.pos.y) / 2 - 28;
          const d = `M ${CENTER.x} ${CENTER.y} Q ${mx} ${my} ${r.pos.x} ${r.pos.y}`;
          return (
            <g key={r.id}>
              <path d={d} fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" opacity={r.built ? 0.8 : 0.42} />
              <path d={d} fill="none" stroke="var(--red)" strokeWidth="1.3" strokeDasharray="1 8" strokeLinecap="round" opacity={r.built ? 0.85 : 0.45} />
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
        <div className="kitchen-medallion"><Mom expr="idle" width={94} /></div>
        <div className="kitchen-name">{KITCHEN.title}</div>
        <div className="kitchen-sub">{KITCHEN.sub}</div>
        <div className="kitchen-cta">▸ Cook with Babushka</div>
      </button>

      {/* lesson nodes */}
      {ROOMS.map((r) => {
        // Per-room mastery status from the engine (or 'not-started' when no data).
        const status = masteryStatusFor(r.nodeId, masteryMap);
        const { cls: statusCls, label: statusLabel } = statusMeta(status);
        const isSuggested = r.id === suggestedRoomId;

        // Build CSS class list: base + soon (if not built) + mastery status + suggested.
        const classNames = [
          'wcard',
          !r.built && 'soon',
          statusCls !== 'not-started' && `wcard--${statusCls}`,
          isSuggested && 'wcard--suggested',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={r.id}
            className={classNames}
            style={{ left: r.pos.x, top: r.pos.y }}
            onClick={() => onOpen(r.id)}
            title={r.built ? `Open Lesson ${r.no}` : `Lesson ${r.no} (not built yet)`}
            data-mastery-status={status}
            data-suggested={isSuggested || undefined}
          >
            <div className="whead">
              <span className="wno">№{r.no}</span>
              {/* Show mastery badge when the engine has data; otherwise show the
                  existing ready/coming-soon tag. */}
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
      })}

      <div className="world-foot">Five lessons, in order — start at the kitchen, or pick any room.</div>
    </div>
  );
}
