// CardNode.jsx — the uniform lesson card used in the world-map submenu (one per
// lesson in an opened shelf). Extracted from WorldMap's inline LessonCard so the
// card chrome (number chip, status pill, title, concept, example) lives in ONE
// place and every shelf renders identical cards.
//
// DATA/chrome only — the card is a button; navigation is the caller's `onOpen`
// (WorldMap threads Shell's hash router through it). Mastery status is computed
// upstream via masteryStatusFor(); this component only displays it. The DOM
// contract (`.wcard`, `data-mastery-status`, `data-suggested`, `.wtag`) is
// preserved verbatim because the integration tests assert on it.
import MasteryBadge, { statusMeta } from "./MasteryBadge.jsx";

/**
 * @param {{
 *   r: import('../../rooms.js').Room,
 *   pos: { x:number, y:number },
 *   status: string,
 *   isSuggested?: boolean,
 *   onOpen: (id:string)=>void,
 * }} props
 */
export default function CardNode({ r, pos, status, isSuggested, onOpen }) {
  const { cls: statusCls } = statusMeta(status);
  const classNames = [
    'wcard',
    !r.built && 'soon',
    statusCls !== 'not-started' && `wcard--${statusCls}`,
    isSuggested && 'wcard--suggested',
  ].filter(Boolean).join(' ');

  // A card shows EITHER a derived mastery pill (Mastered / In progress / Cook
  // again) or, when there is no status yet, a Ready / Coming-soon pill.
  const masteryPill = <MasteryBadge status={status} />;

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
        {statusCls !== 'not-started'
          ? masteryPill
          : (
            <MasteryBadge
              variant={r.built ? 'ready' : 'soon'}
              label={r.built ? 'Ready' : 'Coming soon'}
            />
          )}
        {isSuggested && (
          <MasteryBadge variant="suggested" label="Next" ariaLabel="Suggested next lesson" />
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
