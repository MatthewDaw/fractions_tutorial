// AppNumberLine.jsx — Lesson No.6 "Same Denominators" (room `nl`,
// FRACTION_ON_LINE). CCSS 3.NF.A.2: a fraction is a NUMBER located on the number
// line, found by cutting 0→1 into `den` equal parts and counting `num` of them
// from 0. The whole lesson is built on the shared <NumberLine> ruler so the SAME
// object carries every stage.
//
// THE INTERACTION ARC — three focused stages plus paced practice, reachable
// one-click from the stage selector and advanced one-by-one on a correct answer.
//
//   1 · Place   (Manipulate) — a 0→1 line cut into `den` equal parts and a tray
//       holding ONE reusable 1/den unit piece. The child DRAGS that piece onto
//       the line again and again to GROW a bar — 1/4, 2/4, 3/4 — stopping at the
//       target three fourths. No writing. (REDESIGNED to match the wireframe's
//       block-stacking paradigm: grow a fraction from identical unit pieces.)
//   2 · Write   (Bind) — the line shows a fixed marked point at a/b (2/3); the
//       child WRITES that fraction on a Slate (layout="fraction"). Exact a and b.
//   3 · Numbers (Numbers) — given 5/3, the child DRAGS the point on a 0→2 line
//       PAST 1, killing the "fractions only live between 0 and 1" misconception.
//
// LAYOUT comes from the shared lesson library (LessonShell + LessonBoard +
// AnswerBar + TutorRibbon + LessonGoal); identity + the tab strip come from the
// central registry (web/src/lessons/nl.js) — NOT inlined. The controller backbone
// (engine wiring, stage nav, outcome state) comes from useLessonScaffold. The
// number-line is the shared <NumberLine> component. Room-specific content CSS
// lives in styles/nl.css, namespaced .nl-…
import React, { useState, useRef } from "react";
import NumberLine from "./components/NumberLine.jsx";
import Slate from "./components/Slate.jsx";
import BigFrac from "./components/BigFrac.jsx";
import FitStage from "./components/FitStage.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";
import { denomColor } from "./denominatorColors.js";

import "./styles/nl.css";

// Identity + tab strip are DATA — sourced from the central registry, not inlined.
const L = LESSONS.nl;

// The TAB labels/subs/badges/order come from the registry (L.tabs); these keys
// carry the per-stage scaffold MODEL the controller routes by. `STAGE_BY_BADGE`
// pairs each registry badge (t.n) with its canonical scaffold key (logic, not
// chrome). StageTabs is fed the scaffold KEY so selector clicks map straight to a
// real stage id; copy/order/badge stay sourced from the registry.
const STAGE_BY_BADGE = {
  "1": "1-place",
  "2": "2-write",
  // tabs 3–7 and ★ come from the merged r1 family (wireframe nl+r1 merge);
  // they are navigated by the shared StageTabs but live in AppR1's route.
  "3": "r1-manipulate",
  "4": "r1-numbers",
  "5": "r1-applied",
  "6": "r1-showwork",
  "7": "r1-words",
  "★": "practice",
};
const STAGES = L.tabs.map((t) => ({
  key: STAGE_BY_BADGE[t.n],
  badge: t.n,
  title: t.name,
  sub: t.sub,
}));

// ── geometry (shared with the NumberLine component's own defaults) ────────────
const ORIGIN = 60, SPAN = 600, LINE_Y = 150;

const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

