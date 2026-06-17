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
// Reachability: a STAGE SELECTOR strip jumps to any stage in one click. A correct
// answer NEVER auto-advances — the child sees the success (rosette + cheer), and
// the Check button becomes "Next stage ▸", which on tap calls nextStage() (a pure
// LINEAR advance to the next step — never a redirect, jump, or lesson restart).
//
// Reuses (read-only): Stack, Cook, Rosette, BigFrac, Lock (shared components),
// the new Foundations Slate + WordProblem, and the denominator palette. The
// four-zone play layout is now the shared <LessonBoard>; the page chrome is the
// shared <LessonShell>; the engine + stage-nav + outcome controller backbone is
// the shared useLessonScaffold hook. Only .r1-* CONTENT rules live in r1.css.
import React, { useState, useRef, useEffect } from "react";
import Stack from "./components/Stack.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Lock from "./components/Lock.jsx";
import Slate from "./components/Slate.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import ExpressionSlate from "./components/ExpressionSlate.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, RailInstruction, ScratchSurface } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";
import "./styles/r1.css";

// Geometry for the manipulate canvas (matches the original room).
// The two stacks are vertically separated so NEITHER stack's body overlaps the
// OTHER stack's fraction label (.btag, which sits 58px above its stack). The
// ruler sits below the lower stack (its bottom edge rests on the ruler), pushed
// far enough down that the lower stack's label clears the upper stack's body.
const ORIGIN = 96, UNIT = 392, CW = 584, CH = 372, BAR_H = 72, LINE_Y = 300;
// B is the UPPER stack; its label (.btag) sits 58px ABOVE the stack (≈ y:6→64),
// kept inside the canvas top. A is the LOWER stack; its label sits at y:158→216,
// clearing B's body (ends y:136) with room to spare, then its body 216→300 rests
// on the ruler (LINE_Y 300). Ruler labels at 312 stay inside the play area.
const HOME = { A: { x: ORIGIN, y: 216 }, B: { x: ORIGIN, y: 64 } };

// The single worked example threaded through every stage: 2/7 + 3/7 = 5/7.
const A_N = 2, B_N = 3, DEN = 7, ANSWER = A_N + B_N; // 5
const answerWholes = Math.min(2, Math.max(1, Math.ceil(ANSWER / DEN))); // 1
const RULER_TICKS = answerWholes * DEN;

const NODE = "ADD_SAME_DEN";

