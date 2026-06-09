// AppM2.jsx — Babushka's Lesson m2 (MULT_ARRAYS): the ARRAY / AREA model. The
// worked example is 4 × 6 = 24 — a baking tray of four rows and six columns. The
// tray makes two big ideas visible that m1 deferred: COMMUTATIVITY (spin the tray —
// 4 rows of 6 or 6 rows of 4, still 24) and DISTRIBUTIVITY (score the tray into
// 4×4 + 4×2 = 16 + 8 = 24). It bridges m1 Equal Groups → m3 Times Facts.
//
// THE FULL 7-STAGE INTERACTION ARC (mirrors AppM1 / AppR1's scaffold-fade arc):
//   1 · Manipulate — an empty 4×6 baking tray. Tap cells to fill the tray with buns,
//        then count the filled cells (24) into a plain count box. No Slate.
//   2 · Bind       — the full tray + a written 4 × 6 = __ (Slate row); a SPIN chip
//        rotates the tray 90° to 6×4, count unchanged — write 24 (commutativity).
//   3 · Fade       — the tray dims to ghost; a SCORE line cuts a column so the tray
//        reads 4×4 + 4×2. Write the two partial products (16 and 8), sum to 24
//        (distributivity); never add the split sizes.
//   4 · Workbench  — a BlockSandbox-style build bin: build "4 rows of 6" out of
//        same-size pieces and count to 24 (optional support rung).
//   5 · Numbers    — a bare 4 × 6 = ? card; write the product 24 on the Slate.
//   6 · Applied    — a WordProblem (numerals shown) with a REQUIRED setup gate (a
//        single Slate row capturing rows × cols, EITHER order since commutativity now
//        holds). Then write the total. Engine attempt fires on the ANSWER.
//   7 · Words      — a plain-language WORD PROBLEM (prose only); an OPTIONAL ungraded
//        scratch row that never gates; extract rows & columns, write the product.
//
// Reuses (read-only): Cook, Rosette, Slate (layout="row"), WordProblem, BlockSandbox
// (Workbench), BlankSlate, QuestionBand, the shared LessonShell/LessonBoard/HintRail
// composition, useLessonScaffold + scaffoldMap. New, namespaced .m2-* rules live in
// styles/m2.css; the BakingTray manipulative is genuinely new. ENGINE (R-B5): the
// answer carries the whole-number product as [product, 1]; mult misconceptions
// fingerprint as 'other' in v1.
import React, { useState } from "react";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import BakingTray, { isInterior } from "./components/BakingTray.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import "./styles/m2.css";

// The single worked example threaded through every stage: 4 rows × 6 cols = 24.
const ROWS = 4;
const COLS = 6;
const PRODUCT = ROWS * COLS;     // 24
// Where the Fade stage scores the tray: 4×6 → 4×4 + 4×2 (split the 6 columns 4 | 2).
const SCORE_AT = 4;              // partials: ROWS×SCORE_AT (16) + ROWS×(COLS-SCORE_AT) (8)
const PART_A = ROWS * SCORE_AT;          // 16
const PART_B = ROWS * (COLS - SCORE_AT); // 8

const NODE = "MULT_ARRAYS";

// The seven stages, in order (r1-style numeric-prefixed keys so scaffoldMap's
// parseStageN works), plus the string-keyed "showwork" + "practice" coda.
const STAGES = [
  { n: 1, key: "1-manipulate", tab: "Manipulate", sub: "fill the tray" },
  { n: 2, key: "2-bind",       tab: "Bind",       sub: "4 × 6, spin it" },
  { n: 3, key: "3-fade",       tab: "Fade",       sub: "score 4×4 + 4×2" },
  { n: 4, key: "4-workbench",  tab: "Workbench",  sub: "build 4 rows of 6" },
  { n: 5, key: "5-numbers",    tab: "Numbers",    sub: "bare 4 × 6 = ?" },
  { n: 6, key: "6-applied",    tab: "Applied",    sub: "write the setup, then total" },
  { n: "sw", key: "showwork",  tab: "Show Work",  sub: "show your work" },
  { n: 7, key: "7-words",      tab: "Words",      sub: "story problem" },
  { n: "★", key: "practice",   tab: "Practice",   sub: "Fresh problems — paced to your mastery" },
];

