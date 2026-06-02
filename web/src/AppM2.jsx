// AppM2.jsx — Baking Trays (m2, MULT_ARRAYS): rows × columns make a rectangle.
// The worked example is 4 × 6 = 24 — a baking tray of buns, 4 rows of 6.
//
// THE FULL 7-STAGE INTERACTION ARC (mirrors AppR1). The manipulative (a baking
// tray) carries three new ideas as the support fades:
//
//   1 · Manipulate — the tray IS the problem. An empty 4×6 tray; DRAG a bun onto the
//        INTERIOR cells to drop buns, count the filled cells into a plain count box.
//        No writing on the Slate yet (interior-only fill is the perimeter guard).
//   2 · Bind       — the full tray PLUS the written 4 × 6 = __; a SPIN button
//        rotates the tray to 6 × 4 with the count unchanged (COMMUTATIVITY).
//   3 · Fade       — the tray dims to a faint check; a SCORE line cuts a column
//        (4×6 → 4×4 + 4×2); the child reads the two partial products and sums
//        them, or collapses to 4 × 6 = 24 (DISTRIBUTIVITY).
//   4 · Workbench  — a BakingTray-backed build bin: pick the rows and columns to
//        make 4 × 6, then read the total. (NOT vanilla BlockSandbox — that's 1-D.)
//   5 · Numbers    — a BARE expression 4 × 6 = ?; write the product on the Slate.
//   6 · Applied    — a word problem (numerals shown) with a REQUIRED setup gate:
//        write R × C first (EITHER order — commutativity now holds), then the total.
//   7 · Words      — a plain-language story; pull out rows/columns, write the product.
//
// ENGINE FIT (R-B5): the answer carries as [product, 1]; the Slate write channel
// is layout="row" with a SINGLE whole-number slot graded by parseInt. Every
// multiplication misconception fingerprints as 'other' (the ErrorSignature union
// is fraction-only in v1).
//
// LAYOUT/CONTROLLER: the page chrome (LessonShell), the four-zone play area
// (LessonBoard) and the answer/tutor/rail/goal cards are the shared lesson library;
// the engine wiring + stage nav + outcome state are the shared useLessonScaffold
// hook. Only the m2-SPECIFIC manipulatives, equation pieces, and copy live here.
//
// Voice keys referenced here (added centrally in a later phase — missing audio
// MUST degrade gracefully): mr_mom_goal_m2, mr_mom_nudge_m2, and the in-room
// banter/cue keys spelled inline. say() is a no-op-safe fallback if a clip is absent.
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BakingTray from "./components/BakingTray.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import FitStage from "./components/FitStage.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import "./styles/m2.css";

// The single worked example threaded through the taught stages: 4 × 6 = 24.
const ROWS = 4, COLS = 6, PRODUCT = ROWS * COLS; // 24
const SCORE_COL = 4;                              // cut 4×6 → 4×4 + 4×2
const PART_A = ROWS * SCORE_COL;                  // 16
const PART_B = ROWS * (COLS - SCORE_COL);         // 8

// The seven stages, in order. r1-style numeric-prefixed keys.
const STAGES = [
  { n: 1, key: "1-manipulate", tab: "Manipulate", sub: "fill the tray & count" },
  { n: 2, key: "2-bind",       tab: "Bind",       sub: "write 4 × 6, spin it" },
  { n: 3, key: "3-fade",       tab: "Fade",       sub: "score the tray" },
  { n: 4, key: "4-workbench",  tab: "Workbench",  sub: "build the array" },
  { n: 5, key: "5-numbers",    tab: "Numbers",    sub: "bare 4 × 6 = ?" },
  { n: 6, key: "6-applied",    tab: "Applied",    sub: "setup, then total" },
  { n: "sw", key: "showwork",  tab: "Show Work",  sub: "show your work" },
  { n: 7, key: "7-words",      tab: "Words",      sub: "story problem" },
];

const NODE = "MULT_ARRAYS";

// ── Word-problem bank (m2) — verbatim from the plan ──────────────────────────
// owner is kid | grapa(grandpa) | cat; Babushka narrates all (never owns).
// answer is the product. `setup` = the two factors (either order accepted).
const WORD_BANK = [
  { rows: 4, cols: 6, answer: 24, owner: "kid",
    story: <>The buns are baking in a tray — <b>4 rows</b> with <b>6 buns</b> in each row. How many buns is that?</>,
    read: "The buns are baking in a tray. Four rows with six buns in each row. How many buns is that?" },
  { rows: 5, cols: 8, answer: 40, owner: "grandpa",
    story: <>Grandpa lined the pelmeni up neatly — <b>5 rows</b> of <b>8</b>. How many pelmeni did he line up?</>,
    read: "Grandpa lined the pelmeni up neatly. Five rows of eight. How many pelmeni did he line up?" },
  { rows: 3, cols: 4, answer: 12, owner: "cat",
    story: <>The muffin tin holds <b>3 by 4</b>. The cat knocked it sideways, so now it looks like <b>4 by 3</b> — but how many cups in all?</>,
    read: "The muffin tin holds three by four. The cat knocked it sideways, so now it looks like four by three. But how many cups in all?" },
  { rows: 6, cols: 7, answer: 42, owner: "grandpa",
    story: <>Grandpa's pryanik is <b>6 by 7</b>. He cut it into a <b>6 by 5</b> piece and a <b>6 by 2</b> piece. How many squares of pryanik altogether?</>,
    read: "Grandpa's pryanik is six by seven. He cut it into a six by five piece and a six by two piece. How many squares of pryanik altogether?" },
  { rows: 7, cols: 9, answer: 63, owner: "kid",
    story: <>The cookie rack has <b>7 rows</b> of <b>9</b> cookies. That's a big one — try splitting the rack. How many cookies?</>,
    read: "The cookie rack has seven rows of nine cookies. That's a big one. Try splitting the rack. How many cookies?" },
  { rows: 8, cols: 2, answer: 16, owner: "cat",
    story: <>The cat is guarding <b>8 rows</b> of <b>2</b> sausages. Meow! Babushka counts them for you — how many sausages?</>,
    read: "The cat is guarding eight rows of two sausages. Meow! Babushka counts them for you. How many sausages?" },
];

