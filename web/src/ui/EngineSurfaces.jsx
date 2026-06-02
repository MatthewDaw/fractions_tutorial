// EngineSurfaces.jsx — the always-mounted bridge between the engine store and
// the three learner/observer-facing model surfaces required by the brief:
//
//   • RationaleBanner   — "why did the interface change?" (No Choice Paralysis)
//   • Tier-2 nudge toast — gentle, work-preserving prompts (hint offer / take
//     your time / transfer-probe-queued) that never restructure the workspace
//   • MasteryInspector   — counter-metrics + per-node model evidence (anti
//     shallow-success). Dev/observer toggle.
//
// It subscribes to engineStore once (via useEngineStore) and is mounted a single
// time in Shell, so EVERY lesson — including the partial adopters — is covered
// without per-lesson wiring.
//
// `active` gates the learner-facing surfaces (banner + nudge) to in-lesson
// routes: on the title screen / world map there is no attempt in progress, so a
// stale rationale would be noise. The inspector is gated separately by `showInspector`.
import React, { useEffect } from 'react';
import RationaleBanner from './RationaleBanner.jsx';
import MasteryInspector from './MasteryInspector.jsx';
import { useEngineStore } from '../runtime/useEngineStore.js';
import { clearNudge } from '../runtime/engineStore.js';
import '../styles/engine-surfaces.css';

const NUDGE_TTL_MS = 5000;

function NudgeToast({ nudge }) {
  // Auto-dismiss after a few seconds (a nudge is transient, not a mode).
  useEffect(() => {
    if (!nudge) return undefined;
    const id = setTimeout(() => clearNudge(), NUDGE_TTL_MS);
    return () => clearTimeout(id);
  }, [nudge]);

  if (!nudge) return null;
  return (
    <div
      className={`engine-nudge engine-nudge--${nudge.type.toLowerCase()}`}
      role="status"
      aria-live="polite"
      data-testid="engine-nudge"
      data-nudge-type={nudge.type}
    >
      <span className="engine-nudge__text">{nudge.text}</span>
      <button
        className="engine-nudge__dismiss"
        onClick={() => clearNudge()}
        aria-label="Dismiss"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

// Only surface the banner when the interface actually CHANGED — the brief asks
// "why did the interface change?", not "narrate every problem." Routine
// PresentProblem ("continue at this level") would otherwise show after every
// answer and read as churn. The full rationale stream still lands in the
// inspector's decision log.
const CHANGE_KINDS = new Set([
  'FadeScaffold',
  'RaiseScaffold',
  'TransferProbe',
  'RouteToRoom',
  'ReturnToKitchen',
  'EscalateToHuman',
]);

/**
 * @param {object} props
 * @param {boolean} props.active         — in a lesson? (gates banner + nudge)
 * @param {boolean} props.showInspector  — render the inspector toggle?
 * @param {object|null} props.fallbackMasteryMap — map to show when no live one yet
 */
export default function EngineSurfaces({ active = false, showInspector = false, fallbackMasteryMap = null }) {
  const { decision, rationale, nudge, masteryMap, decisionLog, metrics } = useEngineStore();

  // Banner shows only for change-decisions; routine PresentProblem is silent.
  const bannerRationale = decision && CHANGE_KINDS.has(decision.kind) ? rationale : '';

  return (
    <>
      {active && <RationaleBanner rationale={bannerRationale} />}
      {active && <NudgeToast nudge={nudge} />}
      {showInspector && (
        <MasteryInspector
          masteryMap={masteryMap ?? fallbackMasteryMap}
          decisionLog={decisionLog}
          counterMetrics={{ uiChurn: metrics?.uiChurn ?? 0 }}
        />
      )}
    </>
  );
}
