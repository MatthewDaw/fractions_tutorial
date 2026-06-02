// ExpressionSlate.jsx — the WORD→MATH translation surface: two handwritten
// fractions joined by an operator, e.g.  [_/_]  +  [_/_].  It is the child's
// place to write what the QUESTION is in symbols, before (or alongside) writing
// the answer.
//
// Two uses across the arc (see lesson-stage-arc-expansion):
//   · Applied stage — a REQUIRED setup: transcribe the shown expression here, it's
//     checked, then the answer unlocks. (The room owns the gate via `disabled` +
//     its own grader; this component is just the controlled writing surface.)
//   · Words stage   — an OPTIONAL scratch: an always-present empty expression the
//     child MAY fill to turn the prose into math. Ungraded; never blocks the answer.
//
// CONTROLLED. The parent owns both fractions' digits and grades them:
//   props:
//     a, b     : { num, den } — the committed digits of each fraction (strings)
//     onChange(side, key, value)  — side ∈ {"a","b"}, key ∈ {"num","den"}
//     onSubmit()                  — Enter / commit gesture (optional)
//     denA, denB : number — fraction-bar hue per side (optional; falls back to ink)
//     op        : string  — the operator glyph between the two fractions (default "+")
//     disabled  : boolean
//     autoFocus : "a-num" | "a-den" | "b-num" | "b-den" — which cell pulses next
//     ariaLabel : string
//
// Reuses <Slate> (the same handwriting/recognizer pipeline) so there is no new
// input path — an ExpressionSlate is literally two fraction Slates side by side.
import React from "react";
import Slate from "./Slate.jsx";
import "../styles/slate.css";

export default function ExpressionSlate({
  a = { num: "", den: "" },
  b = { num: "", den: "" },
  onChange = () => {},
  onSubmit = () => {},
  denA,
  denB,
  op = "+",
  disabled = false,
  autoFocus,
  ariaLabel = "write the question in math symbols",
  className = "",
}) {
  const sideFor = (which) => (autoFocus && autoFocus.startsWith(which + "-") ? autoFocus.slice(2) : undefined);
  return (
    <div
      className={"expr-slate" + (disabled ? " is-disabled" : "") + (className ? " " + className : "")}
      role="group"
      aria-label={ariaLabel}
    >
      <Slate
        slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
        values={a}
        onChange={(k, v) => onChange("a", k, v)}
        onSubmit={onSubmit}
        layout="fraction"
        den={denA}
        disabled={disabled}
        autoFocusKey={sideFor("a")}
        ariaLabel="write the first fraction"
      />
      <span className="expr-op" aria-hidden="true">{op}</span>
      <Slate
        slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
        values={b}
        onChange={(k, v) => onChange("b", k, v)}
        onSubmit={onSubmit}
        layout="fraction"
        den={denB}
        disabled={disabled}
        autoFocusKey={sideFor("b")}
        ariaLabel="write the second fraction"
      />
    </div>
  );
}