// owner → in-character label + voice-key prefix (mr_<owner>_<slug>_<1|2|3>)
const OWNER_LABEL = { kid: "Malysh", grandpa: "Grandpa", cat: "The cat" };

// The Stage-1 drag SOURCE is drawn as a literal heaped pile of buns (not a single
// chip) so the child sees an inexhaustible mound to drag from. Positions form a
// mound: a wide bottom row, fewer in the middle, a couple on top. `z` layers them
// back-to-front for overlap; `s` is each bun's diameter (px). Cosmetic only — a
// pointerdown anywhere on the pile starts the same grabBun drag.
const BUN_PILE = [
  { x: 2,  y: 48, s: 34, z: 1 }, { x: 30, y: 50, s: 36, z: 1 }, { x: 60, y: 49, s: 35, z: 1 }, { x: 90, y: 50, s: 34, z: 1 },
  { x: 16, y: 26, s: 35, z: 2 }, { x: 46, y: 24, s: 37, z: 2 }, { x: 76, y: 26, s: 35, z: 2 },
  { x: 34, y: 4,  s: 34, z: 3 }, { x: 62, y: 5,  s: 33, z: 3 },
];

// Which word problem a stage uses (Applied=6, Words=7 pull from the bank). Module
// scope so STAGE_INTRO / the scaffold's introFor can resolve it without the hook.
function problemFor(n) {
  if (n === 6) return WORD_BANK[0]; // 4×6 buns — matches the worked example
  if (n === 7) return WORD_BANK[1]; // 5×8 pelmeni — prose only, no equation
  return null;
}

