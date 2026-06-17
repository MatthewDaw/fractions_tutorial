// AppCompare.jsx — Lesson №5 "Compare & Check" (room cmp).
// CCSS 3.NF.A.3d (compare two fractions with same denominator) ·
// 4.NF.A.2 (compare fractions with different denominators using visual models and
// by finding a common denominator).
//
// THE ARC — five focused stages that build understanding visually then symbolically:
//
//   1 · Boxes          — two squares (same base, eighths) — more shaded cells is bigger.
//   2 · Box → Ruler    — same fractions shown BOTH ways (square + ruler beneath) so
//       the child sees the mapping. Still same base (eighths).
//   3 · Rulers · Same  — two stacked ruler strips, same base (sixths). Longer red wins.
//   4 · Rulers · Diff  — different base (halves vs thirds). Same whole length, so
//       compare red lengths directly without renaming.
//   5 · Numbers        — no picture. Rename to a common bottom (2/3 vs 3/4 → 8/12 vs 9/12).
//
// LAYOUT comes from the shared lesson library (LessonShell + LessonBoard +
// TutorRibbon + LessonGoal); the controller backbone (engine wiring, stage nav,
// outcome state) comes from useLessonScaffold. Room CSS lives in styles/cmp.css,
// namespaced .cmp-… .
import React, { useState } from "react";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import { LessonShell, LessonBoard, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";

import "./styles/cmp.css";

// Identity + tab strip are DATA — sourced from the central registry, not inlined.
const L = LESSONS.cmp;

// ── stage key mapping: badge → internal stage id ────────────────────────────
const STAGE_KEY_BY_BADGE = {
  "1": "1-boxes",
  "2": "2-map",
  "3": "3-same",
  "4": "4-diff",
  "5": "5-numbers",
  "★": "practice",
};
const STAGES = L.tabs.map((t) => ({
  id: STAGE_KEY_BY_BADGE[t.n],
  n: t.n,
  tag: t.name,
  blurb: t.sub,
}));

// ── Stage-1 & 2: same-base pair (eighths) ────────────────────────────────────
const BOXES_A = { num: 3, den: 8 };
const BOXES_B = { num: 6, den: 8 };

// ── Stage-3: same-base rulers (sixths) ───────────────────────────────────────
const SAME_A = { num: 2, den: 6 };
const SAME_B = { num: 5, den: 6 };

// ── Stage-4: different-base rulers (halves vs thirds) ────────────────────────
const DIFF_A = { num: 1, den: 2 };
const DIFF_B = { num: 1, den: 3 };

// ── Stage-5: compare from numbers (rename to common bottom) ──────────────────
const NUMS_A = { num: 2, den: 3 };
const NUMS_B = { num: 3, den: 4 };

export default function AppCompare({ no, title, onBack, onRewatchIntro }) {
  const [pick, setPick] = useState(null);

  const sc = useLessonScaffold({
    nodeId: "COMPARE_BENCHMARK",
    lessonId: "cmp",
    initialStage: "1-boxes",
    stagesOrder: STAGES.map((s) => s.id),
    generatedStages: ["practice"],
    generatorSkill: "COMPARE_BENCHMARK",
    introFor: (s) => initialStatus(s),
    resetStage: () => { setPick(null); },
  });
  const {
    stage, goStage, nextStage,
    reportAttempt, applyEngineDecision,
    solved, setSolved, solvedRef, stars, setStars, cook, setCook, status, setStatus,
    say, speaking, stageRef,
  } = sc;

  function initialStatus(s) {
    switch (s) {
      case "1-boxes":    return { tone: "normal", text: "Both squares are cut into eighths — the same-size cells. Which square has more shaded? Pick < = or >." };
      case "2-map":      return { tone: "normal", text: "A square and a ruler show the same fraction. See how the shaded cells become shaded pieces on the strip." };
      case "3-same":     return { tone: "normal", text: "Same base on both rulers — the pieces are the same size. The longer red strip is the bigger fraction." };
      case "4-diff":     return { tone: "normal", text: "Different bases — different-size pieces. But both strips are the same whole, so compare how far the red reaches." };
      case "5-numbers":  return { tone: "normal", text: "No picture now. Rename both fractions to the same bottom, then compare the tops." };
      default:           return { tone: "normal", text: "" };
    }
  }

  // ── per-stage answer handler ────────────────────────────────────────────────
  function pickRel(rel, correct, why, errSig, lastStage) {
    if (solvedRef.current) return;
    setPick(rel);
    if (correct) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: why });
      say("cmpWin");
      const dec = reportAttempt({ correct: true, answerValue: null, errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: why });
      say("cmpGoal");
      reportAttempt({ correct: false, answerValue: null, errorSignature: errSig, stars: 0 });
    }
  }

  function reset() { goStage(stageRef.current); }

  // ── shared chrome ──────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="cmpGoal" voxSpeaker="mom">
      {stageGoal(stage)}
    </LessonGoal>
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── per-stage body ─────────────────────────────────────────────────────────
  let body = null;
  let canvas = null, railNode = null, answerNode = null;

  if (stage === "practice") {
    body = <GenPracticeBoard skill="COMPARE_BENCHMARK" scaffold={sc} />;
  } else if (stage === "1-boxes") {
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <div className="cmp-boxes-stage">
          <div className="cmp-boxes-col">
            <span className="cmp-boxes-label">3/8</span>
            <CellBox den={8} filled={3} />
            <BigFrac num={3} den={8} />
          </div>
          <span className="cmp-boxes-q">?</span>
          <div className="cmp-boxes-col">
            <span className="cmp-boxes-label">6/8</span>
            <CellBox den={8} filled={6} />
            <BigFrac num={6} den={8} />
          </div>
        </div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Which Square Has More?</h3>
        <div className="hint">
          Both squares are cut into <b>eighths</b> — the cells are the <b>same size</b>.
          So the bigger fraction is just the one with <b>more shaded</b>: <b>6/8</b> has
          more red than <b>3/8</b>. When the <b>bottoms match</b>, the bigger <b>top</b>
          wins: <b>3/8 &lt; 6/8</b>.
        </div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={3} den={8} /> <span className="cmp-ans-q">?</span> <BigFrac num={6} den={8} /></>}
        choices={[
          { key: "<", label: "<", sub: "less than" },
          { key: "=", label: "=", sub: "equal" },
          { key: ">", label: ">", sub: "greater" },
        ]}
        pick={pick} answer="<" solved={solved} stars={stars}
        onPick={(rel) => pickRel(rel, rel === "<",
          "Same-size cells — six shaded beats three shaded: 3/8 < 6/8.",
          "wrong_sign"
        )}
        onNext={nextStage}
        cap={solved ? "same bottom — more on top is bigger" : "pick the sign between the two fractions"}
      />
    );
  } else if (stage === "2-map") {
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <div className="cmp-map-stage">
          <div className="cmp-map-col">
            <CellBox den={8} filled={3} small />
            <span className="cmp-map-arrow">↓ same amount</span>
            <RulerStrip num={3} den={8} width={200} />
            <BigFrac num={3} den={8} />
          </div>
          <span className="cmp-boxes-q">?</span>
          <div className="cmp-map-col">
            <CellBox den={8} filled={6} small />
            <span className="cmp-map-arrow">↓ same amount</span>
            <RulerStrip num={6} den={8} width={200} />
            <BigFrac num={6} den={8} />
          </div>
        </div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Square and Ruler — Same Amount</h3>
        <div className="hint">
          A <b>square</b> and a <b>ruler</b> can show the <b>same fraction</b>: the
          shaded cells become shaded pieces of the strip. <b>3/8</b> and <b>6/8</b>
          look the same on either picture. On the ruler it's easy — the <b>longer red</b>
          is bigger, so <b>3/8 &lt; 6/8</b>. From here on we'll use the ruler.
        </div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={3} den={8} /> <span className="cmp-ans-q">?</span> <BigFrac num={6} den={8} /></>}
        choices={[
          { key: "<", label: "<", sub: "less than" },
          { key: "=", label: "=", sub: "equal" },
          { key: ">", label: ">", sub: "greater" },
        ]}
        pick={pick} answer="<" solved={solved} stars={stars}
        onPick={(rel) => pickRel(rel, rel === "<",
          "Read it off the ruler — longer red wins: 3/8 < 6/8.",
          "wrong_sign"
        )}
        onNext={nextStage}
        cap={solved ? "read it off the ruler — longer red wins" : "pick the sign between the two fractions"}
      />
    );
  } else if (stage === "3-same") {
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <div className="cmp-rulers-stage">
          <div className="cmp-ruler-row">
            <BigFrac num={2} den={6} />
            <RulerStrip num={2} den={6} width={460} />
          </div>
          <div className="cmp-ruler-row">
            <BigFrac num={5} den={6} />
            <RulerStrip num={5} den={6} width={460} />
          </div>
        </div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Same Base on Rulers</h3>
        <div className="hint">
          Two strips, both cut into <b>sixths</b> — the pieces are the <b>same size</b>.
          Stacked, you can see the red lengths: <b>5/6</b> reaches much further than
          <b>2/6</b>. Same bottom, so <b>more on top is longer</b>: <b>2/6 &lt; 5/6</b>.
        </div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={2} den={6} /> <span className="cmp-ans-q">?</span> <BigFrac num={5} den={6} /></>}
        choices={[
          { key: "<", label: "<", sub: "less than" },
          { key: "=", label: "=", sub: "equal" },
          { key: ">", label: ">", sub: "greater" },
        ]}
        pick={pick} answer="<" solved={solved} stars={stars}
        onPick={(rel) => pickRel(rel, rel === "<",
          "Same-size pieces — five of them reaches further than two: 2/6 < 5/6.",
          "wrong_sign"
        )}
        onNext={nextStage}
        cap={solved ? "same-size pieces — count them: more is longer" : "pick the sign between the two fractions"}
      />
    );
  } else if (stage === "4-diff") {
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <div className="cmp-rulers-stage">
          <div className="cmp-ruler-row">
            <BigFrac num={1} den={2} />
            <RulerStrip num={1} den={2} width={460} />
          </div>
          <div className="cmp-ruler-row">
            <BigFrac num={1} den={3} />
            <RulerStrip num={1} den={3} width={460} />
          </div>
        </div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Different Base — Line Them Up</h3>
        <div className="hint">
          Different bottoms means <b>different-size pieces</b> — you can't just count.
          But both strips are the <b>same whole</b> (0→1), so line them up and compare
          the <b>red lengths</b>: one <b>half</b> reaches further than one <b>third</b>.
          So <b>1/2 &gt; 1/3</b>. (Fewer, bigger pieces can beat more, smaller ones.)
        </div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={1} den={2} /> <span className="cmp-ans-q">?</span> <BigFrac num={1} den={3} /></>}
        choices={[
          { key: "<", label: "<", sub: "less than" },
          { key: "=", label: "=", sub: "equal" },
          { key: ">", label: ">", sub: "greater" },
        ]}
        pick={pick} answer=">" solved={solved} stars={stars}
        onPick={(rel) => pickRel(rel, rel === ">",
          "A half reaches further than a third — different-size pieces, same whole: 1/2 > 1/3.",
          "wrong_sign"
        )}
        onNext={nextStage}
        cap={solved ? "same whole — compare how far the red reaches" : "pick the sign between the two fractions"}
      />
    );
  } else if (stage === "5-numbers") {
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <div className="cmp-numbers-stage">
          <div className="cmp-numbers-top">
            <BigFrac num={2} den={3} size={56} />
            <span className="cmp-boxes-q">?</span>
            <BigFrac num={3} den={4} size={56} />
          </div>
          <div className="cmp-numbers-arrow">rename both over 12 ↓</div>
          <div className="cmp-numbers-bottom">
            <BigFrac num={8} den={12} />
            <span className="cmp-numbers-rel">&lt;</span>
            <BigFrac num={9} den={12} />
          </div>
          <div className="cmp-numbers-cap">same bottom now — <b>8/12 &lt; 9/12</b>, so <b>2/3 &lt; 3/4</b></div>
        </div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Compare From the Numbers</h3>
        <div className="hint">
          No strip now. Different bottoms — so <b>rename</b> both to the <b>same
          bottom</b> (the skill from Equivalent Fractions). Over <b>12</b>: <b>2/3 =
          8/12</b> and <b>3/4 = 9/12</b>. Now the bottoms match, so more on top wins:
          <b>2/3 &lt; 3/4</b>.
        </div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={2} den={3} /> <span className="cmp-ans-q">?</span> <BigFrac num={3} den={4} /></>}
        choices={[
          { key: "<", label: "<", sub: "less than" },
          { key: "=", label: "=", sub: "equal" },
          { key: ">", label: ">", sub: "greater" },
        ]}
        pick={pick} answer="<" solved={solved} stars={stars}
        onPick={(rel) => pickRel(rel, rel === "<",
          "Rename to twelfths: 8/12 < 9/12, so 2/3 < 3/4.",
          "wrong_sign"
        )}
        onNext={nextStage}
        lastStage
        cap={solved ? "rename to a common bottom, then compare the tops" : "pick the sign between the two fractions"}
      />
    );
  }

  if (stage !== "practice") {
    body = (
      <LessonBoard
        variant="split"
        footHeight={196}
        railWidth={396}
        stage={canvas}
        rail={railNode}
        answer={answerNode}
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag={L.tag.replace(/^Lesson \d+ · /, "")}
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      resetTitle="Start this stage over"
      tabs={{
        stages: STAGES.map((s) => ({ key: s.id, badge: s.n, title: s.tag, sub: s.blurb })),
        current: stage,
        onSelect: goStage,
      }}
      goal={Goal}
    >
      {body}
    </LessonShell>
  );
}

