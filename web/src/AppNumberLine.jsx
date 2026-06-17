// AppNumberLine.jsx — Lesson No.5 "Same Denominators" (room `nl`,
// FRACTION_ON_LINE). CCSS 3.NF.A.2: a fraction is a NUMBER located on the number
// line, found by cutting 0→1 into `den` equal parts and counting `num` of them
// from 0. nl's own two stages are built on the shared <NumberLine> ruler; the
// remaining steps (3–7 + ★Practice) are the REAL AppR1 same-denominator-addition
// stages, folded in inline via <AppR1 mergeHost=…> (the wireframe nl+r1 merge).
//
// THE INTERACTION ARC — two focused number-line stages here, then the merged r1
// addition stages, reachable one-click from the stage selector and advanced
// one-by-one on a correct answer.
//
//   1 · Place   (Manipulate) — a 0→1 line cut into `den` equal parts and a tray
//       holding ONE reusable 1/den unit piece. The child DRAGS that piece onto
//       the line again and again to GROW a bar — 1/4, 2/4, 3/4 — stopping at the
//       target three fourths. No writing. (REDESIGNED to match the wireframe's
//       block-stacking paradigm: grow a fraction from identical unit pieces.)
//   2 · Write   (Bind) — the line shows a fixed marked point at a/b (2/3); the
//       child WRITES that fraction on a Slate (layout="fraction"). Exact a and b.
//   3–7 · (merged r1) Manipulate · Numbers · Applied · Show Work · Words, plus
//       ★Practice — same-denominator ADDITION, served by <AppR1 mergeHost>.
//
// LAYOUT comes from the shared lesson library (LessonShell + LessonBoard +
// AnswerBar + TutorRibbon + RailInstruction); identity + the tab strip come from the
// central registry (web/src/lessons/nl.js) — NOT inlined. The controller backbone
// (engine wiring, stage nav, outcome state) comes from useLessonScaffold. The
// number-line is the shared <NumberLine> component. Room-specific content CSS
// lives in styles/nl.css, namespaced .nl-…
import React, { useState, useRef } from "react";
import NumberLine from "./components/NumberLine.jsx";
import Slate from "./components/Slate.jsx";
import BigFrac from "./components/BigFrac.jsx";
import FitStage from "./components/FitStage.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, RailInstruction } from "./components/lesson";
import AppR1 from "./AppR1.jsx";
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
  // tabs 3–7 come from the merged r1 family (wireframe nl+r1 merge). Their content
  // is the REAL AppR1 interactive stage, rendered inline by delegating to <AppR1>
  // (see the isR1Stage branch below) — NOT a bridge panel. The nl `r1-*` stage key
  // maps to AppR1's own stage key via R1_STAGE_KEY.
  "3": "r1-manipulate",
  "4": "r1-numbers",
  "5": "r1-applied",
  "6": "r1-showwork",
  "7": "r1-words",
  // ★Practice is the merged lesson's CONSOLIDATION step. Steps 3–7 are all
  // same-denominator ADDITION, so practice must re-roll ADD_SAME_DEN variations,
  // not number-line placement. We let the AppR1 mergeHost own this tab (it already
  // has an estimator-paced ADD_SAME_DEN GenPracticeBoard on its own "practice"
  // stage, node ADD_SAME_DEN), rather than bouncing to nl's FRACTION_ON_LINE
  // practice. So ★ maps to an r1-* stage key and renders through <AppR1>.
  "★": "r1-practice",
};

