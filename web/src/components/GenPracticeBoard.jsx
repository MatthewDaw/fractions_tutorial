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
import React, { useState, useEffect, useRef } from "react";
import Slate from "./Slate.jsx";
import RailReadAloud from "./lesson/RailReadAloud.jsx";
import { gradeAnswer, answerShape } from "../generators/grade.js";
import { hintsFor } from "../generators/hints.js";
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

// U5: misconception-specific reteach copy, keyed on the engine ErrorSignature the
// grader now emits (U4). A diagnosed mistake gets a short corrective BEAT — why the
// move was wrong, in kitchen language — instead of a blank "try again". Shown once
// per problem; a repeat falls back to the gentle generic nudge.
const RETEACH = {
  add_denominators: {
    title: "Keep the bottom the same",
    body: "Same-size pieces stay the same size when you join them — keep the bottom number and add only the tops.",
    ribbon: "Careful — keep the bottom the same. Only the tops add up.",
  },
  add_across_unlike: {
    title: "These pieces are different sizes",
    body: "You can't add different-size pieces yet. Rename them to the same bottom first, then add only the tops.",
    ribbon: "Different sizes — give them the same bottom first.",
  },
  scaled_bottom_only: {
    title: "Grow the top too",
    body: "When the bottom grows, the top has to grow by the same amount — that keeps the fraction the same size.",
    ribbon: "If the bottom grew, the top has to grow the same way.",
  },
  forced_leftover: {
    title: "No leftover here",
    body: "This one makes whole cups exactly, with nothing left over — the leftover part is zero.",
    ribbon: "No leftover here — it makes whole cups exactly.",
  },
  not_simplified: {
    title: "Same amount, smaller name",
    body: "That's the right amount! Now divide the top and bottom by the same number to reach its smallest name.",
    ribbon: "Same amount — but not its smallest name yet. Reduce once more.",
  },
};