// ── CellBox — grid of cells with `filled` shaded in red ─────────────────────
function CellBox({ den, filled, small }) {
  const cols = Math.ceil(Math.sqrt(den));
  const size = small ? 120 : 160;
  const cellSize = size / cols;
  return (
    <svg
      className={"cmp-cellbox" + (small ? " is-sm" : "")}
      width={size} height={size}
      style={{ display: "block" }}
    >
      {Array.from({ length: den }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <rect
            key={i}
            x={col * cellSize + 1} y={row * cellSize + 1}
            width={cellSize - 2} height={cellSize - 2}
            fill={i < filled ? "var(--red, #e63)" : "none"}
            stroke="var(--ink, #333)"
            strokeWidth={1}
            rx={1}
          />
        );
      })}
    </svg>
  );
}

// ── RulerStrip — a fraction-ruler bar: filled portion in red ─────────────────
function RulerStrip({ num, den, width = 300 }) {
  const h = 28;
  const filledW = (num / den) * width;
  return (
    <svg className="cmp-ruler" width={width} height={h} style={{ display: "block" }}>
      <rect x={0} y={0} width={width} height={h} fill="none" stroke="var(--ink,#333)" strokeWidth={1.5} rx={3} />
      {filledW > 0 && (
        <rect x={0} y={0} width={filledW} height={h} fill="var(--red,#e63)" rx={3} />
      )}
      {Array.from({ length: den - 1 }).map((_, i) => {
        const x = ((i + 1) / den) * width;
        return <line key={i} x1={x} y1={0} x2={x} y2={h} stroke="var(--ink,#333)" strokeWidth={1} />;
      })}
    </svg>
  );
}

