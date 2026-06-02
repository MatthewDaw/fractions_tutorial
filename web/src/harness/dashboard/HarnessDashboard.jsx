// harness/dashboard/HarnessDashboard.jsx — the evaluator-facing demo route.
//
// Single-page master-detail: the persona gallery is a left rail, the failure heatmap
// is the visual hero, the recursive panel sits below it, and a click on a heatmap
// cell opens that cell's ranked verdict cards in a right-hand detail panel. Dev-only
// (mount it behind the same gate as MasteryInspector — see ./index.js). It runs a
// SMALL live sweep in-browser by default, or renders injected tapes (committed
// fixtures / tests) so it is always demonstrable without a live run.

import React, { useEffect, useMemo, useState } from 'react';
import './dashboard.css';
import FailureHeatmap from './FailureHeatmap.jsx';
import RecursivePanel from './RecursivePanel.jsx';
import VerdictCard from './VerdictCard.jsx';
import { allPersonas } from '../personas/library.js';
import { DEFAULT_TAU_LATENT } from '../oracle/latentTruth.js';
import { buildHeatmap, cardsForCell, runDemoSweep } from './data.js';

export default function HarnessDashboard({
  tapes: tapesProp = null,
  verdict = null,
  tauLatent = DEFAULT_TAU_LATENT,
  autoRun = true,
}) {
  // tapes: injected (tests / committed fixtures) OR produced by a live demo sweep.
  const [tapes, setTapes] = useState(tapesProp || null);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (tapesProp) { setTapes(tapesProp); return; }
    if (tapes || !autoRun) return;
    // Defer the (synchronous) sweep one tick so the empty/loading shell paints first.
    setRunning(true);
    const id = setTimeout(() => {
      setTapes(runDemoSweep({ seed: 1 }));
      setRunning(false);
    }, 0);
    return () => clearTimeout(id);
  }, [tapesProp, tapes, autoRun]);

  const heatmap = useMemo(() => (tapes ? buildHeatmap(tapes, { tauLatent }) : null), [tapes, tauLatent]);
  const gallery = useMemo(() => {
    if (!heatmap) return [];
    const metaById = new Map(allPersonas().map((p) => [p.id, p]));
    return heatmap.personas.map((id) => {
      const p = metaById.get(id);
      return { id, klass: p ? p.klass : '', meta: p ? p.meta : null };
    });
  }, [heatmap]);

  const cards = useMemo(() => {
    if (!tapes || !selected) return [];
    return cardsForCell(tapes, selected.persona_id, selected.skill, { tauLatent });
  }, [tapes, selected, tauLatent]);

  const storedTerminalKind = useMemo(() => {
    if (!tapes || !selected) return null;
    const t = tapes.find((x) => x.persona_id === selected.persona_id && x.skillId === selected.skill);
    return t && t.terminal ? t.terminal.kind : null;
  }, [tapes, selected]);

  // ----- empty / loading states -----
  if (!tapes) {
    return (
      <div className="hd-root hd-empty">
        <header className="hd-head"><h1>Synthetic-learner red-team</h1></header>
        <div className="hd-empty-body">
          {running
            ? <p className="hd-muted">Running a small in-browser sweep…</p>
            : (
              <>
                <p>No tapes loaded. Run a small in-browser sweep to populate the heatmap.</p>
                <button type="button" className="hd-btn" onClick={() => setTapes(runDemoSweep({ seed: 1 }))}>▶ Run demo sweep</button>
              </>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="hd-root">
      <header className="hd-head">
        <h1>Synthetic-learner red-team</h1>
        <span className="hd-sub">{heatmap.personas.length} personas × {heatmap.skills.length} skills · engine path · τ_latent {tauLatent}</span>
      </header>

      <div className="hd-grid">
        <aside className="hd-gallery" aria-label="Persona gallery">
          <h2>Personas</h2>
          <ul>
            {gallery.map((g) => (
              <li
                key={g.id}
                className={selected && selected.persona_id === g.id ? 'sel' : ''}
                title={g.meta ? `approximates: ${g.meta.approximates}\nmight miss: ${g.meta.mightMiss}` : g.id}
              >
                <span className="hd-gallery-id">{g.id}</span>
                <span className="hd-gallery-klass">{g.klass}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="hd-main">
          <FailureHeatmap heatmap={heatmap} selected={selected} onSelect={setSelected} />
          <RecursivePanel verdict={verdict} />
        </main>

        <aside className="hd-detail" aria-label="Verdict cards">
          <h2>Verdict cards</h2>
          {!selected && <p className="hd-muted">Click a heatmap cell to inspect its failures.</p>}
          {selected && cards.length === 0 && (
            <p className="hd-muted">{selected.persona_id} · {selected.skill}: no oracle-labeled failure.</p>
          )}
          {cards.map((c) => (
            <VerdictCard key={c.id} card={c} storedTerminalKind={storedTerminalKind} />
          ))}
        </aside>
      </div>
    </div>
  );
}
