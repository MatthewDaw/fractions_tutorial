// MasteryBadge.jsx — the small status pill shown on lesson cards and shelves on
// the world map. Extracted from WorldMap's inline `.wtag` ternaries so the
// status → {class, label} mapping lives in ONE place.
//
// DATA/chrome only. Status semantics (derived from the engine mastery map) are
// computed by the caller via masteryStatusFor(); this component is pure display.
// Styling lives in world.css (.wtag + variants), so it renders identically
// wherever it is used.

/**
 * Map a mastery status to a CSS class suffix and a short label.
 * @param {'not-started'|'in-progress'|'mastered'|'needs-review'} status
 */
export function statusMeta(status) {
  switch (status) {
    case 'mastered':      return { cls: 'mastered',     label: 'Mastered' };
    case 'in-progress':   return { cls: 'in-progress',  label: 'In progress' };
    case 'needs-review':  return { cls: 'needs-review', label: 'Cook again' };
    case 'not-started':
    default:              return { cls: 'not-started',  label: null };
  }
}

/**
 * A status pill. Renders nothing for the "not-started" status with no built
 * fallback — callers that want a Ready/Coming-soon pill pass `variant`.
 *
 * @param {{ status?: string, variant?: 'ready'|'soon'|'suggested'|'mastered',
 *           label?: string, ariaLabel?: string }} props
 */
export default function MasteryBadge({ status, variant, label, ariaLabel }) {
  // Explicit variant (Ready / Coming soon / Next / Done) — used where the label
  // is fixed rather than derived from mastery status.
  if (variant) {
    return (
      <span className={`wtag ${variant}`} aria-label={ariaLabel}>
        {label}
      </span>
    );
  }
  const { cls, label: statusLabel } = statusMeta(status);
  if (!statusLabel) return null;
  return <span className={`wtag ${cls}`}>{statusLabel}</span>;
}
