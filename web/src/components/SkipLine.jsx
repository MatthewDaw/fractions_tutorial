// SkipLine.jsx — the m3 (Times Facts) number-line "ladle" for the Fade stage.
// A row of equal hops along a number line shows the skip-count sequence
// (8, 16, 24, … 56); a few INTERIOR terms are blanked and the child fills them
// from the rhythm of the count. This fades the concrete jar to the symbolic
// sequence one step before the bare fact.
//
// CONTROLLED COMPONENT: the room owns the sequence + which indices are blanked
// + the values typed so far; SkipLine just renders and reports fills up.
//
//   props:
//     sequence : number[]  — the full skip-count (e.g. [8,16,24,32,40,48,56])
//     blanks   : number[]  — indices into `sequence` the child must fill
//     values   : { [index]: string }  — committed fills (controlled)
//     onFill(index, value) — tap a number chip to fill a blank
//     ghost    : boolean   — dim (rarely used; the jar above is the ghost)
//
// Whole-number objects: a fixed neutral tone; correct/incorrect use ROLE_COLORS
// (handled by the parent via the `state` map it passes through className hints).
import React from "react";

export default function SkipLine({
  sequence = [],
  blanks = [],
  values = {},
  onFill = () => {},
  ghost = false,
}) {
  const blankSet = new Set(blanks);
  // Candidate chips the child can tap to fill a blank: the blanked values plus a
  // couple of near-miss distractors (so it isn't trivially "tap the only chip").
  const blankVals = blanks.map((i) => sequence[i]);
  const step = sequence.length > 1 ? sequence[1] - sequence[0] : 1;
  const distractors = [];
  for (const v of blankVals) {
    const d = v + step - 1; // an off-by-one drift distractor
    if (!blankVals.includes(d) && !distractors.includes(d) && d > 0) distractors.push(d);
  }
  const chips = Array.from(new Set([...blankVals, ...distractors])).sort((a, b) => a - b);

  // Which blank (the first not-yet-filled) the chips currently target.
  const activeBlank = blanks.find((i) => !(values[i] != null && values[i] !== ""));

  return (
    <div className={"m3-skipline" + (ghost ? " is-ghost" : "")}>
      <div className="m3-skipline-track" aria-label="skip-count number line">
        <div className="m3-skipline-rail" aria-hidden="true" />
        {sequence.map((val, i) => {
          const isBlank = blankSet.has(i);
          const filled = values[i] != null && values[i] !== "";
          const correct = filled && parseInt(values[i], 10) === val;
          return (
            <div key={i} className="m3-skipline-stop">
              <span className="m3-skipline-tick" aria-hidden="true" />
              <span
                className={
                  "m3-skipline-term" +
                  (isBlank ? " is-blank" : " is-given") +
                  (isBlank && filled ? (correct ? " is-correct" : " is-wrong") : "") +
                  (isBlank && i === activeBlank ? " is-active" : "")
                }
              >
                {isBlank ? (filled ? values[i] : "?") : val}
              </span>
            </div>
          );
        })}
      </div>

      {activeBlank != null && (
        <div className="m3-skipline-chips" role="group" aria-label="fill the missing number">
          <span className="m3-skipline-chips-lead">tap the missing number</span>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className="m3-skipline-chip"
              onClick={() => onFill(activeBlank, String(c))}
              disabled={ghost}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
