// AppSubtract.jsx — Taking Away (s1, SUB_SAME_DEN): subtracting SAME-denominator
// fractions. CCSS 4.NF.B.3a (subtract like-den) + 4.NF.B.3b (decompose a fraction
// into a sum of unit fractions). The worked example is 5/8 − 2/8 = 3/8 — take the
// tops apart, keep the bottom (the denominator is LOCKED).
//
// Subtraction is the mirror of R1's adding: instead of dragging two stacks
// TOGETHER, the child starts with the FULL stack and pulls pieces OFF. Four
// focused stages:
//
//   1 · Decompose — 5/8 shown as ONE solid stack of 5 eighths; the child "breaks"
//        it into 5 separate 1/8 pieces. The UI writes 5/8 = 1/8+1/8+1/8+1/8+1/8.
//        Award when decomposed. (4.NF.B.3b — a fraction is a sum of unit fractions.)
//   2 · Take away — 5/8 again; the child drags 2 pieces OFF into the "used" tray,
//        counts the 3 that remain, and WRITES 3 on a locked-denominator Slate
//        (bottom locked to 8). Changing the bottom -> "add_denominators" slip.
//   3 · Numbers   — a BARE equation 7/8 − 3/8 = ?; write the answer on a locked-den
//        Slate (numerator only; the bottom stays 8).
//   4 · Words     — a plain-language Babushka kitchen story; read it, find the two
//        fractions, write how much is LEFT. (Optional ungraded scratch.)
//
// Reuses (read-only): the Stack/Combined block-rendering idea + drag pattern from
// AppR1 (grabBar/move/up/dropBar, scale-calibrated by #stage width/1280), the
// locked-denominator Slate (slots with {key:"den",locked:true,digit:DEN}), Cook,
// Rosette, BigFrac, Lock, WordProblem, BlankSlate, FitStage, and the shared lesson
// library (LessonShell/LessonBoard/AnswerBar/TutorRibbon/HintRail/LessonGoal) +
// the useLessonScaffold controller backbone. Only .s1-* CONTENT rules live in s1.css.
import React, { useState, useRef, useEffect } from "react";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Lock from "./components/Lock.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import FitStage from "./components/FitStage.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";
import "./styles/s1.css";

// Geometry for the decompose/take-away canvas. UNIT = px per whole; a piece is
// UNIT/DEN wide. The take-away tray (where pulled-off pieces land) sits below the
// working line.
const UNIT = 560, CW = 720, CH = 300, PIECE_GAP = 6;

// The single worked example threaded through the manipulate stages: 5/8 − 2/8 = 3/8.
const START_N = 5, TAKE_N = 2, DEN = 8, ANSWER = START_N - TAKE_N; // 3
// The bare Numbers stage uses a second like-den problem (still den 8, in-grade).
const NUM_A = 7, NUM_B = 3, NUM_ANS = NUM_A - NUM_B; // 4

const NODE = "SUB_SAME_DEN";

// The four stages, in order. `key` matches the orchestrator's stage ids.
const STAGES = [
  { n: 1, key: "1-decompose", tab: "Decompose", sub: "break 5/8 into eighths" },
  { n: 2, key: "2-takeaway",  tab: "Take Away", sub: "drag 2 pieces off" },
  { n: 3, key: "3-numbers",   tab: "Numbers",   sub: "bare 7/8 − 3/8 = ?" },
  { n: 4, key: "4-words",     tab: "Words",     sub: "story problem" },
  // Auto-generated, estimator-paced practice: the engine mints fresh SUB_SAME_DEN
  // variations, re-rolls on a correct answer, fades to harder problems on a clean
  // streak, and probes transfer. Purely additive — no teaching stage is touched.
  { n: "practice", key: "practice", tab: "Practice", sub: "Fresh problems — paced to your mastery", badge: "★" },
];

const PIECE_W = UNIT / DEN;

