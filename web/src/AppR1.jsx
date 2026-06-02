// AppR1.jsx — The Cook's Lesson (R1, ADD_SAME_DEN): adding SAME-denominator
// fractions. The worked example is 2/7 + 3/7 = 5/7 — add the tops, keep the
// bottom (the denominator is LOCKED).
//
// THE FULL 7-STAGE INTERACTION ARC. Two channels fade in opposite directions:
// the BLOCK/touch channel shrinks to nothing while the STYLUS/writing (Slate)
// channel grows from "copy one numeral" to "write the whole solution".
//
//   1 · Manipulate — the blocks ARE the problem. Two stacks of same-size pieces;
//        drag them together and COUNT the tops. No writing — a numeric box.
//   2 · Bind       — the merged stack PLUS the written fraction beside it (the
//        stack IS this number); the child WRITES 5/7 on the stylus Slate.
//   3 · Fade       — the blocks dim to a faint check; the EQUATION leads; the
//        child chooses symbolically and writes the changed line on the Slate.
//   4 · Workbench  — the shared <BlockSandbox>: a bin of fraction blocks (sevenths
//        + distractor sizes) the child CHOOSES from, stacks, and counts to 5/7.
//   5 · Numbers    — a BARE equation 2/7 + 3/7 = ?; the child writes the whole
//        fraction on the Slate. Blocks are gone.
//   6 · Applied    — a short applied sentence (numerals shown) with a REQUIRED
//        setup gate: write the sum 2/7 + 3/7 first, then the answer unlocks.
//   7 · Words      — a plain-language WORD PROBLEM (no blocks, no equation given);
//        an OPTIONAL ungraded scratch lets the child write the sum; the child
//        reads it, pulls out the numbers, writes the total.
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
import BlockSandbox from "./components/BlockSandbox.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import ExpressionSlate from "./components/ExpressionSlate.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import SettingsButton from "./SettingsButton.jsx";
import { useVoice } from "./voice.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/r1.css";

// Geometry for the manipulate canvas (matches the original room).
// LINE_Y/HOME.A sit high enough that the ruler labels (drawn at LINE_Y+12) stay
// inside the fixed, clipped block zone (.r1-s1-canvas is 336px tall) instead of
// being cut off below it. The lower stack rests its bottom edge on the ruler.
const ORIGIN = 60, UNIT = 320, CW = 500, CH = 336, BAR_H = 72, LINE_Y = 304;
const HOME = { A: { x: ORIGIN, y: 232 }, B: { x: ORIGIN, y: 86 } };

// The single worked example threaded through every stage: 2/7 + 3/7 = 5/7.
const A_N = 2, B_N = 3, DEN = 7, ANSWER = A_N + B_N; // 5
const answerWholes = Math.min(2, Math.max(1, Math.ceil(ANSWER / DEN))); // 1
const RULER_TICKS = answerWholes * DEN;