export default function GenPracticeBoard({ skill, scaffold, title, reteachAutoAdvanceMs = 6000 }) {
  const { prob, solved, badInput, status, award, reportAttempt, flashBad, setStatus, advance, say, speaking } = scaffold;
  const shape = answerShape(skill);
  const hints = hintsFor(skill);
  const [vals, setVals] = useState({});
  const [reteach, setReteach] = useState(null);
  // How many hint rungs the learner has revealed for THIS problem (0 = none).
  // Recorded as hint_max_rung on the attempt, so a hinted correct does not count
  // as hint-free toward the fade streak / independence gate.
  const [hintRung, setHintRung] = useState(0);
  // Which problem already showed a reteach beat (once-per-problem guard).
  const reteachKeyRef = useRef(null);

  // U5 interaction states: the reteach beat AUTO-ADVANCES after the clip plays
  // (no hard gate — the child is never trapped behind it) and a "Got it" tap
  // dismisses it early. We hold the auto-advance timer here so both the manual
  // skip and a fresh problem can cancel a pending dismissal.
  const reteachTimerRef = useRef(null);

  // Dismiss the reteach beat (auto-advance OR "Got it"). The learner stays on the
  // SAME problem to retry — dismissal clears the corrective card and the warn
  // ribbon, it does not advance/skip the problem (no hard gate, input stays live).
  const dismissReteach = () => {
    if (reteachTimerRef.current) {
      clearTimeout(reteachTimerRef.current);
      reteachTimerRef.current = null;
    }
    setReteach(null);
  };

  // Reset the inputs, reteach, and hint ladder whenever a new variation arrives.
  useEffect(() => {
    setVals({});
    setReteach(null);
    setHintRung(0);
    reteachKeyRef.current = null;
    if (reteachTimerRef.current) {
      clearTimeout(reteachTimerRef.current);
      reteachTimerRef.current = null;
    }
  }, [prob?.skill, prob?.level, prob?.index, prob?.surfaceForm]);

  // Clear any pending auto-advance timer on unmount.
  useEffect(() => () => {
    if (reteachTimerRef.current) clearTimeout(reteachTimerRef.current);
  }, []);

  if (!prob) return null;
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  function submit(answer, answerValue) {
    const g = gradeAnswer(prob, answer);
    if (g.correct) {
      // hintMaxRung carries the help the learner leaned on → the engine won't
      // count a hinted correct toward independence or the clean fade streak.
      award(okLine(prob), null, answerValue, { stars: g.stars, hintMaxRung: hintRung });
    } else {
      reportAttempt({ correct: false, answerValue, errorSignature: g.errorSignature, stars: g.stars });
      flashBad();
      // U5: a diagnosed misconception gets a targeted reteach beat ONCE per problem;
      // a repeat (or an undiagnosed slip) falls back to the gentle generic nudge.
      const probKey = `${prob.level}:${prob.index}:${prob.surfaceForm}`;
      const r = RETEACH[g.errorSignature];
      if (r && reteachKeyRef.current !== probKey) {
        reteachKeyRef.current = probKey;
        setReteach(r);
        setStatus({ tone: "warn", text: r.ribbon });
        // Auto-advance: the corrective beat clears itself after the clip so the
        // child is never hard-gated behind it (they can also tap "Got it" to skip
        // early). A non-positive duration disables the timer (test/opt-out).
        if (reteachTimerRef.current) clearTimeout(reteachTimerRef.current);
        if (reteachAutoAdvanceMs > 0) {
          reteachTimerRef.current = setTimeout(() => {
            reteachTimerRef.current = null;
            setReteach(null);
          }, reteachAutoAdvanceMs);
        }
      } else {
        setReteach(null);
        setStatus({ tone: "warn", text: "Not quite — take another look and try again." });
      }
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
      {/* Read-aloud pill — present on the practice step like every other step.
          It reads the CURRENT generated prompt on demand (a user-initiated press,
          the one always-allowed narration trigger). */}
      {say && <RailReadAloud say={() => say(prob.prompt)} speaking={speaking} />}
      <div className="gen-practice__q">
        <span className="gen-practice__prompt" data-novox="">{prob.prompt}</span>
      </div>
      <div className="gen-practice__answer">{input}</div>
      {/* When solved, the child SEES the success first; a "Next →" button then asks
          for the next problem (advance() re-rolls a fresh variation). No auto-skip.
          The relation shape has no Check button, so it gets its Next button here too. */}
      {solved ? (
        <button type="button" className="check done" onClick={() => advance()}>
          Next →
        </button>
      ) : shape !== "relation" ? (
        <button
          type="button"
          className="check"
          onClick={() => {
            if (shape === "mixed") submit({ whole: vals.w, num: vals.n, den: vals.d }, [parseInt(vals.n, 10), parseInt(vals.d, 10)]);
            else if (shape === "integer") submit({ value: vals.v }, parseInt(vals.v, 10));
            else submit({ num: vals.n, den: vals.d }, [parseInt(vals.n, 10), parseInt(vals.d, 10)]);
          }}
        >
          Check
        </button>
      ) : null}
      {/* Hint ladder — a real strategy hint (not the answer). Revealing one is
          recorded as hint usage, so a hinted correct doesn't count toward the
          independence gate or the clean fade streak. */}
      {hints.length > 0 && !solved && (
        <div className="gen-practice__hints">
          {hintRung < hints.length && (
            <button
              type="button"
              className="gen-practice__hint-btn"
              onClick={() => setHintRung((r) => Math.min(hints.length, r + 1))}
            >
              {hintRung === 0 ? "Need a hint?" : "Another hint?"}
            </button>
          )}
          {hintRung > 0 && (
            <ol className="gen-practice__hint-list">
              {hints.slice(0, hintRung).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          )}
        </div>
      )}
      {reteach && (
        <div className="gen-practice__reteach" data-vox={`${reteach.title}. ${reteach.body}`}>
          <div className="gen-practice__reteach-title">{reteach.title}</div>
          <div className="gen-practice__reteach-body">{reteach.body}</div>
          <button
            type="button"
            className="gen-practice__reteach-skip"
            onClick={dismissReteach}
          >
            Got it
          </button>
        </div>
      )}
      {status?.text && <div className={"ribbon ribbon--" + (status.tone || "normal")}>{status.text}</div>}
    </div>
  );
}
