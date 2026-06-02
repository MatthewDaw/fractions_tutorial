// AppNumberLine.jsx — Lesson No.4 "On the Number Line" (room `nl`,
// FRACTION_ON_LINE). CCSS 3.NF.A.2: a fraction is a NUMBER — a single POINT
// located on the number line, found by cutting 0→1 into `den` equal parts and
// counting `num` of them from 0. The whole lesson is built on the shared
// <NumberLine> ruler so the SAME object carries every stage.
//
// THE INTERACTION ARC — three focused stages, reachable one-click from the stage
// selector and advanced one-by-one on a correct answer. The manipulative channel
// (dragging a point) shrinks while the writing channel (naming the point) grows.
//
//   1 · Place   (Manipulate) — a 0→1 line cut into `den` equal parts. The child
//       DRAGS the point marker to a/b (3/4). Correct when it snaps onto the right
//       tick. No writing.
//   2 · Write   (Bind) — the line shows a fixed marked point at a/b (2/3); the
//       child WRITES that fraction on a Slate (layout="fraction"). Exact a and b.
//   3 · Numbers (Numbers) — given 5/3 in words+symbol, the child places the point
//       on a 0→2 line PAST 1, killing the "fractions only live between 0 and 1"
//       misconception.
//
// LAYOUT comes from the shared lesson library (LessonShell + LessonBoard +
// AnswerBar + TutorRibbon + LessonGoal); the controller backbone (engine wiring,
// stage nav, outcome state) comes from useLessonScaffold. The number-line is the
// shared <NumberLine> component (reuses the .nline/.ntick/.nlab CSS in
// lesson.css). Room-specific content CSS lives in styles/nl.css, namespaced .nl-…
import React, { useState } from "react";
import NumberLine from "./components/NumberLine.jsx";
import Slate from "./components/Slate.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Rosette from "./components/Rosette.jsx";
import FitStage from "./components/FitStage.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, LessonGoal } from "./components/lesson";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";

import "./styles/nl.css";

// ── geometry (shared with the NumberLine component's own defaults) ────────────
const ORIGIN = 60, SPAN = 600, LINE_Y = 150;

const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

// ── the three stages of the arc. Each carries ONE point on ONE ruler. ─────────
//   1-place : 3/4 on a 0→1 line (den 4) — DRAG the point.
//   2-write : 2/3 on a 0→1 line (den 3) — the point is fixed; WRITE the name.
//   3-numbers: 5/3 on a 0→2 line (den 3) — DRAG the point PAST 1.
const STAGES = [
  { id: "1-place",   n: 1, tag: "Place",   blurb: "Drag the point to the fraction" },
  { id: "2-write",   n: 2, tag: "Write",   blurb: "Name the marked point" },
  { id: "3-numbers", n: 3, tag: "Numbers", blurb: "Past 1 — place a fraction bigger than a whole" },
];

// Per-stage problem: the fraction, its ruler width (wholes), and the denominator.
function probFor(s) {
  switch (s) {
    case "1-place":   return { num: 3, den: 4, wholes: 1 };
    case "2-write":   return { num: 2, den: 3, wholes: 1 };
    case "3-numbers": return { num: 5, den: 3, wholes: 2 };
    default:          return { num: 3, den: 4, wholes: 1 };
  }
}

// spoken fraction words, for status copy (e.g. "three fourths").
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const DEN_NAME = { 2: "half", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 8: "eighth", 10: "tenth", 12: "twelfth" };
function fracWords(a, b) {
  const top = ONES[a] || String(a);
  const unit = DEN_NAME[b] || `${b}th`;
  return `${top} ${unit}${a === 1 ? "" : "s"}`;
}

