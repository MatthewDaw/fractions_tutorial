// harness/dashboard/VerdictCard.jsx — one replayable failure.
//
// Shows the plain-language claim, the persona's latent truth vs the engine's gate,
// the replay key, and a "Replay" button that re-runs THAT EXACT session in-browser
// and steps through the decision sequence. On a terminal mismatch vs the stored
// tape it shows the replay-divergence banner (the stored tape stays authoritative).

import React, { useState } from 'react';
import { replaySession } from './data.js';

function fmt(x) {
  if (x === null || x === undefined) return '—';
  return typeof x === 'number' ? (Math.round(x * 1000) / 1000).toString() : String(x);
}

export default function VerdictCard({ card, storedTerminalKind = null }) {
  const [replay, setReplay] = useState(null); // { steps, terminal, diverged }
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);

  function doReplay() {
    const r = replaySession({
      persona_id: card.persona_id,
      skill: card.skill,
      seed: card.replaySeed,
      storedTerminalKind,
    });
    setReplay(r);
    setCursor(0);
    setPlaying(false);
  }

  // 1fps step animation while "playing".
  React.useEffect(() => {
    if (!playing || !replay) return undefined;
    if (cursor >= replay.steps.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const id = setTimeout(() => setCursor((c) => Math.min(c + 1, replay.steps.length - 1)), 1000);
    return () => clearTimeout(id);
  }, [playing, cursor, replay]);

  const step = replay && replay.steps[cursor];

  return (
    <div className="hd-card" data-metric={card.metricFired}>
      <div className="hd-card-head">
        <span className={`hd-pill hd-pill-${card.metricFired}`}>{card.metricLabel}</span>
        <span className="hd-card-title">
          {card.persona_id} · {card.skill}
        </span>
        <span className="hd-card-rank" title="harm × plausibility × novelty">
          rank {fmt(card.rank)}
        </span>
      </div>

      <p className="hd-claim">{card.claim}</p>

      <dl className="hd-kv">
        <div><dt>latent truth</dt><dd>start {fmt(card.latentTruth.start)} → final {fmt(card.latentTruth.final)} (τ={card.latentTruth.tauLatent})</dd></div>
        <div><dt>replay</dt><dd>seed {card.replaySeed} · step {card.evidenceStep}</dd></div>
        <div><dt>scope</dt><dd>engine path only</dd></div>
      </dl>

      <button type="button" className="hd-btn" onClick={doReplay}>
        ▶ Replay this session
      </button>

      {replay && (
        <div className="hd-replay">
          {replay.diverged && (
            <div className="hd-banner hd-banner-warn">
              Replay diverged — the engine changed since this tape. The stored tape is authoritative.
            </div>
          )}
          <div className="hd-replay-controls">
            <button type="button" className="hd-btn-sm" onClick={() => setCursor((c) => Math.max(0, c - 1))}>‹ Prev</button>
            <button type="button" className="hd-btn-sm" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
            <button type="button" className="hd-btn-sm" onClick={() => setCursor((c) => Math.min(replay.steps.length - 1, c + 1))}>Next ›</button>
            <span className="hd-step-count">step {cursor + 1}/{replay.steps.length}</span>
          </div>
          {step && (
            <div className="hd-step">
              <span className="hd-step-dec">{step.decision ? step.decision.kind : '—'}</span>
              <span className={`hd-step-gate ${step.gate ? 'on' : ''}`}>gate {step.gate ? 'OPEN' : 'closed'}</span>
              <span className="hd-step-bars">
                <span className="hd-bar hd-bar-latent" style={{ width: `${Math.round((step.latent ?? 0) * 100)}%` }} title={`latent ${fmt(step.latent)}`} />
                <span className="hd-bar hd-bar-pknown" style={{ width: `${Math.round((step.pknown ?? 0) * 100)}%` }} title={`P_known ${fmt(step.pknown)}`} />
              </span>
            </div>
          )}
          <div className="hd-replay-term">terminal: {replay.terminal ? replay.terminal.kind : '—'}</div>
        </div>
      )}
    </div>
  );
}