// ── ChoiceAnswer — shared < = > picker card ──────────────────────────────────
function ChoiceAnswer({ prompt, choices, pick, answer, solved, stars, onPick, onNext, cap, wide, lastStage }) {
  return (
    <div className="lbar cmp-answer">
      <div className="cmp-ans-row">
        <span className="cmp-ans-prompt">{prompt}</span>
        <div className={"cmp-choices" + (wide ? " is-wide" : "")}>
          {choices.map((c) => {
            const isPick = pick === c.key;
            const state = solved
              ? (c.key === answer ? " is-correct" : "")
              : (isPick ? " is-wrong" : "");
            return (
              <button
                key={c.key}
                className={"cmp-choice" + state}
                disabled={solved}
                aria-pressed={isPick}
                onClick={() => onPick(c.key)}
              >
                <span className="cmp-choice-lab">{c.label}</span>
                {c.sub && <span className="cmp-choice-sub">{c.sub}</span>}
              </button>
            );
          })}
        </div>
        <div className="cmp-ans-marks">
          {solved && <Rosette count={stars} />}
          <button
            className={"check" + (solved ? " done" : "")}
            onClick={solved ? onNext : undefined}
            disabled={!solved}
          >{solved ? (lastStage ? "Done" : "Next →") : "Pick one"}</button>
        </div>
      </div>
      <div className="cmp-ans-cap">{cap}</div>
    </div>
  );
}

// ── per-stage goal copy ───────────────────────────────────────────────────────
function stageGoal(stage) {
  switch (stage) {
    case "1-boxes":
      return (<>Both squares are cut into <b>eighths</b> — the same-size cells. Which square has <b>more shaded</b>? Pick the sign that goes between them: <b>&lt;</b>, <b>=</b>, or <b>&gt;</b>.</>);
    case "2-map":
      return (<>A square and a ruler show the <b>same fraction</b>. The shaded cells become shaded pieces of the strip. Read the comparison off the rulers.</>);
    case "3-same":
      return (<>Two ruler strips, <b>same base</b> (sixths). The pieces are the same size — the <b>longer red</b> is the bigger fraction.</>);
    case "4-diff":
      return (<>Two ruler strips, <b>different bases</b>. Both strips span the same whole, so compare <b>how far the red reaches</b>.</>);
    case "5-numbers":
      return (<>No picture. <b>Rename</b> both fractions to the same bottom, then <b>compare the tops</b> — just like same-base rulers.</>);
    default:
      return "";
  }
}
