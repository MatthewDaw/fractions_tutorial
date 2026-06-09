// OrientationProbe.jsx — UI3 (gap-build-260609): the orientation self-report probe.
//
// A sibling to AffectProbe. The state-model "Success Criteria" asks whether the
// child can state goal / next / why-changed; this measures it without ever blocking
// the learner. At OCCASIONAL boundaries (the PARENT governs cadence — same nudge-
// fatigue discipline AffectProbe relies on), Babushka asks one orientation question
// ("What are you working on right now?" / "Why did this change?") with 2–3 big
// tappable options. The tap is graded for COHERENCE in runtime/affect/orientationReport.js
// and logged as a Signal feeding the coherence counter-metric.
//
// Design constraints honoured (mirrors AffectProbe.jsx):
//   • OCCASIONAL, never per-turn: the parent decides when to set open — respecting
//     cognitive load + the no-choice-paralysis principle (2–3 options, one tap).
//   • Skippable + non-blocking: "Not now" dismisses; the probe NEVER hard-gates.
//   • Reader-safe: each option carries a TEXT label (early readers). Any emoji is
//     aria-hidden decoration.
//   • In-fiction: the prompt is Babushka's voice, tagged for the tap-to-read layer
//     ([data-vox-speaker="Babushka"]); the option <button>s are controls.
//   • Presentational + firewalled: it NEVER touches the engine/gate. The report is
//     graded in runtime/affect/orientationReport.js and recorded as advisory
//     instrumentation only.
//
// Props:
//   open       {boolean}                     — render only when true (parent-governed cadence).
//   prompt     {string}                      — the orientation question (in Babushka's voice).
//   options    {Array<{key,label,emoji?}>}   — 2–3 tap options. The expected key is the
//                                              right answer; the parent grades it.
//   onReport   {(key)=>void}                 — called with the tapped option key.
//   onDismiss  {()=>void}                    — called when the child skips.
//   nickname   {string}                      — in-fiction address.

import React from 'react';
import '../styles/orientationprobe.css';

const DEFAULT_PROMPT = 'What are you working on right now?';

export default function OrientationProbe({
  open = false,
  prompt = DEFAULT_PROMPT,
  options = [],
  onReport,
  onDismiss,
  nickname = 'solnyshko',
}) {
  if (!open) return null;

  // No-choice-paralysis guard: cap the surfaced options at three.
  const shown = options.slice(0, 3);

  const report = (key) => {
    if (typeof onReport === 'function') onReport(key);
  };

  return (
    <div
      className="orient-probe"
      role="dialog"
      aria-label="Quick check: what are you working on?"
      data-testid="orientation-probe"
    >
      <div className="orient-probe__card">
        <p className="orient-probe__prompt qcap" data-vox-speaker="Babushka">
          {nickname ? `${nickname}, ` : ''}{prompt}
        </p>

        <div className="orient-probe__options">
          {shown.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="orient-probe__option"
              onClick={() => report(opt.key)}
              aria-label={opt.label}
            >
              {opt.emoji ? (
                <span className="orient-probe__emoji" aria-hidden="true">
                  {opt.emoji}
                </span>
              ) : null}
              <span className="orient-probe__label">{opt.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="orient-probe__skip"
          onClick={() => onDismiss && onDismiss()}
          aria-label="Skip — not now"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