// nl r1-stage key → AppR1's own stage key (its STAGES `.key`). nl folds in only
// the wireframe-listed r1 stages (Manipulate · Numbers · Applied · Show Work ·
// Words) plus the shared ★Practice (ADD_SAME_DEN); AppR1's Bind/Fade/Workbench
// are intentionally NOT part of the merged strip, so they are unreachable from nl
// (matching the wireframe nl lesson).
const R1_STAGE_KEY = {
  "r1-manipulate": "1-manipulate",
  "r1-numbers": "5-numbers",
  "r1-applied": "6-applied",
  "r1-showwork": "showwork",
  "r1-words": "7-words",
  // ★Practice → AppR1's own generated-practice stage (ADD_SAME_DEN).
  "r1-practice": "practice",
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

// ── nl's two OWN teaching stages (logic/order, not chrome). The TAB labels/subs/
//   badges come from the registry (L.tabs); these keys carry the per-stage MODEL
//   the controller routes by. Tabs 3–7 + ★Practice are served by the AppR1
//   mergeHost (same-denominator addition), not by this component. ──
//   1-place : 3/4 on a 0→1 line (den 4) — GROW a bar from 1/4 unit pieces.
//   2-write : 2/3 on a 0→1 line (den 3) — the point is fixed; WRITE the name.

// Per-stage problem: the fraction, its ruler width (wholes), and the denominator.
function probFor(s) {
  switch (s) {
    case "1-place":   return { num: 3, den: 4, wholes: 1 };
    case "2-write":   return { num: 2, den: 3, wholes: 1 };
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

export default function AppNumberLine({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {
  // DOMAIN STATE the hook does not own.
  // barK = how many 1/den unit pieces have been stacked onto the line (Stage 1 —
  // grow a bar). slate = Stage 2 written name.
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
    // The merged lesson's ★Practice consolidates same-denominator ADDITION, so it
    // is served by the AppR1 mergeHost (its own ADD_SAME_DEN GenPracticeBoard,
    // node ADD_SAME_DEN) — NOT a FRACTION_ON_LINE placement stage here. nl owns
    // only its number-line teaching stages (Place / Write), so it declares no
    // generated stage of its own.
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setBarK(0); setSlate({ n: "", d: "" }); setDrag(null);
    },
  });
  const {
    stage, goStage, nextStage,
    reportAttempt, award,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    sayPhase, speaking, stageRef,
  } = sc;

  // ── nl+r1 MERGE: tabs 3–7 AND ★Practice ARE the real AppR1 interactive stages,
  // rendered inline by delegating the whole page to <AppR1 mergeHost=…>. AppR1
  // brings its own shell + self-drives its stages, but we hand it the nl 8-tab
  // strip and the nl-merged stage SUBSET/order (Manipulate · Numbers · Applied ·
  // Show Work · Words · ★Practice — r1's Bind/Fade/Workbench are excluded, matching
  // the wireframe nl). ★Practice consolidates same-denominator ADDITION, so it is
  // AppR1's own ADD_SAME_DEN practice (NOT nl's number-line placement). Backing
  // before Manipulate hands control back to nl's Write stage. A click on a non-r1
  // nl tab (Place / Write) routes back here via mergeHost.onNative. The `key` is
  // stable across the r1 stages so AppR1 keeps its own state while auto-advancing
  // through them; goStage(R1_STAGE_KEY[stage]) only sets the ENTRY stage on first
  // mount. ──
  if (stage && stage.startsWith("r1-")) {
    const stripStages = STAGES.map((s) => ({ key: s.key, badge: s.badge, title: s.title, sub: s.sub }));
    // AppR1 stage VALUE `n` (its STAGES.n) ↔ nl strip key, both directions.
    const N_BY_HOSTKEY = { "r1-manipulate": 1, "r1-numbers": 5, "r1-applied": 6, "r1-showwork": "sw", "r1-words": 7, "r1-practice": "practice" };
    const HOSTKEY_BY_N = { 1: "r1-manipulate", 5: "r1-numbers", 6: "r1-applied", sw: "r1-showwork", 7: "r1-words", practice: "r1-practice" };
    return (
      <AppR1
        key="nl-r1-merge"
        initialStage={R1_STAGE_KEY[stage]}
        onBack={onBack}
        onRewatchIntro={onRewatchIntro}
        stumpingRecipe={stumpingRecipe}
        onReturnToKitchen={onReturnToKitchen}
        mergeHost={{
          no: no || String(L.num).replace("№", ""),
          tag: L.tag,
          title: title || L.title,
          label: "Lesson stages",
          stages: stripStages,
          order: [1, 5, 6, "sw", 7, "practice"], // nl-merged r1 stage values, in nl order (★Practice last)
          nFromHostKey: N_BY_HOSTKEY,
          hostKeyForN: HOSTKEY_BY_N,
          onNative: (hostKey) => goStage(hostKey), // Place/Write → nl stages
          // ★Practice now lives inside the merge (AppR1's ADD_SAME_DEN practice),
          // so there is no forward hand-back; backing before Manipulate → nl Write.
          onExitBack: () => goStage("2-write"),
        }}
      />
    );
  }

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

  // Dragging a piece onto the line only GROWS the bar — it never grades. The child
  // builds freely and presses "Check" (checkPlace) when they think it's right.
  function addPiece() {
    if (solvedRef.current) return;
    const stg = stageRef.current;
    const p = probFor(stg);
    const next = Math.min(barK + 1, p.wholes * p.den);
    setBarK(next);
    setCook("idle");
    setStatus({ tone: "normal", text: `${next}/${p.den} so far — drag 1/${p.den} blocks until the bar reaches ${fracWords(p.num, p.den)}, then press Check.` });
  }

  // Tapping the bar takes the LAST piece back off — so a child who drags one too
  // many can correct it without clearing the whole bar (⟲ still resets all).
  function removePiece() {
    if (solvedRef.current || stageRef.current !== "1-place") return;
    if (barK <= 0) return;
    const p = probFor(stageRef.current);
    const next = barK - 1;
    setBarK(next);
    setCook("idle");
    setStatus({ tone: "normal", text: next === 0
      ? `Bar cleared — drag 1/${p.den} blocks onto the line to reach ${fracWords(p.num, p.den)}.`
      : `${next}/${p.den} now — keep dragging 1/${p.den} blocks (or tap a block to take one off), then press Check.` });
  }

  // Grade the grown bar against the target on an explicit Check (Stage 1 · Place).
  function checkPlace() {
    if (solvedRef.current) { nextStage(); return; }
    const p = probFor(stageRef.current);
    if (barK === p.num) {
      // award sets solved → the Check button flips to "Next ▸"; the child taps it.
      award(`Right on it! ${fracWords(p.num, p.den)} is ${p.num} pieces of size 1/${p.den} from 0 — that length IS the number. Next stage!`, null, [p.num, p.den], { modality: "drag" });
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: barK > p.num
        ? `That's ${barK}/${p.den} — past ${fracWords(p.num, p.den)}. Press ⟲ to clear the bar and stop at the ${ONES[p.num]}th piece.`
        : `That's ${barK}/${p.den} — not yet ${fracWords(p.num, p.den)}. Keep stacking 1/${p.den} pieces, then Check again.` });
      reportAttempt({ correct: false, answerValue: [barK, p.den], errorSignature: null, stars: 0, modality: "drag" });
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
      reportAttempt({ correct: false, answerValue: [tn, td], errorSignature: tn === P.den && td === P.num ? "flipped" : null, stars: 0 });
      return;
    }
    // award sets solved → the Check button flips to "Next ▸"; the child taps it
    // to advance (no auto-advance; they see the success first).
    award(`Yes! That point is ${fracWords(P.num, P.den)} — ${P.num} parts of size 1/${P.den}. The bottom tells the part size, the top counts them. Next stage!`, null, [tn, td]);
  }

  // Reset the CURRENT stage (toolbar ⟲).
  function reset() { goStage(stageRef.current); }

  // ── derived view state ──────────────────────────────────────────────────────
  const isPlace = stage === "1-place";
  const isWrite = stage === "2-write";
  // NB: r1-family stages (Manipulate · Numbers · Applied · Show Work · Words ·
  // ★Practice) are handled by the early <AppR1 mergeHost> delegation ABOVE —
  // execution never reaches here on an r1-* stage, so the body below only renders
  // nl's own stages (Place / Write).
  const pointVal = P.num / P.den;                // Write: the fixed marked-point value in wholes
  const slateFilled = slate.n !== "" && slate.d !== "";
  const answerReady = !solved && (
    isPlace ? barK === TARGET_K : slateFilled
  );

  // the labelled ticks the NumberLine paints: 0, every whole, and (on Write) the
  // marked-point's own fraction tick so the child can read what they're naming.
  const marks = isWrite ? [{ value: P.num / P.den, label: `${P.num}/${P.den}` }] : [];

  // ── shared chrome ─────────────────────────────────────────────────────────
  // Wave-F: the goal banner + QuestionBand are gone. The task copy + Read-aloud
  // pill live in the rail (<RailInstruction>); the tutor ribbon is corrective-only.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── the number-line canvas (the stage's interaction area) ────────────────────
  // Stage 1 GROWS a bar of stacked 1/den pieces above the line; Stage 2 (Write)
  // uses the shared NumberLine with a FIXED marked point to name.
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
                  className={"nl-bar" + (!solved ? " is-editable" : "")}
                  style={{ left: ORIGIN, top: LINE_Y - 64, width: barK * PIECE_PX }}
                  onClick={solved ? undefined : removePiece}
                  role={!solved ? "button" : undefined}
                  title={!solved ? "tap to take the last block off" : undefined}
                  aria-label={!solved ? `take a 1/${P.den} block off the line` : undefined}
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
            />
          )}
        </div>
      </div>
    </FitStage>
  );

  // ── the per-stage rail-as-instruction card (Wave-F) ──────────────────────────
  // The task copy + the Read-aloud pill sit at the TOP of the rail (replacing the
  // deleted goal banner). On Place, the draggable 1/den unit-piece tray rides as
  // `extra` below the instruction card (the wireframe's .nl-drag-source).
  const Rail = (
    <RailInstruction
      say={sayPhase}
      speaking={speaking}
      voxSpeaker="cook"
      heading={isPlace ? "Build Three Fourths" : "A Fraction Is a Number"}
      extra={isPlace ? (
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
      ) : null}
    >
      {isPlace ? (
        <>
          Drag the <b>1/{P.den}</b> block onto the line, again and again. Each drop grows the
          bar one {DEN_NAME[P.den] || `1/${P.den}`} — <b>1/{P.den}</b>, <b>2/{P.den}</b>, <b>3/{P.den}</b>.
          Stop when the bar reaches <b>{fracWords(P.num, P.den)}</b>. Dragged one too many?
          <b> Tap the bar</b> to take a block off.
        </>
      ) : (
        <>
          Each piece on the line is <b>1/{P.den}</b> — one of the {P.den} equal parts from
          <b> 0</b> to <b>1</b>. Count the pieces; that count goes on <b>top</b>, the
          part size <b>{P.den}</b> on the bottom. {P.num} pieces is <b>{P.num}/{P.den}</b>.
        </>
      )}
    </RailInstruction>
  );

  // ── the answer card ──────────────────────────────────────────────────────────
  // Place: grow-the-bar — no writing; the bar length IS the answer; Check advances
  // once it reaches the target. Write: the Slate fraction + Check.
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
        solved={solved}
        ready={answerReady}
        stars={stars}
        onCheck={solved ? nextStage : checkPlace}
        checkLabel={solved ? "Next ▸" : "Check"}
        checkDisabled={!solved && barK === 0}
      />
    );
  }

  // Only nl's OWN teaching stages (Place / Write) reach here — the r1-family tabs
  // (3–7 AND ★Practice) are served by the <AppR1 mergeHost> early return above.
  const body = (
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
