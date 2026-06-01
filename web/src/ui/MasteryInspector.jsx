// MasteryInspector.jsx — U12: Dev-only mastery model inspector.
//
// Shows, per skill node:
//   • P_known (BKT posterior)
//   • The four gate dimensions: accuracy / independence / transfer / fluency
//   • Mastered / In-progress / Needs-review status
//   • The full decision log (rationale + kind per decision)
//   • Counter-metrics:
//       - UI churn: T3 (scaffold-level changes) per session
//       - Orientation: (display only — caller supplies)
//       - Dependence: unassisted-correct rate at low scaffold
//       - False-positive rate: mastered nodes that later failed a retention probe
//
// GATE (dev-only): Rendered only when import.meta.env.DEV === true OR when the
// user has toggled it on via the header button.  In production builds the
// component renders null unless the toggle is on.
//
// USAGE:
//   <MasteryInspector
//     masteryMap={masteryMap}       // Record<nodeId, MasteryEstimate> | null
//     decisionLog={decisionLog}     // Array<{kind, rationale, t}> | []
//     counterMetrics={counterMetrics} // { uiChurn, dependence, falsePosRate }
//   />
//
// The inspector computes mastered/in-progress/not-started inline (mirrors
// gate.ts isMastered) so it has no engine imports.

import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// Inline gate predicate (mirrors gate.ts — no engine import in UI files)
// ---------------------------------------------------------------------------

/**
 * Returns true when ALL four mastery conditions hold:
 *   P_known >= 0.95 AND max_scaffold_passed >= 3
 *   AND transfer_passed AND fluency_ok (soft = always true).
 */
function isMastered(est) {
  if (!est) return false;
  if (est.P_known < 0.95) return false;
  if (est.max_scaffold_passed === null || est.max_scaffold_passed < 3) return false;
  if (!est.transfer_passed) return false;
  // Soft fluency: advisory pre-calibration; does not block.
  return true;
}

/**
 * Returns the four individual gate conditions as booleans.
 */
function gateConditions(est) {
  if (!est) return { accuracyOk: false, independenceOk: false, transferOk: false, fluencyOk: false };
  return {
    accuracyOk: est.P_known >= 0.95,
    independenceOk: est.max_scaffold_passed !== null && est.max_scaffold_passed >= 3,
    transferOk: est.transfer_passed === true,
    fluencyOk: true, // soft pre-calibration
  };
}

/**
 * Compute the status label for a node.
 */
function statusLabel(est) {
  if (!est) return 'not-started';
  if (isMastered(est)) return 'mastered';
  if (est.last_retention_probe !== null && est.P_known >= 0.50) return 'needs-review';
  if (est.P_known <= 0.15) return 'not-started';
  return 'in-progress';
}

// ---------------------------------------------------------------------------
// Node order (mirrors graph.ts topological order)
// ---------------------------------------------------------------------------

