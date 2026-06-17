// MixedReview.jsx — U8: interleaved "mixed review" across the recipes the learner
// has already met. Standalone (reuses generateFor + gradeAnswer directly), so it
// does not touch the per-lesson practice controller.
//
// The pedagogy: blocked practice lets a child bypass the hardest real step —
// deciding WHICH method a problem needs. Interleaving forces that discrimination,
// so each trial first asks "which recipe is this?" (the type-identification step)
// before the workspace appears. Types rotate trial-to-trial, and only recipes the
// learner has been INTRODUCED to enter the mix (interleaving never precedes
// schema formation). Taylor & Rohrer: interleaved practice ~doubles delayed-test
// performance vs blocked.
import React, { useState, useMemo, useCallback } from "react";
import Slate from "./components/Slate.jsx";
import PrimaryButton from "./components/scene/PrimaryButton.jsx";
import { generateFor } from "./generators/index.js";
import { gradeAnswer, answerShape } from "./generators/grade.js";
import { ROOMS } from "./rooms.js";
import { LESSONS } from "./lessons/index.js";
import "./styles/mixreview.css";

// Identity + copy from the shared registry (data only; the interleave loop,
// grading and Slate logic stay in this component per the "data vs logic" rule).
const L = LESSONS.review;
const MSG = L.messages;

// Short, kid-facing label per engine skill, from the room titles.
const LABEL = {};
for (const r of ROOMS) LABEL[r.nodeId] = r.title;

export default function MixedReview({ skills = [], onExit }) {
  const eligible = useMemo(() => skills.filter((s) => LABEL[s]), [skills]);
  const [trial, setTrial] = useState(0);
  const [phase, setPhase] = useState("identify"); // "identify" → "solve"
  const [vals, setVals] = useState({});
  const [status, setStatus] = useState({ tone: "normal", text: "" });
  const [done, setDone] = useState(0);

  const ready = eligible.length >= 2;
  const skill = ready ? eligible[trial % eligible.length] : null;
  const problem = useMemo(
    () => (skill ? generateFor(skill, { level: 2, index: trial }) : null),
    [skill, trial]
  );
  const shape = skill ? answerShape(skill) : "fraction";

  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  const nextTrial = useCallback(() => {
    setVals({});
    setPhase("identify");
    setStatus({ tone: "normal", text: "" });
    setTrial((t) => t + 1);
  }, []);

  function pickType(picked) {
    if (picked === skill) {
      setPhase("solve");
      setStatus({ tone: "ok", text: MSG.bridge });
    } else {
      setStatus({ tone: "warn", text: MSG.wrong });
    }
  }

  function submit(answer) {
    const g = gradeAnswer(problem, answer);
    if (g.correct) {
      setDone((d) => d + 1);
      setStatus({ tone: "ok", text: MSG.solved });
      setTimeout(nextTrial, 650);
    } else {
      setStatus({ tone: "warn", text: MSG.miss });
    }
  }

  // Empty / one-skill state: interleaving needs ≥2 introduced recipes.
  if (!ready) {
    return (
      <div className="mixreview mixreview--empty">
        <h2 className="mixreview__title">{L.empty.title}</h2>
        <p className="mixreview__sub">{L.empty.sub}</p>
        <PrimaryButton className="mixreview__exit" arrow={null} onClick={onExit}>{L.empty.back}</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="mixreview">
      <button className="mixreview__back" onClick={onExit}>←</button>
      <h2 className="mixreview__title">{L.title}</h2>
      <p className="mixreview__sub">{L.sub(done)}</p>

      <div className="mixreview__prompt">{problem.prompt}</div>

      {phase === "identify" ? (
        <div className="mixreview__identify">
          <p className="mixreview__q">{L.question}</p>
          <div className="mixreview__choices">
            {eligible.map((s) => (
              <button key={s} type="button" className="mixreview__choice" onClick={() => pickType(s)}>
                {LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mixreview__solve">{renderInput(problem, shape, vals, set, submit)}</div>
      )}

      {status.text && <div className={"ribbon ribbon--" + (status.tone || "normal")}>{status.text}</div>}
    </div>
  );
}

function renderInput(problem, shape, vals, set, submit) {
  if (shape === "integer") {
    return (
      <Slate slots={[{ key: "v", label: "answer", multiDigit: true }]} values={vals} onChange={set}
        onSubmit={() => submit({ value: vals.v })} layout="row" disabled={false} autoFocusKey="v" ariaLabel="type the answer" />
    );
  }
  if (shape === "relation") {
    const isBenchmark = !!(problem.operands && problem.operands.benchmark);
    const opts = isBenchmark
      ? [["less", "less than ½"], ["equal", "equal to ½"], ["more", "more than ½"]]
      : [["<", "is less than"], [">", "is greater than"]];
    return (
      <div className="mixreview__rels">
        {opts.map(([rel, label]) => (
          <button key={rel} type="button" className="check" onClick={() => submit({ rel })}>{label}</button>
        ))}
      </div>
    );
  }
  if (shape === "mixed") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Slate slots={[{ key: "w", label: "wholes" }]} values={vals} onChange={set} layout="row" disabled={false} autoFocusKey="w" ariaLabel="how many wholes" />
        <span style={{ fontStyle: "italic" }}>and</span>
        <Slate slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]} values={vals} onChange={set}
          onSubmit={() => submit({ whole: vals.w, num: vals.n, den: vals.d })} layout="fraction" disabled={false} ariaLabel="leftover fraction" />
      </div>
    );
  }
  // fraction (default for adds / subtract / place / simplify)
  return (
    <Slate slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]} values={vals} onChange={set}
      onSubmit={() => submit({ num: vals.n, den: vals.d })} layout="fraction" disabled={false} autoFocusKey="n" ariaLabel="write your answer as a fraction" />
  );
}
