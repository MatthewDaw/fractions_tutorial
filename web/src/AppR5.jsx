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
import { createPortal } from "react-dom";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Lock from "./components/Lock.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, LessonGoal } from "./components/lesson";
import { denomColor, denomTextColor, denomHatch, denomHatchSize } from "./denominatorColors.js";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
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
  ["showwork", "Show Work", "Show your work on a blank slate.", "✎"],
  ["5-words", "Words", "A recipe story — read it, write the mixed number.", "5"],
];
const NEXT_STAGE = { "1-manipulate": "2-bind", "2-bind": "3-fade", "3-fade": "workbench", "workbench": "4-numbers", "4-numbers": "applied", "applied": "showwork", "showwork": "5-words" };

// ---------------- main ----------------
// ---- per-stage problem selection (the swap resetForStage used to inline) -----
// 4-numbers carries the EXACT-WHOLE trap (14/7 = 2, empty leftover); applied and
// 5-words wrap 11/4 (= 2 and 3/4); every other stage carries the anchor 9/7.
function probForStage(s) {
  return s === "4-numbers" ? { num: 14, den: 7 }
    : (s === "5-words" || s === "applied") ? { num: 11, den: 4 }
    : ANCHOR;  // 1-manipulate / 2-bind / 3-fade / workbench all carry the anchor 9/7
}

// ---- the per-stage opening greeting (was set inline by resetForStage) -------
function stageGreeting(s) {
  const p = probForStage(s);
  return {
    "1-manipulate": "Nine sevenths — more than one whole. Drag pieces into the whole-unit frame until it fills. No writing yet.",
    "2-bind": "Group the pieces into a whole, then write the mixed number beside the blocks.",
    "3-fade": "The blocks are just a faint check now. Choose how many wholes fit, then write the mixed number.",
    "workbench": "The Workbench. Pull " + p.den + "ths from the bin and build " + p.num + "/" + p.den + " on the line, then count them up.",
    "4-numbers": "Just the numbers: " + p.num + "/" + p.den + " = ? Write the whole mixed number on the Slate. (Watch the leftover!)",
    "applied": "A question in words, with the amount shown. Write it as one improper fraction first, then give the mixed number.",
    "showwork": "Show your work — write anything you like on the blank slate, then tap Next.",
    "5-words": "A recipe — read it, find the improper fraction, and write the mixed number.",
  }[s];
}

