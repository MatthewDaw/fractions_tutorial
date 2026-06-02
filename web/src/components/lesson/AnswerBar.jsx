// AnswerBar — the ONE equation + Check card, replacing every lesson's bespoke
// WriteCard / inline answer zone (.m1-fz-answer, .r5-z-answer, .lu-ans, …).
//
// The lesson supplies only the equation row (`eq`) — its own fractions, operators,
// and Slate/input markup — plus the caption and Check state. The card frame, the
// Rosette-on-solve, and the Check button (with its done/ready styling) are here.
//
// Props:
//   eq            — node: the equation row (expr · = · input). Rendered in .lbar-eq.
//   cap           — node/string: the italic caption under the equation (optional).
//   solved        — show the Rosette + "done" Check styling.
//   ready         — pulse the Check button (the answer is committed, invite the tap).
//   stars         — Rosette count when solved.
//   onCheck       — Check button handler.
//   checkLabel    — Check button text (e.g. "Check", "Next stage ▸", "Finish ▸").
//   checkDisabled — disable the Check button.
import React from "react";
import Rosette from "../Rosette.jsx";

export default function AnswerBar({
  eq, cap,
  solved = false, ready = false, stars = 0,
  onCheck, checkLabel = "Check", checkDisabled = false,
  className = "",
}) {
  return (
    <div className={"lbar" + (className ? " " + className : "")}>
      <div className="lbar-eq">{eq}</div>
      {cap != null && <div className="lbar-cap">{cap}</div>}
      <div className="lbar-marks">
        {solved && <Rosette count={stars} />}
        <button
          className={"check" + (solved ? " done" : ready ? " ready" : "")}
          onClick={onCheck}
          disabled={checkDisabled}
        >
          {checkLabel}
        </button>
      </div>
    </div>
  );
}
