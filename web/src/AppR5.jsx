// AppR5.jsx — The Whole-Units Room (R5, IMPROPER_TO_MIXED): an answer bigger than
// one whole, like 9/7. The pieces are already the same size; the new move is to
// GROUP every `den` pieces into ONE WHOLE UNIT, leaving the remainder as the
// fraction part. 9/7 → 7 pieces fill one whole, 2 are left over → "1 and 2/7".
//
// THE INTERACTION ARC — the two channels fade in opposite directions. The
// BLOCK/touch channel shrinks to nothing; the STYLUS/writing channel grows from
// nothing to "write the whole mixed number".
//   Stage 1 · Manipulate : blocks ARE the problem — drag/group 7 into a whole on a
//                          0→2 ruler, name the leftover by touch. No writing.
//   Stage 2 · Bind       : blocks PLUS the written mixed number beside them — group,
//                          then WRITE "1 and 2/7" on the Slate.
//   Stage 3 · Fade       : the blocks dim to a faint check, the equation leads —
//                          CHOOSE how many wholes fit, then write on the Slate.
//   Stage 4 · Numbers    : a BARE 9/7 = ? (faded ghost) — write the whole mixed
//                          number on the Slate. The exact-whole trap (14/7 = 2,
//                          empty leftover) lives here.
//   Stage 5 · Words      : a plain-language story with more than one whole — read
//                          it, pull out the improper fraction, write the answer.
//
// Reachability: the topbar STAGE SELECTOR jumps to any stage in one click; a
// correct answer advances to the next stage. Reuses shared components by import
// (Cook, Rosette, BigFrac, Lock, Slate — the stylus surface); only r5.css is owned
// here. The Stage-5 story sits in the canvas; its answer is written on the same
// HUD Slate the other writing stages use, so the stylus channel stays consistent.
import React, { useState, useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Lock from "./components/Lock.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import { useVoice } from "./voice.js";
import { denomColor, denomTextColor, denomHatch, denomHatchSize } from "./denominatorColors.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/r5.css";

// ---- the problem bank -------------------------------------------------------
// Every stage works one improper fraction → mixed number. The denominator is the
// piece size (stays locked); wholes = floor(num/den), leftover = num%den.
//   anchor 9/7 carries stages 1–3 (one whole, 2 left over).
//   stage 4 adds the EXACT-WHOLE TRAP: 14/7 = 2 with an EMPTY leftover (0/7).
//   stage 5 is the same math wrapped in a recipe story (11/4 = 2 and 3/4).
const ANCHOR = { num: 9, den: 7 };

function mixedOf(num, den) {
  return { wholes: Math.floor(num / den), remain: num % den, den, num };
}

// ---- the number-line geometry (a 720-wide canvas; mirrors R1/R4) ------------
// The ruler runs 0→2 (these answers overflow past one whole). UNIT = px per WHOLE
// is derived so a two-whole ruler fills SPAN without squishing.
const ORIGIN = 60, SPAN = 600, LINE_Y = 322;
const RULER_WHOLES = 2;

// ---- one 1/den block (overflow column / frame / tray) -----------------------
// Colored by its denominator via the central palette (never hardcoded).
function Block({ den, width, label = true, locked = false, grabbing = false, onPointerDown, className = "" }) {
  const fill = denomColor(den);
  const labColor = denomTextColor(den);
  const hatch = denomHatch(den), hatchSize = denomHatchSize(den);
  return (
    <div
      className={"r5-block" + (locked ? " is-locked" : "") + (grabbing ? " is-grabbing" : "") + (className ? " " + className : "")}
      style={{ width, background: fill }}
      onPointerDown={onPointerDown}
      role={onPointerDown ? "button" : undefined}
      tabIndex={onPointerDown ? 0 : undefined}
      aria-label={onPointerDown ? `one ${den}th — move into the whole unit` : undefined}
      onKeyDown={onPointerDown ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPointerDown(e); } } : undefined}
    >
      <div className="r5-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
      {label && <span className="r5-lab" style={{ color: labColor }}>1/{den}</span>}
    </div>
  );
}

// ---- the STAGE arc ----------------------------------------------------------
// Each tuple: [key, name, hint, selectorLabel]. The pedagogical Stage 1–5
// numbering stays legible; the inserted stages read as W (Workbench) and A
// (Applied) instead of bumping the numbers.
const STAGES = [
  ["1-manipulate", "Manipulate", "Group every 7 into a whole — by touch, no writing.", "1"],
  ["2-bind", "Bind", "Group the whole, then WRITE the mixed number on the Slate.", "2"],
  ["3-fade", "Fade", "Blocks dim — choose how many wholes fit, then write.", "3"],
  ["workbench", "Workbench", "Build the improper fraction from the bin, then count it.", "W"],
  ["4-numbers", "Numbers", "Bare 9/7 = ? — write the whole mixed number.", "4"],
  ["applied", "Applied", "A worded question — write the improper fraction, then the answer.", "A"],
  ["5-words", "Words", "A recipe story — read it, write the mixed number.", "5"],
];
const NEXT_STAGE = { "1-manipulate": "2-bind", "2-bind": "3-fade", "3-fade": "workbench", "workbench": "4-numbers", "4-numbers": "applied", "applied": "5-words" };