export default function AppR5({ no, title, onBack, onRewatchIntro }) {
  // --- DOMAIN STATE (the parts the shared controller hook does NOT own) -------
  // the live improper fraction for this stage
  const [prob, _setProb] = useState(ANCHOR);
  const { num: NUMER, den: DEN } = prob;
  const { wholes: WHOLES, remain: REMAIN } = mixedOf(NUMER, DEN);
  const probRef = useRef(prob);
  useEffect(() => { probRef.current = prob; }, [prob]);

  // manipulate state: how many overflow pieces have been grouped into the frame
  const [placed, setPlaced] = useState(0);
  const [hotFrame, setHotFrame] = useState(false);
  const [drag, setDrag] = useState(null);              // { x, y } pointer pos while dragging
  const [wholesPick, setWholesPick] = useState(null);  // stage-3 symbolic "how many wholes" choice
  const [bad, setBad] = useState(false);               // shake the slate on a wrong write
  const [vals, setVals] = useState({ w: "", n: "" });  // the Slate's written digits
  // ---- word→math translation surfaces (Applied gate + Words optional scratch) ----
  // Applied: the child TRANSCRIBES the improper fraction the words describe here;
  // once it matches the live problem the mixed-number answer unlocks (setupOk).
  // Words: the same single-fraction surface is OPTIONAL scratch — never gates.
  const [setupFrac, setSetupFrac] = useState({ num: "", den: "" });
  const [setupOk, setSetupOk] = useState(false);
  // ---- mandatory "show your work" blank-slate gate (between Applied and Words) ----
  const [showWorkInked, setShowWorkInked] = useState(false);

  // ---- SHARED CONTROLLER BACKBONE (engine wiring + stage nav + outcome state) --
  // The hook owns everything identical across lessons; R5 supplies only its stage
  // model (advance/back map), its per-stage greeting, and its per-stage reset
  // (problem swap + domain state zeroing). advanceMode:"deferred" reproduces R5's
  // setTimeout(...,1500) before the engine decision (the celebration lingers).
  // R5 keeps its OWN `bad`/shakeBad shake (not the hook's flashBad/badInput) and
  // its OWN `placed`/`prob` refs; from the hook it takes solvedRef/stageRef/
  // selfCorrectionsRef + the nav/engine/outcome surface.
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, applyEngineDecision,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    say, speaking, selfCorrectionsRef, stageRef,
  } = useLessonScaffold({
    nodeId: "IMPROPER_TO_MIXED",
    lessonId: "r5",
    initialStage: "1-manipulate",
    // R5's existing NEXT_STAGE map (8-stage non-contiguous arc). Returns undefined
    // on the last stage → the hook calls onEnd, which REPLAYS the current stage
    // (R5's original advance() re-dealt the last stage instead of stopping).
    advance: (cur) => NEXT_STAGE[cur],
    // R5's existing inline reverse map (RaiseScaffold target — one stage back).
    back: (cur) => ({
      "2-bind": "1-manipulate",
      "3-fade": "2-bind",
      "workbench": "3-fade",
      "4-numbers": "workbench",
      "applied": "4-numbers",
      "showwork": "applied",
      "5-words": "showwork",
    }[cur]),
    introFor: (s) => ({ tone: "normal", text: stageGreeting(s) }),
    // The per-stage PROBLEM SWAP + domain state zeroing (R5's resetForStage body,
    // minus the nav/emit/stopVoice/status the hook now handles itself).
    resetStage: (s) => {
      const p = probForStage(s);
      _setProb(p); probRef.current = p;
      placedRef.current = 0;
      setPlaced(0);
      setHotFrame(false); setDrag(null); setWholesPick(null); setBad(false);
      setVals({ w: "", n: "" });
      // reset the word→math surfaces (Applied gate + Words scratch) on every stage change
      setSetupFrac({ num: "", den: "" }); setSetupOk(false);
      setShowWorkInked(false);
    },
    // Last stage: REPLAY (re-enter the current stage), as R5's advance() did.
    onEnd: () => goStage(stageRef.current),
  });

  // ---- stage flavor flags -----------------------------------------------------
  const isManipulate = stage === "1-manipulate";
  const isBind = stage === "2-bind";
  const isFade = stage === "3-fade";
  const isWorkbench = stage === "workbench";  // the free block sandbox (own render branch)
  const isNumbers = stage === "4-numbers";
  const isApplied = stage === "applied";      // worded question + a required setup gate
  const isShowWork = stage === "showwork";    // mandatory blank-slate "show your work" step
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

  // R5-OWNED ref: the live placement count (the hook owns solvedRef/stageRef).
  const placedRef = useRef(placed);
  useEffect(() => { placedRef.current = placed; }, [placed]);

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
    if (solved) { nextStage(); return; }
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
      reportAttempt({ correct: false, answerValue: [isNaN(w) ? 0 : w, NUMER], errorSignature: errSig, stars: 0 });
      return;
    }
    finishSolved(3, "Yes! " + NUMER + "/" + DEN + " = " + WHOLES + (exactWhole ? "" : " and " + REMAIN + "/" + DEN) + ". " + (exactWhole ? "Exactly " + WHOLES + " wholes — nothing left over. " : "") + "Full marks, povaryonok!", [NUMER, DEN]);
  }

  // R5's celebrate-then-advance. The hook's award sets solved/stars/cook=cheer,
  // says "r5FullMarks", reports the correct attempt, and — under advanceMode
  // "deferred" — applies the engine decision after deferredDelayMs (1500ms). That
  // exactly reproduces R5's old finishSolved + setTimeout(...,1500); no manual
  // timer here anymore.
  function finishSolved(st, text, answerValue) {
    award(text, "r5FullMarks", answerValue ?? null, { stars: st });
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

  // ---- stage navigation -------------------------------------------------------
  // goStage / nextStage now come from the hook (they own the problem swap via
  // resetStage, the greeting via introFor, the stopVoice, and the problem_present
  // emit). The header ⟲ re-deals the CURRENT stage — which is exactly re-entering
  // it, so resetForStage is now a thin wrapper over goStage (re-runs the per-stage
  // problem swap + zeroing). The mount problem_present + opening greeting are
  // emitted by the hook itself, so the old init useEffect is gone.
  const resetForStage = (s) => goStage(s);

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

  // ── CANONICAL QUESTION BAND — the shared full-width band, mounted directly
  //    under the stage-selector tabs on every stage EXCEPT the final words-only
  //    stage ("5-words"). It shows this lesson's live improper fraction with a "?"
  //    answer that becomes the solved mixed number once the stage is solved. The
  //    goal/story copy below it is secondary helper text. Replaces the old ad-hoc
  //    .r5-question band AND the in-canvas .eqstate float that used to overlap the
  //    board. The Words stage deliberately HIDES this band: the child must read the
  //    prose recipe and extract the improper fraction themselves — showing the bare
  //    equation would give the answer away. (Applied keeps it: it shows the amount
  //    on purpose.)
  const Band = (
    <QuestionBand
      lead="write as a mixed number"
      expr={<>{NUMER}/{DEN}</>}
      answer={solved ? (REMAIN > 0 ? <>{WHOLES} and {REMAIN}/{DEN}</> : <>{WHOLES}</>) : "?"}
    />
  );

  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="r5Goal" voxSpeaker="mom">
      {isWorkbench
        ? <>Build <b>{NUMER}/{DEN}</b> on the Workbench — pull same-size blocks from the bin, stack them to the flag, and count them up.</>
        : isApplied
        ? <>A question in words, with the amount shown. Write it as one <b>improper fraction</b> first, then give the mixed number.</>
        : isWords
        ? "Read the recipe, find the fraction that's more than one whole, and write it as a mixed number."
        : <>Babushka can't ask for <b>{NUMER}/{DEN}</b> of a tray — that's more than one whole. Group the pieces into <b>whole units</b>, then name the leftover.</>}
    </LessonGoal>
  );

  // The Cook + speech ribbon, shared by the fixed-zone stages.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  let body = null;

  if (isWorkbench) {
    /* WORKBENCH — the free block sandbox replaces the board entirely. It
       renders its OWN .play (diagram + rail); we add a sibling .hud with the
       Cook + status ribbon + a "Next ▸" that unlocks on solve. Left on the
       shared .play/.hud layout (no overlap bug — not a fixed-zone stage). */
    body = (
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
              <button className={"check" + (solved ? " done" : "")} onClick={nextStage} disabled={!solved}>{solved ? checkLabel : "Build it ▸"}</button>
            </div>
          </div>
        </>
    );
  } else if (isApplied) {
    /* APPLIED — a worded question (the amount shown) with a REQUIRED setup gate:
       write the improper fraction the words describe; only then does the
       mixed-number answer unlock. Left on the shared .play/.hud layout. */
    body = (
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
    );
  } else if (isShowWork) {
    /* SHOW WORK — a mandatory blank-slate step between Applied and Words. The
       child writes anything they like; Next unlocks once ink is down. No
       grading, no engine decision — advancement is a plain nextStage(). Left on
       the shared .play/.hud layout. */
    body = (
        <>
          <div className="play">
            <div className="diagram">
              <div className="bs-surface" style={{ position: "relative", width: 800, height: 360 }}>
                <BlankSlate
                  key={`showwork:${stage}`}
                  hint="show your work here — write anything you like ✎"
                  onInkChange={setShowWorkInked}
                  ariaLabel="show your work on a blank slate"
                />
              </div>
            </div>
            <div className="rail">
              <div className="panel">
                <h3>Show Your Work</h3>
                <div className="hint">Use the slate to work it out however you like — group the pieces, write the division, sketch it. Put something down, then tap Next.</div>
              </div>
            </div>
          </div>
          <div className="hud">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>
            <div className="marks">
              <button
                className={"check" + (showWorkInked ? " ready" : "")}
                disabled={!showWorkInked}
                onClick={nextStage}
              >Next ▸</button>
            </div>
          </div>
        </>
    );
  } else if (isWords) {
    /* WORDS (beat 6, out of the s1–s5 sweep) — keeps the shared <WordProblem>
       card flow. Not a fixed-zone stage; left on the existing .play layout. */
    body = (
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
                  setupLead="Optional — show your work here"
                  setup={
                    /* GENEROUS full-width scratch slate (consistent with M3's
                       ~756×246 reference). With the bare-equation QuestionBand
                       hidden on this words-only stage, there's room for a roomy
                       slate the child can actually sketch the grouping/division
                       in — not a sliver. Fixed px so the centered .wp column
                       gives it a real width instead of collapsing to content. */
                    <div className="r5-scratch-surface bs-surface" style={{ position: "relative", width: 740, maxWidth: "100%", height: 300 }}>
                      <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
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
                <div className="hint">No blocks, no equation. Read the recipe, work out the improper fraction it describes, then write it as a mixed number.</div>
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
    );
  } else {
    /* ════════════════════════════════════════════════════════════════════════
       STAGES 1–4 of the sweep (Manipulate / Bind / Fade / Numbers) — now the
       shared <LessonBoard> split layout. The stage and the answer card live in
       SEPARATE grid tracks (lesson-board.css), so the answer composer can never
       overlap the board (the bug the old absolute .r5-z-* rectangles risked).
       footHeight=236 reserves room for the TALL two-column mixed-number composer.
       The board is wrapped in <FitStage> so the tallest improper-fraction stack
       (the 9-high 9/7 overflow column) auto-downscales to fit the now-flexible
       stage instead of clipping top/bottom — the canvas keeps its own 720×348
       absolute geometry; FitStage only shrinks it uniformly.
       ════════════════════════════════════════════════════════════════════════ */
    const Stage = (
          <FitStage className="r5-board-fit">
          {/* STAGES 1–3: the manipulative board (live, or a faded ghost on stage 3) */}
          {showBoard && (
            <div className={"canvas r5-canvas" + (ghostBoard ? " r5-ghost-board" : "")} id="r5canvas">
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

              {/* "Group a piece" affordance — DRAG the block into the frame.
                  This is a KEYBOARD-only assist (Enter/Space groups one piece);
                  it has NO pointer tap-to-place path, so a plain tap/click can
                  never place a block. The pointer user drags the overflow Block
                  (grabBlock); the keyboard user activates here. placeOne() and
                  the place_block emit are unchanged. */}
              {!locked && !solved && needsGroup && (
                <button
                  className="joinbtn"
                  style={{ left: COL_X, top: COL_TOP + leftover * 30 + 16 }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); placeOne(); } }}
                >
                  ▸ Drag a piece into the whole
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
          </FitStage>
    );

    // ── HINT RAIL (top-right) — one .panel card; goes in LessonBoard's rail slot.
    const Rail = (
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
    );

    // ── EQUATION + MIXED-NUMBER COMPOSER + CHECK — the shared <AnswerBar>. The
    //    equation prefix (NUMER/DEN =) + the write composer ([whole] and
    //    [fraction]) are the `eq`; AnswerBar supplies the card frame, caption, the
    //    Rosette-on-solve and the Check button. Goes in LessonBoard's answer slot.
    const Answer = (
      <AnswerBar
        eq={
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
        }
        cap={
          solved ? "full marks — " + NUMER + "/" + DEN + " = " + WHOLES + (REMAIN > 0 ? " and " + REMAIN + "/" + DEN : "") + "!"
            : isManipulate ? "group every " + DEN + " pieces into a whole — by touch"
            : (needsGroup && !grouped) ? "group the pieces into a whole to unlock the writing"
            : (isFade && wholesPick !== WHOLES) ? "choose how many wholes fit, then write"
            : "write the whole number" + (exactWhole ? " — it's exactly " + WHOLES + " wholes" : " and the leftover on top")
        }
        solved={solved}
        ready={answerReady}
        stars={stars}
        onCheck={isManipulate ? nextStage : checkWritten}
        checkLabel={isManipulate && !solved ? "Group it ▸" : checkLabel}
        checkDisabled={isManipulate && !solved}
      />
    );

    body = (
      <LessonBoard
        footHeight={236}
        railWidth={396}
        stage={Stage}
        rail={Rail}
        answer={Answer}
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag="Mixed Numbers"
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={() => resetForStage(stage)}
      tabs={{
        stages: STAGES.map(([key, title, sub, badge]) => ({ key, badge, title, sub })),
        current: stage,
        onSelect: goStage,
      }}
      band={!isWords ? Band : null}
      goal={Goal}
      extra={
        /* the drag ghost block that follows the pointer. Portaled to <body> so its
           position:fixed resolves against the VIEWPORT — the app's #stage carries a
           transform: scale() (Shell.useStageFit), which would otherwise become the
           containing block for this fixed ghost and drift it up-left of the cursor. */
        drag && createPortal(
          <div className="r5-ghost r5-block is-grabbing" style={{ left: drag.x - 45, top: drag.y - 15, width: 90, height: 30, background: denomColor(DEN), position: "fixed" }}>
            <div className="r5-hatch" style={{ backgroundImage: denomHatch(DEN), backgroundSize: denomHatchSize(DEN) }} />
            <span className="r5-lab" style={{ color: denomTextColor(DEN) }}>1/{DEN}</span>
          </div>,
          document.body
        )
      }
    >
      {body}
    </LessonShell>
  );
}