// Word-problem bank (m2) — Applied (6) uses problem 0; Words (7) uses problem 1.
const WORD_BANK = [
  { rows: 4, cols: 6, product: 24, owner: "kid", slug: "buns",
    prose: <>The little cook lined a tray with <b>4 rows</b> of <b>6 buns</b>. How many buns on the tray?</>,
    say: "The little cook lined a tray with four rows of six buns. How many buns on the tray?" },
  { rows: 5, cols: 8, product: 40, owner: "grandpa", slug: "pelmeni",
    prose: <>Grandpa packed a tray <b>5 rows</b> deep and <b>8 pelmeni</b> across. "Forty, all in neat lines." How many pelmeni in all?</>,
    say: "Grandpa packed a tray five rows deep and eight pelmeni across. Forty, all in neat lines. How many pelmeni in all?" },
];

export default function AppM2({ no, title, onBack, onRewatchIntro, initialBeat }) {
  // Find the starting stage from the beat key (consume initialBeat like AppM1).
  const startN = (() => {
    const b = initialBeat;
    const f = STAGES.find((s) => s.key === b || s.n === b || String(s.n) === String(b));
    return f ? (f.key === "showwork" || f.key === "practice" ? f.key : f.n) : 1;
  })();

  // --- Stage 1 (manipulate) — which tray cells hold a bun (Set of "r,c") ---
  const [filled, setFilled] = useState(() => new Set());
  const [tally, setTally] = useState("");                 // the count box (no Slate)

  // --- Stage 2 (bind) — the tray's current orientation (rotate = commutativity) ---
  const [rotated, setRotated] = useState(false);
  const [spun, setSpun] = useState(false);                // has the child spun it yet?

  // --- Stage 3 (fade) — has the child scored the tray into partials yet? ---
  const [scored, setScored] = useState(false);
  const [partA, setPartA] = useState("");
  const [partB, setPartB] = useState("");

  // --- Slate (write) value — a single whole-number product slot (layout="row") ---
  const [product, setProduct] = useState("");

  // --- Applied (6) setup gate: a single Slate row capturing rows × cols ---
  const [setupRows, setSetupRows] = useState("");
  const [setupCols, setSetupCols] = useState("");
  const [setupOk, setSetupOk] = useState(false);

  // --- Show-work step gate ---
  const [showWorkInked, setShowWorkInked] = useState(false);

  // --- Stage 4 workbench: built the rows ---
  const [sandboxBuilt, setSandboxBuilt] = useState(false);

  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-manipulate";
  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "m2",
    initialStage: startN,
    advance: (cur) => (cur === 6 ? "showwork" : cur === "showwork" ? 7 : cur === 7 ? "practice" : cur === "practice" ? "practice" : Math.min(7, (typeof cur === "number" ? cur : 7) + 1)),
    back: (cur) => Math.max(1, (typeof cur === "number" ? cur : 6) - 1),
    scaffoldKeyFor: SCAFFOLD_KEY,
    generatedStages: ["practice"],
    generatorSkill: "MULT_ARRAYS",
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setFilled(new Set()); setTally("");
      setRotated(false); setSpun(false);
      setScored(false); setPartA(""); setPartB("");
      setProduct("");
      setSetupRows(""); setSetupCols(""); setSetupOk(false);
      setShowWorkInked(false); setSandboxBuilt(false);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole arc — from filling the tray to reading a story and writing the answer. Brilliant, povaryonok!" }),
  });
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, flashBad,
    solved, solvedRef, stars, badInput, cook, setCook, status, setStatus,
    say, speaking, selfCorrectionsRef,
  } = sc;

  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? (d.key === "showwork" || d.key === "practice" ? d.key : d.n) : key;
  };

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 3);

  // The active tray dimensions (rotate swaps rows ↔ cols for the commutativity bind).
  const dispRows = rotated ? COLS : ROWS;
  const dispCols = rotated ? ROWS : COLS;

  // ---- Stage 1 manipulate: tap a cell to drop / remove a bun ----
  function toggleCell(r, c) {
    if (solvedRef.current) return;
    setFilled((prev) => {
      const next = new Set(prev);
      const key = `${r},${c}`;
      if (next.has(key)) { next.delete(key); emit({ type: "remove_block", payload: { node_id: NODE } }); }
      else { next.add(key); emit({ type: "place_block", payload: { node_id: NODE } }); }
      return next;
    });
    selfCorrectionsRef.current += 1;
  }

  const trayFull = filled.size >= ROWS * COLS;
  const tallyN = parseInt(tally, 10);

  // ---- Stage 1 check (numeric count box) ----
  function checkStage1() {
    if (solved) { nextStage(); return; }
    if (!trayFull) {
      setCook("think");
      setStatus({ tone: "warn", text: `Fill the whole tray first — every cell of the ${ROWS} × ${COLS} rectangle holds one bun.` });
      say("Fill the whole tray — rows times columns.");
      return;
    }
    if (!(tallyN > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write how many buns in all — count the filled cells." });
      return;
    }
    if (tallyN !== PRODUCT) {
      flashBad();
      const perimeter = tallyN === 2 * (ROWS + COLS) - 4 || tallyN === 2 * (ROWS + COLS);
      setStatus({ tone: "warn", text: perimeter
        ? `Careful — count the INSIDE of the rectangle, not just the edge. ${ROWS} rows of ${COLS} fill the whole tray.`
        : `Not quite — count every cell: ${ROWS} rows, ${COLS} in each row.` });
      say(perimeter ? "Count the inside of the rectangle, not the edge." : "Count every cell.");
      reportAttempt({ correct: false, answerValue: [tallyN, 1], errorSignature: "other", stars: 0 });
      return;
    }
    award(`Yes! ${ROWS} rows of ${COLS} fill the tray — ${ROWS} × ${COLS} = ${PRODUCT}. Rows times columns. Now let's write it.`, "mr_mom_goal_buns", [PRODUCT, 1]);
  }

  // ---- Slate product grader (stages 2,5) ----
  function gradeProduct(target = PRODUCT, a = ROWS, b = COLS) {
    const n = parseInt(product, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the total — how many in all?" });
      return { ok: false, errSig: null, n };
    }
    if (n !== target) {
      flashBad();
      const added = n === a + b;
      setStatus({ tone: "warn", text: added
        ? `Careful — that's ${a} + ${b}. We want ${a} rows of ${b}: rows TIMES columns.`
        : `Not quite — ${a} rows of ${b}. Count by rows, or multiply.` });
      say(added ? "That is adding. We want rows times columns." : "Not quite. Rows times columns.");
      return { ok: false, errSig: "other", n };
    }
    return { ok: true, errSig: null, n };
  }

  // ---- Stage 2 bind: spin the tray (commutativity), then write the product ----
  function spinTray() {
    if (solvedRef.current) return;
    setRotated((r) => !r);
    setSpun(true);
    setCook("idle");
    setStatus({ tone: "ok", text: `${COLS} rows of ${ROWS} now — but it's the SAME tray, still ${PRODUCT}. ${ROWS} × ${COLS} or ${COLS} × ${ROWS}, either way. Write the total.` });
    say("mr_mom_goal_spin");
  }
  function checkStage2() {
    if (solved) { nextStage(); return; }
    if (!spun) {
      flashBad();
      setStatus({ tone: "warn", text: "Give the tray a spin first — see it both ways, then write the total." });
      return;
    }
    const { ok, errSig, n } = gradeProduct(PRODUCT, ROWS, COLS);
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes! ${ROWS} × ${COLS} = ${COLS} × ${ROWS} = ${PRODUCT}. Spin it any way — rows times columns is the same. Full marks!`, "mr_mom_goal_spin", [PRODUCT, 1]);
  }

  // ---- Stage 3 fade: score the tray, write partials (distributivity) ----
  function scoreTray() {
    if (solvedRef.current || scored) return;
    setScored(true); setCook("idle");
    setStatus({ tone: "normal", text: `Cut it into ${ROWS}×${SCORE_AT} and ${ROWS}×${COLS - SCORE_AT}. Multiply each piece, then ADD the two products — never add the split sizes.` });
    say("mr_mom_goal_score");
  }
  function checkStage3() {
    if (solved) { nextStage(); return; }
    if (!scored) {
      flashBad();
      setStatus({ tone: "warn", text: "Score the tray first — cut it into two smaller rectangles." });
      return;
    }
    const a = parseInt(partA, 10), b = parseInt(partB, 10), p = parseInt(product, 10);
    if (!(a > 0 && b > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: `Fill in both partial products: ${ROWS}×${SCORE_AT} and ${ROWS}×${COLS - SCORE_AT}.` });
      return;
    }
    // Pitfall guard: adding the split SIZES (4 + 2) instead of multiplying each part.
    if (a !== PART_A || b !== PART_B) {
      flashBad();
      const addedSizes = a === SCORE_AT || b === (COLS - SCORE_AT);
      setStatus({ tone: "warn", text: addedSizes
        ? `Careful — multiply each PIECE: ${ROWS}×${SCORE_AT} = ${PART_A} and ${ROWS}×${COLS - SCORE_AT} = ${PART_B}. Don't just write the split sizes.`
        : `Not quite — each piece is ${ROWS} rows wide: ${ROWS}×${SCORE_AT} and ${ROWS}×${COLS - SCORE_AT}.` });
      say("mr_mom_nudge_parts");
      reportAttempt({ correct: false, answerValue: [a + b, 1], errorSignature: "other", stars: 0 });
      return;
    }
    if (!(p > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: `Now add the two partials: ${PART_A} + ${PART_B} = ?` });
      return;
    }
    if (p !== PRODUCT) {
      flashBad();
      setStatus({ tone: "warn", text: `Add the partials: ${PART_A} + ${PART_B} = ${PRODUCT}.` });
      reportAttempt({ correct: false, answerValue: [p, 1], errorSignature: "other", stars: 0 });
      return;
    }
    award(`Yes! ${ROWS}×${SCORE_AT} + ${ROWS}×${COLS - SCORE_AT} = ${PART_A} + ${PART_B} = ${PRODUCT} = ${ROWS} × ${COLS}. Cut the tray, multiply each piece, add them up!`, "mr_mom_goal_score", [PRODUCT, 1]);
  }

  // ---- Stage 4 WORKBENCH — BlockSandbox NUMBER mode, "4 rows of 6" ----
  function onSandboxSolve({ num, den }) {
    if (solvedRef.current) return;
    if (den !== COLS) return;
    if (num * den !== PRODUCT) return;
    setSandboxBuilt(true);
    setCook("idle");
    setStatus({ tone: "ok", text: `Built it — ${num} rows of ${den} reach ${PRODUCT}. Now write the product and Check.` });
  }
  function checkStage4() {
    if (solved) { nextStage(); return; }
    if (!sandboxBuilt) {
      setCook("think");
      setStatus({ tone: "warn", text: `Build the rows first — drop "${COLS}" blocks until they reach ${PRODUCT}.` });
      return;
    }
    const { ok, errSig, n } = gradeProduct(PRODUCT, ROWS, COLS);
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes! ${ROWS} rows of ${COLS} — built and counted to ${PRODUCT}. ${ROWS} × ${COLS} = ${PRODUCT}.`, "mr_mom_goal_workbench", [PRODUCT, 1]);
  }

  // ---- Stage 5 numbers ----
  function checkStage5() {
    if (solved) { nextStage(); return; }
    const { ok, errSig, n } = gradeProduct(PRODUCT, ROWS, COLS);
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes! ${ROWS} × ${COLS} = ${PRODUCT}. Rows times columns — full marks!`, "mr_mom_goal_bare", [PRODUCT, 1]);
  }

  // ---- Stage 6 APPLIED — setup gate (rows × cols, EITHER order: commutativity holds) ----
  function checkSetup() {
    const r = parseInt(setupRows, 10), c = parseInt(setupCols, 10);
    const p = WORD_BANK[0];
    if (!(r > 0 && c > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the setup — how many rows, times how many columns." });
      return;
    }
    const exact = r === p.rows && c === p.cols;
    const reversed = r === p.cols && c === p.rows;
    if (!exact && !reversed) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — read the question: ${p.rows} rows of ${p.cols}. Write ${p.rows} × ${p.cols}.` });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: "That's the setup — rows times columns, either way. Now write the total." });
  }
  function gradeWordProduct(prob) {
    const n = parseInt(product, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the total — how many in all?" });
      return { ok: false, errSig: null, n };
    }
    if (n !== prob.product) {
      flashBad();
      const added = n === prob.rows + prob.cols;
      setStatus({ tone: "warn", text: added
        ? `Careful — that's adding. ${prob.rows} rows of ${prob.cols}: count by rows.`
        : `Not quite — ${prob.rows} rows of ${prob.cols}. Count them all up.` });
      return { ok: false, errSig: "other", n };
    }
    return { ok: true, errSig: null, n };
  }
  function checkApplied() {
    if (solved) { nextStage(); return; }
    if (!setupOk) return;
    const prob = WORD_BANK[0];
    const { ok, errSig, n } = gradeWordProduct(prob);
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes! ${prob.rows} × ${prob.cols} = ${prob.product}. Rows times columns — full marks, povaryonok!`, "mr_mom_goal_applied", [prob.product, 1]);
  }
  function checkWords() {
    if (solved) { nextStage(); return; }
    const prob = WORD_BANK[1];
    const { ok, errSig, n } = gradeWordProduct(prob);
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes — ${prob.rows} rows of ${prob.cols} is ${prob.product}. You found the rows and columns on your own. Brilliant!`, "mr_mom_goal_words", [prob.product, 1]);
  }

  function reset() { goStage(1); }

  // ---- the BARE core question for this stage, shown in the QuestionBand ----
  function questionFor(st) {
    if (st === 6) { const p = WORD_BANK[0]; return { a: p.rows, b: p.cols }; }
    if (st === 7) { const p = WORD_BANK[1]; return { a: p.rows, b: p.cols }; }
    return { a: ROWS, b: COLS };
  }
  const showBand = stage !== 7 && stage !== "practice";
  const Band = (() => {
    const q = questionFor(stage);
    return (
      <QuestionBand
        lead="the question"
        expr={<>{q.a} <span className="qb-op">&times;</span> {q.b}</>}
        answer={solved ? q.a * q.b : "?"}
      />
    );
  })();

  const answerReady = !solved && (
    stage === 1 ? (trayFull && tally !== "")
    : stage === 2 ? (spun && product !== "")
    : stage === 3 ? (scored && partA !== "" && partB !== "" && product !== "")
    : stage === 4 ? (sandboxBuilt && product !== "")
    : stage === 6 ? (setupOk && product !== "")
    : (stage === 5 || stage === 7) ? (product !== "")
    : false
  );

  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;

  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="mr_mom_goal_tray" voxSpeaker="mom" className="m2-goal-text">
      Babushka lines a tray <b>{ROWS} rows</b> deep and <b>{COLS} columns</b> across — rows times columns, the same whichever way you turn it: <b>{ROWS} × {COLS}</b>.
    </LessonGoal>
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  const Rail = (heading, hint) => (
    <HintRail heading={heading} hint={hint}>
      <div className="m2-lockcard">
        <span className="m2-lockcard-x">▦</span>
        <div className="m2-lockcard-note">rows × columns,<br />count the inside</div>
      </div>
    </HintRail>
  );

  // shared write card (stages 2,5) — equation + Slate row + Check
  const writeCard = (onCheck, expr, cap) => (
    <AnswerBar
      eq={
        <>
          {expr}
          <span className="m2-fz-op">=</span>
          <span className="m2-fz-slate">
            <Slate
              slots={[{ key: "product", label: "total" }]}
              values={{ product }}
              onChange={(k, v) => setProduct(onlyDigits(v))}
              onSubmit={onCheck}
              layout="row"
              disabled={solved}
              autoFocusKey="product"
              ariaLabel="write the total"
            />
          </span>
        </>
      }
      cap={cap}
      solved={solved}
      ready={answerReady}
      stars={stars}
      onCheck={onCheck}
      checkLabel={solved ? "Next stage ▸" : "Check"}
    />
  );

  let body = null;

  if (stage === "practice") {
    body = <GenPracticeBoard skill="MULT_ARRAYS" scaffold={sc} />;
  } else if (stage === 1) {
    // STAGE 1 · MANIPULATE — the tray IS the problem. Tap cells; fill a count box.
    body = (
      <LessonBoard
        footHeight={160}
        railWidth={360}
        stage={
          <FitStage className="canvas m2-canvas" id="m2canvas">
            <div className="m2-board-head">Fill every cell of the <b>{ROWS} × {COLS}</b> tray</div>
            <BakingTray rows={ROWS} cols={COLS} filled={filled} onFill={toggleCell} readOnly={solved} />
          </FitStage>
        }
        rail={Rail("Rows × Columns", `A tray is a rectangle — ${ROWS} rows of ${COLS}. Fill every cell, then count them all up: it's the rows times the columns.`)}
        answer={
          <AnswerBar
            eq={
              <>
                <span className="m2-fz-frac">{ROWS} rows × {COLS}</span>
                <span className="m2-fz-op">=</span>
                <span className="m2-countbox">
                  <input
                    className="m2-count-input"
                    inputMode="numeric"
                    value={tally}
                    onChange={(e) => setTally(onlyDigits(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") checkStage1(); }}
                    disabled={!trayFull || solved}
                    placeholder="?"
                    aria-label="how many buns in all"
                  />
                </span>
              </>
            }
            cap={solved ? `full marks — ${ROWS} × ${COLS} = ${PRODUCT}!` : trayFull ? "now count every bun — write the total" : "fill the whole tray to unlock the count"}
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
    // STAGE 2 · BIND — full tray + spin chip (commutativity) + write 4 × 6 = 24.
    body = (
      <LessonBoard
        footHeight={160}
        railWidth={360}
        stage={
          <FitStage className="canvas m2-canvas" id="m2canvas">
            <div className="m2-board-head">{spun ? <>Same tray, spun — <b>{dispRows} × {dispCols}</b>, still {PRODUCT}</> : <>Spin the tray — see <b>{ROWS} × {COLS}</b> become <b>{COLS} × {ROWS}</b></>}</div>
            <BakingTray rows={dispRows} cols={dispCols} fillAll onRotate={spinTray} readOnly={solved} />
          </FitStage>
        }
        rail={Rail("Spin It — Same Tray", `Turn the tray a quarter turn: ${ROWS} rows of ${COLS} becomes ${COLS} rows of ${ROWS}. The buns never move — ${ROWS} × ${COLS} and ${COLS} × ${ROWS} are the same ${PRODUCT}.`)}
        answer={writeCard(checkStage2, <span className="m2-fz-frac">{ROWS} × {COLS}</span>,
          solved ? `full marks — ${ROWS} × ${COLS} = ${PRODUCT}!` : spun ? "rows times columns, either way — write the total" : "spin the tray first, then write the total")}
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · FADE — ghost tray scored into 4×4 + 4×2; write partials, sum to 24.
    const PartSlate = ({ value, onChange, label, onSubmit }) => (
      <Slate
        slots={[{ key: "p", label }]}
        values={{ p: value }}
        onChange={(k, v) => onChange(onlyDigits(v))}
        onSubmit={onSubmit}
        layout="row"
        disabled={solved}
        ariaLabel={label}
      />
    );
    body = (
      <LessonBoard
        footHeight={188}
        railWidth={360}
        stage={
          <FitStage className="canvas m2-canvas m2-faded" id="m2canvas">
            <div className="m2-fadecheck" aria-hidden="true"><span className="m2-fadecheck-mark">✓</span> tray checked — let the cut lead</div>
            <BakingTray rows={ROWS} cols={COLS} fillAll ghost scoreAt={scored ? SCORE_AT : null} />
            {!scored ? (
              <button type="button" className="m2-score-btn" onClick={scoreTray} disabled={solved}>▸ score the tray ({ROWS}×{SCORE_AT} | {ROWS}×{COLS - SCORE_AT})</button>
            ) : (
              <div className="m2-partials">
                <span className="m2-part m2-part--left">{ROWS}×{SCORE_AT} = <span className="m2-part-slot">{PartSlate({ value: partA, onChange: setPartA, label: "left", onSubmit: checkStage3 })}</span></span>
                <span className="m2-part-plus">+</span>
                <span className="m2-part m2-part--right">{ROWS}×{COLS - SCORE_AT} = <span className="m2-part-slot">{PartSlate({ value: partB, onChange: setPartB, label: "right", onSubmit: checkStage3 })}</span></span>
              </div>
            )}
          </FitStage>
        }
        rail={Rail("Cut & Add", `Score the ${ROWS}×${COLS} tray into ${ROWS}×${SCORE_AT} and ${ROWS}×${COLS - SCORE_AT}. Multiply EACH piece (${PART_A} and ${PART_B}), then ADD them — never add the split sizes ${SCORE_AT} and ${COLS - SCORE_AT}.`)}
        answer={writeCard(checkStage3, <span className="m2-fz-frac">{scored ? `${PART_A} + ${PART_B}` : `${ROWS} × ${COLS}`}</span>,
          solved ? `full marks — ${PART_A} + ${PART_B} = ${PRODUCT}!` : scored ? "fill both partials, then add them for the total" : "score the tray first")}
        tutor={Tutor}
      />
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — BlockSandbox NUMBER mode: build "4 rows of 6".
    body = (
      <LessonBoard
        rail={null}
        footHeight={160}
        stageClassName="bare"
        stage={
          <BlockSandbox
            mode="number"
            bin={[COLS, 5, 4]}
            targetValue={PRODUCT}
            targetLabel={`${ROWS} rows of ${COLS}`}
            solved={solved}
            onSolve={onSandboxSolve}
            onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: NODE } }); }}
            onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: NODE } }); }}
            title="Workbench"
            hint={`Build ${ROWS} rows of ${COLS} — drop "${COLS}" blocks until they reach ${PRODUCT}, then write the product below.`}
          />
        }
        answer={writeCard(checkStage4, <span className="m2-fz-frac">{ROWS} × {COLS}</span>,
          solved ? `full marks — ${ROWS} × ${COLS} = ${PRODUCT}!` : sandboxBuilt ? "the rows are built — write the product, then Check" : "build the rows first")}
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — a bare 4 × 6 = ? card; write the product.
    body = (
      <LessonBoard
        footHeight={160}
        railWidth={360}
        stage={
          <div className="canvas m2-canvas m2-canvas-center">
            <div className="m2-bigeq">
              <span className="m2-bigeq-term">{ROWS}</span>
              <span className="m2-bigeq-op">×</span>
              <span className="m2-bigeq-term">{COLS}</span>
              <span className="m2-bigeq-op">=</span>
              <span className="m2-bigeq-q">{solved ? PRODUCT : "?"}</span>
            </div>
            <div className="m2-numbers-cap">No tray now — {ROWS} rows of {COLS}. Rows times columns, or split it if you like.</div>
          </div>
        }
        rail={Rail("Write the Product", `${ROWS} rows of ${COLS}. Count by ${ROWS}s, or split: ${ROWS}×${SCORE_AT} + ${ROWS}×${COLS - SCORE_AT} = ${PART_A} + ${PART_B}.`)}
        answer={writeCard(checkStage5, <span className="m2-fz-frac">{ROWS} × {COLS}</span>,
          solved ? `full marks — ${ROWS} × ${COLS} = ${PRODUCT}!` : "count the tray, write the total, then Check")}
        tutor={Tutor}
      />
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — WordProblem with a REQUIRED rows × cols setup gate.
    const prob = WORD_BANK[0];
    body = (
      <LessonBoard
        variant="wide"
        tutorWidth={224}
        className="m2-fz-words"
        content={
          <WordProblem
            story={prob.prose}
            tag="Babushka's kitchen"
            readAloud={() => say(prob.say)}
            speaking={speaking}
            answerLead="Now write the total"
            setupLead="First, write it as rows × columns"
            setup={
              <div className={"m2-setup-row" + (badInput && !setupOk ? " is-shake" : "")}>
                <Slate
                  slots={[{ key: "rows", label: "rows" }]}
                  values={{ rows: setupRows }}
                  onChange={(k, v) => setSetupRows(onlyDigits(v))}
                  onSubmit={checkSetup}
                  layout="row"
                  disabled={setupOk || solved}
                  autoFocusKey={!setupOk ? "rows" : undefined}
                  ariaLabel="how many rows"
                />
                <span className="m2-setup-times">×</span>
                <Slate
                  slots={[{ key: "cols", label: "columns" }]}
                  values={{ cols: setupCols }}
                  onChange={(k, v) => setSetupCols(onlyDigits(v))}
                  onSubmit={checkSetup}
                  layout="row"
                  disabled={setupOk || solved}
                  ariaLabel="how many columns"
                />
                {setupOk
                  ? <span className="m2-setup-ok">✓ that's the setup — now solve it</span>
                  : <button type="button" className="wp-check" onClick={checkSetup}>Check the setup</button>}
              </div>
            }
            slots={[{ key: "product", label: "total" }]}
            values={{ product }}
            onChange={(k, v) => setProduct(onlyDigits(v))}
            layout="row"
            disabled={!setupOk || solved}
            autoFocusKey={setupOk ? "product" : undefined}
            onCheck={checkApplied}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={!setupOk}
          />
        }
        tutor={<TutorRibbon cook={cook} status={status} narrow />}
      />
    );
  } else if (stage === "showwork") {
    // SHOW WORK — the mandatory free-form blank slate between Applied and Words.
    body = (
      <LessonBoard
        variant="wide"
        tutorWidth={224}
        className="m2-fz-words m2-showwork"
        content={
          <>
            <div className="panel m2-showwork-head">
              <h3>Show Your Work</h3>
              <div className="hint">Before the last story problem — show how you'd count {ROWS} rows of {COLS} on a blank slate. Write anything you like; this one isn't graded.</div>
            </div>
            <div className="bs-surface m2-showwork-slate" style={{ position: "relative" }}>
              <BlankSlate
                key={`showwork:${stage}`}
                hint="show your work here — write anything you like ✎"
                onInkChange={setShowWorkInked}
                ariaLabel="show your work on a blank slate"
              />
            </div>
            <div className="lbar-marks" style={{ marginTop: 12 }}>
              <button
                className={"check" + (showWorkInked ? " ready" : "")}
                disabled={!showWorkInked}
                onClick={() => nextStage()}
              >Next ▸</button>
            </div>
          </>
        }
        tutor={Tutor}
      />
    );
  } else {
    // STAGE 7 · WORDS — prose only; optional ungraded blank-slate scratch.
    const prob = WORD_BANK[1];
    body = (
      <LessonBoard
        variant="wide"
        tutorWidth={224}
        className="m2-fz-words m2-words-stage"
        content={
          <WordProblem
            story={prob.prose}
            tag="Babushka's Recipe"
            readAloud={() => say(prob.say)}
            speaking={speaking}
            answerLead="Write how many in all"
            setupLead="Optional — show your work here"
            setup={
              <div className="bs-surface m2-words-scratch" style={{ position: "relative" }}>
                <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
              </div>
            }
            slots={[{ key: "product", label: "total" }]}
            values={{ product }}
            onChange={(k, v) => setProduct(onlyDigits(v))}
            layout="row"
            disabled={solved}
            autoFocusKey="product"
            onCheck={checkWords}
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
      band={showBand ? Band : null}
      goal={Goal}
    >
      {body}
    </LessonShell>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  if (n === "showwork") return `Show your work on a blank slate — count ${ROWS} rows of ${COLS} however you like, then move on.`;
  switch (n) {
    case 1: return `A baking tray, ${ROWS} rows deep and ${COLS} columns across. Tap every cell to fill it with a bun, then count them all up.`;
    case 2: return `The tray is full — now spin it a quarter turn. ${ROWS} rows of ${COLS} becomes ${COLS} rows of ${ROWS}, still ${PRODUCT}. Write the total.`;
    case 3: return `Let the cut lead. Score the tray into ${ROWS}×${SCORE_AT} and ${ROWS}×${COLS - SCORE_AT}, multiply each piece, then add them up.`;
    case 4: return `The Workbench — build ${ROWS} rows of ${COLS} from the bin, then read the count.`;
    case 5: return `Just the numbers: ${ROWS} × ${COLS} = ? Write the product on the Slate.`;
    case 6: return `A question in words, with the numbers shown. Write it as rows × columns first (${ROWS} × ${COLS}), then give the total.`;
    case 7: return `A story this time — read it, find the rows and the columns, and write how many in all.`;
    default: return "";
  }
}