// ── one row of unit (1/den) pieces. `broken` spaces them apart (decomposed); a
// `gone` set ghosts pieces that have been taken away. Colors come from the shared
// palette by denominator, exactly like Stack/Combined in R1. ──────────────────
function UnitRow({ count, den, broken = false, gone = null, label = true }) {
  const fill = denomColor(den);
  const cut = denomTone(den, 0.55);
  const labColor = denomTextColor(den);
  const hatch = denomHatch(den), hatchSize = denomHatchSize(den);
  return (
    <div className={"s1-row" + (broken ? " is-broken" : "")} style={{ gap: broken ? PIECE_GAP : 0 }}>
      {Array.from({ length: count }).map((_, i) => {
        const isGone = gone ? gone.has(i) : false;
        return (
          <div
            key={i}
            className={"s1-piece" + (isGone ? " is-gone" : "")}
            style={{
              width: PIECE_W, background: fill,
              borderRight: !broken && i < count - 1 ? `1.5px solid ${cut}` : "none",
              borderRadius: broken ? 6 : 0,
            }}
          >
            <div className="s1-piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
            {label && <span className="s1-piece-lab" style={{ color: labColor }}>1/{den}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ---------------- main ----------------
export default function AppSubtract({ no, title, onBack, onRewatchIntro, initialStage }) {
  const startN = (() => {
    const f = STAGES.find((s) => s.key === initialStage || s.n === initialStage);
    return f ? f.n : 1;
  })();

  // --- Stage 1 (decompose) state: has the solid stack been broken into pieces? ---
  const [broken, setBroken] = useState(false);

  // --- Stage 2 (take away) state: which piece indices have been pulled off ---
  // A Set of indices (0..START_N-1). `dragging` = index being dragged to the tray.
  const [taken, setTaken] = useState(() => new Set());
  const [dragIdx, setDragIdx] = useState(null);

  // --- Slate (stylus) values, shared by the write stages (2,3,4) ---
  const [slate, setSlate] = useState({ num: "", den: "" });

  // --- refs the drag/decompose mechanics read synchronously ---
  const brokenRef = useRef(broken);
  const takenRef = useRef(taken);
  useEffect(() => { brokenRef.current = broken; }, [broken]);
  useEffect(() => { takenRef.current = taken; }, [taken]);

  const SCAFFOLD_KEY = (key) => String(key);

  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "s1",
    initialStage: startN,
    stagesOrder: STAGES.map((s) => s.n),
    scaffoldKeyFor: SCAFFOLD_KEY,
    // The final "practice" stage serves auto-generated SUB_SAME_DEN variations,
    // paced by the engine (re-roll on correct, fade on a clean streak, transfer probe).
    generatedStages: ["practice"],
    generatorSkill: "SUB_SAME_DEN",
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setBroken(false); brokenRef.current = false;
      setTaken(new Set()); takenRef.current = new Set();
      setSlate({ num: "", den: "" });
      setDragIdx(null);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole arc — break it apart, take pieces away, and keep the bottom the same. Brilliant, povaryonok!" }),
  });
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, flashBad,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    say, speaking, selfCorrectionsRef,
  } = sc;

  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? d.n : key;
  };
  const curKey = STAGES.find((s) => s.n === stage)?.key;

  // ---- Stage 1 mechanic: break the solid stack into 5 separate 1/8 pieces ----
  function doBreak() {
    if (stage !== 1 || brokenRef.current || solvedRef.current) return;
    setBroken(true); brokenRef.current = true;
    setCook("cheer");
    emit({ type: "place_block", payload: { node_id: NODE } });
    award(
      `Yes! ${START_N}/${DEN} is just ${START_N} pieces of ${DEN}ths put together: 1/${DEN} + 1/${DEN} + 1/${DEN} + 1/${DEN} + 1/${DEN}. Now we can take some away.`,
      "s1Decompose",
      [START_N, DEN],
    );
  }
  function reassemble() {
    if (solvedRef.current) return;
    setBroken(false); brokenRef.current = false;
    setCook("idle");
    setStatus({ tone: "normal", text: "Put it back together — tap Break apart when you're ready." });
    selfCorrectionsRef.current += 1;
    emit({ type: "remove_block", payload: { node_id: NODE } });
  }

  // ---- Stage 2 mechanic: drag a piece OFF into the "used" tray --------------
  // Each piece is its own draggable block. We don't need pixel-perfect physics:
  // dragging a piece below the line (into the tray drop-zone) marks it taken; the
  // scale-calibrated pointer math mirrors AppR1's grabBar so it works under the
  // stage's CSS transform. A taken piece can be dragged back (self-correction).
  function grabPiece(idx, e) {
    if (stage !== 2 || solved) return;
    e.preventDefault();
    const canvas = document.getElementById("s1canvas").getBoundingClientRect();
    const k = document.getElementById("stage")?.getBoundingClientRect().width / 1280 || 1;
    setDragIdx(idx);
    const trayTop = CH * 0.58; // pieces dragged below this line land in the tray
    const move = (ev) => {
      const y = (ev.clientY - canvas.top) / k;
      // live visual feedback: mark/unmark as the pointer crosses the tray line
      const into = y > trayTop;
      setTaken((prev) => {
        const next = new Set(prev);
        if (into) next.add(idx); else next.delete(idx);
        return next;
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragIdx(null);
      dropPiece(idx);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function dropPiece(idx) {
    const isTaken = takenRef.current.has(idx);
    selfCorrectionsRef.current += 1;
    emit({ type: isTaken ? "remove_block" : "place_block", payload: { node_id: NODE } });
    const n = takenRef.current.size;
    if (n > 0 && n < START_N) {
      setCook("idle");
      const left = START_N - n;
      setStatus({ tone: n === TAKE_N ? "ok" : "normal", text: n === TAKE_N
        ? `You took ${TAKE_N} eighths away — count what's left, then write the top number. The bottom stays ${DEN}.`
        : `${n} taken away — that leaves ${left}. Babushka used ${TAKE_N}/${DEN}; drag exactly ${TAKE_N} into the tray.` });
    }
  }

  // ---- Stage 2 check: count the remaining pieces, write the numerator -------
  function checkTakeAway() {
    if (solved) { nextStage(); return; }
    const takenCount = taken.size;
    if (takenCount !== TAKE_N) {
      setCook("think");
      setStatus({ tone: "warn", text: `Babushka used ${TAKE_N}/${DEN}. Drag exactly ${TAKE_N} pieces down into the tray, then count what's left.` });
      say("s1TakeAway");
      return;
    }
    const n = parseInt(slate.num, 10);
    const d = parseInt(slate.den, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the top number — how many eighths are left?" });
      return;
    }
    // Classic slip: changing the locked bottom (subtracting the denominators).
    if (d && d !== DEN) {
      flashBad();
      setStatus({ tone: "warn", text: `Careful — the bottom stays ${DEN}. We only take pieces away from the top.` });
      say("s1TakeAway");
      reportAttempt({ correct: false, answerValue: [n, d], errorSignature: "add_denominators", stars: 0 });
      return;
    }
    if (n !== ANSWER) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — count the pieces still on the line. ${START_N} take away ${TAKE_N} is how many ${DEN}ths?` });
      reportAttempt({ correct: false, answerValue: [n, DEN], errorSignature: null, stars: 0 });
      return;
    }
    award(
      `Yes! ${START_N}/${DEN} − ${TAKE_N}/${DEN} = ${ANSWER}/${DEN}. Take the tops apart, keep the bottom ${DEN}.`,
      "s1Win",
      [ANSWER, DEN],
    );
  }

  // ---- Stage 3 / 4 Slate grader (locked-den; numerator only) ----------------
  // a − b over the shared denominator. d arg is the (possibly mistakenly written)
  // bottom; on the numerator-only stages the bottom is a locked slot so d===DEN.
  function gradeSlate({ a, b, ans, numeratorOnly }) {
    const n = parseInt(slate.num, 10);
    const d = numeratorOnly ? DEN : parseInt(slate.den, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the top number — take the tops apart." });
      return { ok: false };
    }
    if (!numeratorOnly && !(d > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: `Write the bottom number too — the bottom stays ${DEN}.` });
      return { ok: false };
    }
    if (!numeratorOnly && d !== DEN) {
      flashBad();
      setStatus({ tone: "warn", text: `Careful — keep the bottom ${DEN}; only subtract the tops. ${a} − ${b} = ?` });
      reportAttempt({ correct: false, answerValue: [n, d], errorSignature: "add_denominators", stars: 0 });
      return { ok: false };
    }
    if (n !== ans) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — subtract the tops: ${a} − ${b}. How many ${DEN}ths are left?` });
      reportAttempt({ correct: false, answerValue: [n, d || DEN], errorSignature: null, stars: 0 });
      return { ok: false };
    }
    return { ok: true };
  }
  function checkNumbers() {
    if (solved) { nextStage(); return; }
    const { ok } = gradeSlate({ a: NUM_A, b: NUM_B, ans: NUM_ANS, numeratorOnly: true });
    if (!ok) return;
    award(`Yes! ${NUM_A}/${DEN} − ${NUM_B}/${DEN} = ${NUM_ANS}/${DEN}. Subtract the tops, keep the bottom ${DEN}!`, "s1Win", [NUM_ANS, DEN]);
  }
  function checkWords() {
    if (solved) { nextStage(); return; }
    const { ok } = gradeSlate({ a: START_N, b: TAKE_N, ans: ANSWER, numeratorOnly: false });
    if (!ok) return;
    award(`Yes! ${START_N}/${DEN} − ${TAKE_N}/${DEN} = ${ANSWER}/${DEN}. That's how much loaf is left!`, "s1Win", [ANSWER, DEN]);
  }

  function reset() { goStage(1); }

  // ---- the goal banner (shared <LessonGoal>) ----
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="s1Goal" voxSpeaker="mom">
      Babushka had <b>{START_N}/{DEN}</b> of a loaf and used <b>{TAKE_N}/{DEN}</b> — the pieces are the same size, so take the tops apart and keep the bottom.
    </LessonGoal>
  );

  // The bare equation reads in the same spot on every stage except Words (4), where
  // the child must read the prose and extract the math.
  const questionBand = (
    <QuestionBand
      lead="the question"
      expr={
        stage === 3
          ? <>{NUM_A}/{DEN} <span className="qb-op">−</span> {NUM_B}/{DEN}</>
          : <>{START_N}/{DEN} <span className="qb-op">−</span> {TAKE_N}/{DEN}</>
      }
      answer={
        solved
          ? (stage === 3 ? `${NUM_ANS}/${DEN}` : `${ANSWER}/${DEN}`)
          : "?"
      }
    />
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // The "keep the bottom" hint rail (shared across the write stages).
  const Rail = (heading, hint) => (
    <HintRail heading={heading} hint={hint}>
      <div className="lockcard">
        <BigFrac num={<span style={{ color: "var(--red)" }}>−</span>} den={DEN} locked />
        <div className="lockcard-note">take tops apart<br />keep the {DEN}</div>
      </div>
    </HintRail>
  );

  const takenCount = taken.size;
  const remaining = START_N - takenCount;

  // "Ready to check": the answer the current stage needs is committed.
  const answerReady = !solved && (
    stage === 2 ? (takenCount === TAKE_N && slate.num !== "")
    : stage === 3 ? (slate.num !== "")
    : stage === 4 ? (slate.num !== "" && slate.den !== "")
    : false
  );

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  if (stage === "practice") {
    // PRACTICE — auto-generated SUB_SAME_DEN variations, paced by the mastery engine.
    body = <GenPracticeBoard skill="SUB_SAME_DEN" scaffold={sc} />;
  } else if (stage === 1) {
    // STAGE 1 · DECOMPOSE — 5/8 as one solid stack; break it into 5 unit pieces.
    body = (
      <LessonBoard
        footHeight={140}
        railWidth={396}
        stage={
          <div className="canvas s1-canvas" id="s1canvas">
            <div className="eqstate eqfloat locked"><span className="g"><Lock size={16} color="var(--ink)" /></span>bottom stays /{DEN}</div>

            <div className="s1-stagezone">
              <div className="s1-bartag"><BigFrac num={START_N} den={DEN} locked /></div>
              <UnitRow count={START_N} den={DEN} broken={broken} />
              <div className="s1-decomp-eq">
                {broken ? (
                  <>
                    {START_N}/{DEN} = {Array.from({ length: START_N }).map((_, i) => (
                      <React.Fragment key={i}>{i > 0 && <span className="s1-plus"> + </span>}1/{DEN}</React.Fragment>
                    ))}
                  </>
                ) : (
                  <>one stack of {START_N} eighths — break it into pieces</>
                )}
              </div>
            </div>
          </div>
        }
        rail={Rail("Break It Apart", <>The stack <b>{START_N}/{DEN}</b> is really {START_N} little <b>1/{DEN}</b> pieces stuck together. Break them apart so you can take some away.</>)}
        answer={
          <AnswerBar
            eq={
              <div className="s1-decomp-controls">
                {!broken ? (
                  <button className="s1-bigbtn" onClick={doBreak}>Break apart ✂</button>
                ) : (
                  <>
                    <span className="s1-decomp-done">{START_N}/{DEN} = 1/{DEN} + 1/{DEN} + 1/{DEN} + 1/{DEN} + 1/{DEN}</span>
                    {!solved && <button className="mini" title="put it back together" onClick={reassemble}>↺</button>}
                  </>
                )}
              </div>
            }
            cap={solved ? `${START_N}/${DEN} is a sum of ${START_N} unit fractions — nicely decomposed!` : "break the stack into single eighths"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { if (solved) nextStage(); }}
            checkLabel={solved ? "Next stage ▸" : "Break it first"}
            checkDisabled={!solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 2) {
    // STAGE 2 · TAKE AWAY — drag 2 pieces OFF into the tray; write the remainder.
    body = (
      <LessonBoard
        footHeight={140}
        railWidth={396}
        stage={
          <div className="canvas s1-canvas s1-canvas-takeaway" id="s1canvas">
            <div className="eqstate eqfloat locked"><span className="g"><Lock size={16} color="var(--ink)" /></span>bottom stays /{DEN}</div>

            <div className="s1-line-label">on the line — what's left</div>
            <div className="s1-takeline">
              {Array.from({ length: START_N }).map((_, i) => {
                const isTaken = taken.has(i);
                if (isTaken) return <div key={i} className="s1-piece is-slot" style={{ width: PIECE_W }} />;
                const fill = denomColor(DEN);
                const cut = denomTone(DEN, 0.55);
                const labColor = denomTextColor(DEN);
                const hatch = denomHatch(DEN), hatchSize = denomHatchSize(DEN);
                return (
                  <div
                    key={i}
                    className={"s1-piece s1-piece-drag" + (dragIdx === i ? " is-dragging" : "")}
                    style={{ width: PIECE_W, background: fill, borderRight: `1.5px solid ${cut}`, borderRadius: 6 }}
                    onPointerDown={(e) => grabPiece(i, e)}
                  >
                    <div className="s1-piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
                    <span className="s1-piece-lab" style={{ color: labColor }}>1/{DEN}</span>
                    <div className="s1-grip"><i /><i /><i /></div>
                  </div>
                );
              })}
            </div>

            <div className={"s1-tray" + (takenCount > 0 ? " has-pieces" : "")}>
              <span className="s1-tray-label">used by Babushka — drag pieces here</span>
              <div className="s1-tray-row">
                {Array.from({ length: takenCount }).map((_, i) => {
                  const fill = denomColor(DEN), cut = denomTone(DEN, 0.55), labColor = denomTextColor(DEN);
                  return (
                    <div key={i} className="s1-piece is-used" style={{ width: PIECE_W, background: fill, borderRight: `1.5px solid ${cut}` }}>
                      <span className="s1-piece-lab" style={{ color: labColor }}>1/{DEN}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="s1-count-cap">{remaining} left on the line · {takenCount} taken away</div>
          </div>
        }
        rail={Rail("Take It Away", <>Drag <b>{TAKE_N}</b> pieces down into the tray — that's what Babushka used. Count the pieces still on the line: that's the answer's <b>top</b>. The bottom stays {DEN}.</>)}
        answer={
          <AnswerBar
            eq={
              <>
                <span className="s1-frac">{START_N}/{DEN}</span>
                <span className="s1-op">−</span>
                <span className="s1-frac">{TAKE_N}/{DEN}</span>
                <span className="s1-op">=</span>
                <span className="s1-slate">
                  <Slate
                    slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom", locked: true, digit: DEN }]}
                    values={slate}
                    onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                    onSubmit={checkTakeAway}
                    layout="fraction"
                    den={DEN}
                    disabled={solved}
                    autoFocusKey="num"
                    ariaLabel="write the top number"
                  />
                </span>
              </>
            }
            cap={solved ? `full marks — ${START_N}/${DEN} − ${TAKE_N}/${DEN} = ${ANSWER}/${DEN}!` : "drag 2 pieces off, count what's left, write the top"}
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkTakeAway}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · NUMBERS — a BARE equation 7/8 − 3/8 = ?; write the numerator (the
    // bottom is a locked slot). No blocks — the numbers lead alone.
    body = (
      <LessonBoard
        footHeight={140}
        railWidth={396}
        stage={
          <div className="canvas s1-canvas s1-canvas-center" id="s1canvas">
            <div className="s1-bigeq">
              <BigFrac num={NUM_A} den={DEN} />
              <span className="s1-bigeq-op">−</span>
              <BigFrac num={NUM_B} den={DEN} />
              <span className="s1-bigeq-op">=</span>
              {solved ? <BigFrac num={NUM_ANS} den={DEN} /> : <BigFrac num="?" den={DEN} locked />}
            </div>
            <div className="s1-numbers-cap">No blocks now — subtract the tops, keep the bottom {DEN}, and write the answer.</div>
          </div>
        }
        rail={Rail("Subtract the Tops", <>Take the tops apart ({NUM_A} − {NUM_B}) and keep the bottom {DEN}. Write the top number on the Slate.</>)}
        answer={
          <AnswerBar
            eq={
              <>
                <span className="s1-frac">{NUM_A}/{DEN}</span>
                <span className="s1-op">−</span>
                <span className="s1-frac">{NUM_B}/{DEN}</span>
                <span className="s1-op">=</span>
                <span className="s1-slate">
                  <Slate
                    slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom", locked: true, digit: DEN }]}
                    values={slate}
                    onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                    onSubmit={checkNumbers}
                    layout="fraction"
                    den={DEN}
                    disabled={solved}
                    autoFocusKey="num"
                    ariaLabel="write the top number"
                  />
                </span>
              </>
            }
            cap={solved ? `full marks — ${NUM_A}/${DEN} − ${NUM_B}/${DEN} = ${NUM_ANS}/${DEN}!` : "write the top number on the Slate, then Check"}
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkNumbers}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else {
    // STAGE 4 · WORDS — a plain-language Babushka kitchen story; read it, find the
    // two fractions, write how much is LEFT. Optional ungraded scratch slate.
    const story = (
      <>
        Babushka had <b>five eighths</b> of a loaf of black bread. She sliced off{" "}
        <b>two eighths</b> for the soup. The pieces are the same size — eighths.{" "}
        How much of the loaf is <b>left</b>?
      </>
    );
    body = (
      <LessonBoard
        variant="wide"
        className="s1-words"
        tutorWidth={220}
        content={
          <FitStage axis="y">
            <WordProblem
              story={story}
              tag="Babushka's Bread"
              readAloud={() => say("Babushka had five eighths of a loaf of black bread. She sliced off two eighths for the soup. The pieces are the same size, eighths. How much of the loaf is left?")}
              speaking={speaking}
              answerLead="Write how much is left"
              setupLead="Optional — show your work here"
              setup={
                <div className="bs-surface s1-words-scratch">
                  <BlankSlate key="s1-words-scratch" hint="optional — show your work here ✎" />
                </div>
              }
              slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
              values={slate}
              onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
              layout="fraction"
              den={DEN}
              disabled={solved}
              autoFocusKey="num"
              onCheck={checkWords}
              checkLabel={solved ? "Finish ▸" : "Check"}
            />
          </FitStage>
        }
        tutor={<TutorRibbon cook={cook} status={status} narrow />}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag="Taking Away"
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      tabs={{
        stages: STAGES.map((s) => ({ key: s.key, badge: s.n, title: s.tab, sub: s.sub })),
        current: curKey,
        onSelect: (key) => goStage(toStageVal(key)),
      }}
      band={stage !== 4 && stage !== "practice" ? questionBand : null}
      goal={Goal}
    >
      {body}
    </LessonShell>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  switch (n) {
    case 1: return `${START_N}/${DEN} is one stack of ${START_N} eighths. Break it into single 1/${DEN} pieces so we can take some away.`;
    case 2: return `Drag ${TAKE_N} pieces down into the tray — that's what Babushka used. Count what's left on the line and write the top number.`;
    case 3: return `Just the numbers: ${NUM_A}/${DEN} − ${NUM_B}/${DEN} = ? Subtract the tops, keep the bottom, write the answer.`;
    case 4: return "A story this time — read it, find the two fractions, and write how much is left.";
    default: return "";
  }
}
