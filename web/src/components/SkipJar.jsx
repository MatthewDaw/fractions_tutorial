// SkipJar.jsx — the m3 (Times Facts) skip-counting manipulative. A jar fills one
// SCOOP at a time; every scoop is the SAME group size (e.g. 8). The teaching
// device is the VISIBLE RUNNING TALLY beside the jar: each scoop bumps the tally
// by the group size (8, 16, 24, …) so the child reads the product off the jar
// instead of recounting — the anti-drift guard against skip-count slips.
//
// CONTROLLED-ISH: the room owns groupSize/groups/filled and the onScoop callback;
// the jar owns the visual fill + the running tally derived from `filled`.
//
//   props:
//     groupSize : number   — pieces per scoop (the "size" factor, e.g. 8)
//     groups    : number   — how many scoops make a full jar (the "count", e.g. 7)
//     filled    : number   — how many scoops are currently in (0..groups)
//     onScoop() : ()=>void — fired when the child taps the scoop (add one handful)
//     ghost     : boolean  — dim the jar to a faint check (Fade stage)
//
// Whole-number food objects: a FIXED neutral kitchen tone for the pieces; no
// denomTone/denomColor (those color by denominator and have no meaning here).
import React from "react";

const FOOD_TONE = "#caa35a";    // neutral kitchen food tone (mushrooms/scoops)
const FOOD_EDGE = "#8a6a2e";

export default function SkipJar({
  groupSize = 1,
  groups = 1,
  filled = 0,
  onScoop = () => {},
  ghost = false,
}) {
  const clampedFilled = Math.max(0, Math.min(groups, filled));
  const tally = clampedFilled * groupSize;            // the visible running total
  const full = clampedFilled >= groups;
  const fillPct = groups > 0 ? (clampedFilled / groups) * 100 : 0;

  // The sequence of tally steps already poured, oldest → newest (8, 16, 24 …).
  const steps = Array.from({ length: clampedFilled }, (_, i) => (i + 1) * groupSize);

  return (
    <div className={"m3-jarwrap" + (ghost ? " is-ghost" : "")}>
      {/* the jar itself — fills bottom-up with the poured scoops */}
      <div className="m3-jar" aria-label={`jar holding ${tally}`}>
        <div className="m3-jar-neck" aria-hidden="true" />
        <div className="m3-jar-body">
          <div
            className="m3-jar-fill"
            style={{ height: fillPct + "%", background: FOOD_TONE, borderColor: FOOD_EDGE }}
            aria-hidden="true"
          />
          {/* the running tally, large, sits over the jar — the anti-drift readout */}
          <div className="m3-jar-tally">
            <span className="m3-jar-tally-n">{tally}</span>
            <span className="m3-jar-tally-cap">in the jar</span>
          </div>
        </div>
      </div>

      {/* the side scale: each poured scoop, its running total stamped on it */}
      <div className="m3-scale" aria-label="skip-count so far">
        {steps.length === 0 ? (
          <div className="m3-scale-empty">empty — start scooping</div>
        ) : (
          steps.map((s, i) => (
            <div key={i} className="m3-scale-step">
              <span className="m3-scale-step-add">+{groupSize}</span>
              <span className="m3-scale-step-tot">{s}</span>
            </div>
          ))
        )}
      </div>

      {/* the scoop bowl — tap to pour ONE handful of `groupSize` */}
      <div className="m3-scoopzone">
        <button
          type="button"
          className="m3-scoop"
          onClick={onScoop}
          disabled={full || ghost}
          title={full ? "the jar is full" : `scoop ${groupSize} more`}
          aria-label={`scoop ${groupSize} more into the jar`}
        >
          <span className="m3-scoop-bowl" style={{ background: FOOD_TONE, borderColor: FOOD_EDGE }} />
          <span className="m3-scoop-lab">scoop {groupSize}</span>
        </button>
        <div className="m3-scoop-count">
          {clampedFilled} / {groups} scoops
        </div>
      </div>
    </div>
  );
}