// ---------------- main ----------------
export default function AppR5({ no, title, onBack, onRewatchIntro }) {
  // which stage of the arc is live (jump via the selector, or advance on solve)
  const [stage, setStage] = useState("1-manipulate");

  // --- Engine integration (U10) ---
  const { emit, judgeAndAdvance, scaffoldLevel, decision } = useLessonEngine({
    nodeId: "IMPROPER_TO_MIXED",
    lessonConfig: { lessonId: "r5", initialBeat: "1-manipulate" },
  });
  const selfCorrectionsRef = useRef(0);
  const presentEmittedRef = useRef(false);

  // the live improper fraction for this stage
  const [prob, _setProb] = useState(ANCHOR);
  const { num: NUMER, den: DEN } = prob;
  const { wholes: WHOLES, remain: REMAIN } = mixedOf(NUMER, DEN);
  const probRef = useRef(prob);
  useEffect(() => { probRef.current = prob; }, [prob]);

  // manipulate state: how many overflow pieces have been grouped into the frame
  const [placed, setPlaced] = useState(0);
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [cook, setCook] = useState("idle");
  const [hotFrame, setHotFrame] = useState(false);
  const [drag, setDrag] = useState(null);              // { x, y } pointer pos while dragging
  const [wholesPick, setWholesPick] = useState(null);  // stage-3 symbolic "how many wholes" choice
  const [bad, setBad] = useState(false);               // shake the slate on a wrong write
  const [vals, setVals] = useState({ w: "", n: "" });  // the Slate's written digits
  const [status, setStatus] = useState({ tone: "normal", text: "" });
  // ---- word→math translation surfaces (Applied gate + Words optional scratch) ----
  // Applied: the child TRANSCRIBES the improper fraction the words describe here;
  // once it matches the live problem the mixed-number answer unlocks (setupOk).
  // Words: the same single-fraction surface is OPTIONAL scratch — never gates.
  const [setupFrac, setSetupFrac] = useState({ num: "", den: "" });
  const [setupOk, setSetupOk] = useState(false);
  const [scratchFrac, setScratchFrac] = useState({ num: "", den: "" });

  // ---- stage flavor flags -----------------------------------------------------
  const isManipulate = stage === "1-manipulate";
  const isBind = stage === "2-bind";
  const isFade = stage === "3-fade";
  const isWorkbench = stage === "workbench";  // the free block sandbox (own render branch)
  const isNumbers = stage === "4-numbers";
  const isApplied = stage === "applied";      // worded question + a required setup gate
  const isWords = stage === "5-words";

  // Stages that still SHOW the manipulative board. 1+2 show live blocks; 3 shows a
  // dimmed "ghost" check; 4+5 show no board at all (a bare equation / a story).
  const showBoard = isManipulate || isBind || isFade;
  const ghostBoard = isFade;                       // dimmed, non-interactive check
  // Stages that require the GROUP-into-a-whole touch step before writing.
  const needsGroup = isManipulate || isBind;
  // Stages where the child WRITES the mixed number on the Slate (channel grows).
  const writes = isBind || isFade || isNumbers || isWords;

  const locked = needsGroup ? placed >= DEN : true;  // the whole unit has snapped shut
  const leftover = needsGroup ? NUMER - placed : REMAIN;
  const grouped = needsGroup ? locked : true;        // grouping precondition met?

  const { soundOn, speaking, say, stopVoice, toggleSound } = useVoice();
  const placedRef = useRef(placed), solvedRef = useRef(solved), stageRef = useRef(stage);
  useEffect(() => { placedRef.current = placed; }, [placed]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  // stopVoice on unmount so leaving the room never leaves audio playing
  useEffect(() => () => stopVoice(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- engine integration helpers ------------------------------------------
  function reportAttemptR5({ correct, answerValue, errorSignature, stars: starCount }) {
    const currentStage = stageRef.current;
    const dec = judgeAndAdvance(
      { value: answerValue, modality: "tap", recognizerConfidence: null },
      {
        correct,
        errorSignature: errorSignature ?? null,
        stars: starCount ?? 0,
        hintMaxRung: 0,
        selfCorrections: selfCorrectionsRef.current,
        surfaceForm: "stage-" + currentStage,
      }
    );
    selfCorrectionsRef.current = 0;
    return dec;
  }

  function applyEngineDecisionR5(dec, isCorrect) {
    if (!dec) return;
    if (dec.kind === "FadeScaffold") {
      advance();
    } else if (dec.kind === "RaiseScaffold") {
      // Drop back one stage (preserve work via resetForStage).
      const nb = {
        "2-bind": "1-manipulate",
        "3-fade": "2-bind",
        "workbench": "3-fade",
        "4-numbers": "workbench",
        "applied": "4-numbers",
        "5-words": "applied",
      }[stageRef.current];
      if (nb) goStage(nb);
    } else if (isCorrect) {
      advance();
    }
  }

  // ---- ruler / canvas geometry, derived per problem ---------------------------
  // The ruler tops out at 2 wholes for the anchor; a 14/7 (= 2) or 11/4 (< 3)
  // answer still reads on a 0→2 (or extended) ruler. UNIT = px per whole.
  const rulerWholes = Math.max(RULER_WHOLES, Math.ceil(NUMER / DEN));
  const UNIT = SPAN / rulerWholes;
  const RULER_TICKS = rulerWholes * DEN;
  const RLAB = Array.from({ length: RULER_TICKS + 1 })
    .map((_, k) => {
      const isWhole = k % DEN === 0;
      return [k, isWhole ? String(k / DEN) : `${k}/${DEN}`, isWhole];
    })
    .filter(([k, , isWhole]) => isWhole || k === NUMER);

  // ---- the manipulate mechanic: group ONE overflow piece into the frame -------
  function placeOne() {
    if (solvedRef.current || !(stageRef.current === "1-manipulate" || stageRef.current === "2-bind")) return;
    if (placedRef.current >= DEN) return;
    const next = placedRef.current + 1;
    setPlaced(next);
    setHotFrame(false);
    // Track placement as a self-correction event (place/remove oscillation tracking).
    emit({ type: "place_block", payload: { node_id: "IMPROPER_TO_MIXED", placed: next } });
    if (next >= DEN) {
      setCook("cheer");
      if (stageRef.current === "1-manipulate") {
        // Stage 1 is pure touch — grouping IS the solve.
        const p = probRef.current;
        const m = mixedOf(p.num, p.den);
        finishSolved(3, "Snap! Seven pieces make one whole, " + m.remain + " left over. That's 1 and " + m.remain + "/" + m.den + " — you grouped it!", [p.num, p.den]);
      } else {
        setStatus({ tone: "ok", text: "Snap! Seven make one whole, " + REMAIN + " left over. Now WRITE the mixed number on the Slate." });
        say("r5WholeLocked");
        setTimeout(() => setCook("idle"), 700);
      }
    } else {
      const need = DEN - next;
      setStatus({ tone: "normal", text: next + " of " + DEN + " in the frame — " + need + " more to finish one whole." });
    }
  }

  // drag a block from the overflow column into the frame
  function grabBlock(e) {
    if (solved || locked || !needsGroup) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!e || e.clientX == null) { placeOne(); return; }
    setDrag({ x: e.clientX, y: e.clientY });
    const overFrame = (ev) => {
      const fr = document.getElementById("r5-frame");
      if (!fr) return false;
      const r = fr.getBoundingClientRect();
      return ev.clientX >= r.left - 30 && ev.clientX <= r.right + 30 && ev.clientY >= r.top - 30 && ev.clientY <= r.bottom + 30;
    };
    const hover = (ev) => { setDrag({ x: ev.clientX, y: ev.clientY }); setHotFrame(overFrame(ev)); };
    const up = (ev) => {
      window.removeEventListener("pointermove", hover);
      window.removeEventListener("pointerup", up);
      setDrag(null); setHotFrame(false);
      if (overFrame(ev)) placeOne();
    };
    window.addEventListener("pointermove", hover);
    window.addEventListener("pointerup", up);
  }

  // ---- stage 3: choose how many wholes fit (symbolic), THEN write -------------
  function pickWholes(w) {
    if (solved) return;
    setWholesPick(w);
    if (w === WHOLES) {
      setCook("idle");
      setStatus({ tone: "ok", text: "Right — " + WHOLES + " whole" + (WHOLES === 1 ? "" : "s") + " fit. Now write the mixed number on the Slate." });
      say("r5WholeLocked");
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: "Not quite — " + DEN + " pieces fill one whole. How many times does " + DEN + " fit inside " + NUMER + "?" });
      say("r5GroupFirst");
    }
  }

  // ---- the Slate verifier -----------------------------------------------------
  const shakeBad = () => { setBad(true); setTimeout(() => setBad(false), 460); };

  function checkWritten() {
    if (solved) { advance(); return; }
    // group / choose precondition before writing counts
    if (needsGroup && !grouped) {
      setCook("think");
      setStatus({ tone: "warn", text: "Group the pieces into a whole first — drag them into the frame until it fills." });
      say("r5GroupFirst");
      return;
    }
    if (isFade && wholesPick !== WHOLES) {
      setCook("think");
      setStatus({ tone: "warn", text: "First choose how many wholes fit, then write." });
      say("r5GroupFirst");
      return;
    }
    const w = parseInt(vals.w, 10);
    const n = parseInt(vals.n, 10);
    const exactWhole = REMAIN === 0;            // 14/7 = 2, empty leftover
    if (vals.w === "" || (!exactWhole && vals.n === "")) {
      shakeBad();
      setStatus({ tone: "warn", text: exactWhole
        ? "Write the whole number — how many wholes in all?"
        : "Fill both slots — the whole number, then the leftover on top." });
      return;
    }
    const wholeOk = w === WHOLES;
    const numOk = exactWhole ? (vals.n === "" || n === 0) : (n === REMAIN);
    if (!wholeOk || !numOk) {
      shakeBad();
      setCook("think");
      const wroteImproper = n === NUMER;
      const errSig = wroteImproper ? "forced_leftover" : null;
      setStatus({ tone: "warn", text: wroteImproper
        ? "Careful — the leftover is only the pieces OUTSIDE the wholes. " + WHOLES + " whole" + (WHOLES === 1 ? "" : "s") + " locked away " + (WHOLES * DEN) + ", so " + REMAIN + " are left."
        : exactWhole
          ? "Close — " + NUMER + " is EXACTLY " + WHOLES + " wholes, with nothing left over. The leftover is empty."
          : "Not quite. " + WHOLES + " whole" + (WHOLES === 1 ? "" : "s") + " filled, " + REMAIN + " " + DEN + "ths left over." });
      say("r4NotQuite");
      // Report incorrect attempt to the engine.
      reportAttemptR5({ correct: false, answerValue: [isNaN(w) ? 0 : w, NUMER], errorSignature: errSig, stars: 0 });
      return;
    }
    finishSolved(3, "Yes! " + NUMER + "/" + DEN + " = " + WHOLES + (exactWhole ? "" : " and " + REMAIN + "/" + DEN) + ". " + (exactWhole ? "Exactly " + WHOLES + " wholes — nothing left over. " : "") + "Full marks, povaryonok!", [NUMER, DEN]);
  }

  function finishSolved(st, text, answerValue) {
    setSolved(true); setStars(st); setCook("cheer");
    setStatus({ tone: "ok", text });
    say("r5FullMarks");
    // Report correct attempt to engine; apply decision to stage flow.
    const dec = reportAttemptR5({ correct: true, answerValue: answerValue ?? null, errorSignature: null, stars: st });
    setTimeout(() => applyEngineDecisionR5(dec, true), 1500);
  }

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

  // ---- Workbench: the block sandbox builds the improper fraction physically ----
  // Bin offers ONLY the piece size (DEN); the child stacks NUMER of them to reach
  // the improper value, then reads it off as one same-size count.
  const sandboxBin = [DEN];
  const sandboxTarget = NUMER / DEN;            // the improper value a correct row reaches
  function onSandboxSolve({ num, den }) {
    if (solvedRef.current) return;
    const p = probRef.current;
    const m = mixedOf(p.num, p.den);
    finishSolved(3,
      "That's " + num + "/" + den + " — " + p.num + "/" + p.den + ". Group the " + p.den + "s into wholes: " + m.wholes + (m.remain > 0 ? " and " + m.remain + "/" + p.den : "") + ". Built it yourself!",
      [num, den]);
  }

  // ---- Applied: the worded question + the required setup gate -------------------
  // The setup is correct when the written fraction IS the live improper fraction.
  function checkSetup() {
    const sn = parseInt(setupFrac.num, 10), sd = parseInt(setupFrac.den, 10);
    if (!(sn > 0 && sd > 0)) {
      shakeBad(); setCook("think");
      setStatus({ tone: "warn", text: "Write the amount as one fraction — a top and a bottom." });
      return;
    }
    if (!(sn === NUMER && sd === DEN)) {
      shakeBad(); setCook("think");
      setStatus({ tone: "warn", text: "Not quite — write the amount the question gives as one improper fraction (" + NUMER + "/" + DEN + ")." });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: "That's the improper fraction. Now group it and write the mixed number." });
  }
  function onSetupChange(key, value) {
    const v = onlyDigits(value);
    setSetupFrac((s) => ({ ...s, [key]: v }));
  }
  function onScratchChange(key, value) {
    const v = onlyDigits(value);
    setScratchFrac((s) => ({ ...s, [key]: v }));
  }

  // ---- stage navigation -------------------------------------------------------
  // Set the board to a fresh start for stage `s` (problem, placements, inputs).
  function resetForStage(s) {
    stopVoice();
    const p = s === "4-numbers" ? { num: 14, den: 7 }
      : (s === "5-words" || s === "applied") ? { num: 11, den: 4 }
      : ANCHOR;  // 1-manipulate / 2-bind / 3-fade / workbench all carry the anchor 9/7
    _setProb(p); probRef.current = p;
    placedRef.current = 0; solvedRef.current = false;
    setPlaced(0); setSolved(false); setStars(0); setCook("idle");
    setHotFrame(false); setDrag(null); setWholesPick(null); setBad(false);
    setVals({ w: "", n: "" });
    // reset the word→math surfaces (Applied gate + Words scratch) on every stage change
    setSetupFrac({ num: "", den: "" }); setSetupOk(false); setScratchFrac({ num: "", den: "" });
    selfCorrectionsRef.current = 0;
    const m = mixedOf(p.num, p.den);
    const greet = {
      "1-manipulate": "Nine sevenths — more than one whole. Drag pieces into the whole-unit frame until it fills. No writing yet.",
      "2-bind": "Group the pieces into a whole, then write the mixed number beside the blocks.",
      "3-fade": "The blocks are just a faint check now. Choose how many wholes fit, then write the mixed number.",
      "workbench": "The Workbench. Pull " + p.den + "ths from the bin and build " + p.num + "/" + p.den + " on the line, then count them up.",
      "4-numbers": "Just the numbers: " + p.num + "/" + p.den + " = ? Write the whole mixed number on the Slate. (Watch the leftover!)",
      "applied": "A question in words, with the amount shown. Write it as one improper fraction first, then give the mixed number.",
      "5-words": "A recipe — read it, find the improper fraction, and write the mixed number.",
    }[s];
    setStatus({ tone: "normal", text: greet });
    // Emit problem_present for this stage.
    emit({
      type: "problem_present",
      payload: { node_id: "IMPROPER_TO_MIXED", scaffold_level: toScaffoldLevel("r5", s) },
    });
  }

  function goStage(s) { setStage(s); resetForStage(s); }

  function advance() {
    stopVoice();
    const nb = NEXT_STAGE[stageRef.current];
    if (nb) { setStage(nb); resetForStage(nb); }
    else { resetForStage(stageRef.current); }  // last stage: replay
  }

  // initialize the opening greeting once (also emits the first problem_present)
  useEffect(() => { resetForStage("1-manipulate"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- the Slate slots (the mixed-number writing surface) ---------------------
  const exactWhole = REMAIN === 0;
  const slateDisabled = solved || (needsGroup && !grouped) || (isFade && wholesPick !== WHOLES);
  const slateAutoFocus = vals.w === "" ? "w" : "n";

  // "Ready to check": the child has committed the handwritten answer this stage
  // needs (and it isn't solved yet), so the Check button lights up (.check.ready,
  // defined in lesson.css). On a writing stage the whole-number slot is always
  // required; the leftover numerator is required UNLESS this is the exact-whole
  // trap (14/7 = 2, empty leftover). On Applied the setup gate must be passed too.
  const writeReady = vals.w !== "" && (exactWhole || vals.n !== "");
  const answerReady = !solved && (
    isApplied ? (setupOk && writeReady)
    : isWords ? writeReady
    : (writes && !slateDisabled && writeReady)
  );

  // ---- the post-solve / check button label ------------------------------------
  const checkLabel = !solved
    ? (isManipulate ? "Check" : "Check")
    : (NEXT_STAGE[stage] ? "Next ▸" : "Again");

  // ---- layout coordinates inside the canvas -----------------------------------
  const COL_W = 90;
  const COL_X = ORIGIN;
  const COL_TOP = 28;
  const FRAME_X = ORIGIN + 200;
  const FRAME_Y = 96;
  const FRAME_W = UNIT;
  const FRAME_H = 64;
  const TRAY_X = FRAME_X;
  const TRAY_Y = FRAME_Y + 150;
  const TRAY_W = UNIT;
  const TRAY_H = 56;

  return (
    <div className="page" data-vox-speaker="cook">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№{no}</span>
          <div>
            <div className="puzzle-tag">Lesson {no} · Mixed Numbers</div>
            <div className="puzzle-title">{title}</div>
          </div>
        </div>

        {/* STAGE SELECTOR — jump to any stage of the arc in one click */}
        <div className="beat-select" role="group" aria-label="lesson stage">
          <span className="beat-lab">Stage</span>
          {STAGES.map(([s, name, hint, label], i) => (
            <button
              key={s}
              type="button"
              className={"beat-btn" + (stage === s ? " on" : "")}
              aria-pressed={stage === s}
              title={name + " — " + hint}
              onClick={() => goStage(s)}
            >
              {label ?? i + 1}
            </button>
          ))}
        </div>

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
          <button className="ctrl-btn" title="Start over" onClick={() => resetForStage(stage)}>⟲</button>
        </div>
      </div>

      <div className="goal">
        <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("r5Goal")}>
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div className="goal-text" data-vox="r5Goal" data-vox-speaker="mom">
          {isWorkbench
            ? <>Build <b>{NUMER}/{DEN}</b> on the Workbench — pull same-size blocks from the bin, stack them to the flag, and count them up.</>
            : isApplied
            ? <>A question in words, with the amount shown. Write it as one <b>improper fraction</b> first, then give the mixed number.</>
            : isWords
            ? "Read the recipe, find the fraction that's more than one whole, and write it as a mixed number."
            : <>Babushka can't ask for <b>{NUMER}/{DEN}</b> of a tray — that's more than one whole. Group the pieces into <b>whole units</b>, then name the leftover.</>}
        </div>
      </div>

      {isWorkbench ? (
        /* WORKBENCH — the free block sandbox replaces the board entirely. It
           renders its OWN .play (diagram + rail); we add a sibling .hud with the
           Cook + status ribbon + a "Next ▸" that unlocks on solve. */
        <>
          <BlockSandbox
            bin={sandboxBin}
            targetValue={sandboxTarget}
            targetLabel={NUMER + "/" + DEN}
            rulerWholes={rulerWholes}
            solved={solved}
            onSolve={onSandboxSolve}
            onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: "IMPROPER_TO_MIXED" } }); }}
            onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: "IMPROPER_TO_MIXED" } }); }}
          />
          <div className="hud">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>
            <div className="marks">
              {solved && <Rosette count={stars} />}
              <button className={"check" + (solved ? " done" : "")} onClick={advance} disabled={!solved}>{solved ? checkLabel : "Build it ▸"}</button>
            </div>
          </div>
        </>
      ) : isApplied ? (
        /* APPLIED — a worded question (the amount shown) with a REQUIRED setup gate:
           write the improper fraction the words describe; only then does the
           mixed-number answer unlock. */
        <>
          <div className="play r5-applied-play">
            <WordProblem
              story={<>Babushka's party needs <b>{NUMER} quarters</b> of cake in all. How many <b>whole</b> cakes is that, and how many quarters left over?</>}
              tag="Babushka's kitchen"
              readAloud={() => say("r5Goal")}
              speaking={speaking}
              answerLead="Now write the mixed number"
              setupLead="First, write the amount as one fraction"
              setup={
                <div className={"r5-setup-row" + (bad && !setupOk ? " bad" : "")}>
                  <Slate
                    slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
                    values={{ num: setupFrac.num, den: setupFrac.den }}
                    onChange={onSetupChange}
                    onSubmit={checkSetup}
                    layout="fraction"
                    den={parseInt(setupFrac.den, 10) || DEN}
                    disabled={setupOk || solved}
                    autoFocusKey={!setupOk && setupFrac.num === "" ? "num" : undefined}
                    ariaLabel="write the improper fraction"
                  />
                  {setupOk
                    ? <span className="r5-setup-ok">✓ that's the fraction — now solve it</span>
                    : <button type="button" className="wp-check" onClick={checkSetup}>Check the fraction</button>}
                </div>
              }
            >
              <div className={"r5-write" + (bad ? " bad" : "")}>
                <div className="r5-write-whole">
                  <Slate
                    slots={[{ key: "w", label: "wholes" }]}
                    values={{ w: vals.w }}
                    onChange={(k, v) => setVals((s) => ({ ...s, [k]: v }))}
                    onSubmit={checkWritten}
                    layout="row"
                    den={DEN}
                    disabled={!setupOk || solved}
                    autoFocusKey={setupOk && vals.w === "" ? "w" : undefined}
                    ariaLabel="how many wholes"
                  />
                </div>
                <span className="r5-and">and</span>
                <div className="r5-write-frac">
                  <Slate
                    slots={[{ key: "n", label: "leftover" }, { key: "d", fixed: true, digit: DEN, label: "size" }]}
                    values={{ n: vals.n }}
                    onChange={(k, v) => setVals((s) => ({ ...s, [k]: v }))}
                    onSubmit={checkWritten}
                    layout="fraction"
                    den={DEN}
                    disabled={!setupOk || solved}
                    autoFocusKey={setupOk && vals.w !== "" && vals.n === "" ? "n" : undefined}
                    ariaLabel="leftover fraction"
                  />
                </div>
                <button type="button" className={"wp-check" + (answerReady ? " ready" : "")} onClick={checkWritten} disabled={!setupOk}>{checkLabel}</button>
              </div>
            </WordProblem>
          </div>
          <div className="hud">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>
            {solved && <div className="marks"><Rosette count={stars} /></div>}
          </div>
        </>
      ) : isWords ? (
        /* WORDS (beat 6, out of the s1–s5 sweep) — keeps the shared <WordProblem>
           card flow. Not a fixed-zone stage; left on the existing .play layout. */
        <>
          <div className="play">
            <div className="diagram">
              <div className="r5-wp-mount">
                <WordProblem
                  story={<>Babushka is cutting a cake into <b>quarters</b>. The party needs <b>{NUMER} quarters</b> in all. How many <b>whole</b> cakes is that, and how many quarters left over?</>}
                  tag="Babushka's Recipe"
                  readAloud={() => say("r5Goal")}
                  speaking={speaking}
                  answerLead="Write the mixed number"
                  setupLead="Optional — write the amount as one fraction first"
                  setup={
                    <Slate
                      slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
                      values={{ num: scratchFrac.num, den: scratchFrac.den }}
                      onChange={onScratchChange}
                      layout="fraction"
                      den={parseInt(scratchFrac.den, 10) || DEN}
                      disabled={solved}
                      ariaLabel="optional: write the improper fraction from the recipe"
                    />
                  }
                >
                  <div className={"r5-write" + (bad ? " bad" : "")}>
                    <div className="r5-write-whole">
                      <Slate
                        slots={[{ key: "w", label: "wholes" }]}
                        values={{ w: vals.w }}
                        onChange={(k, v) => setVals((s) => ({ ...s, [k]: v }))}
                        onSubmit={checkWritten}
                        layout="row"
                        den={DEN}
                        disabled={solved}
                        autoFocusKey={vals.w === "" ? "w" : undefined}
                        ariaLabel="how many wholes"
                      />
                    </div>
                    <span className="r5-and">and</span>
                    <div className="r5-write-frac">
                      <Slate
                        slots={[{ key: "n", label: "leftover" }, { key: "d", fixed: true, digit: DEN, label: "size" }]}
                        values={{ n: vals.n }}
                        onChange={(k, v) => setVals((s) => ({ ...s, [k]: v }))}
                        onSubmit={checkWritten}
                        layout="fraction"
                        den={DEN}
                        disabled={solved}
                        autoFocusKey={vals.w !== "" && vals.n === "" ? "n" : undefined}
                        ariaLabel="leftover fraction"
                      />
                    </div>
                    <button type="button" className={"wp-check" + (answerReady ? " ready" : "")} onClick={checkWritten}>{checkLabel}</button>
                  </div>
                </WordProblem>
              </div>
            </div>
            <div className="rail">
              <div className="panel">
                <h3>Word Problem</h3>
                <div className="hint">No blocks, no equation. Read the recipe, find the improper fraction ({NUMER} quarters = {NUMER}/{DEN}), then write it as a mixed number.</div>
              </div>
            </div>
          </div>
          <div className="hud">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>
            {solved && <div className="marks"><Rosette count={stars} /></div>}
          </div>
        </>
      ) : (
      /* ════════════════════════════════════════════════════════════════════════
         STAGES 1–5 of the sweep (Manipulate / Bind / Fade / Numbers) —
         DETERMINISTIC FIXED-ZONE LAYOUT (the R1-stage-1 exemplar applied here).
         Four absolutely-positioned, fixed-size rectangles inside .r5-stage:
           · .r5-z-board  — block board OR the bare equation (top-left, fixed h)
           · .r5-z-rail   — the hint panel                    (top-right, fixed w/h)
           · .r5-z-answer — the equation + mixed-number write composer + Check, as
                            ONE bordered card pinned to the BOTTOM (tall: the
                            composer is two slate columns), with a GUARANTEED gap
                            above it so the board corner can never clip it
           · .r5-z-tutor  — Cook + speech ribbon              (bottom-right, fixed)
         Every zone is a fixed rectangle with clamped text, so a longer string or a
         different font (Safari vs Chromium) can NEVER reflow one zone onto another.
         ════════════════════════════════════════════════════════════════════════ */
      <div className="r5-stage">
        {/* ── BOARD ZONE (fixed rect, top-left) ── */}
        <div className="r5-z-board">
          {/* STAGES 1–3: the manipulative board (live, or a faded ghost on stage 3) */}
          {showBoard && (
            <div className={"canvas r5-canvas" + (ghostBoard ? " r5-ghost-board" : "")} id="r5canvas">
              <div className="eqstate eqfloat"><span className="g">{NUMER}/{DEN}</span>more than one whole</div>

              {/* ruler 0→rulerWholes (the answer overflows past 1) */}
              <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: rulerWholes * UNIT }} />
              {Array.from({ length: RULER_TICKS + 1 }).map((_, k) => (
                <span key={k} className="ntick" style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y, height: k % DEN === 0 ? 14 : 7 }} />
              ))}
              {RLAB.map(([k, lab, isWhole]) => (
                <span key={k} className={"nlab" + (isWhole ? " ng" : "")} style={{ left: ORIGIN + (k / DEN) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
              ))}

              {/* the OVERFLOW COLUMN — the leftover pieces still to be grouped */}
              <div className="r5-overflow" style={{ left: COL_X, top: COL_TOP, width: COL_W }}>
                <div className="r5-col-tag"><BigFrac num={NUMER} den={DEN} /></div>
                {!locked && leftover > 0 && Array.from({ length: leftover }).map((_, i) => (
                  <Block key={i} den={DEN} width={COL_W}
                    grabbing={!!drag}
                    onPointerDown={i === 0 && needsGroup ? grabBlock : undefined}
                    className={i === 0 ? "" : "is-locked"} />
                ))}
                {locked && (
                  <div className="r5-dropcue" style={{ position: "static", transform: "none", marginTop: 8, opacity: .7 }}>
                    all grouped ✓
                  </div>
                )}
              </div>

              {/* the WHOLE-UNIT FRAME — fill it with DEN pieces; it locks at full */}
              <div id="r5-frame"
                className={"r5-frame" + (hotFrame ? " is-hot" : "") + (locked ? " is-locked" : "")}
                style={{ left: FRAME_X, top: FRAME_Y, width: FRAME_W, height: FRAME_H }}>
                <div className="r5-frame-lab">
                  {locked
                    ? <span className="r5-whole-stamp">{WHOLES} whole{WHOLES === 1 ? "" : "s"}</span>
                    : <span className="r5-frame-hint">whole-unit frame — fill with {DEN} pieces</span>}
                </div>
                <div className="r5-frame-fill">
                  {Array.from({ length: needsGroup ? placed : DEN }).map((_, i) => (
                    <Block key={i} den={DEN} width={FRAME_W / DEN} label={false} locked />
                  ))}
                </div>
                {!locked && placed < DEN && needsGroup && (
                  <div className="r5-dropcue">drop a piece here</div>
                )}
              </div>

              {/* the LEFTOVER TRAY — what doesn't complete a whole (the fraction) */}
              <div className={"r5-tray" + (locked ? " is-hot" : "")}
                style={{ left: TRAY_X, top: TRAY_Y, width: TRAY_W, height: TRAY_H }}>
                <div className="r5-tray-lab">
                  {locked
                    ? (REMAIN > 0 ? <BigFrac num={REMAIN} den={DEN} locked /> : <span className="r5-frame-hint">leftover: none</span>)
                    : <span className="r5-frame-hint">leftover tray</span>}
                </div>
                {locked && REMAIN > 0 && (
                  <div className="r5-tray-fill">
                    {Array.from({ length: REMAIN }).map((_, i) => (
                      <Block key={i} den={DEN} width={FRAME_W / DEN} label locked />
                    ))}
                  </div>
                )}
              </div>

              {/* "Group a piece" affordance alongside drag — click/keyboard too */}
              {!locked && !solved && needsGroup && (
                <button className="joinbtn" style={{ left: COL_X, top: COL_TOP + leftover * 30 + 16 }} onClick={placeOne}>
                  ▸ Group a piece into the whole
                </button>
              )}
            </div>
          )}

          {/* STAGE 5 (Numbers): a bare equation (a faded ghost), the numbers lead */}
          {isNumbers && (
            <div className="canvas r5-canvas r5-bare">
              <div className="r5-bare-eq">
                <span className="r5-bare-frac">{NUMER}/{DEN}</span>
                <span className="qop">=</span>
                <span className="slate-blank">?</span>
              </div>
              <div className="r5-bare-note">{NUMER} ÷ {DEN} — how many whole {DEN}-piece units fit, and what's left over?</div>
            </div>
          )}
        </div>

        {/* ── HINT RAIL (fixed rect, top-right) ── */}
        <div className="r5-z-rail">
          <div className="panel">
            {isFade ? (
              <>
                <h3>How Many Wholes?</h3>
                <div className="hint">The blocks are just a faint check now. {DEN} pieces make one whole — how many whole units fit inside {NUMER}/{DEN}?</div>
                <div className="r5-pick" role="group" aria-label="how many wholes fit">
                  {[0, 1, 2, 3].filter((w) => w * DEN <= NUMER + DEN).map((w) => (
                    <button key={w} type="button"
                      className={"r5-pick-btn" + (wholesPick === w ? (w === WHOLES ? " ok" : " bad") : "")}
                      aria-pressed={wholesPick === w}
                      onClick={() => pickWholes(w)} disabled={solved}>
                      {w}
                    </button>
                  ))}
                </div>
                <div className="r5-card-note">{NUMER} ÷ {DEN} = {WHOLES} remainder {REMAIN}. The wholes are the whole number; the remainder over {DEN} is the leftover.</div>
              </>
            ) : (
              <>
                <h3>Group into Wholes</h3>
                <div className="hint">{DEN} same-size pieces make one whole. Fill the frame to lock a whole; the pieces left over are the fraction part.</div>
                <div className="r5-card">
                  <div className="r5-card-row">
                    <span className="r5-mini-frame">
                      {Array.from({ length: DEN }).map((_, i) => <span key={i} className="r5-mini-block" />)}
                    </span>
                    <span>= 1 whole</span>
                  </div>
                  <div className="r5-card-note">
                    {NUMER} ÷ {DEN} = {WHOLES} remainder {REMAIN}. The wholes are the whole number; the remainder over {DEN} is the leftover fraction.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── EQUATION + MIXED-NUMBER COMPOSER + CHECK, ONE UNIT (fixed rect, bottom) ──
            The equation prefix (NUMER/DEN =), the write composer ([whole] and
            [fraction]) and the Check button read as ONE bordered card, pinned to the
            bottom with a guaranteed gap above. The composer is tall (two slate
            columns) — the card height accounts for it so the board can never clip it. */}
        <div className="r5-z-answer">
          <div className="r5-ans-eqrow">
            <span className="r5-ans-frac">{NUMER}/{DEN}</span>
            <span className="r5-ans-op">=</span>
            {writes ? (
              /* the STYLUS channel — the child HANDWRITES the mixed number */
              <div className={"r5-write" + (bad ? " bad" : "")}>
                <div className="r5-write-whole">
                  <Slate
                    slots={[{ key: "w", label: "wholes" }]}
                    values={{ w: vals.w }}
                    onChange={(k, v) => setVals((s) => ({ ...s, [k]: v }))}
                    onSubmit={checkWritten}
                    layout="row"
                    den={DEN}
                    disabled={slateDisabled}
                    autoFocusKey={slateAutoFocus === "w" ? "w" : undefined}
                    ariaLabel="how many wholes"
                  />
                </div>
                <span className="r5-and">and</span>
                <div className="r5-write-frac">
                  <Slate
                    slots={[{ key: "n", label: "leftover" }, { key: "d", fixed: true, digit: DEN, label: "size" }]}
                    values={{ n: vals.n }}
                    onChange={(k, v) => setVals((s) => ({ ...s, [k]: v }))}
                    onSubmit={checkWritten}
                    layout="fraction"
                    den={DEN}
                    disabled={slateDisabled}
                    autoFocusKey={slateAutoFocus === "n" ? "n" : undefined}
                    ariaLabel="leftover fraction"
                  />
                </div>
              </div>
            ) : (
              /* STAGE 1 (Manipulate) has no writing — the blocks ARE the answer */
              <span className="r5-mixed">
                <span className="r5-touch-cue">{grouped ? (REMAIN > 0 ? WHOLES + " and " + REMAIN + "/" + DEN : String(WHOLES)) : "group the blocks"}</span>
              </span>
            )}
          </div>
          <div className="r5-ans-cap">
            {solved ? "full marks — " + NUMER + "/" + DEN + " = " + WHOLES + (REMAIN > 0 ? " and " + REMAIN + "/" + DEN : "") + "!"
              : isManipulate ? "group every " + DEN + " pieces into a whole — by touch"
              : (needsGroup && !grouped) ? "group the pieces into a whole to unlock the writing"
              : (isFade && wholesPick !== WHOLES) ? "choose how many wholes fit, then write"
              : "write the whole number" + (exactWhole ? " — it's exactly " + WHOLES + " wholes" : " and the leftover on top")}
          </div>
          <div className="r5-ans-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={isManipulate ? advance : checkWritten}
              disabled={isManipulate && !solved}>
              {isManipulate && !solved ? "Group it ▸" : checkLabel}
            </button>
          </div>
        </div>

        {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
        <div className="r5-z-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
      )}

      {/* the drag ghost block that follows the pointer */}
      {drag && (
        <div className="r5-ghost r5-block is-grabbing" style={{ left: drag.x - 45, top: drag.y - 15, width: 90, height: 30, background: denomColor(DEN), position: "fixed" }}>
          <div className="r5-hatch" style={{ backgroundImage: denomHatch(DEN), backgroundSize: denomHatchSize(DEN) }} />
          <span className="r5-lab" style={{ color: denomTextColor(DEN) }}>1/{DEN}</span>
        </div>
      )}
    </div>
  );
}
