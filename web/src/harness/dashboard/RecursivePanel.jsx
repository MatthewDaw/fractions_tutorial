// harness/dashboard/RecursivePanel.jsx — baseline → tuned, with the held-out guard.
//
// Shows the headline metric paired with its counter, the sealed held-out ✓/✗ guard
// (the optimizer never saw those personas), and the REAL / GAMING / NO_CHANGE
// verdict. With no tuned run it greys the "tuned" column with a call to action —
// the demo is honest about an un-run loop.

import React from 'react';

function fmt(x) {
  if (x === null || x === undefined) return '—';
  return typeof x === 'number' ? (Math.round(x * 1000) / 1000).toString() : String(x);
}

const VERDICT_TOOLTIP = {
  REAL: 'REAL = improved on learners the optimizer never saw (sealed held-out).',
  GAMING: 'GAMING = improved only on training personas, or degraded the guardrail.',
  NO_CHANGE: 'NO_CHANGE = neither family moved (e.g. plan-002 flags are inert today).',
};

export default function RecursivePanel({ verdict }) {
  if (!verdict) {
    return (
      <section className="hd-recursive hd-recursive-empty">
        <h2>Recursive improvement loop</h2>
        <p className="hd-muted">Run the improvement loop (or flip the 002 flags) to populate the baseline → tuned comparison.</p>
      </section>
    );
  }

  const { verdict: v, trainDelta, heldOutDelta, guardrail, regressions } = verdict;
  const heldOutImproved = heldOutDelta && heldOutDelta.netImprovement > 1e-9;
  const tunedKnown = v !== 'NO_CHANGE';

  return (
    <section className="hd-recursive">
      <h2>Recursive improvement loop</h2>

      <div className="hd-verdict-row">
        <span className={`hd-verdict hd-verdict-${v}`} title={VERDICT_TOOLTIP[v]}>{v}</span>
        <span className="hd-guard">
          Held-out (unseen personas):{' '}
          <strong className={heldOutImproved ? 'ok' : 'no'}>
            {heldOutImproved ? '✓ improved' : '✗ did not improve'}
          </strong>
        </span>
        <span className="hd-guard">
          Guardrail (novel-form transfer):{' '}
          <strong className={guardrail && guardrail.degraded ? 'no' : 'ok'}>
            {guardrail && guardrail.degraded ? '✗ degraded' : '✓ intact'}
          </strong>
        </span>
      </div>

      <table className="hd-deltas">
        <thead>
          <tr><th>family</th><th>false_mastery (before → after)</th><th>transfer_after_fade (before → after)</th><th>net</th></tr>
        </thead>
        <tbody>
          <Row label="TRAIN (seen)" delta={trainDelta} tuned />
          <Row label="HELD-OUT (sealed)" delta={heldOutDelta} tuned={tunedKnown} />
        </tbody>
      </table>

      <div className="hd-regressions">
        {regressions && regressions.length > 0
          ? <span className="no">⚠ regressed personas: {regressions.join(', ')}</span>
          : <span className="ok">no previously-passing persona regressed</span>}
      </div>
      <p className="hd-muted hd-scope">Scope: engine path only — a REAL verdict certifies the adaptive engine, not the live scripted runtime.</p>
    </section>
  );
}

function Row({ label, delta, tuned }) {
  if (!delta) return null;
  const fm = delta.false_mastery_rate;
  const tx = delta.transfer_after_fade;
  return (
    <tr className={tuned ? '' : 'hd-untuned'}>
      <th scope="row">{label}</th>
      <td>{fmt(fm.before)} → {tuned ? fmt(fm.after) : <span className="hd-muted">(run loop)</span>}</td>
      <td>{fmt(tx.before)} → {tuned ? fmt(tx.after) : <span className="hd-muted">(run loop)</span>}</td>
      <td>{tuned ? fmt(delta.netImprovement) : '—'}</td>
    </tr>
  );
}
