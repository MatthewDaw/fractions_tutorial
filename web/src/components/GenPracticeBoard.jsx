// GenPracticeBoard.jsx — the ONE practice surface every lesson reuses for its
// auto-generated, estimator-paced practice stage.
//
// It reads the current generated problem from the shared lesson controller
// (scaffold.prob), renders the right answer input for the skill's answer shape
// (fraction / mixed / integer / relation), grades the answer with the shared
// gradeAnswer, and drives the engine through the controller's own primitives:
//   correct → scaffold.award(...)  → engine re-rolls a fresh variation (more
//             practice), fades after a clean streak, or ends on mastery.
//   wrong   → scaffold.reportAttempt(correct:false) + flashBad (stay, retry).
//
// So a lesson adds estimator-driven generated practice by rendering exactly:
//   <GenPracticeBoard skill={SKILL} scaffold={scaffold} />
// for its generated stage — no per-lesson grading or loop glue.
import React, { useState, useEffect } from "react";
import Slate from "./Slate.jsx";
import { gradeAnswer, answerShape } from "../generators/grade.js";
import "../styles/gen-practice.css";

const OK_LINES = [
  "Yes — that's it! Here's another.",
  "Correct! Keep going.",
  "Right again — nice work.",
];

// A stable-per-problem encouraging line (no Math.random; varies by index).
function okLine(prob) {
  return OK_LINES[(prob?.index ?? 0) % OK_LINES.length];
}

export default function GenPracticeBoard({ skill, scaffold, title }) {
  const { prob, solved, badInput, status, award, reportAttempt, flashBad, setStatus } = scaffold;
  const shape = answerShape(skill);
  const [vals, setVals] = useState({});

  // Reset the inputs whenever a new variation arrives.
  useEffect(() => {
    setVals({});
  }, [prob?.skill, prob?.level, prob?.index, prob?.surfaceForm]);

  if (!prob) return null;
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  function submit(answer, answerValue) {
    const g = gradeAnswer(prob, answer);
    if (g.correct) {
      award(okLine(prob), null, answerValue, { stars: g.stars });
    } else {
      reportAttempt({ correct: false, answerValue, errorSignature: g.errorSignature, stars: g.stars });
      flashBad();
      setStatus({
        tone: "warn",
        text: g.errorSignature === "not_simplified"
          ? "Same amount — but not its smallest name yet. Reduce it once more."
          : "Not quite — take another look and try again.",
      });
    }
  }

  // ---- answer inputs by shape ----------------------------------------------
  function fractionInput() {
    return (
      <Slate
        slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
        values={vals}
        onChange={set}
        onSubmit={() => submit({ num: vals.n, den: vals.d }, [parseInt(vals.n, 10), parseInt(vals.d, 10)])}
        layout="fraction"
        disabled={solved}
        autoFocusKey="n"
        ariaLabel="write your answer as a fraction"
      />
    );
  }

  function mixedInput() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Slate
          slots={[{ key: "w", label: "wholes" }]}
          values={vals}
          onChange={set}
          layout="row"
          disabled={solved}
          autoFocusKey="w"
          ariaLabel="how many wholes"
        />
        <span style={{ fontStyle: "italic" }}>and</span>
        <Slate
          slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
          values={vals}
          onChange={set}
          onSubmit={() => submit({ whole: vals.w, num: vals.n, den: vals.d }, [parseInt(vals.n, 10), parseInt(vals.d, 10)])}
          layout="fraction"
          disabled={solved}
          ariaLabel="leftover fraction"
        />
      </div>
    );
  }

  function integerInput() {
    return (
      <Slate
        slots={[{ key: "v", label: "answer", multiDigit: true }]}
        values={vals}
        onChange={set}
        onSubmit={() => submit({ value: vals.v }, parseInt(vals.v, 10))}
        layout="row"
        disabled={solved}
        autoFocusKey="v"
        ariaLabel="type the product"
      />
    );
  }

  function relationInput() {
    const isBenchmark = !!prob.operands.benchmark;
    const opts = isBenchmark
      ? [["less", "less than ½"], ["equal", "equal to ½"], ["more", "more than ½"]]
      : [["<", "is less than"], [">", "is greater than"]];
    return (
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        {opts.map(([rel, label]) => (
          <button
            key={rel}
            type="button"
            className="check"
            disabled={solved}
            onClick={() => submit({ rel }, rel)}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  const input =
    shape === "mixed" ? mixedInput()
    : shape === "integer" ? integerInput()
    : shape === "relation" ? relationInput()
    : fractionInput();

  return (
    <div className={"gen-practice" + (badInput ? " bad" : "")}>
      <div className="gen-practice__q">
        <span className="gen-practice__prompt">{prob.prompt}</span>
      </div>
      <div className="gen-practice__answer">{input}</div>
      {shape !== "relation" && (
        <button
          type="button"
          className={"check" + (solved ? " done" : "")}
          disabled={solved}
          onClick={() => {
            if (shape === "mixed") submit({ whole: vals.w, num: vals.n, den: vals.d }, [parseInt(vals.n, 10), parseInt(vals.d, 10)]);
            else if (shape === "integer") submit({ value: vals.v }, parseInt(vals.v, 10));
            else submit({ num: vals.n, den: vals.d }, [parseInt(vals.n, 10), parseInt(vals.d, 10)]);
          }}
        >
          {solved ? "✓" : "Check"}
        </button>
      )}
      {status?.text && <div className={"ribbon ribbon--" + (status.tone || "normal")}>{status.text}</div>}
    </div>
  );
}