// The seven stages, in order. `key` matches the orchestrator's stage ids.
// Arc (lesson-stage-arc-expansion): Manipulate, Bind, Fade, Workbench, Numbers,
// Applied, Words. Workbench (4) = the shared <BlockSandbox>; Applied (6) = an
// applied sentence with a REQUIRED word→math setup gate (<ExpressionSlate>).
const STAGES = [
  { n: 1, key: "1-manipulate", tab: "Manipulate", sub: "drag & count blocks" },
  { n: 2, key: "2-bind",       tab: "Bind",       sub: "blocks + write 5/7" },
  { n: 3, key: "3-fade",       tab: "Fade",       sub: "blocks dim, write" },
  { n: 4, key: "4-workbench",  tab: "Workbench",  sub: "build it from the bin" },
  { n: 5, key: "5-numbers",    tab: "Numbers",    sub: "bare 2/7 + 3/7 = ?" },
  { n: 6, key: "6-applied",    tab: "Applied",    sub: "write the sum, then total" },
  // String-keyed mandatory step (does NOT renumber the lesson). scaffoldMap maps
  // "showwork" -> level 3; the slate is ungraded — advancing is gated only on ink.
  { n: "sw", key: "showwork",  tab: "Show Work",  sub: "show your work" },
  { n: 7, key: "7-words",      tab: "Words",      sub: "story problem" },
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

  // --- Slate (stylus) values, shared by the write stages (2,3,5,6,7) ---
  // num/den slots; the denominator is the locked padlock idea.
  const [slate, setSlate] = useState({ num: "", den: "" });

  // --- word→math surfaces (Applied gate) ---
  // Applied (6): the child TRANSCRIBES the two shown fractions here; once they
  // match 2/7 and 3/7 (either order) the answer Slate unlocks (setupOk). The Words
  // (7) optional scratch is now a free-form BlankSlate (ungraded; no state needed).
  const [setupA, setSetupA] = useState({ num: "", den: "" });
  const [setupB, setSetupB] = useState({ num: "", den: "" });
  const [setupOk, setSetupOk] = useState(false);
  // --- mandatory "show your work" step (ungraded; ink-presence gate) ---
  const [showWorkInked, setShowWorkInked] = useState(false);

  // --- shared outcome state ---
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState({ tone: "normal", text: STAGE_INTRO(1) });

  const { speaking, say, stopVoice } = useVoice();
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
    // reset the word→math surfaces (Applied gate + Words scratch) on every entry
    setSetupA({ num: "", den: "" }); setSetupB({ num: "", den: "" }); setSetupOk(false);
    setShowWorkInked(false);
    setPosA(HOME.A); setPosB(HOME.B);
    setCook("idle");
    intro(n);
    // Emit problem_present for this stage (latency anchor for the engine).
    // The mandatory "show your work" step is keyed by the string "showwork" so
    // scaffoldMap returns its dedicated level (3); numeric stages pass through.
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    emit({
      type: "problem_present",
      payload: { node_id: "ADD_SAME_DEN", scaffold_level: toScaffoldLevel("r1", n === "sw" ? "showwork" : String(n)) },
    });
    if (n >= 2) {
      // stages 2–5 write on the Slate; nudge focus is automatic via autoFocusKey
    }
  }

  function nextStage() {
    // Advance by STAGES ORDER (not arithmetic) so the string-keyed "showwork"
    // step (n: "sw") sits correctly between Applied (6) and Words (7).
    const idx = STAGES.findIndex((s) => s.n === stageRef.current);
    if (idx < 0 || idx >= STAGES.length - 1) {
      // already at the last stage — celebrate completion in place
      setStatus({ tone: "ok", text: "That's the whole arc — from dragging blocks to reading a story and writing the answer. Brilliant!" });
      return;
    }
    goStage(STAGES[idx + 1].n);
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

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

  // ---- Stage 4 · WORKBENCH — the shared <BlockSandbox> reports a clean row ----
  // The sandbox only fires onSolve for a SAME-SIZE row that reaches the target, so
  // {num,den} is always a gradable fraction. We set the answer to it, then run the
  // room's award/solve + engine-report path. (Distractor sizes in the bin mean a
  // wrong-size row simply never reaches the flag as one size.)
  function onSandboxSolve({ num, den }) {
    if (solvedRef.current) return;
    setSlate({ num: String(num), den: String(den) });
    award(`Yes! ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN} — built from same-size pieces and counted up. Brilliant!`, "r1FullMarks", [num, den], null);
  }

  // ---- Stage 6 · APPLIED — the required word→math setup gate -----------------
  // Correct when the two written fractions ARE 2/7 and 3/7, in either order; then
  // the answer Slate (write 5/7) unlocks. Reuses the same Slate grader downstream.
  function checkSetup() {
    const an = parseInt(setupA.num, 10), ad = parseInt(setupA.den, 10);
    const bn = parseInt(setupB.num, 10), bd = parseInt(setupB.den, 10);
    if (!(an > 0 && ad > 0 && bn > 0 && bd > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write both fractions from the question — a top and a bottom for each." });
      return;
    }
    const match = (x, y) => x.n === y.n && x.d === y.d;
    const A = { n: an, d: ad }, B = { n: bn, d: bd };
    const P = { n: A_N, d: DEN }, Q = { n: B_N, d: DEN };
    const ok = (match(A, P) && match(B, Q)) || (match(A, Q) && match(B, P));
    if (!ok) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — copy the two fractions exactly as the question gives them: ${A_N}/${DEN} and ${B_N}/${DEN}.` });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: "That's the sum. Now add the tops, keep the bottom, and write the total." });
  }
  function onSetupChange(side, key, value) {
    const v = onlyDigits(value);
    if (side === "a") setSetupA((s) => ({ ...s, [key]: v }));
    else setSetupB((s) => ({ ...s, [key]: v }));
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
        <SettingsButton />
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
      <div className="goal-text" data-vox="r1Goal" data-vox-speaker="mom">Babushka needs <b>{A_N}/{DEN}</b> of a tray and <b>{B_N}/{DEN}</b> of a tray — the pieces are the same size, so add the tops and keep the bottom.</div>
    </div>
  );

  // ── THE QUESTION, MADE PROMINENT ───────────────────────────────────────────
  // The shared <QuestionBand> now carries the bare equation. It is mounted ONCE,
  // as a full-width row directly UNDER the stage-selector tabs (see the return
  // block), so the question reads in the exact same spot on every stage and never
  // overlaps the working area. The bare equation body + the "?"→solved answer are
  // the lesson's data; goal/story/helper copy stays secondary below it.
  const questionBand = (
    <QuestionBand
      lead="the question"
      expr={<>{A_N}/{DEN} <span className="qb-op">+</span> {B_N}/{DEN}</>}
      answer={solved ? `${ANSWER}/${DEN}` : "?"}
    />
  );

  // "Ready to check": the child has committed the answer the current stage needs,
  // so the Check button lights up (a red glow) to say "you can check now". Stage 1
  // also needs the stacks merged; stage 3 writes only the numerator (den locked).
  const answerReady = !solved && (
    stage === 1 ? (merged && slate.num !== "")
    : stage === 3 ? (slate.num !== "")
    : stage === 6 ? (setupOk && slate.num !== "" && slate.den !== "")
    : (slate.num !== "" && slate.den !== "")
  );

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  if (stage === 1) {
    // STAGE 1 · MANIPULATE — the blocks ARE the problem. No writing.
    //
    // DETERMINISTIC LAYOUT: every region is a fixed rectangle inside the
    // 1280×800 stage (see .r1-s1* in r1.css). The block zone, the equation+
    // answer card, the tutor zone and the hint rail are absolutely positioned
    // with fixed geometry, so a longer string or a different font (Safari vs.
    // headless Chromium) can NEVER reflow one zone into another. A guaranteed
    // gap sits between the block zone (top) and the equation+answer card below.
    body = (
      <div className="r1-s1">
        {/* ── BLOCK-MANIPULATION ZONE (fixed rect, top-left) ── */}
        <div className="r1-s1-blocks">
          <div className="canvas r1-s1-canvas" id="r1canvas">
            <div className="eqstate eqfloat locked"><span className="g"><Lock size={16} color="var(--ink)" /></span>bottom stays /{DEN}</div>
            <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: answerWholes * UNIT }} />
            {Array.from({ length: RULER_TICKS + 1 }).map((_, k) => (
              <span key={k} className="ntick" style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y, height: k % DEN === 0 ? 14 : 8 }} />
            ))}
            {RLAB.map(([k, lab, isWhole]) => (
              <span key={k} className={"nlab" + (isWhole ? " ng" : "")} style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
            ))}

            {merged ? (
              <div className="nbar" style={{ left: HOME.A.x, top: 140 }}>
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
          </div>
        </div>

        {/* ── HINT RAIL (fixed rect, top-right) ── */}
        <div className="r1-s1-rail">
          <div className="panel">
            <h3>Keep the Bottom</h3>
            <div className="hint">Both stacks are cut into {DEN}ths — the pieces are the same size, so you just count how many. The bottom number is locked.</div>
            <div className="lockcard">
              <BigFrac num={<span style={{ color: "var(--red)" }}>+</span>} den={DEN} locked />
              <div className="lockcard-note">add the tops<br />keep the {DEN}</div>
            </div>
          </div>
        </div>

        {/* ── EQUATION + ANSWER, ONE UNIT (fixed rect, below the blocks) ── */}
        <div className="r1-s1-answer">
          <div className="r1-s1-eqrow">
            <span className="r1-s1-frac">{A_N}/{DEN}</span>
            <span className="r1-s1-op">+</span>
            <span className="r1-s1-frac">{B_N}/{DEN}</span>
            <span className="r1-s1-op">=</span>
            <span className="r1-s1-slate">
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
          <div className="r1-s1-cap">{solved ? `full marks — ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}!` : merged ? "count the pieces — write the top number" : "count the pieces to unlock the answer"}</div>
          <div className="r1-s1-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage1}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r1-s1-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  } else if (stage === 2 || stage === 3) {
    // STAGE 2 · BIND   — merged stack PLUS the written fraction; write 5/7.
    // STAGE 3 · FADE   — blocks dim to a faint check; the equation leads; the
    //                    child writes only the changed line (the numerator).
    // STAGE 2/3 · DETERMINISTIC FIXED-ZONE LAYOUT — mirrors Stage 1's four fixed
    // rectangles (.r1-fz* in r1.css). Block-proof zone (top-left), hint rail
    // (top-right), the equation+Slate+Check as ONE bordered card pinned to the
    // bottom (Check immediately right of the Slate), and the tutor (bottom-right).
    const numeratorOnly = stage === 3;
    const slateSlots = numeratorOnly
      ? [{ key: "num", label: "top" }, { key: "den", label: "bottom", locked: true, digit: DEN }]
      : [{ key: "num", label: "top" }, { key: "den", label: "bottom" }];

    body = (
      <div className="r1-fz">
        {/* ── BLOCK / PROOF ZONE (fixed rect, top-left) ── */}
        <div className="r1-fz-stage">
          <div className={"canvas r1-fz-canvas" + (stage === 3 ? " r1-faded" : "")} id="r1canvas">
            <div className="eqstate eqfloat locked">
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
                  ? <>this one stack <b>is</b> the number {ANSWER}/{DEN}</>
                  : <>the blocks just confirm it — the equation up top leads now</>}
              </div>
            </div>
          </div>
        </div>

        {/* ── HINT RAIL (fixed rect, top-right) ── */}
        <div className="r1-fz-rail">
          <div className="panel">
            <h3>{stage === 2 ? "Write the Number" : "Write the Changed Line"}</h3>
            <div className="hint">
              {stage === 2
                ? <>The whole joined stack <b>is</b> {ANSWER}/{DEN}. Trace that numeral on the Slate — top, then bottom. The bottom is still {DEN}.</>
                : <>The bottom is locked to {DEN}, so you only write the <b>top</b>. Add the tops: {A_N} + {B_N}.</>}
            </div>
            <div className="lockcard">
              <BigFrac num={<span style={{ color: "var(--red)" }}>+</span>} den={DEN} locked />
              <div className="lockcard-note">add the tops<br />keep the {DEN}</div>
            </div>
          </div>
        </div>

        {/* ── EQUATION + ANSWER + CHECK, ONE UNIT (fixed rect, bottom-left) ── */}
        <div className="r1-fz-answer">
          <div className="r1-fz-eqrow">
            <span className="r1-fz-frac">{A_N}/{DEN}</span>
            <span className="r1-fz-op">+</span>
            <span className="r1-fz-frac">{B_N}/{DEN}</span>
            <span className="r1-fz-op">=</span>
            <span className="r1-fz-slate">
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
            </span>
          </div>
          <div className="r1-fz-cap">{solved ? `full marks — ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}!` : "write your answer on the Slate, then Check"}</div>
          <div className="r1-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={() => checkSlateStage(numeratorOnly)}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r1-fz-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — the shared <BlockSandbox>. The bin offers sevenths PLUS
    // two distractor sizes (halves, thirds) so the child must CHOOSE the right
    // pieces, stack them on the ruler, and count to 5/7. The sandbox renders its
    // OWN .play (diagram + rail); we mount a sibling .hud with the Cook + ribbon +
    // a "Next ▸" button that stays disabled until the row solves.
    body = (
      <>
        <BlockSandbox
          bin={[7, 2, 3]}
          targetValue={ANSWER / DEN}
          targetLabel={`${A_N}/${DEN} + ${B_N}/${DEN}`}
          rulerWholes={answerWholes}
          solved={solved}
          onSolve={onSandboxSolve}
          onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: "ADD_SAME_DEN" } }); }}
          onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: "ADD_SAME_DEN" } }); }}
          title="Workbench"
          hint={`Pull blocks from the bin and stack them on the line. Build ${A_N}/${DEN} + ${B_N}/${DEN} out of same-size pieces, then count them up.`}
        />
        <div className="hud">
          <div className="cook-zone">
            <div className="cook-stage"><Cook expr={cook} width={118} /></div>
            <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
          </div>
          <div className="marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : "")} onClick={() => { if (solved) nextStage(); }} disabled={!solved}>{solved ? "Next stage ▸" : "Build it ▸"}</button>
          </div>
        </div>
      </>
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — a BARE equation; write the whole fraction. No blocks at
    // all here — the numbers lead alone.
    // STAGE 5 · NUMBERS — DETERMINISTIC FIXED-ZONE LAYOUT. No blocks: the bare
    // equation 2/7 + 3/7 = ?/? fills the proof zone (all terms — including the
    // ?/? answer placeholder — are equal-size BigFracs centred on ONE midline),
    // the hint rail sits top-right, and the equation+Slate+Check card is pinned
    // to the bottom with the Check immediately right of the Slate.
    body = (
      <div className="r1-fz">
        {/* ── EQUATION ZONE (fixed rect, top-left) ── */}
        <div className="r1-fz-stage">
          <div className="canvas r1-fz-canvas r1-fz-canvas-center" id="r1canvas">
            <div className="r1-bigeq">
              <BigFrac num={A_N} den={DEN} />
              <span className="r1-bigeq-op">+</span>
              <BigFrac num={B_N} den={DEN} />
              <span className="r1-bigeq-op">=</span>
              {solved ? <BigFrac num={ANSWER} den={DEN} /> : <BigFrac num="?" den="?" />}
            </div>
            <div className="r1-numbers-cap">No blocks now — add the tops, keep the bottom, and write the whole answer.</div>
          </div>
        </div>

        {/* ── HINT RAIL (fixed rect, top-right) ── */}
        <div className="r1-fz-rail">
          <div className="panel">
            <h3>Write the Whole Answer</h3>
            <div className="hint">Add the tops ({A_N} + {B_N}) and keep the bottom {DEN}. Write both numbers on the Slate.</div>
            <div className="lockcard">
              <BigFrac num={<span style={{ color: "var(--red)" }}>+</span>} den={DEN} locked />
              <div className="lockcard-note">add the tops<br />keep the {DEN}</div>
            </div>
          </div>
        </div>

        {/* ── EQUATION + ANSWER + CHECK, ONE UNIT (fixed rect, bottom-left) ── */}
        <div className="r1-fz-answer">
          <div className="r1-fz-eqrow">
            <span className="r1-fz-frac">{A_N}/{DEN}</span>
            <span className="r1-fz-op">+</span>
            <span className="r1-fz-frac">{B_N}/{DEN}</span>
            <span className="r1-fz-op">=</span>
            <span className="r1-fz-slate">
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
            </span>
          </div>
          <div className="r1-fz-cap">{solved ? `full marks — ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}!` : "write the whole fraction on the Slate, then Check"}</div>
          <div className="r1-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={() => checkSlateStage(false)}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r1-fz-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — a short applied SENTENCE with the fraction numerals shown.
    // The shared <WordProblem> renders a REQUIRED `setup` gate: the child first
    // transcribes the question as a sum (2/7 + 3/7) on an <ExpressionSlate>; once
    // checkSetup() passes (setupOk) the answer Slate (write 5/7) unlocks.
    const story = (
      <>Babushka needs <b>{A_N}/{DEN}</b> + <b>{B_N}/{DEN}</b> of a tray — how much in all?</>
    );
    // STAGE 6 · DETERMINISTIC FIXED-ZONE LAYOUT — the WordProblem (story card on
    // top, then the setup gate, then the answer Slate + Check together) lives in a
    // FIXED main rectangle that can never overflow the stage, and the Cook + ribbon
    // sit in the fixed tutor zone (bottom-right). Slate + Check stay one unit via
    // WordProblem's own .wp-answer-row.
    body = (
      <div className="r1-fz r1-fz-words">
        <div className="r1-fz-wp">
          <FitStage axis="y">
          <WordProblem
            story={story}
            tag="Babushka's kitchen"
            readAloud={() => say(`Babushka needs ${A_N}/${DEN} plus ${B_N}/${DEN} of a tray. How much in all?`)}
            speaking={speaking}
            answerLead="Now write the total"
            setupLead="First, write the question as a sum"
            setup={
              <>
                <ExpressionSlate
                  a={setupA} b={setupB}
                  onChange={onSetupChange}
                  onSubmit={checkSetup}
                  denA={DEN} denB={DEN}
                  disabled={setupOk || solved}
                  autoFocus={!setupOk && setupA.num === "" ? "a-num" : undefined}
                  className={badInput && !setupOk ? "is-shake" : ""}
                />
                {setupOk
                  ? <span className="r1-setup-ok">✓ that's the sum — now solve it</span>
                  : <button type="button" className="wp-check" onClick={checkSetup}>Check the sum</button>}
              </>
            }
            slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
            values={slate}
            onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
            layout="fraction"
            den={DEN}
            disabled={!setupOk || solved}
            autoFocusKey={setupOk ? "num" : undefined}
            onCheck={() => checkSlateStage(false)}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={!setupOk}
          />
          </FitStage>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r1-fz-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  } else if (stage === "sw") {
    // SHOW WORK — the mandatory, UNGRADED free-form blank slate between Applied and
    // Words. The child shows their working however they like; advancing is gated
    // purely on ink presence (onInkChange), never on a graded answer. The slate
    // remounts (key) on (re)entry to clear, and goStage resets showWorkInked.
    const story = (
      <>Show how you worked it out — write the sum, draw the pieces, do whatever helps. There's no wrong way here.</>
    );
    body = (
      <div className="r1-fz r1-fz-words">
        <div className="r1-fz-wp">
          <FitStage axis="y">
          <WordProblem
            story={story}
            tag="Babushka's kitchen"
            readAloud={() => say("Show how you worked it out. Write the sum, draw the pieces, whatever helps. There is no wrong way here.")}
            speaking={speaking}
            answerLead="Show your work"
            setup={
              <div className="bs-surface" style={{ position: "relative", width: "100%", height: 320 }}>
                <BlankSlate
                  key="showwork:r1"
                  hint="show your work here — write anything you like ✎"
                  onInkChange={setShowWorkInked}
                  ariaLabel="show your work on a blank slate"
                />
              </div>
            }
            setupLead="Show your work — write anything you like"
          >
            {/* custom "answer" surface: this step is ungraded, so the only control
                is a presence-gated Next ▸ (BlankSlate never advances itself). */}
            <button
              className={"check" + (showWorkInked ? " ready" : "")}
              disabled={!showWorkInked}
              onClick={() => nextStage()}
            >
              Next ▸
            </button>
          </WordProblem>
          </FitStage>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r1-fz-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  } else {
    // STAGE 7 · WORDS — a plain-language story; read it, pull the numbers, write
    // the total. No blocks, no given equation. The setup here is an OPTIONAL,
    // ungraded free-form BlankSlate — it NEVER gates the answer (answer stays enabled).
    const story = (
      <>
        Babushka used <b>two sevenths</b> of the oats for the porridge, then poured in{" "}
        <b>three sevenths</b> more. The pieces are the same size — sevenths.{" "}
        How much of the oats did she use in all?
      </>
    );
    // STAGE 7 · DETERMINISTIC FIXED-ZONE LAYOUT — same shape as Stage 6: the
    // WordProblem (story + optional scratch + answer Slate beside Check) in a fixed
    // main rectangle, the Cook + ribbon in the fixed tutor zone.
    body = (
      <div className="r1-fz r1-fz-words">
        <div className="r1-fz-wp">
          <FitStage axis="y">
          <WordProblem
            story={story}
            tag="Babushka's Recipe"
            readAloud={() => say("Babushka used two sevenths of the oats, then poured in three sevenths more. The pieces are the same size. How much of the oats did she use in all?")}
            speaking={speaking}
            answerLead="Write how much in all"
            setupLead="Optional — show your work here"
            setup={
              <div className="bs-surface r1-words-scratch">
                <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
              </div>
            }
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
          </FitStage>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r1-fz-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" data-vox-speaker="cook">
      <div className="foxing" />
      {TopBar}
      {Selector}
      {/* The bare equation reads in the same spot on every stage EXCEPT the final
          words-only stage (7): there the child must read the PROSE and extract the
          math themselves, so showing the equation would give the answer away. */}
      {stage !== 7 && questionBand}
      {Goal}
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
    case 4: return "The Workbench — pull blocks from the bin, build the answer out of same-size pieces, then count them up.";
    case 5: return `Just the numbers: ${A_N}/${DEN} + ${B_N}/${DEN} = ? Write the whole answer on the Slate.`;
    case 6: return `A question in words, with the fractions shown. Write it as a sum first (${A_N}/${DEN} + ${B_N}/${DEN}), then give the answer.`;
    case "sw": return "Show your work — write the sum, draw the pieces, do whatever helps. Put something down, then move on.";
    case 7: return "A story this time — read it, find the two fractions, and write how much in all.";
    default: return "";
  }
}