// ---------------- main ----------------
export default function AppM2({ no, title, onBack, onRewatchIntro, initialBeat }) {
  // Find the initial stage from the beat key (deep-link from a seeded mastery map).
  const startN = (() => {
    const f = STAGES.find((s) => s.key === initialBeat || s.n === initialBeat || String(s.n) === String(initialBeat));
    return f ? f.n : 1;
  })();

  // --- Stage 1/2/3 tray state ---
  // Per-cell fill: a Set of filled interior cell indices (child drags a bun onto EACH cell).
  const [filled, setFilled] = useState(() => new Set());
  const filledCount = filled.size;
  const [rotated, setRotated] = useState(false); // Stage 2 spin (rows↔cols)
  const [scored, setScored] = useState(false);  // Stage 3 score line shown

  // --- Stage 1 bun drag-to-place (pointer-following ghost + highlighted cell) ---
  const [bunDrag, setBunDrag] = useState(null);   // {x,y} cursor while dragging a bun
  const [hotCell, setHotCell] = useState(null);   // index of the cell under the pointer
  const trayZoneRef = useRef(null);
  const bunDragRef = useRef(false);

  // --- Slate (single whole-number product slot), shared by write stages ---
  const [slate, setSlate] = useState({ product: "" });
  // Stage 3 partial-product slates (distributivity)
  const [partA, setPartA] = useState({ product: "" });
  const [partB, setPartB] = useState({ product: "" });

  // --- Stage 4 workbench build state (BakingTray-backed, 2-D) ---
  const [buildRows, setBuildRows] = useState(0);
  const [buildCols, setBuildCols] = useState(0);

  // --- word→math setup gate (Applied) + optional scratch (Words) ---
  const [setup, setSetup] = useState({ a: "", b: "" });
  const [setupOk, setSetupOk] = useState(false);

  // --- mandatory "show your work" blank-slate gate (between Applied & Words) ---
  const [showWorkInked, setShowWorkInked] = useState(false);

  // --- shared controller backbone (engine wiring + stage nav + outcome state) ---
  // The hook owns everything identical across lessons; M2 supplies only its stage
  // model (advance/back/scaffold key), its intro copy, and its per-stage reset.
  // Map a stage value (number | "sw") to its scaffold key string.
  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-manipulate";
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, flashBad,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    say, speaking, selfCorrectionsRef,
  } = useLessonScaffold({
    nodeId: NODE,
    lessonId: "m2",
    initialStage: startN,
    // Linear advance/back over the STAGES list (numeric stages with the string "sw"
    // step threaded between 6 and 7).
    advance: (cur) => {
      const i = STAGES.findIndex((s) => s.n === cur);
      return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1].n : cur;
    },
    back: (cur) => {
      const i = STAGES.findIndex((s) => s.n === cur);
      return i > 0 ? STAGES[i - 1].n : cur;
    },
    scaffoldKeyFor: SCAFFOLD_KEY,
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n, problemFor(n)) }),
    resetStage: () => {
      setFilled(new Set()); setRotated(false); setScored(false);
      setBunDrag(null); setHotCell(null); bunDragRef.current = false;
      setSlate({ product: "" }); setPartA({ product: "" }); setPartB({ product: "" });
      setBuildRows(0); setBuildCols(0);
      setSetup({ a: "", b: "" }); setSetupOk(false);
      setShowWorkInked(false);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole tray — from counting buns to reading a story and knowing the product. Brilliant, povaryonok!" }),
  });

  // Selector clicks pass a STAGES `key` string; normalize to the stage VALUE
  // (a number, or "sw") the render branches compare against.
  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? d.n : key;
  };

  // The word problem this stage uses (Applied=6, Words=7).
  const wp = problemFor(stage);

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 3);

  // ---- tray cell toggle: flip a single cell (Stage 1) with self-correction telemetry.
  //      Reached only via drag-drop (grabBun) or keyboard a11y — never a plain tap. ----
  function onTrayFill(index) {
    if (solvedRef.current) return;
    selfCorrectionsRef.current += 1;
    const removing = filled.has(index);
    emit({ type: removing ? "remove_block" : "place_block", payload: { node_id: NODE } });
    setFilled((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // ---- Stage 1 bun drag: a ghost bun follows the pointer; the cell under it
  //      highlights; releasing over a cell toggles it (empty→fill, filled→clear).
  //      Drag is the ONLY pointer placement gesture; keyboard Enter/Space on a
  //      focused cell (BakingTray's onKeyDown → onFill) is the non-pointer a11y path. ----
  function cellIndexAt(clientX, clientY) {
    const zone = trayZoneRef.current;
    if (!zone) return null;
    const cells = zone.querySelectorAll(".m2-tray-cell");
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return i;
    }
    return null;
  }

  // position the highlight ring over the hot cell, in the dropzone's OWN (unscaled)
  // coordinate space. We use offsetLeft/offsetTop (relative to the offset parent)
  // rather than getBoundingClientRect so the ring isn't double-scaled by FitStage's
  // transform — the dropzone and the ring share the same scaled ancestor.
  function cellHighlightStyle(idx) {
    const zone = trayZoneRef.current;
    if (!zone) return { display: "none" };
    const cells = zone.querySelectorAll(".m2-tray-cell");
    const el = cells[idx];
    if (!el) return { display: "none" };
    // offset coords accumulate up to the nearest positioned ancestor; the dropzone
    // is position:relative so these resolve within it regardless of the transform.
    let x = 0, y = 0, node = el;
    while (node && node !== zone) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
    const w = el.offsetWidth, h = el.offsetHeight;
    return { left: x - 4, top: y - 4, width: w + 8, height: h + 8 };
  }

  function grabBun(e) {
    if (solvedRef.current || filledCount >= PRODUCT) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!e || e.clientX == null) return; // keyboard/synthetic — tray taps handle it
    bunDragRef.current = true;
    setBunDrag({ x: e.clientX, y: e.clientY });
    const move = (ev) => { setBunDrag({ x: ev.clientX, y: ev.clientY }); setHotCell(cellIndexAt(ev.clientX, ev.clientY)); };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const idx = cellIndexAt(ev.clientX, ev.clientY);
      bunDragRef.current = false;
      setBunDrag(null); setHotCell(null);
      // drop on ANY cell → toggle it (empty fills via place_block; filled clears via
      // remove_block — preserving the old tap-toggle self-correction, now drag-driven).
      // dropping off-tray cancels.
      if (idx != null && !solvedRef.current) onTrayFill(idx);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // The dropzone wrapper also forwards moves (touch) so the highlight tracks even
  // when the pointer capture stays on the source button.
  function onTrayPointerMove(e) {
    if (!bunDragRef.current) return;
    setBunDrag({ x: e.clientX, y: e.clientY });
    setHotCell(cellIndexAt(e.clientX, e.clientY));
  }
  function onTrayPointerUp() { /* global pointerup handles the drop */ }

  // The effective dimensions (Stage 2 spin swaps rows/cols; count is invariant).
  const effRows = rotated ? COLS : ROWS;
  const effCols = rotated ? ROWS : COLS;

  // ---- Stage 1 check (count box) ----
  function checkStage1() {
    if (solved) { nextStage(); return; }
    const n = parseInt(slate.product, 10);
    const full = filledCount >= PRODUCT;
    if (!full) {
      setCook("think");
      setStatus({ tone: "warn", text: `Fill every cup in the tray first — ${ROWS} rows of ${COLS}. Drag a bun onto the inside cups.` });
      say("Fill every cup in the tray first. Drag a bun onto the inside cups.");
      return;
    }
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write how many buns in all — count the filled cells." });
      return;
    }
    if (n !== PRODUCT) {
      flashBad();
      // perimeter slip: counting only the rim is a classic array misconception
      const perimeter = 2 * (ROWS + COLS) - 4;
      const msg = n === perimeter
        ? "That's just the edge cups — count ALL the cups inside the rectangle, row by row."
        : `Not quite — count by rows: ${COLS}, ${COLS * 2}, ${COLS * 3}, ${PRODUCT}. How many buns in all?`;
      setStatus({ tone: "warn", text: msg });
      say(msg);
      reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: "other", stars: 0 });
      return;
    }
    award(`Yes! ${ROWS} rows of ${COLS} buns is ${PRODUCT}. A tray is a rectangle — rows times columns.`, "mr_mom_goal_m2", [PRODUCT, 1]);
  }

  // ---- Stage 2/5 check (single product slot) ----
  function checkProduct() {
    if (solved) { nextStage(); return; }
    const n = parseInt(slate.product, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the product — how many in the whole tray?" });
      return;
    }
    if (n === ROWS + COLS) {
      // added the factors instead of multiplying — the classic slip
      flashBad();
      setStatus({ tone: "warn", text: `Careful — that's adding ${ROWS} + ${COLS}. We want every cup: ${ROWS} rows of ${COLS}.` });
      say(`Careful. That's adding. We want every cup. ${ROWS} rows of ${COLS}.`);
      reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: "other", stars: 0 });
      return;
    }
    if (n !== PRODUCT) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — count by rows: ${COLS}, ${COLS * 2}, … to ${PRODUCT}.` });
      reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: "other", stars: 0 });
      return;
    }
    const line = stage === 2
      ? `Yes! ${ROWS} × ${COLS} = ${PRODUCT}. Spin it — ${COLS} × ${ROWS} fills the very same tray. Still ${PRODUCT}!`
      : `Yes! ${ROWS} × ${COLS} = ${PRODUCT}. You knew the whole tray.`;
    award(line, "mr_mom_goal_m2", [PRODUCT, 1]);
  }

  // ---- Stage 3 check (distributivity: two partials → sum, OR the product) ----
  function checkFade() {
    if (solved) { nextStage(); return; }
    const a = parseInt(partA.product, 10);
    const b = parseInt(partB.product, 10);
    const p = parseInt(slate.product, 10);
    // Path 1: the child collapsed straight to the product.
    if (p === PRODUCT && !(a > 0) && !(b > 0)) {
      award(`Yes! ${ROWS} × ${COLS} = ${PRODUCT}, whole tray at once.`, "mr_mom_goal_m2", [PRODUCT, 1]);
      return;
    }
    // Path 2: the two partial products, then their sum.
    if (!(a > 0) || !(b > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: `Read the two pieces off the cut tray: ${ROWS} × ${SCORE_COL} and ${ROWS} × ${COLS - SCORE_COL}. Then add them, or just write ${ROWS} × ${COLS}.` });
      return;
    }
    // Pitfall guard: multiply each part, never add the split sizes (4 + 2 = 6).
    if (a === SCORE_COL && b === (COLS - SCORE_COL)) {
      flashBad();
      setStatus({ tone: "warn", text: `Those are the column counts, not the products. Multiply each piece by its ${ROWS} rows: ${ROWS} × ${SCORE_COL} and ${ROWS} × ${COLS - SCORE_COL}.` });
      reportAttempt({ correct: false, answerValue: [a + b, 1], errorSignature: "other", stars: 0 });
      return;
    }
    if (a !== PART_A || b !== PART_B) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — ${ROWS} × ${SCORE_COL} = ${PART_A} and ${ROWS} × ${(COLS - SCORE_COL)} = ${PART_B}.` });
      reportAttempt({ correct: false, answerValue: [a + b, 1], errorSignature: "other", stars: 0 });
      return;
    }
    // partials correct — now the sum
    if (p !== PRODUCT) {
      flashBad();
      setStatus({ tone: "warn", text: `Good — now add the two pieces: ${PART_A} + ${PART_B} = ?` });
      return;
    }
    award(`Yes! ${PART_A} + ${PART_B} = ${PRODUCT}, the same as ${ROWS} × ${COLS}. That's how you split a hard tray.`, "mr_mom_goal_m2", [PRODUCT, 1]);
  }

  // ---- Stage 4 workbench check (BakingTray-backed build) ----
  function checkBuild() {
    if (solved) { nextStage(); return; }
    if (buildRows <= 0 || buildCols <= 0) {
      setCook("think");
      setStatus({ tone: "warn", text: "Set the rows and the columns to build the tray — then read the total." });
      return;
    }
    const built = buildRows * buildCols;
    const dimsMatch = (buildRows === ROWS && buildCols === COLS) || (buildRows === COLS && buildCols === ROWS);
    if (!dimsMatch || built !== PRODUCT) {
      flashBad();
      setStatus({ tone: "warn", text: `Make ${ROWS} × ${COLS} (or ${COLS} × ${ROWS}) — rows times columns must reach ${PRODUCT}.` });
      reportAttempt({ correct: false, answerValue: [built, 1], errorSignature: "other", stars: 0 });
      return;
    }
    award(`Built it — ${buildRows} rows of ${buildCols} is ${PRODUCT}. Same tray, either way around.`, "mr_mom_goal_m2", [PRODUCT, 1]);
  }

  // ---- Stage 6 applied: setup gate (R × C, EITHER order) ----
  function checkSetup() {
    const a = parseInt(setup.a, 10), b = parseInt(setup.b, 10);
    if (!(a > 0 && b > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the two numbers from the question — the rows and the columns." });
      return;
    }
    const want = [wp.rows, wp.cols];
    const ok = (a === want[0] && b === want[1]) || (a === want[1] && b === want[0]);
    if (!ok) {
      flashBad();
      setStatus({ tone: "warn", text: `Use the rows and columns the question gives: ${wp.rows} and ${wp.cols} (either order is fine).` });
      say("mr_mom_nudge_m2");
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: "That's the setup — rows times columns. Now write the product." });
  }

  // ---- Stage 6/7 applied/words answer check ----
  function checkWordAnswer() {
    if (solved) { nextStage(); return; }
    const n = parseInt(slate.product, 10);
    const want = wp.answer;
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the product — how many in all?" });
      return;
    }
    if (n === wp.rows + wp.cols) {
      flashBad();
      setStatus({ tone: "warn", text: `Careful — that's adding ${wp.rows} + ${wp.cols}. Multiply: ${wp.rows} rows of ${wp.cols}.` });
      say(`Careful. That's adding. Multiply. ${wp.rows} rows of ${wp.cols}.`);
      reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: "other", stars: 0 });
      return;
    }
    if (n !== want) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — ${wp.rows} × ${wp.cols} = ?` });
      reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: "other", stars: 0 });
      return;
    }
    const owner = OWNER_LABEL[wp.owner] || "Babushka";
    award(`Yes — ${wp.rows} × ${wp.cols} = ${want}! ${owner} is proud of you.`, `mr_${wp.owner}_${wp.rows}x${wp.cols}_1`, [want, 1]);
  }

  // ---- header reset ----
  function reset() { goStage(1); }

  // ---- "ready to check" glow ----
  const answerReady = !solved && (
    stage === 1 ? (filledCount >= PRODUCT && slate.product !== "")
    : stage === 3 ? (slate.product !== "" || (partA.product !== "" && partB.product !== ""))
    : stage === 4 ? (buildRows > 0 && buildCols > 0)
    : stage === 6 ? (setupOk && slate.product !== "")
    : (slate.product !== "")
  );

  // ---- stage selector strip (reachability: jump to any stage) ----
  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;

  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="mr_mom_goal_m2" voxSpeaker="mom">
      Babushka's tray has <b>{ROWS} rows</b> of <b>{COLS} buns</b> — a rectangle. Count it as rows times columns: <b>{ROWS} × {COLS}</b>.
    </LessonGoal>
  );

  // The Cook + speech ribbon, shared by every stage.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ---- the single product Slate (layout="row", one whole-number slot) ----
  const ProductSlate = ({ disabled, autoFocus = true }) => (
    <Slate
      slots={[{ key: "product", label: "product" }]}
      values={slate}
      onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
      onSubmit={stage === 1 ? checkStage1 : stage === 3 ? checkFade : checkProduct}
      layout="row"
      disabled={disabled}
      autoFocusKey={autoFocus ? "product" : undefined}
      ariaLabel="write the product"
    />
  );

  // ---- the shared QuestionBand, mounted full-width directly under the tabs ----
  // Shows THIS lesson's current question (bare equation; "?" → solved product).
  const band = (() => {
    if (stage === 1) {
      return <QuestionBand lead="the question" expr={<>{ROWS} <span className="qb-op">×</span> {COLS}</>} answer={solved ? PRODUCT : "?"} />;
    }
    if (stage === 2) {
      return <QuestionBand lead="the question" expr={<>{effRows} <span className="qb-op">×</span> {effCols}</>} answer={solved ? PRODUCT : "?"} />;
    }
    if (stage === 3) {
      return <QuestionBand lead="the question" expr={<>{ROWS} <span className="qb-op">×</span> {COLS}</>} answer={solved ? PRODUCT : "?"} />;
    }
    if (stage === 4) {
      return <QuestionBand lead="build a tray that makes" expr={<>{ROWS} <span className="qb-op">×</span> {COLS}</>} answer={PRODUCT} />;
    }
    if (stage === 5) {
      return <QuestionBand lead="the question" expr={<>{ROWS} <span className="qb-op">×</span> {COLS}</>} answer={solved ? PRODUCT : "?"} />;
    }
    if (stage === 6) {
      return <QuestionBand lead="the question — find the product" expr={<>{wp.rows} <span className="qb-op">×</span> {wp.cols}</>} answer={solved ? wp.answer : "?"} />;
    }
    if (stage === "sw") {
      return <QuestionBand lead="show how you found" expr={<>{ROWS} <span className="qb-op">×</span> {COLS}</>} answer={PRODUCT} />;
    }
    // stage 7 — words
    return <QuestionBand lead="the question — find the product" expr={<>{wp.rows} <span className="qb-op">×</span> {wp.cols}</>} answer={solved ? wp.answer : "?"} />;
  })();

  // ---- Per-stage body ----
  let body = null;

  if (stage === 1) {
    // STAGE 1 · MANIPULATE — the tray IS the problem; fill interior cells, count.
    body = (
      <LessonBoard
        footHeight={172}
        railWidth={396}
        stage={
          <FitStage className="m2-fz-canvas m2-fz-canvas-center">
            {/* pile-of-buns SOURCE sits to the LEFT of the tray so the tray keeps
                the full vertical budget (a tall rotated/large tray never gets
                squeezed by controls stacked beneath it). */}
            <div className="m2-fill-row">
              <div className="m2-fill-source">
                <button
                  type="button"
                  className={"m2-bun-pile" + (filledCount >= PRODUCT || solved ? " is-spent" : "")}
                  onPointerDown={grabBun}
                  disabled={filledCount >= PRODUCT || solved}
                  style={{ touchAction: "none" }}
                  aria-label={`a pile of buns — ${Math.max(0, PRODUCT - filledCount)} left, drag one onto a cup to fill it`}
                >
                  {/* The heap visibly DEPLETES as cups fill: render a slice of the buns
                      proportional to how many are still to be placed, taking them off
                      the TOP of the pile first (high indices) so it drains naturally to
                      an empty bowl when every cup is full. */}
                  {BUN_PILE.slice(0, Math.ceil(BUN_PILE.length * Math.max(0, PRODUCT - filledCount) / PRODUCT)).map((b, i) => (
                    <span
                      key={i}
                      className="m2-pile-bun"
                      aria-hidden="true"
                      style={{ left: b.x, top: b.y, width: b.s, height: b.s, zIndex: b.z }}
                    />
                  ))}
                </button>
                <span className="m2-pile-cap">{filledCount >= PRODUCT ? "all buns placed ✓" : `${PRODUCT - filledCount} buns left — drag onto a cup`}</span>
              </div>
              <div
                className={"m2-tray-dropzone" + (bunDrag ? " is-dragging" : "")}
                ref={trayZoneRef}
                onPointerMove={onTrayPointerMove}
                onPointerUp={onTrayPointerUp}
              >
                <BakingTray rows={ROWS} cols={COLS} filled={filled} onFill={onTrayFill} />
                {bunDrag && hotCell != null && (
                  <span className="m2-cell-highlight" style={cellHighlightStyle(hotCell)} aria-hidden="true" />
                )}
              </div>
            </div>
            <div className="m2-cap">Drag a bun onto each inside cup — fill all {ROWS} rows of {COLS}, then count.</div>
          </FitStage>
        }
        rail={
          <HintRail heading="Rows × Columns" hint={`A tray is a rectangle. Drag a bun to every cup one by one, then count them up — by rows is fastest: ${COLS}, ${COLS * 2}, ${COLS * 3}, ${PRODUCT}.`}>
            <div className="m2-count-readout">filled: <b>{filledCount}</b> / {PRODUCT}</div>
          </HintRail>
        }
        answer={
          <AnswerBar
            eq={
              <>
                <span className="m2-fz-expr">{ROWS} × {COLS}</span>
                <span className="m2-fz-op">=</span>
                <span className="m2-fz-slate">{ProductSlate({ disabled: filledCount < PRODUCT || solved })}</span>
              </>
            }
            cap={solved ? `full marks — ${ROWS} × ${COLS} = ${PRODUCT}!` : filledCount >= PRODUCT ? "count the buns — write the product" : "fill the whole tray to unlock the answer"}
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkStage1}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 2) {
    // STAGE 2 · BIND — full tray + written 4 × 6 = __; SPIN for commutativity.
    body = (
      <LessonBoard
        footHeight={172}
        railWidth={396}
        stage={
          <FitStage className="m2-fz-canvas m2-fz-canvas-center">
            <BakingTray rows={effRows} cols={effCols} filled={effRows * effCols} onFill={() => {}} onRotate={() => { setRotated((r) => !r); setCook("idle"); setStatus({ tone: "ok", text: `Spun it — now it's ${effCols} × ${effRows}, but the buns never changed. Still ${PRODUCT}.` }); }} readOnly />
            <div className="m2-cap">{rotated ? `${effRows} rows of ${effCols} — same tray, ${PRODUCT} buns.` : `${ROWS} rows of ${COLS}. Tap "Spin the tray" to see it the other way.`}</div>
          </FitStage>
        }
        rail={
          <HintRail heading="The Same Either Way" hint={`Write ${ROWS} × ${COLS}, then spin the tray: ${COLS} × ${ROWS} fills the very same cups. Rows times columns is the same number either way around.`} />
        }
        answer={
          <AnswerBar
            eq={
              <>
                <span className="m2-fz-expr">{effRows} × {effCols}</span>
                <span className="m2-fz-op">=</span>
                <span className="m2-fz-slate">{ProductSlate({ disabled: solved })}</span>
              </>
            }
            cap={solved ? `full marks — ${PRODUCT} either way!` : "write the product, then Check"}
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkProduct}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · FADE — tray dims; SCORE a column → two partial products (distrib).
    body = (
      <LessonBoard
        footHeight={172}
        railWidth={396}
        stage={
          <FitStage className="m2-fz-canvas m2-fz-canvas-center">
            <BakingTray rows={ROWS} cols={COLS} filled={PRODUCT} onFill={() => {}} ghost={!scored} scoreAt={scored ? SCORE_COL : null} readOnly />
            {!scored && (
              <button type="button" className="m2-score-btn" onClick={() => { setScored(true); setCook("idle"); setStatus({ tone: "normal", text: `Cut! Now it's two pieces: ${ROWS} × ${SCORE_COL} and ${ROWS} × ${COLS - SCORE_COL}. Read each product, then add.` }); }}>✂ Score the tray</button>
            )}
            <div className="m2-cap">{scored ? `Two pieces: ${ROWS} × ${SCORE_COL} and ${ROWS} × ${COLS - SCORE_COL}. Multiply each, then add.` : `A big tray — score it into two easy pieces.`}</div>
          </FitStage>
        }
        rail={
          <HintRail heading="Split a Hard Tray" hint={`Cut the ${ROWS} × ${COLS} tray after column ${SCORE_COL}: that's ${ROWS} × ${SCORE_COL} = ${PART_A} and ${ROWS} × ${COLS - SCORE_COL} = ${PART_B}. Add the two pieces — or just write ${ROWS} × ${COLS}.`} />
        }
        answer={
          <AnswerBar
            className="m2-fz-answer-distrib"
            eq={
              <div className="m2-distrib-row">
                <span className="m2-distrib-part">
                  <span className="m2-distrib-lab">{ROWS} × {SCORE_COL} =</span>
                  <Slate slots={[{ key: "product", label: "first product" }]} values={partA} onChange={(k, v) => setPartA({ product: onlyDigits(v) })} onSubmit={checkFade} layout="row" disabled={solved || !scored} ariaLabel="first partial product" />
                </span>
                <span className="m2-distrib-plus">+</span>
                <span className="m2-distrib-part">
                  <span className="m2-distrib-lab">{ROWS} × {COLS - SCORE_COL} =</span>
                  <Slate slots={[{ key: "product", label: "second product" }]} values={partB} onChange={(k, v) => setPartB({ product: onlyDigits(v) })} onSubmit={checkFade} layout="row" disabled={solved || !scored} ariaLabel="second partial product" />
                </span>
                <span className="m2-distrib-eq">→ {ROWS} × {COLS} =</span>
                <span className="m2-fz-slate">{ProductSlate({ disabled: solved, autoFocus: false })}</span>
              </div>
            }
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkFade}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — BakingTray-backed BUILD (2-D dimensions + total).
    const built = buildRows * buildCols;
    body = (
      <LessonBoard
        footHeight={172}
        railWidth={396}
        stage={
          <FitStage className="m2-fz-canvas m2-fz-canvas-center">
            {buildRows > 0 && buildCols > 0 ? (
              <BakingTray rows={buildRows} cols={buildCols} filled={built} onFill={() => {}} readOnly />
            ) : (
              <div className="m2-build-empty">Pick the rows and columns →</div>
            )}
            <div className="m2-cap">Set the rows and columns so rows × columns reach {PRODUCT}.</div>
          </FitStage>
        }
        rail={
          <HintRail heading="Build the Array" hint={`Set the rows, set the columns, and the tray draws itself. Make ${ROWS} × ${COLS} (or ${COLS} × ${ROWS}) and read the ${PRODUCT}.`}>
            <div className="m2-build-controls">
              <div className="m2-build-dim">
                <span className="m2-build-dim-lab">rows</span>
                <div className="m2-build-btns">
                  <button type="button" onClick={() => !solved && setBuildRows((r) => Math.max(0, r - 1))} aria-label="fewer rows">−</button>
                  <span className="m2-build-dim-val">{buildRows}</span>
                  <button type="button" onClick={() => !solved && setBuildRows((r) => Math.min(9, r + 1))} aria-label="more rows">+</button>
                </div>
              </div>
              <span className="m2-build-x">×</span>
              <div className="m2-build-dim">
                <span className="m2-build-dim-lab">columns</span>
                <div className="m2-build-btns">
                  <button type="button" onClick={() => !solved && setBuildCols((c) => Math.max(0, c - 1))} aria-label="fewer columns">−</button>
                  <span className="m2-build-dim-val">{buildCols}</span>
                  <button type="button" onClick={() => !solved && setBuildCols((c) => Math.min(9, c + 1))} aria-label="more columns">+</button>
                </div>
              </div>
            </div>
            <div className="m2-count-readout">total: <b>{built}</b></div>
          </HintRail>
        }
        answer={
          <AnswerBar
            className="m2-fz-answer-build"
            eq={
              <>
                <span className="m2-fz-expr">{buildRows || "?"} × {buildCols || "?"}</span>
                <span className="m2-fz-op">=</span>
                <span className="m2-fz-expr">{built || "?"}</span>
              </>
            }
            cap={solved ? `built it — ${PRODUCT}!` : "set rows and columns, then Build it"}
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkBuild}
            checkLabel={solved ? "Next stage ▸" : "Build it ▸"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — a BARE expression; write the product. No tray.
    body = (
      <LessonBoard
        footHeight={172}
        railWidth={396}
        stage={
          <FitStage className="m2-fz-canvas m2-fz-canvas-center">
            <div className="m2-bigeq">
              <span className="m2-bigeq-f">{ROWS}</span>
              <span className="m2-bigeq-op">×</span>
              <span className="m2-bigeq-f">{COLS}</span>
              <span className="m2-bigeq-op">=</span>
              <span className="m2-bigeq-q">{solved ? PRODUCT : "?"}</span>
            </div>
            <div className="m2-cap">No tray now — picture the rows, and write the product.</div>
          </FitStage>
        }
        rail={
          <HintRail heading="Write the Product" hint={`${ROWS} rows of ${COLS}. Skip-count if you need to (${COLS}, ${COLS * 2}, …) or split it (${ROWS} × 5 = ${ROWS * 5}, then ${ROWS} more) — then write ${PRODUCT}.`} />
        }
        answer={
          <AnswerBar
            className="m2-fz-answer-big"
            eq={
              <>
                <span className="m2-fz-expr">{ROWS} × {COLS}</span>
                <span className="m2-fz-op">=</span>
                <span className="m2-fz-slate">{ProductSlate({ disabled: solved })}</span>
              </>
            }
            cap={solved ? `full marks — ${ROWS} × ${COLS} = ${PRODUCT}!` : "write the product on the Slate, then Check"}
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkProduct}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — word problem (numerals shown) + REQUIRED setup gate.
    body = (
      <LessonBoard
        variant="wide"
        className="m2-fz-words m2-fz-applied"
        tutorWidth={220}
        content={
          <WordProblem
            story={wp.story}
            tag="Babushka's kitchen"
            readAloud={() => say(wp.read)}
            speaking={speaking}
            answerLead="Now write the product"
            setupLead="First, write rows × columns"
            setup={
              <>
                <span className="m2-setup-row">
                  <Slate slots={[{ key: "a", label: "rows" }]} values={{ a: setup.a }} onChange={(k, v) => setSetup((s) => ({ ...s, a: onlyDigits(v) }))} onSubmit={checkSetup} layout="row" disabled={setupOk || solved} ariaLabel="rows" />
                  <span className="m2-setup-x">×</span>
                  <Slate slots={[{ key: "b", label: "columns" }]} values={{ b: setup.b }} onChange={(k, v) => setSetup((s) => ({ ...s, b: onlyDigits(v) }))} onSubmit={checkSetup} layout="row" disabled={setupOk || solved} ariaLabel="columns" />
                </span>
                {setupOk
                  ? <span className="m2-setup-ok">✓ that's the setup — now solve it</span>
                  : <button type="button" className="wp-check" onClick={checkSetup}>Check the setup</button>}
              </>
            }
            slots={[{ key: "product", label: "product" }]}
            values={slate}
            onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
            layout="row"
            disabled={!setupOk || solved}
            autoFocusKey={setupOk ? "product" : undefined}
            onCheck={checkWordAnswer}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={!setupOk}
          />
        }
        tutor={<TutorRibbon cook={cook} status={status} narrow />}
      />
    );
  } else if (stage === "sw") {
    // SHOW WORK — mandatory blank-slate step between Applied and Words.
    // Ungraded: the child must put ink down before the Next button unlocks.
    const wordsKey = STAGES.find((s) => s.key === "7-words")?.n ?? 7;
    body = (
      <LessonBoard
        footHeight={172}
        railWidth={396}
        stage={
          <div className="m2-fz-canvas m2-fz-canvas-center m2-showwork-canvas">
            <div className="bs-surface m2-showwork-surface">
              <BlankSlate
                key="showwork:m2"
                hint="show your work here — write anything you like ✎"
                onInkChange={setShowWorkInked}
                ariaLabel="show your work"
              />
            </div>
            <div className="m2-cap">Show your work — write out how you found the product. Anything you like.</div>
          </div>
        }
        rail={
          <HintRail heading="Show Your Work" hint="No tray, no slots — just a blank sheet. Sketch the rows, skip-count, or write the multiplication. When you've shown your work, tap Next." />
        }
        answer={
          <AnswerBar
            eq={null}
            cap={showWorkInked ? "looks good — tap Next when you're ready" : "write something on the sheet to continue"}
            ready={showWorkInked}
            onCheck={() => goStage(wordsKey)}
            checkLabel="Next ▸"
            checkDisabled={!showWorkInked}
          />
        }
        tutor={Tutor}
      />
    );
  } else {
    // STAGE 7 · WORDS — prose only; optional ungraded scratch never gates.
    body = (
      <LessonBoard
        variant="wide"
        className="m2-fz-words"
        tutorWidth={220}
        content={
          <WordProblem
            story={wp.story}
            tag="Babushka's Recipe"
            readAloud={() => say(wp.read)}
            speaking={speaking}
            answerLead="Write how many in all"
            setupLead="Optional — show your work first"
            setup={
              <div className="bs-surface m2-words-scratch">
                <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
              </div>
            }
            slots={[{ key: "product", label: "product" }]}
            values={slate}
            onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
            layout="row"
            disabled={solved}
            autoFocusKey="product"
            onCheck={checkWordAnswer}
            checkLabel={solved ? "Finish ▸" : "Check"}
          />
        }
        tutor={<TutorRibbon cook={cook} status={status} narrow />}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag="Baking Trays"
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      tabs={{
        stages: STAGES.map((s) => ({ key: s.key, badge: s.n, title: s.tab, sub: s.sub })),
        current: curKey,
        onSelect: (key) => goStage(toStageVal(key)),
      }}
      // The bare-equation QuestionBand shows the math on every stage EXCEPT the
      // final words-only stage (7), where the whole point is for the child to read
      // the prose and extract the math themselves — showing the equation would give
      // it away. (Applied (6) intentionally keeps numerals.)
      band={stage !== 7 ? band : null}
      goal={Goal}
      // Portaled to <body> so its position:fixed resolves against the VIEWPORT —
      // the app's #stage carries a transform: scale() (Shell.useStageFit), which
      // would otherwise become the containing block for this fixed ghost and drift
      // it up-left of the real cursor.
      extra={bunDrag && createPortal(
        <span
          className="m2-bun-ghost"
          style={{ left: bunDrag.x, top: bunDrag.y }}
          aria-hidden="true"
        />,
        document.body
      )}
    >
      {body}
    </LessonShell>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n, prob) {
  switch (n) {
    case 1: return `A baking tray — ${ROWS} rows of ${COLS} cups. Drag a bun onto the inside cups to fill it, then count the buns.`;
    case 2: return `Write ${ROWS} × ${COLS}, then spin the tray to see ${COLS} × ${ROWS} fills the very same cups.`;
    case 3: return `A big tray. Score it into two easy pieces and read each product, or just write ${ROWS} × ${COLS}.`;
    case 4: return `The Workbench — set the rows and columns to build ${ROWS} × ${COLS}, then read the total.`;
    case 5: return `Just the numbers: ${ROWS} × ${COLS} = ? Write the product on the Slate.`;
    case 6: return `A question in words. Write rows × columns first, then give the product.`;
    case "sw": return `Show your work — a blank sheet. Write out how you find the product, then tap Next.`;
    case 7: return `A story this time — find the rows and columns, and write how many in all.`;
    default: return "";
  }
}
