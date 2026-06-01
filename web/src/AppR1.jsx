// AppR1.jsx — The Cook's Lesson (R1, ADD_SAME_DEN): adding SAME-denominator
// fractions. The worked example is 2/7 + 3/7 = 5/7 — add the tops, keep the
// bottom (the denominator is LOCKED).
//
// THE FULL 5-STAGE INTERACTION ARC. Two channels fade in opposite directions:
// the BLOCK/touch channel shrinks to nothing while the STYLUS/writing (Slate)
// channel grows from "copy one numeral" to "write the whole solution".
//
//   1 · Manipulate — the blocks ARE the problem. Two stacks of same-size pieces;
//        drag them together and COUNT the tops. No writing — a numeric box.
//   2 · Bind       — the merged stack PLUS the written fraction beside it (the
//        stack IS this number); the child WRITES 5/7 on the stylus Slate.
//   3 · Fade       — the blocks dim to a faint check; the EQUATION leads; the
//        child chooses symbolically and writes the changed line on the Slate.
//   4 · Numbers    — a BARE equation 2/7 + 3/7 = ?; the child writes the whole
//        fraction on the Slate. Blocks are gone (a faded ghost remains).
//   5 · Words      — a plain-language WORD PROBLEM (no blocks, no equation
//        given); the child reads it, pulls out the numbers, writes the total.
//
// Reachability: a STAGE SELECTOR strip jumps to any stage in one click, and a
// correct answer auto-advances to the next stage.
//
// Reuses (read-only): Stack, Cook, Rosette, BigFrac, Lock (shared components),
// the new Foundations Slate + WordProblem, useVoice (clip → Web Speech
// fallback), and the denominator palette. New, namespaced .r1-* rules live in
// styles/r1.css; shared lesson.css house classes are reused by name only.
import React, { useState, useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Stack from "./components/Stack.jsx";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Lock from "./components/Lock.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import { useVoice } from "./voice.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/r1.css";

// Geometry for the manipulate canvas (matches the original room).
const ORIGIN = 60, UNIT = 320, CW = 720, CH = 346, BAR_H = 72, LINE_Y = 322;
const HOME = { A: { x: ORIGIN, y: 250 }, B: { x: ORIGIN, y: 86 } };

// The single worked example threaded through every stage: 2/7 + 3/7 = 5/7.
const A_N = 2, B_N = 3, DEN = 7, ANSWER = A_N + B_N; // 5
const answerWholes = Math.min(2, Math.max(1, Math.ceil(ANSWER / DEN))); // 1
const RULER_TICKS = answerWholes * DEN;

// The five stages, in order. `key` matches the orchestrator's stage ids.
const STAGES = [
  { n: 1, key: "1-manipulate", tab: "Manipulate", sub: "drag & count blocks" },
  { n: 2, key: "2-bind",       tab: "Bind",       sub: "blocks + write 5/7" },
  { n: 3, key: "3-fade",       tab: "Fade",       sub: "blocks dim, write" },
  { n: 4, key: "4-numbers",    tab: "Numbers",    sub: "bare 2/7 + 3/7 = ?" },
  { n: 5, key: "5-words",      tab: "Words",      sub: "story problem" },
];

// ---- the merged stack (all a+b pieces, one locked denominator) --------------
// Both addends share the denominator, so the merged stack is one uniform color —
// the visual proof that same-size pieces just combine. `dim` ghosts the blocks
// for Stage 3 (the equation leads; the blocks are only a faint check).
function Combined({ a, b, den, reveal, dim = false }) {
  const pieceW = UNIT / den;
  const total = a + b;
  const fill = denomColor(den);
  const cut = denomTone(den, 0.55);
  const labColor = denomTextColor(den);
  const hatch = denomHatch(den), hatchSize = denomHatchSize(den);
  return (
    <div className={"plank lit is-matched" + (dim ? " r1-ghostblocks" : "")} style={{ width: total * pieceW }}>
      <div className="plank-body">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: fill,
            borderRight: i < total - 1 ? `1.5px solid ${cut}` : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
            <span className="piece-lab" style={{ color: labColor, fontSize: pieceW < 58 ? 13 : 15 }}>{reveal ? i + 1 : 1}/{den}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- main ----------------
export default function AppR1({ no, title, onBack, onRewatchIntro, initialStage }) {
  // Which arc stage we're on (1..5). initialStage lets the orchestrator deep-link.
  const startN = (() => {
    const f = STAGES.find((s) => s.key === initialStage || s.n === initialStage);
    return f ? f.n : 1;
  })();
  const [stage, setStage] = useState(startN);

  // --- Engine integration (U10) ---
  const { emit, judgeAndAdvance, scaffoldLevel, decision } = useLessonEngine({
    nodeId: "ADD_SAME_DEN",
    lessonConfig: { lessonId: "r1", initialBeat: String(startN) },
  });

  // Track how many place/remove self-corrections for the current attempt.
  const selfCorrectionsRef = useRef(0);
  // Present-problem timestamp for latency (emitted on stage entry).
  const presentEmittedRef = useRef(false);

  // --- Stage 1 (manipulate) state ---
  const [merged, setMerged] = useState(false);
  const [mergeTick, setMergeTick] = useState(0);
  const [posA, _setPosA] = useState(HOME.A);
  const [posB, _setPosB] = useState(HOME.B);
  const [dragBar, setDragBar] = useState(null);

  // --- Slate (stylus) values, shared by stages 2–5 ---
  // num/den slots; the denominator is the locked padlock idea.
  const [slate, setSlate] = useState({ num: "", den: "" });

  // --- shared outcome state ---
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState({ tone: "normal", text: STAGE_INTRO(1) });

  const { soundOn, speaking, say, stopVoice, toggleSound } = useVoice();
  const mergedRef = useRef(merged), solvedRef = useRef(solved), stageRef = useRef(stage);
  const posARef = useRef(posA), posBRef = useRef(posB);
  const bodyA = useRef(), bodyB = useRef();
  useEffect(() => { mergedRef.current = merged; }, [merged]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  // Emit problem_present for the initial stage on mount.
  useEffect(() => {
    if (!presentEmittedRef.current) {
      presentEmittedRef.current = true;
      emit({
        type: "problem_present",
        payload: { node_id: "ADD_SAME_DEN", scaffold_level: toScaffoldLevel("r1", String(startN)) },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const setPosA = (p) => { posARef.current = p; _setPosA(p); };
  const setPosB = (p) => { posBRef.current = p; _setPosB(p); };

  const reveal = true; // the single worked example always teaches with the count shown
  const TICKW = UNIT / DEN;
  const stackW = (n) => (n / DEN) * UNIT;

  // Stage intro copy + voice key.
  function intro(n) {
    setStatus({ tone: "normal", text: STAGE_INTRO(n) });
  }

  // ---- enter a stage cleanly (selector click OR auto-advance) ----
  function goStage(n) {
    stopVoice();
    setStage(n); stageRef.current = n;
    setMerged(false); mergedRef.current = false;
    setSolved(false); solvedRef.current = false;
    setStars(0); setMergeTick(0); setBadInput(false);
    setSlate({ num: "", den: "" });
    setPosA(HOME.A); setPosB(HOME.B);
    setCook("idle");
    intro(n);
    // Emit problem_present for this stage (latency anchor for the engine).
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    emit({
      type: "problem_present",
      payload: { node_id: "ADD_SAME_DEN", scaffold_level: toScaffoldLevel("r1", String(n)) },
    });
    if (n >= 2) {
      // stages 2–5 write on the Slate; nudge focus is automatic via autoFocusKey
    }
  }

  function nextStage() {
    const n = Math.min(5, stageRef.current + 1);
    if (n === stageRef.current) {
      // already at the last stage — celebrate completion in place
      setStatus({ tone: "ok", text: "That's the whole arc — from dragging blocks to reading a story and writing the answer. Brilliant!" });
      return;
    }
    goStage(n);
  }

  // ---- engine integration helpers ------------------------------------------
  // Call judgeAndAdvance and apply the returned Decision to stage flow.
  // FadeScaffold → advance to next higher stage (same as nextStage).
  // RaiseScaffold → drop back to lower stage (while preserving existing work).
  // Other decisions → default: nextStage() on correct, stay on incorrect.
  function applyEngineDecision(dec, isCorrect) {
    if (!dec) return;
    if (dec.kind === "FadeScaffold") {
      // Engine says: reduce support → move forward.
      nextStage();
    } else if (dec.kind === "RaiseScaffold") {
      // Engine says: add support → go back one stage (preserve work via goStage).
      const prev = Math.max(1, stageRef.current - 1);
      if (prev !== stageRef.current) goStage(prev);
    } else if (isCorrect) {
      // PresentProblem / TransferProbe / ReturnToKitchen / default → advance on correct.
      nextStage();
    }
    // On incorrect, do nothing extra — the lesson already shows the error state.
  }

  // Emit a judged attempt and apply the engine decision.
  function reportAttempt({ correct, answerValue, errorSignature, stars: starCount }) {
    const dec = judgeAndAdvance(
      { value: answerValue, modality: "tap", recognizerConfidence: null },
      {
        correct,
        errorSignature: errorSignature ?? null,
        stars: starCount ?? 0,
        hintMaxRung: 0,
        selfCorrections: selfCorrectionsRef.current,
        surfaceForm: "stage-" + stageRef.current,
      }
    );
    selfCorrectionsRef.current = 0;
    return dec;
  }

  // ---- Stage 1 mechanic: merge the two same-size stacks into one ----
  function doMerge() {
    if (stageRef.current !== 1) return;
    if (mergedRef.current || solvedRef.current) return;
    setMerged(true); mergedRef.current = true;
    setMergeTick((t) => t + 1);
    setCook("idle");
    setStatus({ tone: "ok", text: `Same-size pieces, all counted up — that's ${ANSWER} pieces. The bottom stays ${DEN}. How many ${DEN}ths in all? Write the top number.` });
    say("r1CountUp");
  }

  function unmerge() {
    if (solvedRef.current) return;
    setMerged(false); mergedRef.current = false;
    setPosA(HOME.A); setPosB(HOME.B);
    setCook("idle"); setStatus({ tone: "normal", text: "Split them back apart — drag them together when you're ready to count." });
    say("r1Split");
    // Count a self-correction (place → remove oscillation).
    selfCorrectionsRef.current += 1;
    emit({ type: "remove_block", payload: { node_id: "ADD_SAME_DEN" } });
  }

  // ---- stacks: drag to move / bring together to merge ----
  function grabBar(id, e) {
    if (stage !== 1 || merged || solved) return;
    e.preventDefault();
    const pos = id === "A" ? posARef.current : posBRef.current;
    const canvas = document.getElementById("r1canvas").getBoundingClientRect();
    const k = document.getElementById("stage").getBoundingClientRect().width / 1280 || 1;
    const grab = { x: (e.clientX - canvas.left) / k - pos.x, y: (e.clientY - canvas.top) / k - pos.y };
    setDragBar(id);
    const move = (ev) => {
      let nx = (ev.clientX - canvas.left) / k - grab.x;
      let ny = (ev.clientY - canvas.top) / k - grab.y;
      nx = Math.max(0, Math.min(CW - stackW(id === "A" ? A_N : B_N), nx));
      ny = Math.max(0, Math.min(CH - BAR_H, ny));
      (id === "A" ? setPosA : setPosB)({ x: nx, y: ny });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); setDragBar(null); dropBar(id); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  function dropBar(id) {
    const o = id === "A" ? "B" : "A";
    const dp = id === "A" ? posARef.current : posBRef.current;
    const op = o === "A" ? posARef.current : posBRef.current;
    const dw = stackW(id === "A" ? A_N : B_N), ow = stackW(o === "A" ? A_N : B_N);
    const near = Math.abs(dp.y - op.y) < 66 && dp.x <= op.x + ow + 48 && dp.x + dw >= op.x - 48;
    if (near) { doMerge(); return; }
    const lane = HOME[id].y;
    let sx = Math.round((dp.x - ORIGIN) / TICKW) * TICKW + ORIGIN;
    sx = Math.max(ORIGIN, Math.min(ORIGIN + answerWholes * UNIT - dw, sx));
    (id === "A" ? setPosA : setPosB)({ x: sx, y: lane });
  }

  // ---- award + advance on a correct answer ----
  function award(line, voiceKeyOrText, answerValue, errorSignature) {
    setSolved(true); solvedRef.current = true; setStars(3); setCook("cheer");
    setStatus({ tone: "ok", text: line });
    if (voiceKeyOrText) say(voiceKeyOrText);
    // Report correct attempt to the engine; apply decision to stage flow.
    const dec = reportAttempt({ correct: true, answerValue: answerValue ?? null, errorSignature: null, stars: 3 });
    applyEngineDecision(dec, true);
  }

  function flashBad() {
    setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
  }

  // ---- Stage 1 check (numeric box; counts the merged pieces) ----
  function checkStage1() {
    if (solved) { nextStage(); return; }
    if (!merged) {
      setCook("think");
      setStatus({ tone: "warn", text: "Bring the two stacks together and count the pieces first." });
      say("r1FirstMerge"); return;
    }
    const n = parseInt(slate.num, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the top number — how many pieces in all?" }); return;
    }
    if (n !== ANSWER) {
      flashBad();
      const reachedForBottom = n === DEN || n === DEN * 2;
      const errSig = reachedForBottom ? "add_denominators" : null;
      setStatus({ tone: "warn", text: reachedForBottom
        ? `Careful — the bottom number is locked. We only count the tops. How many ${DEN}ths in all?`
        : `Not quite — count every piece in the joined stack. How many ${DEN}ths in all?` });
      say(reachedForBottom ? "r1KeepBottom" : "r1NotQuite");
      // Report incorrect attempt to the engine.
      reportAttempt({ correct: false, answerValue: [n, DEN], errorSignature: errSig, stars: 0 });
      return;
    }
    award(`Yes! ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}. Add the tops, keep the bottom — now let's write it.`, "r1FullMarks", [ANSWER, DEN], null);
  }

  // ---- Slate checks for stages 2–5 ----
  // Grades the handwritten fraction. `requireDen` is true for the full-fraction
  // stages (2,4,5); stage 3 only writes the numerator (the bottom is a locked
  // slot on the Slate, so den is pre-filled and not graded).
  // Returns { ok, errorSignature } rather than a bare boolean.
  function gradeSlate({ numeratorOnly = false }) {
    const n = parseInt(slate.num, 10);
    const d = numeratorOnly ? DEN : parseInt(slate.den, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the top number — add the tops together." });
      say("Write the top number. Add the tops together."); return { ok: false, errorSignature: null };
    }
    if (!numeratorOnly && !(d > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: `Write the bottom number too — the bottom stays ${DEN}.` });
      say(`Write the bottom number too. The bottom stays ${DEN}.`); return { ok: false, errorSignature: null };
    }
    if (n === DEN || (!numeratorOnly && d !== DEN)) {
      // added the bottoms, or changed the denominator — the classic slip
      flashBad();
      setStatus({ tone: "warn", text: `Careful — keep the bottom ${DEN} and only add the tops. ${A_N} + ${B_N} = ?` });
      say(`Careful. Keep the bottom ${DEN} and only add the tops.`);
      reportAttempt({ correct: false, answerValue: [n, d || DEN], errorSignature: "add_denominators", stars: 0 });
      return { ok: false, errorSignature: "add_denominators" };
    }
    if (n !== ANSWER) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — add the tops: ${A_N} + ${B_N}. How many ${DEN}ths in all?` });
      say(`Not quite. Add the tops, ${A_N} plus ${B_N}. How many sevenths in all?`);
      reportAttempt({ correct: false, answerValue: [n, d || DEN], errorSignature: null, stars: 0 });
      return { ok: false, errorSignature: null };
    }
    return { ok: true, errorSignature: null };
  }

  function checkSlateStage(numeratorOnly) {
    if (solved) { nextStage(); return; }
    const { ok } = gradeSlate({ numeratorOnly });
    if (!ok) return;
    award(`Yes! ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}. Add the tops, keep the bottom — full marks, povaryonok!`, "r1FullMarks", [ANSWER, DEN], null);
  }

  // ---- header reset: back to Stage 1, fresh board ----
  function reset() { goStage(1); }

  // ruler labels (Stage 1): every mark labelled while revealing.
  const RLAB = Array.from({ length: RULER_TICKS + 1 })
    .map((_, k) => {
      const isWhole = k % DEN === 0;
      return [k, isWhole ? String(k / DEN) : `${k}/${DEN}`, isWhole];
    })
    .filter(([, , isWhole]) => reveal || isWhole);

  // ---- stage selector strip (reachability: jump to any stage) ----
  const Selector = (
    <div className="r1-stages" role="tablist" aria-label="Lesson stages">
      {STAGES.map((s) => (
        <button
          key={s.n}
          role="tab"
          aria-selected={stage === s.n}
          className={"r1-stage-tab" + (stage === s.n ? " is-active" : "") + (stage > s.n ? " is-done" : "")}
          onClick={() => goStage(s.n)}
          title={s.sub}
        >
          <span className="r1-stage-n">{s.n}</span>
          <span className="r1-stage-txt">
            <span className="r1-stage-name">{s.tab}</span>
            <span className="r1-stage-sub">{s.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );

  // Shared topbar / goal / cook bits.
  const TopBar = (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="num-mark">№{no}</span>
        <div>
          <div className="puzzle-tag">Lesson {no} · Adding Fractions</div>
          <div className="puzzle-title">{title}</div>
        </div>
      </div>
      <div />
      <div className="controls">
        {onBack && <button className="ctrl-btn" title="Back to the lesson map" onClick={onBack}>←</button>}
        {onRewatchIntro && (
          <button className="ctrl-btn" title="Rewatch the intro video" aria-label="Rewatch the intro video" onClick={onRewatchIntro}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 8.4 L16 12 L10 15.6 Z" fill="currentColor" /></svg>
          </button>
        )}
        <button className={"ctrl-btn" + (soundOn ? " on" : "")} title={soundOn ? "Turn sound off" : "Turn sound on"} onClick={toggleSound}>
          {soundOn ? (
            <svg width="18" height="16" viewBox="0 0 18 16"><path d="M2 6 H5 L9 2 V14 L5 10 H2 Z" fill="currentColor" /><path d="M12 5 Q15 8 12 11" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M13.5 3 Q18 8 13.5 13" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
          ) : (
            <svg width="18" height="16" viewBox="0 0 18 16"><path d="M2 6 H5 L9 2 V14 L5 10 H2 Z" fill="currentColor" /><line x1="12" y1="5" x2="17" y2="11" stroke="currentColor" strokeWidth="1.6" /><line x1="17" y1="5" x2="12" y2="11" stroke="currentColor" strokeWidth="1.6" /></svg>
          )}
        </button>
        <button className="ctrl-btn" title="Start over" onClick={reset}>⟲</button>
      </div>
    </div>
  );

  const Goal = (
    <div className="goal">
      <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("r1Goal")}>
        <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
        Read aloud
      </button>
      <div className="goal-text">Babushka needs <b>{A_N}/{DEN}</b> of a tray and <b>{B_N}/{DEN}</b> of a tray — the pieces are the same size, so add the tops and keep the bottom.</div>
    </div>
  );

  const CookHud = (extraCaption) => (
    <div className="hud">
      <div className="cook-zone">
        <div className="cook-stage"><Cook expr={cook} width={118} /></div>
        <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
      </div>
      {extraCaption}
    </div>
  );

  // The marks block (Rosette + Check/Next button), shared.
  const Marks = (label, onClick) => (
    <div className="marks">
      {solved && <Rosette count={stars} />}
      <button className={"check" + (solved ? " done" : "")} onClick={onClick}>{label}</button>
    </div>
  );

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  if (stage === 1) {
    // STAGE 1 · MANIPULATE — the blocks ARE the problem. No writing.
    body = (
      <>
        <div className="play">
          <div className="diagram">
            <div className="canvas" id="r1canvas">
              <div className="eqstate eqfloat locked"><span className="g"><Lock size={16} color="var(--ink)" /></span>bottom stays /{DEN}</div>
              <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: answerWholes * UNIT }} />
              {Array.from({ length: RULER_TICKS + 1 }).map((_, k) => (
                <span key={k} className="ntick" style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y, height: k % DEN === 0 ? 14 : 8 }} />
              ))}
              {RLAB.map(([k, lab, isWhole]) => (
                <span key={k} className={"nlab" + (isWhole ? " ng" : "")} style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
              ))}

              {merged ? (
                <div className="nbar" style={{ left: HOME.A.x, top: HOME.A.y }}>
                  <div className="btag">
                    <BigFrac num={(reveal || solved) ? ANSWER : "?"} den={DEN} locked />
                    {!solved && <button className="mini" title="split them back apart" onClick={unmerge}>↺</button>}
                  </div>
                  <Combined a={A_N} b={B_N} den={DEN} reveal={reveal} />
                </div>
              ) : (
                <React.Fragment>
                  <div className={"nbar" + (dragBar === "A" ? " dragging" : "")}
                    style={{ left: posA.x, top: posA.y, width: stackW(A_N) }} onPointerDown={(e) => grabBar("A", e)}>
                    <div className="btag"><BigFrac num={A_N} den={DEN} locked /></div>
                    <Stack n={A_N} den={DEN} unit={UNIT} bodyRef={bodyA} />
                    <div className="grip"><i /><i /><i /></div>
                  </div>
                  <div className={"nbar" + (dragBar === "B" ? " dragging" : "")}
                    style={{ left: posB.x, top: posB.y, width: stackW(B_N) }} onPointerDown={(e) => grabBar("B", e)}>
                    <div className="btag"><BigFrac num={B_N} den={DEN} locked /></div>
                    <Stack n={B_N} den={DEN} unit={UNIT} bodyRef={bodyB} />
                    <div className="grip"><i /><i /><i /></div>
                  </div>
                </React.Fragment>
              )}

              {!merged && (
                <button className="joinbtn" style={{ left: ORIGIN + stackW(A_N) + 40, top: HOME.A.y + 22 }} onClick={doMerge}>▸ Count them up</button>
              )}
            </div>
          </div>

          <div className="rail">
            <div className="panel">
              <h3>Keep the Bottom</h3>
              <div className="hint">Both stacks are cut into {DEN}ths — the pieces are the same size, so you just count how many. The bottom number is locked.</div>
              <div className="lockcard">
                <BigFrac num={<span style={{ color: "var(--red)" }}>+</span>} den={DEN} locked />
                <div className="lockcard-note">add the tops<br />keep the {DEN}</div>
              </div>
            </div>
          </div>
        </div>

        {CookHud(
          <div className="hud-eq">
            <div className="qeq">
              <span>{A_N}/{DEN}</span><span className="qop">+</span><span>{B_N}/{DEN}</span><span className="qop">=</span>
              <span className="r1-stage1-slate">
                <Slate
                  slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom", locked: true, digit: DEN }]}
                  values={slate}
                  onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                  onSubmit={checkStage1}
                  layout="fraction"
                  den={DEN}
                  disabled={!merged || solved}
                  autoFocusKey="num"
                  ariaLabel="write the top number"
                />
              </span>
            </div>
            <div className="qcap">{solved ? `full marks — ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}!` : merged ? "count the pieces and write the top number" : "count the pieces to unlock the answer"}</div>
          </div>
        )}
        {Marks(solved ? "Next stage ▸" : "Check", checkStage1)}
      </>
    );
  } else if (stage === 2 || stage === 3) {
    // STAGE 2 · BIND   — merged stack PLUS the written fraction; write 5/7.
    // STAGE 3 · FADE   — blocks dim to a faint check; the equation leads; the
    //                    child writes only the changed line (the numerator).
    const numeratorOnly = stage === 3;
    const slateSlots = numeratorOnly
      ? [{ key: "num", label: "top" }, { key: "den", label: "bottom", locked: true, digit: DEN }]
      : [{ key: "num", label: "top" }, { key: "den", label: "bottom" }];

    body = (
      <>
        <div className="play r1-write-play">
          <div className="diagram">
            <div className={"canvas r1-bind-canvas" + (stage === 3 ? " r1-faded" : "")} id="r1canvas">
              <div className={"eqstate eqfloat locked"}>
                <span className="g"><Lock size={16} color="var(--ink)" /></span>bottom stays /{DEN}
              </div>

              {stage === 3 && (
                <div className="r1-fadecheck" aria-hidden="true">
                  <span className="r1-fadecheck-mark">✓</span> blocks checked — let the numbers lead
                </div>
              )}

              {/* the merged stack — solid in Bind, ghosted in Fade */}
              <div className="r1-bind-stack">
                <div className="btag"><BigFrac num={ANSWER} den={DEN} locked /></div>
                <Combined a={A_N} b={B_N} den={DEN} reveal dim={stage === 3} />
                <div className="r1-bind-cap">
                  {stage === 2
                    ? <>this one stack <b>is</b> the number {ANSWER}/{DEN} — copy it onto the Slate</>
                    : <>the blocks just confirm it — the equation leads now</>}
                </div>
              </div>

              {/* the equation leads in Fade */}
              {stage === 3 && (
                <div className="r1-leadeq">
                  <span>{A_N}/{DEN}</span><span className="qop">+</span><span>{B_N}/{DEN}</span><span className="qop">=</span>
                  <span className="r1-leadeq-blank">?/{DEN}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rail">
            <div className="panel">
              <h3>{stage === 2 ? "Write the Number" : "Write the Changed Line"}</h3>
              <div className="hint">
                {stage === 2
                  ? <>The whole joined stack <b>is</b> {ANSWER}/{DEN}. Trace that numeral on the Slate — top, then bottom. The bottom is still {DEN}.</>
                  : <>The bottom is locked to {DEN}, so you only write the <b>top</b>. Add the tops: {A_N} + {B_N}.</>}
              </div>
              <div className="r1-slate-wrap">
                <Slate
                  slots={slateSlots}
                  values={slate}
                  onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                  onSubmit={() => checkSlateStage(numeratorOnly)}
                  layout="fraction"
                  den={DEN}
                  disabled={solved}
                  autoFocusKey="num"
                  ariaLabel={"write " + (numeratorOnly ? "the top number" : "the answer fraction")}
                />
              </div>
            </div>
          </div>
        </div>

        {CookHud(
          <div className="hud-eq">
            <div className="qeq">
              <span>{A_N}/{DEN}</span><span className="qop">+</span><span>{B_N}/{DEN}</span><span className="qop">=</span>
              <span className="r1-eq-answer">{solved ? `${ANSWER}/${DEN}` : (numeratorOnly ? `?/${DEN}` : "?/?")}</span>
            </div>
            <div className="qcap">{solved ? `full marks — ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}!` : "write your answer on the Slate, then Check"}</div>
          </div>
        )}
        {Marks(solved ? "Next stage ▸" : "Check", () => checkSlateStage(numeratorOnly))}
      </>
    );
  } else if (stage === 4) {
    // STAGE 4 · NUMBERS — a BARE equation; write the whole fraction. Blocks gone
    // (a faded ghost behind the equation).
    body = (
      <>
        <div className="play r1-write-play">
          <div className="diagram">
            <div className="canvas r1-numbers-canvas" id="r1canvas">
              <div className="r1-ghost-rail" aria-hidden="true">
                <Combined a={A_N} b={B_N} den={DEN} reveal dim />
              </div>
              <div className="r1-bigeq">
                <BigFrac num={A_N} den={DEN} />
                <span className="r1-bigeq-op">+</span>
                <BigFrac num={B_N} den={DEN} />
                <span className="r1-bigeq-op">=</span>
                <span className="r1-bigeq-q">{solved ? <BigFrac num={ANSWER} den={DEN} /> : "?"}</span>
              </div>
              <div className="r1-numbers-cap">No blocks now — add the tops, keep the bottom, and write the whole answer.</div>
            </div>
          </div>

          <div className="rail">
            <div className="panel">
              <h3>Write the Whole Answer</h3>
              <div className="hint">Add the tops ({A_N} + {B_N}) and keep the bottom {DEN}. Write both numbers on the Slate.</div>
              <div className="r1-slate-wrap">
                <Slate
                  slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
                  values={slate}
                  onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                  onSubmit={() => checkSlateStage(false)}
                  layout="fraction"
                  den={DEN}
                  disabled={solved}
                  autoFocusKey="num"
                  ariaLabel="write the answer fraction"
                />
              </div>
            </div>
          </div>
        </div>

        {CookHud(
          <div className="hud-eq">
            <div className="qeq">
              <span>{A_N}/{DEN}</span><span className="qop">+</span><span>{B_N}/{DEN}</span><span className="qop">=</span>
              <span className="r1-eq-answer">{solved ? `${ANSWER}/${DEN}` : "?/?"}</span>
            </div>
            <div className="qcap">{solved ? `full marks — ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}!` : "write the whole fraction on the Slate, then Check"}</div>
          </div>
        )}
        {Marks(solved ? "Next stage ▸" : "Check", () => checkSlateStage(false))}
      </>
    );
  } else {
    // STAGE 5 · WORDS — a plain-language story; read it, pull the numbers, write
    // the total. No blocks, no given equation.
    const story = (
      <>
        Babushka used <b>two sevenths</b> of the oats for the porridge, then poured in{" "}
        <b>three sevenths</b> more. The pieces are the same size — sevenths.{" "}
        How much of the oats did she use in all?
      </>
    );
    body = (
      <div className="play r1-words-play">
        <WordProblem
          story={story}
          tag="Babushka's Recipe"
          readAloud={() => say("Babushka used two sevenths of the oats, then poured in three sevenths more. The pieces are the same size. How much of the oats did she use in all?")}
          speaking={speaking}
          answerLead="Write how much in all"
          slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
          values={slate}
          onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
          layout="fraction"
          den={DEN}
          disabled={solved}
          autoFocusKey="num"
          onCheck={() => checkSlateStage(false)}
          checkLabel={solved ? "Finish ▸" : "Check"}
        />
        {CookHud(null)}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="foxing" />
      {TopBar}
      {Goal}
      {Selector}
      {body}
    </div>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  switch (n) {
    case 1: return "Two stacks of the same-size pieces. Drag them together to count them up.";
    case 2: return `All one stack now — this whole stack IS the number ${ANSWER}/${DEN}. Write it on the Slate.`;
    case 3: return "The blocks just confirm it now — let the equation lead. Write the top number on the Slate.";
    case 4: return `Just the numbers: ${A_N}/${DEN} + ${B_N}/${DEN} = ? Write the whole answer on the Slate.`;
    case 5: return "A story this time — read it, find the two fractions, and write how much in all.";
    default: return "";
  }
}
