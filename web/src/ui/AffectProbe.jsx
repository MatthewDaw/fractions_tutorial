// AffectProbe.jsx — Phase 3 (plan 005, S3): the consented self-report probe.
//
// At rare T3 boundaries (where the child has ALREADY paused), Babushka asks
// "tricky, or easy-peasy?" with two big tappable faces. The tap is the gold-
// standard self-report — the label every inferred signal is graded against.
//
// Design constraints honoured:
//   • Reader-safe: each face carries a TEXT label, not just an emoji (early readers
//     + the on-screen-caption decision). The emoji is aria-hidden decoration.
//   • In-fiction: the prompt is Babushka's voice, tagged for the app-wide tap-to-read
//     layer ([data-vox-speaker="Babushka"]); the face <button>s are controls that
//     TapToRead deliberately skips.
//   • The component is presentational: the PARENT decides when to show it (rare T3
//     pauses, governed by nudge-fatigue) and what to do with the report. It NEVER
//     touches the engine — a self-report is corroborated/recorded in
//     runtime/affect/selfReport.js, never anywhere near the mastery gate (firewall).
//
// Props:
//   open       {boolean}            — render only when true.
//   onReport   {(choice)=>void}     — called with 'easy' | 'tricky' on a face tap.
//   onDismiss  {()=>void}           — called when the child skips.
//   nickname   {string}             — in-fiction address (povaryonok/malysh/solnyshko).

import React from 'react';
import '../styles/affectprobe.css';

export default function AffectProbe({ open = false, onReport, onDismiss, nickname = 'solnyshko' }) {
  if (!open) return null;

  const report = (choice) => {
    if (typeof onReport === 'function') onReport(choice);
  };

  return (
    <div className="affect-probe" role="dialog" aria-label="How did that feel?" data-testid="affect-probe">
      <div className="affect-probe__card">
        <p className="affect-probe__prompt qcap" data-vox-speaker="Babushka">
          Ну что, {nickname} — was that tricky, or easy-peasy?
        </p>

        <div className="affect-probe__faces">
          <button
            type="button"
            className="affect-probe__face affect-probe__face--easy"
            onClick={() => report('easy')}
            aria-label="Easy-peasy"
          >
            <span className="affect-probe__emoji" aria-hidden="true">🙂</span>
            <span className="affect-probe__label">Easy-peasy</span>
          </button>

          <button
            type="button"
            className="affect-probe__face affect-probe__face--tricky"
            onClick={() => report('tricky')}
            aria-label="Tricky"
          >
            <span className="affect-probe__emoji" aria-hidden="true">😖</span>
            <span className="affect-probe__label">Tricky</span>
          </button>
        </div>

        <button
          type="button"
          className="affect-probe__skip"
          onClick={() => onDismiss && onDismiss()}
          aria-label="Skip — not now"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