export default function AppNumberLine({ no, title, onBack, onRewatchIntro }) {
  // DOMAIN STATE the hook does not own.
  // pointK = the dragged/placed point expressed as a tick index k in [0..wholes*den]
  // (so the point value in wholes is pointK/den). Stages that DRAG seed it at 0.
  const [pointK, setPointK] = useState(0);
  const [placed, setPlaced] = useState(false);   // has the child committed a drag this stage?
  const [slate, setSlate] = useState({ n: "", d: "" });  // Stage 2 written name

  const {
    stage, goStage, nextStage,
    reportAttempt, applyEngineDecision,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    say, speaking, stageRef,
  } = useLessonScaffold({
    nodeId: "FRACTION_ON_LINE",
    lessonId: "nl",
    initialStage: "1-place",
    stagesOrder: STAGES.map((s) => s.id),
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setPointK(0); setPlaced(false); setSlate({ n: "", d: "" });
    },
  });

  const P = probFor(stage);                 // this stage's fraction + ruler
  const TARGET_K = P.num;                    // the correct tick index (num/den in wholes)
  const TICKS = P.wholes * P.den;            // total ticks 0..TICKS

  function initialStatus(s) {
    const p = probFor(s);
    switch (s) {
      case "1-place":
        return { tone: "normal", text: `A fraction is a NUMBER — one point on the line. The line from 0 to 1 is cut into ${p.den} equal parts. Drag the point to ${fracWords(p.num, p.den)} — count ${ONES[p.num]} parts from 0.` };
      case "2-write":
        return { tone: "normal", text: `The point is already placed at ${fracWords(p.num, p.den)}. ${p.den} equal parts from 0 to 1, the dot sits ${ONES[p.num]} of them along. Write that fraction on the Slate — top, then bottom.` };
      case "3-numbers":
        return { tone: "normal", text: `Fractions don't stop at 1! ${fracWords(p.num, p.den)} is more than one whole. Each whole is cut into ${p.den} parts — drag the point past 1 to the ${ONES[p.num]}th tick.` };
      default:
        return { tone: "normal", text: "" };
    }
  }

  // ── the placed-point handler the NumberLine calls on pointer-up. It hands back
  // a value in WHOLES snapped to the nearest 1/den; convert to a tick index and
  // judge against the target. Used by 1-place and 3-numbers. ──
  function onPlace(valInWholes, info) {
    if (solvedRef.current) return;
    const k = Math.round(valInWholes * P.den);   // snap to nearest tick index
    setPointK(k); setPlaced(true);
    if (info && info.live) return;               // gliding under the finger — only judge on release
    const stg = stageRef.current;
    if (k === TARGET_K) {
      setCook("cheer");
      setStatus({ tone: "ok", text: stg === "3-numbers"
        ? `Yes! ${fracWords(P.num, P.den)} sits past 1 — ${P.num} parts of size 1/${P.den}, which is more than one whole. A fraction is just a number on the line. Next stage!`
        : `Right on it! ${fracWords(P.num, P.den)} is ${P.num} parts of 1/${P.den} from 0 — that single point IS the number. Next stage!` });
      say("nlWin");
      const dec = reportAttempt({ correct: true, answerValue: [P.num, P.den], errorSignature: null, stars: 3, modality: "drag" });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else {
      setCook("think");
      const overOne = k > P.den && P.wholes > 1;
      setStatus({ tone: "warn", text: k < TARGET_K
        ? `Not far enough — count ${ONES[P.num]} parts of size 1/${P.den} from 0${overOne ? " (keep going past 1)" : ""}.`
        : `Too far — that's past ${fracWords(P.num, P.den)}. Each step is 1/${P.den}; land on the ${ONES[P.num]}th tick.` });
      say("nlPlace");
      reportAttempt({ correct: false, answerValue: [k, P.den], errorSignature: null, stars: 0, modality: "drag" });
    }
  }

  // ── Stage 2 (Write): grade the handwritten fraction against the marked point. ──
  function submitWrite() {
    if (solvedRef.current) return;
    const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
    if (!(tn > 0) || !(td > 0)) {
      setCook("think");
      setStatus({ tone: "warn", text: "Write the fraction the point names — a top number and a bottom number." });
      return;
    }
    // exact match (a over b) — not just equal value: we're naming THIS partition.
    if (!(tn === P.num && td === P.den)) {
      setCook("think");
      const flipped = tn === P.den && td === P.num;
      setStatus({ tone: "warn", text: flipped
        ? `Careful — the BOTTOM is how many equal parts the whole is cut into (${P.den}), the TOP is how many you count (${P.num}). You've flipped them.`
        : `Not quite. The line is cut into ${P.den} equal parts and the dot is ${ONES[P.num]} along — write ${P.num} over ${P.den}.` });
      say("nlPlace");
      reportAttempt({ correct: false, answerValue: [tn, td], errorSignature: tn === P.den && td === P.num ? "flipped" : null, stars: 0 });
      return;
    }
    setCook("cheer");
    setStatus({ tone: "ok", text: `Yes! That point is ${fracWords(P.num, P.den)} — ${P.num} parts of size 1/${P.den}. The bottom tells the part size, the top counts them. Next stage!` });
    say("nlWin");
    const dec = reportAttempt({ correct: true, answerValue: [tn, td], errorSignature: null, stars: 3 });
    setTimeout(() => applyEngineDecision(dec, true), 1500);
  }

  // Reset the CURRENT stage (toolbar ⟲).
  function reset() { goStage(stageRef.current); }

  // ── derived view state ──────────────────────────────────────────────────────
  const isWrite = stage === "2-write";
  const drags = !isWrite;                                  // 1-place + 3-numbers drag the point
  const pointVal = isWrite ? P.num / P.den : pointK / P.den; // the marker's value in wholes
  const slateFilled = slate.n !== "" && slate.d !== "";
  const answerReady = !solved && (isWrite ? slateFilled : (placed && pointK === TARGET_K));

  // the labelled ticks the NumberLine paints: 0, every whole, and (on Write) the
  // marked-point's own fraction tick so the child can read what they're naming.
  const marks = isWrite ? [{ k: P.num, label: `${P.num}/${P.den}` }] : [];

  // ── shared chrome ─────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="nlGoal" voxSpeaker="mom">
      {stageGoal(stage, P)}
    </LessonGoal>
  );

  // The canonical question band: the bare fraction, with the answer "where on the
  // line?" resolving to ✓ once solved.
  const Band = (
    <QuestionBand
      lead="where on the line?"
      expr={<BigFrac num={P.num} den={P.den} />}
      answer={solved ? "✓ on the line" : "?"}
    />
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── the number-line canvas (the stage's interaction area) ────────────────────
  const Stage = (
    <FitStage className="nl-board-fit" axis="y">
      <div className="nl-canvas">
        <div className="nl-line-wrap">
          <NumberLine
            wholes={P.wholes}
            den={P.den}
            origin={ORIGIN}
            span={SPAN}
            lineY={LINE_Y}
            marks={marks}
            labelParts
            fillToPoint
            point={pointVal}
            draggablePoint={drags && !solved}
            onPlace={onPlace}
          />
        </div>
        <div className="nl-cap">
          {drags
            ? (solved ? `placed at ${fracWords(P.num, P.den)} ✓` : `drag the point — each tick is 1/${P.den}`)
            : `the dot is ${ONES[P.num]} of ${P.den} equal parts along — name it`}
        </div>
      </div>
    </FitStage>
  );

  // ── the per-stage hint rail ──────────────────────────────────────────────────
  const Rail = (
    <div className="panel">
      <h3 className="pick-title">A Fraction Is a Number</h3>
      <div className="hint">
        Cut the line from <b>0</b> to <b>1</b> into <b>{P.den}</b> equal parts. The
        <b> bottom</b> ({P.den}) is the size of one part; the <b>top</b> counts how many you
        step from 0. {fracWords(P.num, P.den)} is <b>{P.num}</b> steps of <b>1/{P.den}</b>.
        {P.wholes > 1 && <> Past <b>1</b>, the parts just keep going — a fraction can be bigger than a whole.</>}
      </div>
      <div className="nl-mini">
        <span className="nl-mini-frac"><BigFrac num={P.num} den={P.den} /></span>
        <span className="nl-mini-note">{P.num} part{P.num === 1 ? "" : "s"} of size 1/{P.den}</span>
      </div>
    </div>
  );

  // ── the answer card ──────────────────────────────────────────────────────────
  // Place / Numbers: no writing — the placed point IS the answer; Check just
  // advances once it snapped to the target. Write: the Slate fraction + Check.
  const Answer = isWrite ? (
    <AnswerBar
      eq={
        <div className="nl-ans-eqrow">
          <span className="nl-ans-lead">the point is</span>
          <span className="nl-ans-slate">
            <Slate
              slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
              values={slate}
              onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
              onSubmit={submitWrite}
              layout="fraction"
              den={P.den}
              disabled={solved}
              autoFocusKey={solved ? undefined : "n"}
              ariaLabel="write the fraction the point names"
            />
          </span>
        </div>
      }
      cap={solved
        ? `that point is ${fracWords(P.num, P.den)} — a number on the line!`
        : "write the fraction the point names, then Check"}
      solved={solved}
      ready={answerReady}
      stars={stars}
      onCheck={solved ? nextStage : submitWrite}
      checkLabel={solved ? "Next ▸" : "Check"}
    />
  ) : (
    <AnswerBar
      eq={
        <div className="nl-ans-eqrow">
          <span className="nl-ans-frac"><BigFrac num={P.num} den={P.den} /></span>
          <span className="nl-ans-eq">=</span>
          <span className="nl-ans-amt">{placed ? `${pointK}/${P.den} of the way` : "drag the point to place it"}</span>
        </div>
      }
      cap={solved
        ? `placed at ${fracWords(P.num, P.den)} — that point IS the number`
        : (placed && pointK !== TARGET_K)
        ? `that's ${pointK}/${P.den} — aim for ${P.num}/${P.den}`
        : `drag the point to ${fracWords(P.num, P.den)} on the line`}
      solved={solved}
      ready={answerReady}
      stars={stars}
      onCheck={solved ? nextStage : undefined}
      checkLabel={solved ? "Next ▸" : "Drag to place"}
      checkDisabled={!solved}
    />
  );

  const body = (
    <LessonBoard
      variant="split"
      footHeight={196}
      railWidth={396}
      stage={Stage}
      rail={Rail}
      answer={Answer}
      tutor={Tutor}
    />
  );

  return (
    <LessonShell
      no={no}
      tag="Number Line"
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
      band={Band}
      goal={Goal}
    >
      {body}
    </LessonShell>
  );
}

// ── per-stage goal copy (captions, since the audience reads) ──────────────────
function stageGoal(stage, P) {
  switch (stage) {
    case "1-place":
      return (<>A fraction is a <b>number</b> — a single point on the line. The whole from <b>0</b> to <b>1</b> is cut into <b>{P.den}</b> equal parts. <b>Drag the point</b> to {fracWords(P.num, P.den)} — count {ONES[P.num]} parts from 0.</>);
    case "2-write":
      return (<>The point is marked at {fracWords(P.num, P.den)}. The line has <b>{P.den}</b> equal parts; the dot is <b>{ONES[P.num]}</b> of them along. <b>Write</b> that fraction — the count on top, the part size on the bottom.</>);
    case "3-numbers":
      return (<>Fractions don't stop at 1! <b>{P.num}/{P.den}</b> is {fracWords(P.num, P.den)} — <b>bigger than one whole</b>. Each whole is still cut into <b>{P.den}</b> parts. <b>Drag the point past 1</b> to place it.</>);
    default:
      return "";
  }
}
