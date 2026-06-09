// SelfReportProbes.jsx — UI8+UI9 (gap-build-260609): the shared cadence shell that
// finally MOUNTS the two orphaned self-report probes (OrientationProbe + AffectProbe).
//
// THE GAP THIS CLOSES:
//   OrientationProbe.jsx, AffectProbe.jsx, orientationReport.js, selfReport.js and
//   engineStore.recordCoherence all existed but were never mounted / never called.
//   This component is the missing wiring. It is mounted ONCE inside EngineSurfaces
//   (which is itself mounted once in Shell, above every lesson), so a single
//   occasional cadence serves every room without per-lesson wiring.
//
// HOW THE CADENCE WORKS (see runtime/affect/selfReportCadence.js for the policy):
//   • A "problem boundary" = one judged engine decision. engineStore appends to
//     decisionLog exactly once per judged boundary (publishDecision with a
//     decision). We watch decisionLog.length as the boundary counter — so an
//     opportunity can ONLY arise at a boundary, NEVER mid-attempt.
//   • At each new boundary we ask decideProbe(...): at most once every N=5
//     boundaries, never two in a row, one probe per opportunity, alternating
//     orientation ↔ affect. The probe that shows is then live until the child
//     answers OR skips; either way consumeOpportunity advances the cadence.
//
// FIREWALL / ADVISORY (R12 taste + the affect firewall):
//   • Both probes are occasional, skippable, non-blocking — a child is NEVER made
//     to reorient every turn. They render as overlays the child can dismiss.
//   • Orientation taps feed recordCoherence (the coherence counter-metric) only.
//   • Affect taps are graded through selfReport.js into a gold-standard Signal —
//     advisory instrumentation, NEVER the mastery gate.

import React, { useEffect, useRef, useState } from 'react';
import OrientationProbe from './OrientationProbe.jsx';
import AffectProbe from './AffectProbe.jsx';
import { useEngineStore } from '../runtime/useEngineStore.js';
import { recordCoherence } from '../runtime/engineStore.js';
import { evaluateOrientationReport } from '../runtime/affect/orientationReport.js';
import { evaluateSelfReport } from '../runtime/affect/selfReport.js';
import { orientationFromDecision } from '../runtime/affect/orientationFromDecision.js';
import {
  makeCadenceState,
  decideProbe,
  consumeOpportunity,
  SELF_REPORT_CADENCE,
} from '../runtime/affect/selfReportCadence.js';

/**
 * @param {object} props
 * @param {boolean} props.active — gate to in-lesson routes (no probes on title/map).
 * @param {number} [props.everyN] — override the cadence gap (tests).
 * @param {(report:object)=>void} [props.onAffectReport] — advisory sink for the
 *        graded affect Signal (tests/instrumentation). Optional; never gates.
 */
export default function SelfReportProbes({
  active = false,
  everyN = SELF_REPORT_CADENCE.everyN,
  onAffectReport,
}) {
  const { decision, uiMetrics } = useEngineStore();
  // NIT-1 fix: use the MONOTONE problemsJudged tally, not decisionLog.length.
  // decisionLog is capped at 50 (.slice(-50)), so its length pins at 50 and would
  // silently halt all probes after ~50 problems in a long session. problemsJudged
  // (UI2) increments once per judged boundary and is never capped.
  const boundaryCount = uiMetrics ? uiMetrics.problemsJudged : 0;

  // Cadence state + the last boundary we evaluated, kept in refs so the boundary
  // effect runs its decision exactly once per new boundary (not on every render).
  const cadenceRef = useRef(makeCadenceState());
  const lastBoundaryRef = useRef(0);

  // The probe currently surfaced ('orientation' | 'affect' | null) and the frozen
  // orientation inputs captured at the moment it opened (so a later decision can't
  // change the question/answer mid-prompt).
  const [openKind, setOpenKind] = useState(null);
  const [orientInputs, setOrientInputs] = useState(null);

  useEffect(() => {
    // Boundary-only: only react when the judged-boundary counter actually advanced.
    if (boundaryCount === lastBoundaryRef.current) return;
    lastBoundaryRef.current = boundaryCount;

    // Don't surface anything outside a lesson, or while a probe is already open
    // (one probe per opportunity — never stack two).
    if (!active || openKind) return;

    const { show, kind } = decideProbe(cadenceRef.current, boundaryCount, everyN);
    if (!show) return;

    if (kind === 'orientation') {
      // Freeze the expected goal/why from the CURRENT engine decision.
      setOrientInputs(orientationFromDecision(decision));
    }
    setOpenKind(kind);
    cadenceRef.current = consumeOpportunity(cadenceRef.current, boundaryCount);
  }, [boundaryCount, active, openKind, everyN, decision]);

  if (!active || !openKind) return null;

  if (openKind === 'orientation' && orientInputs) {
    const { prompt, options, expectedKey } = orientInputs;
    return (
      <OrientationProbe
        open
        prompt={prompt}
        options={options}
        onReport={(key) => {
          // Wire the dead sink: grade the tap against the engine's expected
          // orientation and move the coherence counter-metric (advisory only).
          const graded = evaluateOrientationReport(key, expectedKey);
          recordCoherence(graded.coherent);
          setOpenKind(null);
          setOrientInputs(null);
        }}
        onDismiss={() => {
          // Skippable + non-blocking: a skip records nothing (never a coherence
          // failure) but still closes the opportunity.
          setOpenKind(null);
          setOrientInputs(null);
        }}
      />
    );
  }

  if (openKind === 'affect') {
    return (
      <AffectProbe
        open
        onReport={(choice) => {
          // Reuse selfReport.js plumbing: grade the tap into a gold-standard
          // Signal. Advisory only — corroboration/Signal NEVER touches the gate.
          const graded = evaluateSelfReport(choice, []);
          if (typeof onAffectReport === 'function') onAffectReport(graded);
          setOpenKind(null);
        }}
        onDismiss={() => setOpenKind(null)}
      />
    );
  }

  return null;
}