// The seven stages, in order — LOGIC ONLY. Identity/copy (tab name, sub, badge)
// now live in the registry (web/src/lessons/r1.js); this array carries only what
// the component's interaction logic needs: the stage VALUE `n` (the render
// branches + engine compare against it) and the scaffold/orchestrator `key`.
// The DISPLAY strip (tab name / sub / badge) is mapped from the registry below.
// Arc (lesson-stage-arc-expansion): Manipulate, Bind, Fade, Workbench, Numbers,
// Applied, Show Work, Words, Practice. Order here MUST match LESSONS.r1.tabs.
const STAGES = [
  { n: 1, key: "1-manipulate" },
  { n: 2, key: "2-bind" },
  { n: 3, key: "3-fade" },
  { n: 4, key: "4-workbench" },
  { n: 5, key: "5-numbers" },
  { n: 6, key: "6-applied" },
  // String-keyed mandatory step (does NOT renumber the lesson). scaffoldMap maps
  // "showwork" -> level 3; the slate is ungraded — advancing is gated only on ink.
  { n: "sw", key: "showwork" },
  { n: 7, key: "7-words" },
  // Auto-generated, estimator-paced practice: the engine mints fresh ADD_SAME_DEN
  // variations, re-rolls on a correct answer, fades to harder problems on a clean
  // streak, and probes transfer. Purely additive — no teaching stage is touched.
  { n: "practice", key: "practice" },
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
// `mergeHost` lets a HOST lesson reuse AppR1's interactive stages inline while
// presenting its OWN header + tab strip. Used by AppNumberLine for the merged
// nl+r1 lesson (the wireframe folds r1's add-stages into nl's 8-tab strip): nl
// renders <AppR1 mergeHost=…> for tabs 3–7. When present, AppR1:
//   • shows the host's header (no/tag/title) + the host's 8-tab strip;
//   • restricts advance/back to the host-listed SUBSET of stages in host order
//     (so r1's Bind/Fade/Workbench are skipped — they're not in the nl lesson),
//     and hands control back to the host (nl) at the ends (→ nl ★Practice forward,
//     → nl Write backward);
//   • routes a click on a non-r1 host tab (Place / Write / ★Practice) back to nl,
//     while r1 tabs (3–7) navigate AppR1's own stages.
// Without mergeHost, AppR1 is the standalone lesson exactly as before.
export default function AppR1({ no, title, onBack, onRewatchIntro, initialStage, stumpingRecipe = null, onReturnToKitchen, mergeHost = null }) {
  // Identity + tab strip come from the central registry (web/src/lessons/r1.js).
  // The component no longer hardcodes tag/title or its own tab display copy.
  // `id.stages` is the registry strip in order; we re-key each strip item to this
  // component's stage `key` (same order) so curKey/toStageVal/onSelect logic —
  // which is keyed on the orchestrator stage keys — keeps working unchanged.
  const id = useLessonIdentity("r1");
  const shellNo = no ?? id.no;
  const shellTitle = title ?? id.title;
  const stripStages = id.stages.map((t, i) => ({ ...t, key: STAGES[i].key }));
  // Which arc stage we're on. initialStage lets the orchestrator deep-link. The
  // stage VALUE is the STAGES `n` (1..7, or the string "sw" for the inserted
  // mandatory show-work step — so the numeric stages never renumber).
  const startN = (() => {
    const f = STAGES.find((s) => s.key === initialStage || s.n === initialStage);
    return f ? f.n : 1;
  })();

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
  const [wbBuilt, setWbBuilt] = useState(null); // build stage: a complete row, awaiting Check

  // --- shared controller backbone (engine wiring + stage nav + outcome state) ---
  // The hook owns everything identical across lessons; R1 supplies only its stage
  // model (advance/back/scaffold key), its intro copy, and its per-stage reset.
  // Map a stage value (number | "sw") to its scaffold key string: the inserted
  // mandatory step maps to "showwork" (scaffoldMap level 3); numeric stages pass
  // their own numeric key string ("1".."7") through unchanged.
  const SCAFFOLD_KEY = (key) => (key === "sw" ? "showwork" : String(key));
  // Advance / back by STAGES ORDER (not arithmetic) so the string-keyed "sw" step
  // sits correctly between Applied (6) and Words (7).
  //
  // mergeHost narrows the order to the host-listed subset (mergeHost.order, a list
  // of stage VALUES `n`): advancing past its last entry / backing before its first
  // hands control to the host (nl) instead of touching r1's omitted stages. The
  // standalone path is unchanged (full STAGES order).
  const advanceByOrder = (cur) => {
    if (mergeHost) {
      const order = mergeHost.order;
      const i = order.indexOf(cur);
      if (i < 0) return cur;
      if (i < order.length - 1) return order[i + 1];
      mergeHost.onExitForward?.();   // past the last merged stage → nl ★Practice
      return cur;
    }
    const idx = STAGES.findIndex((s) => s.n === cur);
    return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1].n : cur;
  };
  const backByOrder = (cur) => {
    if (mergeHost) {
      const order = mergeHost.order;
      const i = order.indexOf(cur);
      if (i < 0) return cur;
      if (i > 0) return order[i - 1];
      mergeHost.onExitBack?.();      // before the first merged stage → nl Write
      return cur;
    }
    const idx = STAGES.findIndex((s) => s.n === cur);
    return idx > 0 ? STAGES[idx - 1].n : cur;
  };
  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "r1",
    initialStage: startN,
    advance: advanceByOrder,
    back: backByOrder,
    scaffoldKeyFor: SCAFFOLD_KEY,
    // The final "practice" stage serves auto-generated ADD_SAME_DEN variations,
    // paced by the engine (re-roll on correct, fade on a clean streak, transfer probe).
    generatedStages: ["practice"],
    generatorSkill: "ADD_SAME_DEN",
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setMerged(false); setMergeTick(0);
      setSlate({ num: "", den: "" });
      setSetupA({ num: "", den: "" }); setSetupB({ num: "", den: "" }); setSetupOk(false);
      setShowWorkInked(false); setWbBuilt(null);
      setPosA(HOME.A); setPosB(HOME.B);
    },
    // U3: when opened from a stumping kitchen recipe, certified mastery returns the
    // child to the kitchen; otherwise the normal end-of-arc celebration line.
    stumpingRecipe,
    inKitchen: false,
    onEnd: (dec) => {
      if (dec?.kind === "ReturnToKitchen") { onReturnToKitchen?.(); return; }
      setStatus({ tone: "ok", text: "That's the whole arc — from dragging blocks to reading a story and writing the answer. Brilliant!" });
    },
  });
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, flashBad,
    solved, solvedRef, stars, badInput, cook, setCook, status, setStatus,
    sayPhase, speaking, selfCorrectionsRef,
  } = sc;

  // Selector clicks pass a STAGES `key` string; normalize to the stage VALUE
  // (a number, or "sw") the render branches compare against.
  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? d.n : key;
  };

  // --- Stage 1 manipulate refs (block-merge mechanic owns its own position refs;
  // the hook owns solvedRef/stageRef/selfCorrectionsRef). ---
  const mergedRef = useRef(merged);
  const posARef = useRef(posA), posBRef = useRef(posB);
  const bodyA = useRef(), bodyB = useRef();
  useEffect(() => { mergedRef.current = merged; }, [merged]);
  const setPosA = (p) => { posARef.current = p; _setPosA(p); };
  const setPosB = (p) => { posBRef.current = p; _setPosB(p); };

  const reveal = true; // the single worked example always teaches with the count shown
  const TICKW = UNIT / DEN;
  const stackW = (n) => (n / DEN) * UNIT;

  // ---- Stage 1 mechanic: merge the two same-size stacks into one ----
  function doMerge() {
    if (stage !== 1) return;
    if (mergedRef.current || solvedRef.current) return;
    setMerged(true); mergedRef.current = true;
    setMergeTick((t) => t + 1);
    setCook("idle");
    setStatus({ tone: "ok", text: `Same-size pieces, all counted up — that's ${ANSWER} pieces. The bottom stays ${DEN}. How many ${DEN}ths in all? Write the top number.` });
  }

  function unmerge() {
    if (solvedRef.current) return;
    setMerged(false); mergedRef.current = false;
    setPosA(HOME.A); setPosB(HOME.B);
    setCook("idle"); setStatus({ tone: "normal", text: "Split them back apart — drag them together when you're ready to count." });
    // Count a self-correction (place → remove oscillation).
    selfCorrectionsRef.current += 1;
    emit({ type: "remove_block", payload: { node_id: NODE } });
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

  // ---- Stage 1 check (numeric box; counts the merged pieces) ----
  function checkStage1() {
    if (solved) { nextStage(); return; }
    if (!merged) {
      setCook("think");
      setStatus({ tone: "warn", text: "Bring the two stacks together and count the pieces first." });
      return;
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
      // Report incorrect attempt to the engine.
      reportAttempt({ correct: false, answerValue: [n, DEN], errorSignature: errSig, stars: 0 });
      return;
    }
    award(`Yes! ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}. Add the tops, keep the bottom — now let's write it.`, "r1FullMarks", [ANSWER, DEN]);
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
      return { ok: false, errorSignature: null };
    }
    if (!numeratorOnly && !(d > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: `Write the bottom number too — the bottom stays ${DEN}.` });
      return { ok: false, errorSignature: null };
    }
    if (n === DEN || (!numeratorOnly && d !== DEN)) {
      // added the bottoms, or changed the denominator — the classic slip
      flashBad();
      setStatus({ tone: "warn", text: `Careful — keep the bottom ${DEN} and only add the tops. ${A_N} + ${B_N} = ?` });
      reportAttempt({ correct: false, answerValue: [n, d || DEN], errorSignature: "add_denominators", stars: 0 });
      return { ok: false, errorSignature: "add_denominators" };
    }
    if (n !== ANSWER) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — add the tops: ${A_N} + ${B_N}. How many ${DEN}ths in all?` });
      reportAttempt({ correct: false, answerValue: [n, d || DEN], errorSignature: null, stars: 0 });
      return { ok: false, errorSignature: null };
    }
    return { ok: true, errorSignature: null };
  }

  function checkSlateStage(numeratorOnly) {
    if (solved) { nextStage(); return; }
    const { ok } = gradeSlate({ numeratorOnly });
    if (!ok) return;
    award(`Yes! ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN}. Add the tops, keep the bottom — full marks, povaryonok!`, "r1FullMarks", [ANSWER, DEN]);
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
    // No auto-finish — record the built row; the child confirms with Check.
    setWbBuilt({ num, den });
    setStatus({ tone: "normal", text: "Row built — press Check to count it up." });
  }
  function checkBuildRow() {
    if (solved) { nextStage(); return; }
    if (!wbBuilt) return;
    const { num, den } = wbBuilt;
    award(`Yes! ${A_N}/${DEN} + ${B_N}/${DEN} = ${ANSWER}/${DEN} — built from same-size pieces and counted up. Brilliant!`, "r1FullMarks", [num, den]);
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

  // "Ready to check": the child has committed the answer the current stage needs,
  // so the Check button lights up (a red glow) to say "you can check now". Stage 1
  // also needs the stacks merged; stage 3 writes only the numerator (den locked).
  const answerReady = !solved && (
    stage === 1 ? (merged && slate.num !== "")
    : stage === 3 ? (slate.num !== "")
    : stage === 6 ? (setupOk && slate.num !== "" && slate.den !== "")
    : (slate.num !== "" && slate.den !== "")
  );

  // The Cook + speech ribbon, shared by every standard four-zone stage.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // The rail-as-instruction card (Wave-F): the task copy + the Read-aloud pill at
  // the TOP of the rail (replacing the deleted goal banner), with the "keep the
  // bottom" lock card rendered below it (the wireframe r1 rail's .lockcard).
  const Rail = (heading, hint) => (
    <RailInstruction
      say={sayPhase}
      speaking={speaking}
      voxSpeaker="cook"
      heading={heading}
      extra={
        <div className="lockcard">
          <BigFrac num={<span style={{ color: "var(--red)" }}>+</span>} den={DEN} locked />
          <div className="lockcard-note">add the tops<br />keep the {DEN}</div>
        </div>
      }
    >
      {hint}
    </RailInstruction>
  );

  // ---- the stage selector "key" for StageTabs. The current stage is matched by
  // `n` so the string-keyed "sw" step selects/navigates correctly alongside the
  // numeric stages; tabs carry the canonical STAGES `.key` strings. ----
  const curKey = STAGES.find((s) => s.n === stage)?.key;

  // ---- merged (nl+r1) tab strip. When hosted by nl, the strip is the HOST's
  // 8-tab strip: `current` is THIS r1 stage mapped to its host key (so the strip
  // tracks AppR1's own auto-advance), and onSelect routes r1 tabs into AppR1's
  // goStage while non-r1 host tabs (Place/Write/★Practice) hand back to nl. ----
  const tabsForShell = mergeHost
    ? {
        stages: mergeHost.stages,
        current: mergeHost.hostKeyForN?.[stage],
        onSelect: (hostKey) => {
          const n = mergeHost.nFromHostKey?.[hostKey];
          if (n !== undefined) goStage(n);     // an r1 tab → AppR1's own stage
          else mergeHost.onNative?.(hostKey);  // Place / Write / ★Practice → nl
        },
        label: mergeHost.label || "Lesson stages",
      }
    : {
        stages: stripStages,
        current: curKey,
        onSelect: (key) => goStage(toStageVal(key)),
      };

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  if (stage === "practice") {
    // PRACTICE — auto-generated ADD_SAME_DEN variations, paced by the mastery engine.
    body = <GenPracticeBoard skill="ADD_SAME_DEN" scaffold={sc} />;
  } else if (stage === 1) {
    // STAGE 1 · MANIPULATE — the blocks ARE the problem. No writing.
    // The four-zone play layout is now the shared <LessonBoard variant="split">:
    // the block canvas fills the (now flexible) stage box; the equation + numeric
    // box ride in the shared <AnswerBar>; the hint rail + tutor are the rail/tutor
    // slots. Overlap of the answer bar over the blocks is structurally impossible.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
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
              /* the joined stack sits ON the ruler (same resting y as the lower
                 stack), so its 5 pieces line up with the 0→5/7 ticks below. */
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
          </div>
        }
        rail={Rail("Keep the Bottom", <>Both stacks are cut into {DEN}ths — the pieces are the same size, so you just count how many. The bottom number is locked.</>)}
        answer={
          <AnswerBar
            eq={
              <>
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
              </>
            }
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
  } else if (stage === 2 || stage === 3) {
    // STAGE 2 · BIND   — merged stack PLUS the written fraction; write 5/7.
    // STAGE 3 · FADE   — blocks dim to a faint check; the equation leads; the
    //                    child writes only the changed line (the numerator).
    // The four-zone play layout is the shared <LessonBoard variant="split">: the
    // block-proof canvas fills the stage box, the equation + Slate + Check ride in
    // the shared <AnswerBar>, and the hint rail + tutor are the rail/tutor slots.
    const numeratorOnly = stage === 3;
    const slateSlots = numeratorOnly
      ? [{ key: "num", label: "top" }, { key: "den", label: "bottom", locked: true, digit: DEN }]
      : [{ key: "num", label: "top" }, { key: "den", label: "bottom" }];

    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
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
            </div>
          </div>
        }
        rail={Rail(
          stage === 2 ? "Write the Number" : "Write the Changed Line",
          stage === 2
            ? <>The whole joined stack <b>is</b> {ANSWER}/{DEN}. Trace that numeral on the Slate — top, then bottom. The bottom is still {DEN}.</>
            : <>The bottom is locked to {DEN}, so you only write the <b>top</b>. Add the tops: {A_N} + {B_N}.</>
        )}
        answer={
          <AnswerBar
            eq={
              <>
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
              </>
            }
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={() => checkSlateStage(numeratorOnly)}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — the shared <BlockSandbox>. The bin offers sevenths PLUS
    // two distractor sizes (halves, thirds) so the child must CHOOSE the right
    // pieces, stack them on the ruler, and count to 5/7. The sandbox renders its
    // OWN .play (diagram + rail); we mount a sibling .hud with the shared
    // corrective-only <TutorRibbon> (Cook always visible, ribbon hidden unless a
    // wrong answer sets tone:"warn") + a "Next ▸" button gated on the solved row.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <BlockSandbox
            bin={[7, 2, 3]}
            targetValue={ANSWER / DEN}
            targetLabel={`${A_N}/${DEN} + ${B_N}/${DEN}`}
            rulerWholes={answerWholes}
            solved={solved}
            onSolve={onSandboxSolve}
            onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: NODE } }); }}
            onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: NODE } }); }}
          />
        }
        rail={Rail("Workbench", <>Pull blocks from the bin and stack them on the line. Build {A_N}/{DEN} + {B_N}/{DEN} out of same-size pieces, then count them up.</>)}
        answer={
          <AnswerBar
            eq={
              <>
                <span className="r1-fz-frac">{A_N}/{DEN}</span>
                <span className="r1-fz-op">+</span>
                <span className="r1-fz-frac">{B_N}/{DEN}</span>
              </>
            }
            cap="stack same-size pieces to the flag, then count them"
            solved={solved}
            ready={!!wbBuilt && !solved}
            stars={stars}
            onCheck={checkBuildRow}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — a BARE equation; write the whole fraction. No blocks at
    // all here — the numbers lead alone. The four-zone play layout is the shared
    // <LessonBoard variant="split">: the bare equation fills the stage box, the
    // equation + Slate + Check ride in the shared <AnswerBar>.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas r1-fz-canvas r1-fz-canvas-center" id="r1canvas">
            <div className="r1-bigeq">
              <BigFrac num={A_N} den={DEN} />
              <span className="r1-bigeq-op">+</span>
              <BigFrac num={B_N} den={DEN} />
              <span className="r1-bigeq-op">=</span>
              {solved ? <BigFrac num={ANSWER} den={DEN} /> : <BigFrac num="?" den="?" />}
            </div>
          </div>
        }
        rail={Rail("Write the Whole Answer", <>Add the tops ({A_N} + {B_N}) and keep the bottom {DEN}. Write both numbers on the Slate.</>)}
        answer={
          <AnswerBar
            eq={
              <>
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
              </>
            }
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={() => checkSlateStage(false)}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — a short applied SENTENCE with the fraction numerals shown.
    // The shared <WordProblem> renders a REQUIRED `setup` gate: the child first
    // transcribes the question as a sum (2/7 + 3/7) on an <ExpressionSlate>; once
    // checkSetup() passes (setupOk) the answer Slate (write 5/7) unlocks. The
    // wide <LessonBoard> gives a full-width story column + a narrow Cook column;
    // the FitStage axis="y" wrapper keeps the whole column from overflowing.
    const story = (
      <>Babushka needs <b>{A_N}/{DEN}</b> + <b>{B_N}/{DEN}</b> of a tray — how much in all?</>
    );
    // Wave-F: restructured onto the shared 4-zone <LessonBoard> per the wireframe
    // room-r1-6-applied.js — rail = <RailInstruction> (the question + Read-aloud),
    // stage = the required word→sum setup gate (story + ExpressionSlate), answer =
    // the total Slate + Check, tutor = corrective ribbon. The all-in-one WordProblem
    // column (question across the top) is gone.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <div className="wp-setup">
            <span className="wp-tag">Babushka's kitchen</span>
            <p className="wp-story">{story}</p>
            <div className="wp-setup-lead">First, write the question as a sum</div>
            <div className="wp-setup-row">
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
            </div>
            <div className="wp-answer-lead">Now write the total</div>
          </div>
        }
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking}
            voxSpeaker="cook"
            heading="Babushka's kitchen"
          >
            A question in words, with the fractions shown. Write what it's asking
            as a <b>sum</b> first, then give the total.
          </RailInstruction>
        }
        answer={
          <div className="wp-answer">
            <div className="wp-answer-row">
              <Slate
                slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
                values={slate}
                onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                onSubmit={() => checkSlateStage(false)}
                layout="fraction"
                den={DEN}
                disabled={!setupOk || solved}
                autoFocusKey={setupOk ? "num" : undefined}
                ariaLabel="write the total"
              />
              <button
                type="button"
                className={"wp-check" + (answerReady ? " ready" : "")}
                onClick={() => checkSlateStage(false)}
                disabled={!setupOk}
              >{solved ? "Next stage ▸" : "Check"}</button>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );
  } else if (stage === "sw") {
    // SHOW WORK — the mandatory, UNGRADED free-form blank slate between Applied and
    // Words. The child shows their working however they like; advancing is gated
    // purely on ink presence (onInkChange), never on a graded answer. The slate
    // remounts (key) on (re)entry to clear, and resetStage clears showWorkInked.
    // Wave-F: restructured onto the shared 4-zone <LessonBoard> per the wireframe
    // room-r1-sw-showwork.js — rail = <RailInstruction> (task copy + Read-aloud),
    // stage = the free-form blank slate, answer = the presence-gated Next ▸, tutor =
    // corrective ribbon. The instruction no longer sits in a top column.
    // The child can EITHER scribble on the slate (ink) OR type the total into the
    // number-entry Slate in the answer bar; Next unlocks on either. Still UNGRADED —
    // any values are accepted (this is "show your work", not a checked answer).
    const swReady = showWorkInked || (slate.num !== "" && slate.den !== "");
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <ScratchSurface variant="required" slateKey="showwork:r1" onInkChange={setShowWorkInked} />
        }
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking}
            voxSpeaker="cook"
            heading="Show your work"
          >
            Show how you worked it out — write the sum, draw the pieces, do whatever
            helps. There's no wrong way here.
          </RailInstruction>
        }
        answer={
          <div className="lbar">
            <div className="lbar-eq">
              <span className="r1-fz-frac">{A_N}/{DEN}</span>
              <span className="r1-fz-op">+</span>
              <span className="r1-fz-frac">{B_N}/{DEN}</span>
              <span className="r1-fz-op">=</span>
              <span className="r1-fz-slate">
                <Slate
                  slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
                  values={slate}
                  onChange={(k, v) => setSlate((s) => ({ ...s, [k]: v }))}
                  layout="fraction"
                  den={DEN}
                  autoFocusKey="num"
                  ariaLabel="write your total here"
                />
              </span>
            </div>
            <div className="lbar-marks">
              <button
                type="button"
                className={"check" + (swReady ? " ready" : "")}
                disabled={!swReady}
                onClick={() => nextStage()}
              >Next ▸</button>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );
  } else {
    // STAGE 7 · WORDS — a plain-language story; read it, pull the numbers, write
    // the total. No blocks, no given equation. The setup here is an OPTIONAL,
    // ungraded free-form BlankSlate — it NEVER gates the answer (answer stays enabled).
    // Wave-F: restructured onto the shared 4-zone <LessonBoard> per the wireframe
    // room-r1-7-words.js — rail = <RailInstruction> (the story + Read-aloud), stage =
    // the optional ungraded scratch slate, answer = the from-scratch fraction Slate +
    // Check, tutor = corrective ribbon. The story no longer sits in a top column.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <ScratchSurface slateKey="words-scratch" />
        }
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking}
            voxSpeaker="cook"
            heading="Babushka's Recipe"
          >
            Babushka used <b>two sevenths</b> of the oats for the porridge, then poured in{" "}
            <b>three sevenths</b> more. The pieces are the same size — sevenths.{" "}
            How much of the oats did she use in all?
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={
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
                  ariaLabel="write how much in all"
                />
              </span>
            }
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={() => checkSlateStage(false)}
            checkLabel={solved ? "Finish ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={mergeHost?.no ?? shellNo}
      tag={(mergeHost?.tag ?? id.tag).replace(/^Lesson \d+ · /, "")}
      title={mergeHost?.title ?? shellTitle}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      // When hosted by nl the strip reads as the HOST's 8-tab lesson; otherwise
      // AppR1 drives its own registry strip. (See tabsForShell.)
      // Wave-F: no goal banner, no QuestionBand — the task copy lives in the rail
      // (<RailInstruction>), the tutor ribbon is corrective-only.
      tabs={tabsForShell}
    >
      {body}
    </LessonShell>
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