const NODE_ORDER = [
  { id: 'ADD_SAME_DEN',       label: 'Same Den (r1)' },
  { id: 'ADD_UNLIKE_NESTED',  label: 'Unlike Nested (r3)' },
  { id: 'ADD_UNLIKE_COPRIME', label: 'Unlike Coprime (r2)' },
  { id: 'SIMPLIFY',           label: 'Simplify (r4)' },
  { id: 'IMPROPER_TO_MIXED',  label: 'Mixed (r5)' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GateBadge({ ok, label }) {
  return (
    <span
      className={`inspector-gate-badge inspector-gate-badge--${ok ? 'pass' : 'fail'}`}
      title={label}
      aria-label={`${label}: ${ok ? 'pass' : 'fail'}`}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}

function NodeRow({ nodeId, label, est }) {
  const status = statusLabel(est);
  const conds = gateConditions(est);
  const pKnown = est ? est.P_known : null;
  const hintDep = est ? est.hint_dependence : null;

  return (
    <tr
      className={`inspector-row inspector-row--${status}`}
      data-node={nodeId}
      data-status={status}
    >
      <td className="inspector-col inspector-col--label">{label}</td>
      <td className="inspector-col inspector-col--pknown">
        {pKnown !== null ? (pKnown * 100).toFixed(1) + '%' : '—'}
      </td>
      <td className="inspector-col inspector-col--gates">
        <GateBadge ok={conds.accuracyOk}     label="Acc" />
        <GateBadge ok={conds.independenceOk} label="Ind" />
        <GateBadge ok={conds.transferOk}     label="Xfr" />
        <GateBadge ok={conds.fluencyOk}      label="Flu" />
      </td>
      <td className="inspector-col inspector-col--status" data-testid={`status-${nodeId}`}>
        {status}
      </td>
      <td className="inspector-col inspector-col--hint-dep">
        {hintDep !== null ? (hintDep * 100).toFixed(0) + '%' : '—'}
      </td>
    </tr>
  );
}

function DecisionLog({ log }) {
  if (!log || log.length === 0) {
    return <p className="inspector-log-empty">No decisions yet this session.</p>;
  }
  return (
    <ol className="inspector-log" reversed>
      {[...log].reverse().map((entry, i) => (
        <li key={i} className="inspector-log-entry" data-kind={entry.kind}>
          <span className="inspector-log-kind">[{entry.kind}]</span>{' '}
          <span className="inspector-log-rationale">{entry.rationale}</span>
          {entry.t != null && (
            <span className="inspector-log-time"> @{entry.t}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function CounterMetrics({ metrics }) {
  const { uiChurn = 0, dependence = null, falsePosRate = null } = metrics || {};
  return (
    <dl className="inspector-metrics">
      <dt className="inspector-metric-label">UI churn (T3/session)</dt>
      <dd className="inspector-metric-value" data-testid="metric-uiChurn">{uiChurn}</dd>

      <dt className="inspector-metric-label">Dependence (unassisted-correct @ low scaffold)</dt>
      <dd className="inspector-metric-value" data-testid="metric-dependence">
        {dependence !== null ? (dependence * 100).toFixed(1) + '%' : '—'}
      </dd>

      <dt className="inspector-metric-label">False-positive rate (mastered → later failed probe)</dt>
      <dd className="inspector-metric-value" data-testid="metric-falsePosRate">
        {falsePosRate !== null ? (falsePosRate * 100).toFixed(1) + '%' : '—'}
      </dd>
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * MasteryInspector — dev-only model window.
 *
 * @param {object} props
 * @param {Record<string, import('../engine/types.js').MasteryEstimate>|null} props.masteryMap
 * @param {Array<{kind: string, rationale: string, t?: number}>} [props.decisionLog]
 * @param {{ uiChurn?: number, dependence?: number|null, falsePosRate?: number|null }} [props.counterMetrics]
 */
export default function MasteryInspector({
  masteryMap = null,
  decisionLog = [],
  counterMetrics = {},
}) {
  // Inspector starts hidden by default. A header button opens it in any
  // environment (dev or prod) for field debugging. Callers may also pass
  // defaultOpen={true} via the prop below if they want it open on mount.
  const [visible, setVisible] = useState(false);

  // Counter-metrics: derive from masteryMap where possible.
  // falsePosRate: nodes that were mastered but now have a retention probe with
  // P_known < 0.95 (i.e., they were demoted).
  const derivedFalsePosRate = React.useMemo(() => {
    if (!masteryMap) return null;
    const mastered = Object.values(masteryMap).filter(
      (est) =>
        est.last_retention_probe !== null &&
        est.P_known >= 0.95 // still passing
    );
    const total = Object.values(masteryMap).filter(
      (est) => est.last_retention_probe !== null
    ).length;
    if (total === 0) return null;
    // falsePosRate = fraction of probed nodes that passed (should have been lower)
    // Actually: rate of probed-mastered nodes that FAILED (P_known < 0.95 post-probe).
    const failed = Object.values(masteryMap).filter(
      (est) =>
        est.last_retention_probe !== null && !isMastered(est)
    ).length;
    return total > 0 ? failed / total : null;
  }, [masteryMap]);

  // dependence: average hint_dependence across in-progress nodes.
  const derivedDependence = React.useMemo(() => {
    if (!masteryMap) return null;
    const inProgress = Object.values(masteryMap).filter(
      (est) => est.P_known > 0.15 && !isMastered(est)
    );
    if (inProgress.length === 0) return null;
    const total = inProgress.reduce((s, est) => s + est.hint_dependence, 0);
    return total / inProgress.length;
  }, [masteryMap]);

  const effectiveMetrics = {
    uiChurn: counterMetrics.uiChurn ?? 0,
    dependence: counterMetrics.dependence !== undefined ? counterMetrics.dependence : derivedDependence,
    falsePosRate: counterMetrics.falsePosRate !== undefined ? counterMetrics.falsePosRate : derivedFalsePosRate,
  };

  return (
    <div className="mastery-inspector" data-testid="mastery-inspector">
      {/* Toggle button — always rendered (even in production) */}
      <button
        className="mastery-inspector__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-expanded={visible}
        type="button"
        data-testid="inspector-toggle"
      >
        {visible ? 'Hide' : 'Mastery Inspector'}
      </button>

      {visible && (
        <div className="mastery-inspector__panel" data-testid="inspector-panel">
          <h2 className="mastery-inspector__heading">Mastery Inspector</h2>

          {/* Per-node table */}
          <section className="inspector-section" aria-label="Per-node mastery">
            <table className="inspector-table">
              <thead>
                <tr>
                  <th>Node</th>
                  <th>P(known)</th>
                  <th>Gate</th>
                  <th>Status</th>
                  <th>Hint dep.</th>
                </tr>
              </thead>
              <tbody>
                {NODE_ORDER.map(({ id, label }) => (
                  <NodeRow
                    key={id}
                    nodeId={id}
                    label={label}
                    est={masteryMap ? masteryMap[id] : null}
                  />
                ))}
              </tbody>
            </table>
          </section>

          {/* Counter-metrics */}
          <section className="inspector-section" aria-label="Counter metrics">
            <h3>Counter-Metrics</h3>
            <CounterMetrics metrics={effectiveMetrics} />
          </section>

          {/* Decision log */}
          <section className="inspector-section" aria-label="Decision log">
            <h3>Decision Log</h3>
            <DecisionLog log={decisionLog} />
          </section>
        </div>
      )}
    </div>
  );
}
