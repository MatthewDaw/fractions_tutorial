// QuestionBand.jsx — the CANONICAL, prominent display of the question the child
// must answer. A dedicated FULL-WIDTH band that mounts directly UNDER the lesson's
// stage-selector tabs (the spot users are trained to look), on every stage. It is
// meant to be the single most readable thing on the page: a big bare equation on a
// paper chip with the house ink-border treatment.
//
// Purely presentational / controlled — it owns no state and reads only props.
//   lead   : string  — a small uppercase label above/beside the equation
//                      (e.g. "the question", "build this", "write as a mixed number")
//   expr   : node    — the bare equation BODY, any React node. Terms render big and
//                      bold; wrap operators in <span className="qb-op"> to tint them
//                      red, or just pass a string like "7 × 8" and the band will not
//                      auto-color inner operators (use `answer` for the red "?").
//   answer : node    — OPTIONAL. The right-hand side (the "?" or the result), shown
//                      in red after an "=". Omit it for a bare prompt with no "=".
//
// Consistent mount (lesson agents must use this shape):
//   <QuestionBand lead="the question" expr={<>7 &times; 8</>} answer="?" />
import React from "react";
import "../styles/questionband.css";

export default function QuestionBand({ lead, expr, answer }) {
  const hasAnswer = answer != null && answer !== "";
  // a flat, screen-reader-friendly label for the whole band
  const ariaLabel = ["question", lead].filter(Boolean).join(": ");
  return (
    <div className="question-band" role="group" aria-label={ariaLabel}>
      <div className="qb-chip">
        {lead && <span className="qb-lead">{lead}</span>}
        <span className="qb-expr">
          <span className="qb-terms">{expr}</span>
          {hasAnswer && (
            <>
              <span className="qb-op">=</span>
              <span className="qb-answer">{answer}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