// ── the three teaching stages (logic/order, not chrome). The TAB labels/subs/
//   badges come from the registry (L.tabs); these keys carry the per-stage MODEL
//   the controller routes by. The trailing "practice" stage serves engine-paced
//   generated FRACTION_ON_LINE variations. ──
//   1-place : 3/4 on a 0→1 line (den 4) — GROW a bar from 1/4 unit pieces.
//   2-write : 2/3 on a 0→1 line (den 3) — the point is fixed; WRITE the name.
//   3-numbers: 5/3 on a 0→2 line (den 3) — DRAG the point PAST 1.

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
  // pointK = the dragged/placed point as a tick index k in [0..wholes*den]
  //   (Stage 3 — drag the point). barK = how many 1/den unit pieces have been
  //   stacked onto the line (Stage 1 — grow a bar). slate = Stage 2 written name.
  const [pointK, setPointK] = useState(0);
  const [placed, setPlaced] = useState(false);   // Stage 3: committed a drag?
  const [barK, setBarK] = useState(0);           // Stage 1: pieces stacked so far
  const [slate, setSlate] = useState({ n: "", d: "" });

  // drag ghost for the Stage-1 unit piece (a floating preview that tracks the
  // pointer). null ⇒ not dragging. {x,y,over} in client px + drop-zone hover.
  const [drag, setDrag] = useState(null);
  const canvasRef = useRef(null);

  const sc = useLessonScaffold({
    nodeId: "FRACTION_ON_LINE",
    lessonId: "nl",
    initialStage: "1-place",
    stagesOrder: STAGES.map((s) => s.key),
    // The final "practice" stage serves auto-generated FRACTION_ON_LINE variations,
    // paced by the engine (re-roll on correct, fade on a clean streak, transfer probe).
    generatedStages: ["practice"],
    generatorSkill: "FRACTION_ON_LINE",
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setPointK(0); setPlaced(false); setBarK(0); setSlate({ n: "", d: "" }); setDrag(null);
    },
  });
  const {
    stage, goStage, nextStage,
    reportAttempt, applyEngineDecision,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    say, speaking, stageRef,
  } = sc;

  const P = probFor(stage);                 // this stage's fraction + ruler
  const TARGET_K = P.num;                    // the correct tick index (num/den in wholes)
  const TICKS = P.wholes * P.den;            // total ticks 0..TICKS
  const UNIT_PX = SPAN / P.wholes;           // px per whole on the rendered ruler
  const PIECE_PX = UNIT_PX / P.den;          // px width of one 1/den piece
  const HUE = denomColor(P.den);             // the denominator's color

  function initialStatus(s) {
    const p = probFor(s);
    switch (s) {
      case "1-place":
        return { tone: "normal", text: `Drag the 1/${p.den} block onto the line — 1/${p.den}, 2/${p.den}, 3/${p.den}. Stop when you reach ${fracWords(p.num, p.den)}.` };
      case "2-write":
        return { tone: "normal", text: `Count the 1/${p.den} pieces sitting on the line from 0 — that's the top number; the part size ${p.den} is the bottom. Write it on the Slate.` };
      case "3-numbers":
        return { tone: "normal", text: `Fractions don't stop at 1! ${fracWords(p.num, p.den)} is more than one whole. Each whole is cut into ${p.den} parts — drag the point past 1 to the ${ONES[p.num]}th tick.` };
      default:
        return { tone: "normal", text: "" };
    }
  }

  // ── Stage 1 (Place): grow a bar by stacking 1/den unit pieces. The child drags
  // the reusable unit piece from the rail tray onto the line; each drop that lands
  // on the canvas adds one 1/den piece. Reaching the target (3/4) wins. Pointer
  // math reads the stage scale k = stageWidth/1280 so client px map into the CSS
  // transform correctly (same convention as NumberLine / the rest of the app). ──
  function startPieceDrag(e) {
    if (solvedRef.current || stageRef.current !== "1-place") return;
    if (e && e.preventDefault) e.preventDefault();
    setDrag({ x: e.clientX, y: e.clientY, over: false });

    const overCanvas = (clientX, clientY) => {
      const el = canvasRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    };

    const move = (ev) => setDrag({ x: ev.clientX, y: ev.clientY, over: overCanvas(ev.clientX, ev.clientY) });
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const dropped = overCanvas(ev.clientX, ev.clientY);
      setDrag(null);
      if (dropped) addPiece();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function addPiece() {
    if (solvedRef.current) return;
    const stg = stageRef.current;
    const p = probFor(stg);
    const next = Math.min(barK + 1, p.wholes * p.den);
    setBarK(next);
    if (next === p.num) {
      setCook("cheer");
      setStatus({ tone: "ok", text: `Right on it! ${fracWords(p.num, p.den)} is ${p.num} pieces of size 1/${p.den} from 0 — that length IS the number. Next stage!` });
      say("nlWin");
      const dec = reportAttempt({ correct: true, answerValue: [p.num, p.den], errorSignature: null, stars: 3, modality: "drag" });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else if (next > p.num) {
      setCook("think");
      setStatus({ tone: "warn", text: `Too many — that's ${next}/${p.den}, past ${fracWords(p.num, p.den)}. Reset and stop at the ${ONES[p.num]}th piece.` });
      say("nlPlace");
      reportAttempt({ correct: false, answerValue: [next, p.den], errorSignature: null, stars: 0, modality: "drag" });
    } else {
      setCook("think");
      setStatus({ tone: "normal", text: `${next}/${p.den} so far — keep stacking 1/${p.den} pieces until the bar reaches ${fracWords(p.num, p.den)}.` });
      say("nlPlace");
    }
  }

  // ── Stage 3 (Numbers): drag the point. NumberLine hands back a value in WHOLES
  // snapped to the nearest 1/den on release; convert to a tick index and judge. ──
  function onPlace(valInWholes, info) {
    if (solvedRef.current) return;
    const k = Math.round(valInWholes * P.den);   // snap to nearest tick index
    setPointK(k); setPlaced(true);
    if (info && info.live) return;               // gliding under the finger — only judge on release
    if (k === TARGET_K) {
      setCook("cheer");
      setStatus({ tone: "ok", text: `Yes! ${fracWords(P.num, P.den)} sits past 1 — ${P.num} parts of size 1/${P.den}, which is more than one whole. A fraction is just a number on the line. Next stage!` });
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
  const isPlace = stage === "1-place";
  const isWrite = stage === "2-write";
  const isNumbers = stage === "3-numbers";
  // r1-family stages (Manipulate, Numbers, Applied, Show Work, Words) are part
  // of the merged nl+r1 wireframe lesson; in the real app they live in AppR1.
  const isR1Stage = stage && stage.startsWith("r1-");
  const pointVal = isWrite ? P.num / P.den : pointK / P.den; // Stage 3 marker value in wholes
  const slateFilled = slate.n !== "" && slate.d !== "";
  const answerReady = !solved && (
    isPlace ? barK === TARGET_K
    : isWrite ? slateFilled
    : (placed && pointK === TARGET_K)
  );

  // the labelled ticks the NumberLine paints: 0, every whole, and (on Write) the
  // marked-point's own fraction tick so the child can read what they're naming.
  const marks = isWrite ? [{ value: P.num / P.den, label: `${P.num}/${P.den}` }] : [];

  // ── shared chrome ─────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="nlGoal" voxSpeaker="mom">
      {stageGoal(stage, P)}
    </LessonGoal>
  );

  const Band = (
    <QuestionBand
      lead="where on the line?"
      expr={<BigFrac num={P.num} den={P.den} />}
      answer={solved ? "✓ on the line" : "?"}
    />
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── the number-line canvas (the stage's interaction area) ────────────────────
  // Stage 1 GROWS a bar of stacked 1/den pieces above the line; Stages 2/3 use the
  // shared NumberLine (fixed point on Write, draggable point on Numbers).
  const Stage = (
    <FitStage className="nl-board-fit" axis="y">
      <div className="nl-canvas" ref={canvasRef}>
        <div className="nl-line-wrap">
          {isPlace ? (
            <>
              {/* the ruler (drawn with the same geometry as NumberLine) */}
              <NumberLine
                wholes={P.wholes}
                den={P.den}
                origin={ORIGIN}
                span={SPAN}
                lineY={LINE_Y}
                labelParts
              />
              {/* the grown bar: barK stacked 1/den pieces, 0→barK on the line */}
              {barK > 0 && (
                <div
                  className="nl-bar"
                  style={{ left: ORIGIN, top: LINE_Y - 64, width: barK * PIECE_PX }}
                >
                  <div className="nl-bar-tag">
                    <BigFrac num={barK} den={P.den} />
                  </div>
                  <div className="nl-plank">
                    {Array.from({ length: barK }).map((_, i) => (
                      <div
                        key={i}
                        className="nl-piece"
                        style={{
                          width: PIECE_PX,
                          background: HUE,
                          borderRight: i < barK - 1 ? "1.5px solid rgba(237,226,200,0.55)" : "none",
                        }}
                      >
                        <span className="nl-piece-lab">1/{P.den}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ghost drop slot: where the NEXT 1/den piece lands */}
              {!solved && barK < TICKS && (
                <div
                  className={"nl-ghost-slot" + (drag && drag.over ? " is-hot" : "")}
                  style={{ left: ORIGIN + barK * PIECE_PX, top: LINE_Y - 64, width: PIECE_PX }}
                >
                  <span className="nl-ghost-lab">+1/{P.den}</span>
                </div>
              )}
            </>
          ) : (
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
              draggablePoint={isNumbers && !solved}
              onPlace={onPlace}
            />
          )}
        </div>
        <div className="nl-cap">
          {isPlace
            ? (solved ? `grown to ${fracWords(P.num, P.den)} ✓` : `drag the 1/${P.den} block onto the line — each piece is 1/${P.den}`)
            : isNumbers
            ? (solved ? `placed at ${fracWords(P.num, P.den)} ✓` : `drag the point — each tick is 1/${P.den}`)
            : `the dot is ${ONES[P.num]} of ${P.den} equal parts along — name it`}
        </div>
      </div>
    </FitStage>
  );

  // ── the per-stage hint rail ──────────────────────────────────────────────────
  const Rail = (
    <div className="panel">
      <h3 className="pick-title">{isPlace ? "Build Three Fourths" : "A Fraction Is a Number"}</h3>
      {isPlace ? (
        <>
          <div className="hint">
            Drag the <b>1/{P.den}</b> block onto the line, again and again. Each drop grows the
            bar one {DEN_NAME[P.den] || `1/${P.den}`} — <b>1/{P.den}</b>, <b>2/{P.den}</b>, <b>3/{P.den}</b>.
            Stop when the bar reaches <b>{fracWords(P.num, P.den)}</b>.
          </div>
          <div className="nl-drag-source">
            <div
              className={"nl-src-plank" + (drag ? " is-dragging" : "")}
              onPointerDown={startPieceDrag}
              role="button"
              tabIndex={0}
              aria-label={`drag a 1/${P.den} piece onto the line`}
            >
              <div className="nl-plank">
                <div className="nl-piece" style={{ width: 96, background: HUE, borderRight: "none" }}>
                  <span className="nl-piece-lab">1/{P.den}</span>
                </div>
              </div>
            </div>
            <span className="nl-src-hint">drag onto the line →</span>
          </div>
        </>
      ) : (
        <>
          <div className="hint">
            Each piece on the line is <b>1/{P.den}</b> — one of the {P.den} equal parts from
            <b> 0</b> to <b>1</b>. Count the pieces; that count goes on <b>top</b>, the
            part size <b>{P.den}</b> on the bottom. {P.num} pieces is <b>{P.num}/{P.den}</b>.
          </div>
        </>
      )}
    </div>
  );

  // ── the answer card ──────────────────────────────────────────────────────────
  // Place: grow-the-bar — no writing; the bar length IS the answer; Check advances
  // once it reaches the target. Write: the Slate fraction + Check. Numbers: the
  // placed point IS the answer; Check advances once it snapped to the target.
  let Answer;
  if (isWrite) {
    Answer = (
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
    );
  } else if (isPlace) {
    Answer = (
      <AnswerBar
        eq={
          <div className="nl-ans-eqrow">
            <span className="nl-ans-frac"><BigFrac num={P.num} den={P.den} /></span>
            <span className="nl-ans-eq">=</span>
            <span className="nl-ans-amt">{barK > 0 ? `grow the bar with 1/${P.den} blocks — ${barK}/${P.den} so far` : `drag 1/${P.den} blocks to grow the bar`}</span>
          </div>
        }
        cap={solved
          ? `grown to ${fracWords(P.num, P.den)} — that length IS the number`
          : (barK > P.num)
          ? `that's ${barK}/${P.den} — too many; reset and stop at ${P.num}/${P.den}`
          : `drop one more 1/${P.den} to reach ${fracWords(P.num, P.den)}`}
        solved={solved}
        ready={answerReady}
        stars={stars}
        onCheck={solved ? nextStage : undefined}
        checkLabel={solved ? "Next ▸" : `Add 1/${P.den}`}
        checkDisabled={!solved}
      />
    );
  } else {
    Answer = (
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
  }

  let body;
  if (stage === "practice") {
    // PRACTICE — auto-generated FRACTION_ON_LINE variations, paced by the engine.
    body = <GenPracticeBoard skill="FRACTION_ON_LINE" scaffold={sc} />;
  } else if (isR1Stage) {
    // r1-family stages (Manipulate · Numbers · Applied · Show Work · Words) are
    // part of the merged nl+r1 wireframe lesson; the real app serves them via the
    // separate #/r1 route (AppR1). Show a lightweight bridge panel.
    body = (
      <div className="nl-r1-bridge">
        <p>This stage continues in the <b>Adding Fractions</b> lesson.</p>
      </div>
    );
  } else {
    body = (
      <LessonBoard
        variant="split"
        footHeight={L.footH || 196}
        railWidth={L.railW || 396}
        stage={Stage}
        rail={Rail}
        answer={Answer}
        tutor={Tutor}
      />
    );
  }

  return (
    <>
      <LessonShell
        no={no || String(L.num).replace("№", "")}
        tag={L.tag}
        title={title || L.title}
        onBack={onBack}
        onRewatchIntro={onRewatchIntro}
        onReset={reset}
        resetTitle="Start this stage over"
        tabs={{
          stages: STAGES.map((s) => ({ key: s.key, badge: s.badge, title: s.title, sub: s.sub })),
          current: stage,
          onSelect: goStage,
          label: "Lesson stages",
        }}
        band={stage !== "practice" ? Band : null}
        goal={Goal}
      >
        {body}
      </LessonShell>

      {/* the floating drag ghost for the Stage-1 unit piece (a portal-free fixed
          overlay tracking the pointer). pointer-events none so the drop hit-test
          reads the canvas underneath. */}
      {drag && (
        <div
          className="nl-drag-ghost"
          style={{ left: drag.x, top: drag.y, background: HUE }}
        >
          <span className="nl-piece-lab">1/{P.den}</span>
        </div>
      )}
    </>
  );
}

// ── per-stage goal copy (captions, since the audience reads) ──────────────────
function stageGoal(stage, P) {
  switch (stage) {
    case "1-place":
      return (<>Grow a fraction from unit pieces. <b>Drag the 1/{P.den} block</b> onto the line again and again — the bar grows <b>1/{P.den}</b>, <b>2/{P.den}</b>, <b>3/{P.den}</b> — stop at {fracWords(P.num, P.den)}.</>);
    case "2-write":
      return (<>The bar is built from <b>1/{P.den}</b> pieces. Count how many sit on the line from <b>0</b>, and <b>write</b> that fraction — the count on top, the part size ({P.den}) on the bottom.</>);
    case "3-numbers":
      return (<>Fractions don't stop at 1! <b>{P.num}/{P.den}</b> is {fracWords(P.num, P.den)} — <b>bigger than one whole</b>. Each whole is still cut into <b>{P.den}</b> parts. <b>Drag the point past 1</b> to place it.</>);
    default:
      return "";
  }
}
