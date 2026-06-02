// LessonUnlikeDen.jsx — The Cook's Lesson: slice to same-size blocks → join →
// write the total. The scaffold LADDER (room doc §4.4): L0/L1 blocks lead → L2
// blocks fade → L3 numbers lead → L4 new dress → L5 bare + ghost backdrop → L6
// bare slate. The math runs through a shared, content-free problem engine
// (unlikeDenMath.js); the worked example (anchor), the L4 transfer bank, and the
// voice-clip keys all come from the per-lesson `lesson` config prop.
import React, { useState, useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Knife from "./components/Knife.jsx";
import Plank from "./components/Plank.jsx";
import Rosette from "./components/Rosette.jsx";
import DenominatorPicker from "./components/DenominatorPicker.jsx";
import BigFrac from "./components/BigFrac.jsx";
import InkPad from "./components/InkPad.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import ExpressionSlate from "./components/ExpressionSlate.jsx";
import { useVoice } from "./voice.js";
import { denomColor, denomTextColor, denomTone } from "./denominatorColors.js";
import { lcd, exactSum, commonDenChoices, multipliersFor, verify, generateProblem, crossMultiply } from "./unlikeDenMath.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/lesson-unlike.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Derive a stable engine nodeId from the lesson framing config.
// "crossMultiply" → r2 (Cross-Multiply, ADD_UNLIKE_COPRIME)
// "scaleOne"      → r3 (Scale One,      ADD_UNLIKE_NESTED)
function nodeIdFromLesson(lesson) {
  const kind = lesson?.framing?.kind;
  if (kind === "crossMultiply") return "ADD_UNLIKE_COPRIME";
  if (kind === "scaleOne") return "ADD_UNLIKE_NESTED";
  // Fallback: infer from framing.crossMultiply flag
  return lesson?.framing?.crossMultiply ? "ADD_UNLIKE_COPRIME" : "ADD_UNLIKE_NESTED";
}

// Derive a lessonId ("r2" or "r3") from the lesson framing config.
function lessonIdFromLesson(lesson) {
  const kind = lesson?.framing?.kind;
  if (kind === "crossMultiply") return "r2";
  if (kind === "scaleOne") return "r3";
  return lesson?.framing?.crossMultiply ? "r2" : "r3";
}

// Derive a surface_form key from the problem shape (used for transfer tracking).
// Strategy: use lesson.surface_forms if present; classify by problem structure.
function surfaceFormFor(problem, lesson) {
  const forms = lesson?.surface_forms;
  if (!forms || forms.length < 2) return "default";
  const { aDen, bDen } = problem;
  // For r2-unit (crossMultiply): unit fractions; classify by whether 2 is a denominator
  // For r3-nonunit (scaleOne): non-unit; classify by whether 8 is a denominator
  const lessonKind = lesson?.framing?.kind;
  if (lessonKind === "crossMultiply") {
    // "unit_halves" if either denom is 2; "unit_thirds" otherwise
    return (aDen === 2 || bDen === 2) ? forms[0] : forms[1];
  } else {
    // "scale_one_eights" if either denom is 8; "scale_one_thirds" otherwise
    return (aDen === 8 || bDen === 8) ? forms[0] : forms[1];
  }
}

// Derive an error_signature from verify result + the problem + submitted answer.
function errorSignatureFor(problem, n, d) {
  // Correct answer → no signature
  if (verify(problem, n, d).ok) return null;
  const { aNum, aDen, bNum, bDen } = problem;
  // add_denominators: n === aNum + bNum AND d === aDen + bDen
  if (n === aNum + bNum && d === aDen + bDen) return "add_denominators";
  // add_across_unlike: n === aNum + bNum AND d === aDen (or bDen, straight across)
  if (n === aNum + bNum && (d === aDen || d === bDen)) return "add_across_unlike";
  // scaled_bottom_only: denominator is a common multiple but numerator wasn't scaled
  const okD = d % aDen === 0 && d % bDen === 0;
  const expectedN = aNum * (d / aDen) + bNum * (d / bDen);
  if (okD && n !== expectedN && n === aNum + bNum) return "scaled_bottom_only";
  return "other";
}

// Capture minimum recognizer confidence across num + den InkPad samples.
function inkConfidence(numPadRef, denPadRef) {
  try {
    const ns = numPadRef.current?.getSample?.()?.recognized?.conf ?? null;
    const ds = denPadRef.current?.getSample?.()?.recognized?.conf ?? null;
    if (ns == null && ds == null) return null;
    if (ns == null) return ds;
    if (ds == null) return ns;
    return Math.min(ns, ds);
  } catch (_) { return null; }
}

// SPAN = the pixel width the ruler ALWAYS fills (ORIGIN → ORIGIN+SPAN). Pixels
// per whole (UNIT) is derived per problem as SPAN / answerWholes, so a 1-whole
// problem uses the full width (large blocks) and a 2-whole problem packs two
// wholes into the same span. The ruler never leaves empty space on the right.
const ORIGIN = 60, SPAN = 600, CW = 720, CH = 360, LINE_Y = 322, BAR_H = 72;
const HOME = { A: { x: ORIGIN, y: 250 }, B: { x: ORIGIN, y: 86 } };

// ---- the joined strip ----
// Once joined, every block is one common size (denominator D), so the whole
// strip is a single uniform denominator color — the payoff of "they're all the
// same size now". The seam between the (mA) pieces that came from a/aDen and the
// (mB) from b/bDen stays countable via a heavier divider, not a different hue.
function Combined({ countA, countB, D, unit }) {
  const pieceW = unit / D;
  const total = countA + countB;
  const fill = denomColor(D), labCol = denomTextColor(D);
  return (
    <div className="plank lit" style={{ width: total * pieceW }}>
      <div className="plank-body">
        {Array.from({ length: total }).map((_, i) => {
          const seam = i === countA - 1 && i < total - 1; // the a | b join
          return (
            <div key={i} className="piece" style={{
              width: pieceW, background: fill,
              borderRight: i < total - 1 ? `${seam ? 3 : 1.5}px solid ${denomTone(D, seam ? 0.8 : 0.55)}` : "none",
            }}>
              {/* unit label only — the child counts the blocks themselves */}
              <span className="piece-lab" style={{ color: labCol, fontSize: pieceW < 58 ? 13 : 15 }}>1/{D}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- main ----------------
// The ladder order — after solving a level, "Next" climbs to the next rung
// (one question per level). L6 has no successor (terminal).
// Arc order (lesson-stage-arc-expansion): … Fade(L4) → Workbench(LW) → ghost(L5)
// → Numbers(L6) → Applied(LA) → Words(L7). LW = block sandbox; LA = applied
// sentence with a required setup gate.
const NEXT_BEAT = { L0: "L2", L2: "L4", L4: "LW", LW: "L5", L5: "L6", L6: "LA", LA: "L7" };

export default function LessonUnlikeDen({ no, title, lesson, onBack, onRewatchIntro }) {
  // Pedagogical beat. The ladder is one click each for the demo (topbar selector).
  //   L0/L1 = "blocks lead": drag the knife to slice (anchor 1/2 + 1/3).
  //   L2     = "pick the size": faded strips, pick the common size + see each
  //            fraction scale, then JOIN by hand (teach beat, on the anchor).
  //   L4     = "new dress": the same picker move on generated unlike pairs
  //            (some >1), auto-join, New-problem cycles (transfer beat).
  //   L5     = "bare + ghost backdrop": just the equation; bars linger, dimmed.
  //   L6     = "bare slate": equation + inputs only, no manipulatives at all.
  const [beat, _setBeat] = useState("L0");

  // ---- Engine integration (U10) -------------------------------------------
  // Derive stable ids so the hook receives consistent values on every render.
  const engineNodeId  = nodeIdFromLesson(lesson);
  const engineLessonId = lessonIdFromLesson(lesson);
  const { emit: engineEmit, judgeAndAdvance } = useLessonEngine({
    nodeId: engineNodeId,
    lessonConfig: { lessonId: engineLessonId, initialBeat: "L0" },
  });

  // selfCorrections: count of place/remove oscillations within the current attempt.
  const selfCorrRef = useRef(0);
  // Last engine Decision (returned synchronously by judgeAndAdvance; stored in a ref
  // so reset() can read it without a React state lag).
  const lastDecisionRef = useRef(null);
  const isL2 = beat === "L2";
  const isL4 = beat === "L4";
  const isL5 = beat === "L5";
  const isL6 = beat === "L6";
  const isL7 = beat === "L7"; // word problem: prose only, solved with the stylus
  const isLW = beat === "LW"; // Workbench: the free block sandbox (own render branch)
  const isLA = beat === "LA"; // Applied: worded question, numerals shown, setup gate
  // The picker (symbolic common-size choice) drives L2/L4. L5/L6/L7 are bare.
  const usesPicker = isL2 || isL4;
  // Strips faded to outlines whenever the blocks are no longer the lead actor.
  const stripsFaded = isL2 || isL4;
  // No canvas strips at all on L6/L7/LA; ghost (dim, non-interactive) backdrop on L5.
  const noBars = isL6 || isL7 || isLA;
  const ghostBars = isL5;
  // L5/L6/L7/LA: the child writes the whole answer directly (no slice/join gating).
  const bareEntry = isL5 || isL6 || isL7 || isLA;

  // ---- per-lesson framing (Scale One renames ONE; Cross-Multiply renames BOTH)
  const framing = lesson.framing || {};
  // The numbers-lead beats (Stage 3/4 = L5/L6) fold in the cross-multiply
  // crossing-arrows visual ONLY for the rename-both lesson.
  const showCross = !!framing.crossMultiply;
  // The WRITE channel uses the shared <Slate> from Stage 2 (Bind = L2) onward.
  // Stage 1 (L0 · Manipulate) is pure touch — no writing at all there. Below L2
  // the answer entry stays printed (there isn't one until the blocks match).
  const writeBeat = !(beat === "L0");
  const useSlate = !!lesson.handwriting && writeBeat;

  // ---- the problem model (anchor by default; L4 cycles generated pairs) ----
  const [probIndex, setProbIndex] = useState(0);
  const [wpIndex, setWpIndex] = useState(0); // which L7 word problem is showing
  const [problem, _setProblem] = useState(lesson.anchor);
  const { aNum, aDen, bNum, bDen } = problem;
  const problemRef = useRef(problem);
  useEffect(() => { problemRef.current = problem; }, [problem]);

  // ---- slice multipliers + derived state (generalized) ----
  const [mA, setMA] = useState(1);
  const [mB, setMB] = useState(1);
  const [joined, setJoined] = useState(false);
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [tickA, setTickA] = useState(0);
  const [tickB, setTickB] = useState(0);
  const [shakeA, setShakeA] = useState(false);
  const [shakeB, setShakeB] = useState(false);
  const [numStr, setNumStr] = useState("");
  const [denStr, setDenStr] = useState("");
  const [badInput, setBadInput] = useState(false);
  // Answer-entry gate: the denominator is written + checked first ("den"); only
  // then does the numerator unlock ("num"). Reset to "den" per fresh problem.
  const [stage, setStage] = useState("den");
  const [hoverBar, setHoverBar] = useState(null);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState({ tone: "normal", text: "Two strips, different block sizes. Grab a knife and slice, povaryonok." });
  const [posA, _setPosA] = useState(HOME.A);
  const [posB, _setPosB] = useState(HOME.B);
  const [dragBar, setDragBar] = useState(null);
  const [dragKnife, setDragKnife] = useState(null); // {n,x,y}

  // ---- word→math translation surfaces (Applied gate + Words optional scratch) ----
  // Applied (LA): the child TRANSCRIBES the two shown fractions here; once they
  // match the problem (either order) the answer unlocks (setupOk). Words (L7): the
  // same surface is OPTIONAL scratch — never gates, never graded.
  const [setupA, setSetupA] = useState({ num: "", den: "" });
  const [setupB, setSetupB] = useState({ num: "", den: "" });
  const [setupOk, setSetupOk] = useState(false);
  const [scratchA, setScratchA] = useState({ num: "", den: "" });
  const [scratchB, setScratchB] = useState({ num: "", den: "" });

  // scaled numerators/denominators of each addend after slicing
  const numA = aNum * mA, denA = aDen * mA, numB = bNum * mB, denB = bDen * mB;
  const matched = aDen * mA === bDen * mB;
  const D = aDen * mA;                 // the common denominator once matched
  const answerNum = aNum * mA + bNum * mB; // total count of common-size blocks
  // ruler in WHOLES: ≥1, rounded UP past the exact sum, capped at 2 (the bank
  // never sums to ≥2).
  const sum = exactSum(problem);                 // { num, den } over the LCD
  const PLCD = lcd(problem);
  const answerWholes = Math.min(2, Math.max(1, Math.ceil(sum.num / sum.den)));
  const RULER_TICKS = answerWholes * PLCD;       // 1/LCD steps drawn
  const choices = commonDenChoices(problem);
  // Pixels per whole: the ruler always fills SPAN, so blocks grow/shrink to fit
  // (a 1-whole problem fills the width; a 2-whole problem packs two wholes in).
  const UNIT = SPAN / answerWholes;
  // a strip's pixel width = its value × pixels-per-whole
  const barW = (id) => (id === "A" ? aNum / aDen : bNum / bDen) * UNIT;

  const { soundOn, speaking, say, stopVoice, toggleSound } = useVoice();
  const mARef = useRef(mA), mBRef = useRef(mB), matchedRef = useRef(matched);
  const joinedRef = useRef(joined), solvedRef = useRef(solved);
  const posARef = useRef(posA), posBRef = useRef(posB);
  const bodyA = useRef(), bodyB = useRef();
  const numPad = useRef(null), denPad = useRef(null); // handwriting cells (for Check-time capture)
  useEffect(() => { mARef.current = mA; }, [mA]);
  useEffect(() => { mBRef.current = mB; }, [mB]);
  useEffect(() => { matchedRef.current = matched; }, [matched]);
  useEffect(() => { joinedRef.current = joined; }, [joined]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  const setPosA = (p) => { posARef.current = p; _setPosA(p); };
  const setPosB = (p) => { posBRef.current = p; _setPosB(p); };

  function clientToStage(cx, cy) { const s = document.getElementById("stage").getBoundingClientRect(); const k = s.width / 1280 || 1; return { x: (cx - s.left) / k, y: (cy - s.top) / k }; }
  function hitBar(cx, cy) {
    for (const [id, ref] of [["A", bodyA], ["B", bodyB]]) {
      const el = ref.current; if (!el) continue; const r = el.getBoundingClientRect();
      if (cx >= r.left - 10 && cx <= r.right + 10 && cy >= r.top - 14 && cy <= r.bottom + 14) return id;
    } return null;
  }

  // ---- changing a strip's division ----
  function setM(bar, val) {
    if (bar === "A") { mARef.current = val; setMA(val); setTickA(t => (val > 1 ? t + 1 : 0)); }
    else { mBRef.current = val; setMB(val); setTickB(t => (val > 1 ? t + 1 : 0)); }
  }

  function applyCut(bar, n) {
    if (joinedRef.current || solvedRef.current) return;
    setM(bar, n);
    const nA = mARef.current, nB = mBRef.current;
    const p = problemRef.current;
    setCook("idle");
    if (p.aDen * nA === p.bDen * nB) {
      setStatus({ tone: "ok", text: "Same-size blocks now! Write the bottom number: how big is each block?" });
      say("denPrompt");
    } else {
      setStatus({ tone: "normal", text: `${p.aNum}/${p.aDen} is now ${p.aNum * nA}/${p.aDen * nA} and ${p.bNum}/${p.bDen} is now ${p.bNum * nB}/${p.bDen * nB}. Keep slicing until every block is the same size.` });
    }
  }

  // L2/L3/L4: apply a chosen common denominator to BOTH strips, then run the
  // same match check. Atomic so the two cuts can't batch-clobber.
  function applyCommon(denom) {
    if (joinedRef.current || solvedRef.current || matchedRef.current) return;
    const p = problemRef.current;
    const { multA, multB, valid } = multipliersFor(p, denom);
    if (!valid) {
      setStatus({ tone: "warn", text: "That size doesn't make both strips match. Try another." });
      say("notQuite");
      return;
    }
    setM("A", multA);   // setM updates mARef synchronously, then schedules state
    setM("B", multB);
    setCook("idle");
    // The chosen common size IS the answer's denominator — auto-fill the bottom box.
    setDenStr(String(denom));
    if (isL2) {
      // L2 still manipulates blocks: after the picker slices, the child JOINS by
      // hand — drag the strips together (or the "Join the strips" button) — same as
      // the L0/L1 knife path. No auto-join.
      setStatus({ tone: "ok", text: "Same-size blocks now! Drag the strips together to join them." });
      say("dragTogether");
    } else {
      // L3/L4 are symbolic ("numbers lead"); the bars are only a check, so jump
      // straight to the numerator with an auto-join.
      doJoin();
    }
  }

  // Switch beats (locked once a problem is in progress / solved).
  function setBeatLevel(b) {
    // Free navigation: clicking any beat box jumps there anytime, resetting the
    // board to a fresh start for that level (clearForBeat clears mid-solve state).
    _setBeat(b);
    clearForBeat(b);
  }

  // Reset the board to a fresh start appropriate for beat `b` (sets the problem,
  // multipliers, inputs, status). One place so every entry point stays coherent.
  function clearForBeat(b, genIndex) {
    stopVoice(); // switching beats silences any in-flight clip at once
    const wps = lesson.wordProblems || [];
    let p;
    if (b === "L4") p = generateProblem(lesson.bank, genIndex != null ? genIndex : probIndex);
    else if (b === "L7" && wps.length) p = wps[(genIndex != null ? genIndex : wpIndex) % wps.length].problem;
    else p = lesson.anchor;
    _setProblem(p); problemRef.current = p;
    mARef.current = 1; mBRef.current = 1; joinedRef.current = false; solvedRef.current = false; matchedRef.current = false;
    setMA(1); setMB(1); setJoined(false); setSolved(false); setStars(0); setTickA(0); setTickB(0);
    setNumStr(""); setDenStr(""); setStage("den"); setPosA(HOME.A); setPosB(HOME.B); setCook("idle");
    // reset the word→math surfaces (Applied gate + Words scratch) on every beat change
    setSetupA({ num: "", den: "" }); setSetupB({ num: "", den: "" }); setSetupOk(false);
    setScratchA({ num: "", den: "" }); setScratchB({ num: "", den: "" });
    if (b === "L0") setStatus({ tone: "normal", text: "Two strips, different block sizes. Grab a knife and slice, povaryonok." });
    else if (b === "L2") setStatus({ tone: "normal", text: "Pick the common block size, watch each fraction scale, then join the strips." });
    else if (b === "L4") setStatus({ tone: "normal", text: "A new pair. Find a common size, then add — same move, new dress." });
    else if (b === "LW") setStatus({ tone: "normal", text: "The Workbench. Pull blocks from the bin and build the answer out of same-size pieces, then count them up." });
    else if (b === "L5") setStatus({ tone: "normal", text: "Just the numbers. The bars are only a memory now — write the whole answer." });
    else if (b === "L6") setStatus({ tone: "normal", text: "Bare slate. Find the common denominator, scale, and add — write it all." });
    else if (b === "LA") setStatus({ tone: "normal", text: "A question in words — the fractions are right there. Write them as a sum first, then give the answer." });
    else if (b === "L7") setStatus({ tone: "normal", text: "A recipe! Read it, work out the two fractions yourself, and write the total." });
    // Emit problem_present for the engine (at the boundary between problems).
    // selfCorrRef resets per problem.
    selfCorrRef.current = 0;
    engineEmit({
      type: "problem_present",
      payload: {
        node_id: engineNodeId,
        scaffold_level: toScaffoldLevel(engineLessonId, b),
        beat: b,
      },
      modality: "tap",
    });
  }

  function resetBar(bar) {
    if (joinedRef.current || solvedRef.current || matchedRef.current) return;
    setM(bar, 1);
    // Each reset after a cut counts as one self-correction (place→remove oscillation).
    selfCorrRef.current += 1;
    setCook("idle"); setStatus({ tone: "normal", text: "Put that strip back together — now try a different knife." });
  }

  function grabKnife(n, e) {
    if (joined || solved || matched) return; // slicing locks once the blocks match
    e.preventDefault(); e.stopPropagation();
    const p = clientToStage(e.clientX, e.clientY); setDragKnife({ n, x: p.x, y: p.y });
    const move = (ev) => { const q = clientToStage(ev.clientX, ev.clientY); setDragKnife({ n, x: q.x, y: q.y }); setHoverBar(hitBar(ev.clientX, ev.clientY)); };
    const up = (ev) => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); const h = hitBar(ev.clientX, ev.clientY); setDragKnife(null); setHoverBar(null); if (h) applyCut(h, n); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  // ---- strips: drag to move / bring together to join ----
  // The only valid left-edge positions for a strip are the two number-line
  // anchors: the origin (x = ORIGIN) or touching the right end of the other strip.
  function snapX(id, x) {
    const dw = barW(id);
    const o = id === "A" ? posBRef.current : posARef.current;
    const ow = barW(id === "A" ? "B" : "A");
    const abut = Math.min(o.x + ow, ORIGIN + answerWholes * UNIT - dw);
    return Math.abs(x - ORIGIN) <= Math.abs(x - abut) ? ORIGIN : abut;
  }

  function grabBar(id, e) {
    if (joined || solved) return;
    e.preventDefault();
    const pos = id === "A" ? posARef.current : posBRef.current;
    const canvas = document.getElementById("r2canvas").getBoundingClientRect();
    const k = document.getElementById("stage").getBoundingClientRect().width / 1280 || 1;
    const grab = { x: (e.clientX - canvas.left) / k - pos.x, y: (e.clientY - canvas.top) / k - pos.y };
    setDragBar(id);
    const move = (ev) => {
      const rawX = (ev.clientX - canvas.left) / k - grab.x;
      let ny = (ev.clientY - canvas.top) / k - grab.y;
      ny = Math.max(0, Math.min(CH - BAR_H, ny));
      const nx = snapX(id, rawX);
      (id === "A" ? setPosA : setPosB)({ x: nx, y: ny });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); setDragBar(null); dropBar(id); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  function dropBar(id) {
    const o = id === "A" ? "B" : "A";
    const dp = id === "A" ? posARef.current : posBRef.current;
    const op = o === "A" ? posARef.current : posBRef.current;
    const dw = barW(id), ow = barW(o);
    const near = Math.abs(dp.y - op.y) < 66 && dp.x <= op.x + ow + 48 && dp.x + dw >= op.x - 48;
    if (near) {
      if (matchedRef.current) { doJoin(); return; }
      // mismatch — bounce back and shake
      setShakeA(true); setShakeB(true); setCook("think");
      setStatus({ tone: "warn", text: "These blocks aren't the same size — they don't fit together. Slice them to match first." });
      say("dontFit");
      setPosA(HOME.A); setPosB(HOME.B);
      setTimeout(() => { setShakeA(false); setShakeB(false); }, 460);
      setTimeout(() => setCook("idle"), 1500);
      return;
    }
    const lane = HOME[id].y;
    (id === "A" ? setPosA : setPosB)({ x: snapX(id, dp.x), y: lane });
  }

  function doJoin() {
    setJoined(true); joinedRef.current = true; setCook("idle");
    setStatus({ tone: "ok", text: "Joined! Write the bottom number first — how big is each block? — then press Check." });
    say("denPrompt");
  }

  // Dev-only: when Check is pressed in handwriting mode, ship the WRITTEN answer
  // (both cells' ink PNGs + strokes + the recognizer's guess + correctness) to
  // the laptop's /__ink endpoint, so we can inspect real tablet handwriting and
  // improve the digit recognizer. One record per Check press. No-op in prod.
  function logCheck() {
    if (!import.meta.env.DEV || !lesson.handwriting) return;
    try {
      const n = parseInt(numStr, 10), d = parseInt(denStr, 10);
      const v = (n > 0 && d > 0) ? verify(problemRef.current, n, d) : { ok: false, stars: 0 };
      fetch("/__ink", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ts: Date.now(), beat, problem: problemRef.current,
          numStr, denStr, correct: !!v.ok, stars: v.stars || 0,
          num: numPad.current && numPad.current.getSample ? numPad.current.getSample() : null,
          den: denPad.current && denPad.current.getSample ? denPad.current.getSample() : null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  function checkAnswer() {
    if (solved) { reset(); return; }
    logCheck();
    const n = parseInt(numStr, 10), d = parseInt(denStr, 10);
    const p = problemRef.current;

    // Beats with strips: the child must slice both strips to equal-size blocks
    // (a common denominator) before any writing counts. Bare beats (L5/L6/L7)
    // have no strips, so this gate doesn't apply there.
    if (!bareEntry && !matched) {
      setCook("think");
      setStatus({ tone: "warn", text: "Slice both strips into the same-size blocks first — then write the total." });
      say("sliceFirst"); return;
    }

    // Two-stage entry: the DENOMINATOR is written and checked first — it must be
    // a size both strips reach (a common denominator) — and only then does the
    // NUMERATOR unlock. (Joining the strips stays optional; matching them does not.)
    if (stage === "den") {
      if (!(d > 0)) {
        setBadInput(true); setTimeout(() => setBadInput(false), 460);
        setStatus({ tone: "warn", text: "Write the bottom number first — how big is each block?" }); return;
      }
      if (!multipliersFor(p, d).valid) {
        setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
        setStatus({ tone: "warn", text: "That bottom number isn't a size both strips reach. Find a common denominator." });
        say("notQuite");
        // Emit wrong denominator as an incorrect attempt (partial — denominator wrong).
        _emitIncorrectAttempt(p, n > 0 ? n : null, d > 0 ? d : null);
        return;
      }
      // Valid common size — lock the denominator in and unlock the numerator.
      setStage("num"); setCook("idle");
      setStatus({ tone: "ok", text: "Good — the bottom number is set. Now count the blocks and write the top number." });
      say("joined");
      return;
    }

    // stage === "num": grade the whole fraction now that the denominator is fixed.
    if (!(n > 0)) {
      setBadInput(true); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Write the top number — how many blocks in all?" }); return;
    }
    const res = verify(p, n, d);
    if (!res.ok) {
      setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Not quite — count every block. How many in all?" });
      say("notQuite");
      // Emit incorrect attempt with error signature for engine tracking.
      _emitIncorrectAttempt(p, n, d);
      return;
    }
    finishSolved(res.stars, n, d);
  }

  // Emit a judgeAndAdvance for an incorrect attempt (both stages of two-stage entry).
  function _emitIncorrectAttempt(p, n, d) {
    const usingInkPad = lesson.handwriting && !useSlate;
    const modality = usingInkPad ? "handwriting" : "tap";
    const recognizerConf = usingInkPad ? inkConfidence(numPad, denPad) : null;
    const dec = judgeAndAdvance(
      { value: (n != null && d != null) ? [n, d] : null, modality, recognizerConfidence: recognizerConf },
      {
        correct: false,
        errorSignature: (n != null && d != null) ? errorSignatureFor(p, n, d) : null,
        stars: 0,
        hintMaxRung: 0,
        selfCorrections: selfCorrRef.current,
        surfaceForm: surfaceFormFor(p, lesson),
      }
    );
    lastDecisionRef.current = dec;
  }

  // Common "you got it" tail, shared by the gated and bare-entry paths.
  function finishSolved(st, n, d) {
    if (!joinedRef.current) { setJoined(true); joinedRef.current = true; }
    setSolved(true); setStars(st); setCook("cheer");
    const p = problemRef.current; const s = exactSum(p);
    if (st === 3) {
      setStatus({ tone: "ok", text: `Yes! ${p.aNum}/${p.aDen} + ${p.bNum}/${p.bDen} = ${s.num}/${s.den}. Same-size blocks, counted up — full marks, povaryonok!` });
      say(lesson.voice.fullMarks);
    } else {
      setStatus({ tone: "ok", text: `Right — ${n}/${d} is the same amount. Fewer, bigger blocks earn more stars.` });
      say(lesson.voice.sameAs);
    }
    // Emit the full correct Observation burst for the engine.
    // useSlate = Slate (tap-digital); !useSlate + handwriting = InkPad (handwriting).
    const usingInkPad = lesson.handwriting && !useSlate;
    const modality = usingInkPad ? "handwriting" : "tap";
    const recognizerConf = usingInkPad ? inkConfidence(numPad, denPad) : null;
    const dec = judgeAndAdvance(
      { value: [n, d], modality, recognizerConfidence: recognizerConf },
      {
        correct: true,
        errorSignature: null,
        stars: st,
        hintMaxRung: 0,
        selfCorrections: selfCorrRef.current,
        surfaceForm: surfaceFormFor(p, lesson),
      }
    );
    // Store the decision so reset() can read it synchronously.
    lastDecisionRef.current = dec;
    // Reset self-correction counter after the attempt is closed.
    selfCorrRef.current = 0;
  }

  // The post-solve "Next" button. After SOLVING, climb the ladder one rung
  // (L0→L2→L3→L4→L5→L6) — one question per level. Called from the mid-beat
  // "New problem" button (not yet solved) it instead re-deals the current beat,
  // and on L4 cycles to the next generated pair.
  //
  // Engine integration: if the last Decision was RaiseScaffold, stay at the
  // current beat (or go back one rung) rather than advancing. All other decisions
  // preserve the existing happy path so playability is never regressed.
  function reset() {
    stopVoice(); // advancing silences any in-flight clip at once
    const wasSolved = solvedRef.current;
    const dec = lastDecisionRef.current;

    // RaiseScaffold: hold at the current beat (do not advance even on solve).
    // This is the engine's in-lesson scaffold raise — work is preserved (dec.preserveWork).
    if (wasSolved && dec && dec.kind === "RaiseScaffold") {
      // Stay at the current beat — re-deal the same level for another practice round.
      if (beat === "L4") {
        const next = probIndex + 1;
        setProbIndex(next);
        clearForBeat("L4", next);
      } else if (beat === "L7") {
        const next = wpIndex + 1;
        setWpIndex(next);
        clearForBeat("L7", next);
      } else {
        clearForBeat(beat);
      }
      return;
    }

    if (wasSolved && NEXT_BEAT[beat]) {
      const nb = NEXT_BEAT[beat];
      _setBeat(nb);
      clearForBeat(nb);   // resets the board + sets the next rung's greeting
      return;
    }
    if (beat === "L4") {
      const next = probIndex + 1;
      setProbIndex(next);
      clearForBeat("L4", next);
      return;
    }
    if (beat === "L7") {
      const next = wpIndex + 1;
      setWpIndex(next);
      clearForBeat("L7", next);
      return;
    }
    clearForBeat(beat);
  }

  // ---- ruler labels (generalized to the problem's LCD across answerWholes) ----
  // Whole marks (0, 1, 2) are taller and labelled with the whole number; the LCD
  // sub-marks are labelled only on the anchor's single whole so the line stays
  // readable. Mirrors AppR1's RLAB technique.
  const RLAB = Array.from({ length: RULER_TICKS + 1 }).map((_, k) => {
    const isWhole = k % PLCD === 0;
    return [k, isWhole ? String(k / PLCD) : `${k}/${PLCD}`, isWhole];
  }).filter(([, , isWhole]) => isWhole || (answerWholes === 1 && PLCD <= 8));

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);
  const checkLabel = !solved ? "Check" : (NEXT_BEAT[beat] ? "Next ▸" : (isL7 ? "New recipe ▸" : "New strips"));

  // ---- shared <Slate> wiring (the stylus WRITE channel from Stage 2 on) ----
  // The Slate is a controlled fraction surface: slot "num" over slot "den".
  // It commits each slot's recognized/tapped digit through onChange(key,value),
  // which we route into the SAME numStr/denStr state + verify path the typed
  // inputs used. Slots disable per the two-stage gate (den first, then num).
  function onSlateChange(key, value) {
    const v = onlyDigits(value);
    if (key === "num") setNumStr(v);
    else if (key === "den") setDenStr(v);
  }
  // On beats WITH strips, the answer stays locked until the child has sliced both
  // strips to equal-size blocks (matched = a shared common denominator). Bare
  // beats (L5/L6/L7) have no strips to slice, so writing is always available there.
  // Declared here (ahead of slateAutoKey) so it is initialized before first use.
  const blocksReady = bareEntry || matched;
  // Which slate slot should auto-pulse for "write here next": the denominator
  // until it's locked in, then the numerator.
  const slateAutoKey = solved ? undefined : (!blocksReady ? undefined : (stage === "den" ? "den" : "num"));
  // The fraction-shaped slot list for the answer Slate (top = num, bottom = den).
  // Two-stage gate via per-slot `locked`: in the "den" stage the NUMERATOR is
  // locked (write the bottom first); once the bottom is set ("num" stage) the
  // DENOMINATOR locks to its committed digit and the numerator opens. Solved
  // freezes both to their final digits.
  const slateSlots = [
    { key: "num", label: "top", locked: solved || stage === "den", digit: solved ? numStr : undefined },
    { key: "den", label: "bottom", locked: solved || stage === "num", digit: (solved || stage === "num") ? denStr : undefined },
  ];
  // The Slate hue follows the (live) common denominator once it's known.
  const slateDen = matched ? D : (parseInt(denStr, 10) || PLCD);

  // ---- cross-multiply crossing-arrows data (Stage 3/4, rename-both lesson) ----
  // Derived from the LIVE problem so it re-renders for every generated pair.
  const cm = showCross ? crossMultiply(problem) : null;

  // L7 word problem currently showing (its `problem` is the live problem set by
  // clearForBeat, so the same verifier grades it). `caption` is the prose prompt.
  const wordProblems = lesson.wordProblems || [];
  const wp = isL7 && wordProblems.length ? wordProblems[wpIndex % wordProblems.length] : null;

  // The equation string shown in the goal/HUD/worksheet, from the live problem.
  const eqLead = `${aNum}/${aDen} + ${bNum}/${bDen}`;

  // Stylus pivot: when the lesson opts in, the answer digits are HANDWRITTEN
  // (InkPad) instead of typed. Same numStr/denStr state + verify path downstream.
  const handwriting = !!lesson.handwriting;

  const denEnabled = !solved && stage === "den" && blocksReady;
  const numEnabled = !solved && stage === "num" && blocksReady;

  // "Ready to check": the child has committed the answer the current stage needs,
  // so the Check button lights up (a red glow, shared .check.ready). The blocks
  // must be ready (matched, or a bare beat), and BOTH the top and bottom must be
  // written. On the Applied (LA) gate, the sum must also be checked first.
  const answerReady = !solved && blocksReady && numStr !== "" && denStr !== ""
    && (!isLA || setupOk);

  // ---- Workbench (LW): the block sandbox, configured from the live problem ----
  // The bin offers the two addends' sizes plus their common size (the LCD), so the
  // child can lay the originals, see they don't line up, then rebuild from one size.
  const sandboxBin = Array.from(new Set([aDen, bDen, PLCD]));
  const sandboxTarget = sum.num / sum.den;            // the value a correct row reaches
  function onSandboxSolve({ num, den }) {
    if (solvedRef.current) return;
    setNumStr(String(num)); setDenStr(String(den));
    const res = verify(problemRef.current, num, den);
    finishSolved(res.ok ? res.stars : 3, num, den);
  }

  // ---- Applied (LA): the worded question (numerals shown) + the setup gate ------
  const appliedSentence = lesson.applied
    || `Babushka needs ${aNum}/${aDen} + ${bNum}/${bDen} cups — how many cups is that?`;
  // The setup is correct when the two written fractions ARE the problem's two
  // addends, in either order.
  function checkSetup() {
    const an = parseInt(setupA.num, 10), ad = parseInt(setupA.den, 10);
    const bn = parseInt(setupB.num, 10), bd = parseInt(setupB.den, 10);
    if (!(an > 0 && ad > 0 && bn > 0 && bd > 0)) {
      setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Write both fractions from the question — a top and a bottom for each." });
      return;
    }
    const match = (x, y) => x.n === y.n && x.d === y.d;
    const A = { n: an, d: ad }, B = { n: bn, d: bd };
    const P = { n: aNum, d: aDen }, Q = { n: bNum, d: bDen };
    const ok = (match(A, P) && match(B, Q)) || (match(A, Q) && match(B, P));
    if (!ok) {
      setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
      setStatus({ tone: "warn", text: "Not quite — copy the two fractions exactly as the question gives them, then add." });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: "That's the sum. Now work it out and write the total." });
  }
  function onSetupChange(side, key, value) {
    const v = onlyDigits(value);
    if (side === "a") setSetupA((s) => ({ ...s, [key]: v }));
    else setSetupB((s) => ({ ...s, [key]: v }));
  }
  function onScratchChange(side, key, value) {
    const v = onlyDigits(value);
    if (side === "a") setScratchA((s) => ({ ...s, [key]: v }));
    else setScratchB((s) => ({ ...s, [key]: v }));
  }

  return (
    <div className="page" data-vox-speaker="cook">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№{no}</span>
          <div>
            <div className="puzzle-tag">Lesson {no} · Adding Fractions</div>
            <div className="puzzle-title">{title}</div>
          </div>
        </div>
        {/* STAGE SELECTOR — the 5-stage interaction arc, one click each. The
            block/touch channel shrinks (Stage 1→2) and the stylus/write channel
            grows (Stage 2→5). ✎ marks a stage where the child writes on the Slate.
            A correct answer also advances stage-by-stage (NEXT_BEAT). */}
        <div className="beat-select" role="group" aria-label="interaction-arc stage">
          <span className="beat-lab">Stage</span>
          {[
            ["L0", "Stage 1 · Manipulate — the blocks ARE the problem; drag & slice by touch", "1", false],
            ["L2", "Stage 2 · Bind — blocks + the written fraction; copy the numeral on the Slate", "2", true],
            ["L4", "Stage 3 · Fade — blocks dim to a check; the equation leads, write the changed line", "3", true],
            ["LW", "Workbench — pull blocks from the bin and build the answer out of same-size pieces", "W", false],
            ["L5", "Stage 3 · Fade — blocks a faded ghost behind; write the whole answer", "3·", true],
            ["L6", "Stage 4 · Numbers-only — a bare equation; write the whole solution", "4", true],
            ["LA", "Applied — a worded question with the fractions shown; write the sum, then the answer", "A", true],
            ["L7", "Stage 5 · Words — a plain-language word problem; read it and write the solution", "5", true],
          ].map(([b, name, label, writes]) => (
            <button
              key={b}
              type="button"
              className={"beat-btn" + (beat === b ? " on" : "")}
              aria-pressed={beat === b}
              title={name}
              onClick={() => setBeatLevel(b)}
            >
              {label}{writes && lesson.handwriting ? <span className="lu-stylus" aria-hidden="true">✎</span> : null}
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
          <button className="ctrl-btn" title="Start over" onClick={() => { setProbIndex(0); clearForBeat(beat); }}>⟲</button>
        </div>
      </div>

      <div className="goal">
        <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say(isL7 && wp ? wp.caption : lesson.voice.goal)}>
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div className="goal-text" data-vox-speaker="mom">{
          isLW ? <>Build <b>{aNum}/{aDen} + {bNum}/{bDen}</b> on the Workbench — pick blocks, make them all the same size, and count them up.</>
          : isLA ? <>A question in words, with the fractions shown. Write what it's asking as a <b>sum</b> first, then give the answer.</>
          : isL7 ? "Read the recipe, work out the two fractions yourself, and write the total."
          : <>Babushka needs <b>{aNum}/{aDen}</b> of a dough strip and <b>{bNum}/{bDen}</b> of a strip — add them together.</>}</div>
      </div>

      {isLW ? (
        /* WORKBENCH — the free block sandbox replaces the strips entirely. */
        <>
          <BlockSandbox
            bin={sandboxBin}
            targetValue={sandboxTarget}
            targetLabel={eqLead}
            rulerWholes={answerWholes}
            solved={solved}
            onSolve={onSandboxSolve}
            onPlace={() => { selfCorrRef.current += 1; engineEmit({ type: "place_block", payload: { node_id: engineNodeId } }); }}
            onRemove={() => { selfCorrRef.current += 1; engineEmit({ type: "remove_block", payload: { node_id: engineNodeId } }); }}
          />
          <div className="hud">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>
            <div className="marks">
              {solved && <Rosette count={stars} />}
              <button className={"check" + (solved ? " done" : "")} onClick={reset} disabled={!solved}>{solved ? checkLabel : "Build it ▸"}</button>
            </div>
          </div>
        </>
      ) : isLA ? (
        /* APPLIED — a worded question (fractions shown) with the required setup gate:
           transcribe the sum, then the answer unlocks. */
        <>
          <div className="play lu-applied-play">
            <WordProblem
              story={appliedSentence}
              tag="Babushka's kitchen"
              readAloud={() => say(appliedSentence)}
              speaking={speaking}
              answerLead="Now write the total"
              setupLead="First, write the question as a sum"
              setup={
                <>
                  <ExpressionSlate
                    a={setupA} b={setupB}
                    onChange={onSetupChange}
                    onSubmit={checkSetup}
                    denA={aDen} denB={bDen}
                    disabled={setupOk || solved}
                    autoFocus={!setupOk && setupA.num === "" ? "a-num" : undefined}
                    className={badInput && !setupOk ? "is-shake" : ""}
                  />
                  {setupOk
                    ? <span className="lu-setup-ok">✓ that's the sum — now solve it</span>
                    : <button type="button" className="wp-check" onClick={checkSetup}>Check the sum</button>}
                </>
              }
              slots={slateSlots}
              values={{ num: numStr, den: denStr }}
              onChange={onSlateChange}
              layout="fraction"
              den={slateDen}
              disabled={!setupOk || solved}
              autoFocusKey={setupOk ? slateAutoKey : undefined}
              onCheck={checkAnswer}
              checkLabel={checkLabel}
              checkDisabled={!setupOk}
            />
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
      // DETERMINISTIC FIXED-ZONE STAGE (mirrors AppR1's .r1-s1): the strip/picker/
      // numbers beats lay out as fixed, non-overlapping rectangles inside the
      // 1280×800 stage — .lu-top (blocks/numbers, top), .lu-ans (equation + answer
      // Slate + Check + Rosette, ONE bordered card bottom-left, Check right of the
      // write area), .lu-tutor (Cook + ribbon, bottom-right). The block zone is
      // pinned TOP, the card + tutor to the BOTTOM with a guaranteed gap; heights
      // never depend on text content (clamped), so a longer string / a different
      // font can never grow one zone over its neighbour.
      <>
      <div className="lu-stage">
      <div className="play lu-top">
        <div className="diagram">
          <div className="canvas" id="r2canvas">
            {!noBars && (
              <div className={"eqstate eqfloat" + (matched ? " ok" : "")}><span className="g">{matched ? "=" : "≠"}</span>{matched ? "blocks match" : "blocks differ"}</div>
            )}

            {/* ruler — drawn to answerWholes wholes, whole marks taller/labelled */}
            {!noBars && (
              <React.Fragment>
                <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: answerWholes * UNIT }} />
                {Array.from({ length: RULER_TICKS + 1 }).map((_, k) => (
                  <span key={k} className="ntick" style={{ left: ORIGIN + (k / PLCD) * UNIT, top: LINE_Y, height: k % PLCD === 0 ? 14 : 6 }} />
                ))}
                {RLAB.map(([k, lab, isWhole]) => (
                  <span key={k} className={"nlab" + (isWhole ? " ng" : "")} style={{ left: ORIGIN + (k / PLCD) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
                ))}
              </React.Fragment>
            )}

            {/* ghost backdrop (L5): the two bars linger, dimmed + non-interactive */}
            <div className={ghostBars ? "ghost-backdrop" : ""}>
              {noBars ? null : (!bareEntry && joined) ? (
                <div className="nbar" style={{ left: HOME.A.x, top: HOME.A.y }}>
                  {/* Hide the numerator until solved — the child must COUNT. */}
                  <div className="btag"><BigFrac num={solved ? answerNum : "?"} den={D} /></div>
                  <Combined countA={numA} countB={numB} D={D} unit={UNIT} />
                </div>
              ) : (
                <React.Fragment>
                  <div className={"nbar" + (dragBar === "A" ? " dragging" : "") + (shakeA ? " is-shake" : "")}
                    style={{ left: posA.x, top: posA.y, width: barW("A") }} onPointerDown={(e) => grabBar("A", e)}>
                    <div className="btag">
                      <BigFrac num={numA} den={denA} />
                      {mA > 1 && <span key={tickA} className={"xchip" + (stripsFaded ? "" : " pop")}>×{mA}</span>}
                      {mA > 1 && !matched && !stripsFaded && <button className="mini" title="put it back together" onPointerDown={(e) => e.stopPropagation()} onClick={() => resetBar("A")}>↺</button>}
                    </div>
                    <Plank baseNum={aNum} baseDen={aDen} m={mA} unit={UNIT} sliceTick={stripsFaded ? 0 : tickA} matched={matched} hoverCut={hoverBar === "A" && !!dragKnife} bodyRef={bodyA} faded={stripsFaded} />
                    {mA > 1 && <span className="xchip-bot">×{mA}</span>}
                  </div>

                  <div className={"nbar" + (dragBar === "B" ? " dragging" : "") + (shakeB ? " is-shake" : "")}
                    style={{ left: posB.x, top: posB.y, width: barW("B") }} onPointerDown={(e) => grabBar("B", e)}>
                    <div className="btag">
                      <BigFrac num={numB} den={denB} />
                      {mB > 1 && <span key={tickB} className={"xchip" + (stripsFaded ? "" : " pop")}>×{mB}</span>}
                      {mB > 1 && !matched && !stripsFaded && <button className="mini" title="put it back together" onPointerDown={(e) => e.stopPropagation()} onClick={() => resetBar("B")}>↺</button>}
                    </div>
                    <Plank baseNum={bNum} baseDen={bDen} m={mB} unit={UNIT} sliceTick={stripsFaded ? 0 : tickB} matched={matched} hoverCut={hoverBar === "B" && !!dragKnife} bodyRef={bodyB} faded={stripsFaded} />
                    {mB > 1 && <span className="xchip-bot">×{mB}</span>}
                  </div>
                </React.Fragment>
              )}
            </div>

            {/* join button when matched (drag-to-join in L0; the button is the
                only join path once the strips are faded outlines in L2–L4) */}
            {!bareEntry && !noBars && matched && !joined && (
              <button className="joinbtn" style={{ left: ORIGIN + barW("A") + 40, top: HOME.A.y + 22 }} onClick={doJoin}>▸ Join the strips</button>
            )}

            {/* numbers-lead beats (Stage 3/4 · L5 ghost-backdrop + L6 bare slate):
                just the equation. For the rename-BOTH lesson (Cross-Multiply) the
                ×N/×N CROSSING-ARROWS visual is folded in here — each fraction is
                multiplied by the OTHER's bottom, common bottom = the product —
                adapted from the old standalone AppR6. The rename-ONE lesson (Scale
                One) keeps the plain equation (no crossing). */}
            {noBars && !isL7 && (
              showCross ? (
                <div className="lu-cross">
                  <div className="lu-cross-eq">
                    <span className="lu-cf">{aNum}/{aDen}</span>
                    <span className="qop">+</span>
                    <span className="lu-cf">{bNum}/{bDen}</span>
                    <span className="qop">=</span>
                    <span className="slate-blank">?</span>
                  </div>
                  {/* the crossing arrows: each bottom arcs to the OTHER fraction,
                      carrying the ×N it contributes (the classic cross-multiply X) */}
                  <svg className="lu-cross-svg" viewBox="0 0 220 120" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <marker id="luArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M0 0 L10 5 L0 10 z" fill="var(--red)" />
                      </marker>
                    </defs>
                    <path d="M40 26 C 130 40, 130 80, 40 94" fill="none" stroke="var(--red)" strokeWidth="2.4" strokeDasharray="5 5" markerEnd="url(#luArrow)" />
                    <path d="M40 94 C 130 80, 130 40, 40 26" fill="none" stroke="var(--red)" strokeWidth="2.4" strokeDasharray="5 5" markerEnd="url(#luArrow)" />
                    <text x="150" y="40" className="lu-cross-x">×{cm.multA}</text>
                    <text x="150" y="92" className="lu-cross-x">×{cm.multB}</text>
                  </svg>
                  <div className="lu-cross-rule">
                    {aNum}/{aDen} <b>×{cm.multA}/{cm.multA}</b> → {cm.scaledANum}/{cm.common}
                    <span className="lu-cross-plus">+</span>
                    {bNum}/{bDen} <b>×{cm.multB}/{cm.multB}</b> → {cm.scaledBNum}/{cm.common}
                    <span className="lu-cross-note">common bottom = {aDen} × {bDen} = {cm.common}</span>
                  </div>
                </div>
              ) : (
                <div className="slate-eq">
                  <span>{eqLead}</span><span className="qop">=</span><span className="slate-blank">?</span>
                </div>
              )
            )}

            {/* word problem (Stage 5 · L7): the shared <WordProblem> — Babushka's recipe
                in prose + a stylus <Slate> the child writes the total into. No
                strips, no given equation. onChange routes into the same numStr/
                denStr state; onCheck runs the same verifier via checkAnswer(). */}
            {isL7 && wp && (
              <div className="lu-wp-mount">
                <WordProblem
                  story={wp.caption}
                  tag="Babushka's recipe"
                  readAloud={() => say(wp.caption)}
                  speaking={speaking}
                  answerLead="Write the total"
                  setupLead="Optional — write the question as a sum first"
                  setup={
                    <ExpressionSlate
                      a={scratchA} b={scratchB}
                      onChange={onScratchChange}
                      denA={parseInt(scratchA.den, 10) || undefined}
                      denB={parseInt(scratchB.den, 10) || undefined}
                      disabled={solved}
                      ariaLabel="optional: write the two fractions from the recipe"
                    />
                  }
                  slots={slateSlots}
                  values={{ num: numStr, den: denStr }}
                  onChange={onSlateChange}
                  layout="fraction"
                  den={slateDen}
                  disabled={solved}
                  autoFocusKey={slateAutoKey}
                  onCheck={checkAnswer}
                  checkLabel={checkLabel}
                />
              </div>
            )}
          </div>
        </div>

        {/* rail — its content depends on the beat */}
        <div className="rail">
          <div className="panel">
            {usesPicker ? (
              <>
                <h3 className="pick-title">{isL4 ? "Scale & Add" : (framing.pickTitle || "Pick the Size")}</h3>
                <div className="hint">
                  {isL4
                    ? (showCross
                        ? "Pick the common bottom — each fraction is renamed by the OTHER's bottom (top & bottom together), then count the total."
                        : "Pick the common bottom — rename the strip that doesn't fit yet (top & bottom together), then count the total.")
                    : (framing.pickHint || "Choose the common block size — both strips multiply to reach it (top & bottom the same).")}
                </div>
                <div className="worksheet">
                  <div className="ws-row">
                    <span className="ws-frac">{aNum}/{aDen}</span>
                    <span className="ws-arrow">→</span>
                    <span className={"ws-frac scaled" + (matched ? " on" : "")}>{matched ? `${numA}/${denA}` : "?/?"}</span>
                  </div>
                  <div className="ws-plus">+</div>
                  <div className="ws-row">
                    <span className="ws-frac">{bNum}/{bDen}</span>
                    <span className="ws-arrow">→</span>
                    <span className={"ws-frac scaled" + (matched ? " on" : "")}>{matched ? `${numB}/${denB}` : "?/?"}</span>
                  </div>
                </div>
                <DenominatorPicker
                  matched={matched} D={D} choices={choices}
                  aNum={aNum} aDen={aDen} bNum={bNum} bDen={bDen}
                  onApply={applyCommon}
                />
                {isL4 && !solved && (
                  <button type="button" className="newprob" onClick={() => { if (!joined && !matched) reset(); }} disabled={joined || matched}>↻ New problem</button>
                )}
              </>
            ) : isL7 ? (
              <>
                <h3>Word Problem</h3>
                <div className="hint">No numbers laid out this time. Read Babushka's recipe, figure out the two fractions yourself, add them, and write the total.</div>
                {!solved && (
                  <button type="button" className="newprob" onClick={() => { const n = wpIndex + 1; setWpIndex(n); clearForBeat("L7", n); }}>↻ New recipe</button>
                )}
              </>
            ) : bareEntry ? (
              <>
                <h3>{isL5 ? "From Memory" : "On the Slate"}</h3>
                <div className="hint">
                  {isL5
                    ? (showCross
                        ? "The bars are behind, faded — just a reminder. Cross-multiply: rename BOTH (each by the other's bottom), add the tops, write the whole answer."
                        : "The bars are behind, faded — just a reminder. Rename the one that doesn't fit, add the tops, and write the whole answer.")
                    : (showCross
                        ? "Nothing but the numbers. Cross-multiply — rename BOTH fractions by the other's bottom, add the tops, write the total."
                        : "Nothing but the numbers. Rename just the one that doesn't fit, add the tops, write the total.")}
                </div>
                <div className="bare-eq">{eqLead} = <b>?</b></div>
              </>
            ) : (
              <>
                <h3>The Knives</h3>
                <div className="hint">Drag a knife onto a strip — it cuts every block into that many equal pieces (top &amp; bottom together).</div>
                <div className="knife-rack" style={{ opacity: matched ? 0.3 : 1, pointerEvents: matched ? "none" : "auto" }}>
                  {[2, 3, 4].map((n) => (
                    <div className="knife-row" key={n} style={{ opacity: dragKnife && dragKnife.n === n ? 0.18 : 1 }}>
                      <Knife n={n} onGrab={(e) => grabKnife(n, e)} hint={!dragKnife && mA === 1 && mB === 1} scale={0.48} />
                      <span className="krow-lab">→ {n} pieces</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── EQUATION + ANSWER, ONE bordered card (fixed rect, bottom-left) ──────
          The worked equation, the handwriting Slate (the "?/?" answer placeholder)
          and the Check button read as ONE unit, with Check IMMEDIATELY right of the
          write area. Every fraction term — the two addends AND the answer — is the
          SAME stacked size and the row is align-items:center, so the fraction bars
          of a/b, c/d and the answer all sit on one midline (= centered too).
          On L7 (Words) the Slate + Check live inside the <WordProblem> card in the
          top zone, so this card collapses to the Cook/ribbon-only tutor layout. */}
      {!isL7 && (
      <div className="lu-ans">
        <div className="lu-eqrow">
          <BigFrac num={aNum} den={aDen} />
          <span className="lu-op">+</span>
          <BigFrac num={bNum} den={bDen} />
          <span className="lu-op">=</span>
          <span className="lu-ans-slot">
            {solved ? (
              <BigFrac num={parseInt(numStr, 10)} den={parseInt(denStr, 10)} />
            ) : handwriting && !useSlate ? (
              <span className={"frinput ink" + (badInput ? " bad" : "")}>
                <InkPad ref={numPad} value={numStr} onChange={(t) => setNumStr(onlyDigits(t))} disabled={!numEnabled} want={numEnabled && !numStr} ariaLabel="write the numerator" />
                <span className="ln" />
                <InkPad ref={denPad} value={denStr} onChange={(t) => setDenStr(onlyDigits(t))} disabled={!denEnabled} want={denEnabled && !denStr} ariaLabel="write the denominator" />
              </span>
            ) : (
              <span className={"lu-slate" + (badInput ? " bad" : "")}>
                <Slate
                  slots={slateSlots}
                  values={{ num: numStr, den: denStr }}
                  onChange={onSlateChange}
                  onSubmit={checkAnswer}
                  layout="fraction"
                  den={slateDen}
                  disabled={!blocksReady || solved}
                  autoFocusKey={slateAutoKey}
                  ariaLabel="write the total fraction"
                />
              </span>
            )}
          </span>
        </div>
        <div className="lu-ans-cap">{
          solved ? "full marks!" :
          (!bareEntry && !matched) ? "slice the blocks to the same size to unlock the answer" :
          stage === "den" ? "write the bottom number — how big is each block?" :
          "write the top number — how many blocks in all?"
        }</div>
        <div className="lu-ans-marks">
          {solved && <Rosette count={stars} />}
          <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkAnswer}>{checkLabel}</button>
        </div>
      </div>
      )}

      {/* ── TUTOR ZONE — Cook + speech ribbon, fixed rect bottom-right ───────── */}
      <div className="lu-tutor">
        <div className="cook-stage"><Cook expr={cook} width={118} /></div>
        <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        {/* On L7 (Words) the Check lives inside the WordProblem card; surface the
            Rosette here when solved so the reward still reads in the tutor zone. */}
        {isL7 && solved && <div className="lu-tutor-rosette"><Rosette count={stars} /></div>}
      </div>
      </div>

      {/* floating knife while dragging */}
      <div className="knife-layer">
        {dragKnife && (
          <div className="knife-wrap" style={{ transform: `translate(${dragKnife.x - 40}px, ${dragKnife.y - 48}px)` }}>
            <Knife n={dragKnife.n} dragging={true} />
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
