// AppM1.jsx — Babushka's Lesson m1 (MULT_EQUAL_GROUPS): what multiplication
// MEANS. The worked example is 3 × 4 = 12 — three plates, four pelmeni on every
// plate, count by adding the group again and again, or multiply. Commutativity is
// DEFERRED to m2 (the plates are NEVER rotated); the equal-size-group invariant is
// ENFORCED (extra taps spill back; an unequal plate outlines red).
//
// THE FULL 6-STAGE INTERACTION ARC (mirrors AppR1's scaffold-fade arc):
//   1 · Manipulate — N empty plates + a bowl of identical pelmeni. Tap pelmeni
//        onto each plate until ALL N hold M; fill a plain count box. No Slate.
//   2 · Bind       — filled plates stay; a repeated-addition strip 4 + 4 + 4 fades
//        in beneath (one term per plate); write the total 12 on the Slate.
//   3 · Workbench  — a scoops-into-bowls bin (BowlGroup): build N bowls each
//        holding the same correct M; Build stays disabled until equal. (Optional.)
//   4 · Numbers    — a bare 3 × 4 = ? card; write the product 12 on the Slate.
//   5 · Applied    — a WordProblem (numerals shown) with a REQUIRED setup gate
//        (a single Slate row capturing count × size = 3 × 4); reversed order earns
//        a GENTLE nudge, not a reject (R-M4). Then write the total. Engine attempt
//        fires on the ANSWER.
//   6 · Words      — a plain-language WORD PROBLEM (prose only); an OPTIONAL
//        ungraded scratch row that never gates; extract count & size, write product.
//
// Reuses (read-only): Cook, Rosette, Slate (layout="row"), WordProblem, BlockSandbox
// (Workbench styling), useVoice, ROLE_COLORS, useLessonEngine + scaffoldMap. New,
// namespaced .m1-* rules live in styles/m1.css; shared lesson.css house classes
// (.page/.topbar/.goal/.canvas/.panel/.ribbon/.check/.hud …) are reused by name.
//
// ENGINE (R-B5): the answer value carries the whole-number product as [product, 1]
// (the grader reads parseInt of a single Slate slot; answer_value[1] is never a
// denominator). Every multiplication misconception fingerprints as 'other' in v1.
import React, { useState } from "react";
import Slate from "./components/Slate.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import PlateGroup, { BowlGroup } from "./components/PlateGroup.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, RailInstruction, ScratchSurface } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";
import "./styles/m1.css";

// Identity + tab strip are DATA — sourced from the central registry, not inlined.
const L = LESSONS.m1;

// The single worked example threaded through every stage: 3 groups of 4 = 12.
const GROUPS = 3;          // N plates
const SIZE = 4;            // M pelmeni per plate
const PRODUCT = GROUPS * SIZE; // 12

// The scaffold stage MODEL (logic, not chrome). The canonical `key` strings are
// r1-style numeric-prefixed ids so scaffoldMap's parseStageN works, plus the two
// string-keyed steps "showwork" (between Applied and Words) and "practice" (the
// generated coda). The orchestrator routes by these keys. We keep them HERE (they
// are interactive wiring, not copy) and pull the TAB LABELS / SUBS / badges / order
// from the registry (L.tabs) so identity + copy live in one place.
//
// `n` is the render-branch stage value (numeric 1..6, or the string key for the
// non-numeric steps). The map below pairs each registry tab (keyed by its badge
// `t.n`) with its canonical scaffold key + render value.
const STAGE_BY_BADGE = {
  "1": { n: 1, key: "1-manipulate" },
  "2": { n: 2, key: "2-bind" },
  "3": { n: 3, key: "3-workbench" },
  "4": { n: 4, key: "4-numbers" },
  "5": { n: 5, key: "5-applied" },
  "6": { n: "showwork", key: "showwork" },
  "7": { n: 6, key: "6-words" },
  "★": { n: "practice", key: "practice" },
};
// Zip the registry strip (order + labels + subs) with the scaffold model above.
const STAGES = L.tabs.map((t) => {
  const m = STAGE_BY_BADGE[t.n];
  return { n: m.n, key: m.key, badge: t.n, tab: t.name, sub: t.sub };
});

const NODE = "MULT_EQUAL_GROUPS";

// Word-problem bank (m1) — verbatim from the plan. Owner drives banter voice keys
// (mr_<owner>_<slug>_*; cat stays meow-only, Babushka carries the answer). The
// Applied stage (5) uses problem 0; the Words stage (6) uses problem 1.
const WORD_BANK = [
  { groups: 3, size: 4, product: 12, owner: "kid",     slug: "plates",
    prose: <>The little cook set out <b>3 plates</b>, then put <b>4 pelmeni</b> on every plate. How many pelmeni in all?</>,
    say: "The little cook set out three plates, then put four pelmeni on every plate. How many pelmeni in all?" },
  { groups: 5, size: 2, product: 10, owner: "kid",     slug: "cherries",
    prose: <>The little cook filled <b>5 bowls</b> with <b>2 cherries</b> each — and then some jumped into a mouth! How many cherries did the bowls hold?</>,
    say: "The little cook filled five bowls with two cherries each, and then some jumped into a mouth. How many cherries did the bowls hold?" },
  { groups: 6, size: 3, product: 18, owner: "grandpa", slug: "skewers",
    prose: <>Grandpa loaded <b>6 skewers</b> with <b>3 sausages</b> each — "I will guard all eighteen with my life." How many sausages is that?</>,
    say: "Grandpa loaded six skewers with three sausages each. He will guard all eighteen with his life. How many sausages is that?" },
];

export default function AppM1({ onBack, onRewatchIntro, initialBeat }) {
  // Identity comes from the registry, not props — one source of truth.
  const no = L.num.replace("№", "");
  const title = L.title;
  // Find the starting stage from the beat key (consume initialBeat like AppR1).
  // `stage` holds either a numeric stage (1..6) OR the string key "showwork" for
  // the inserted mandatory step — so the numeric stages never renumber.
  const startN = (() => {
    const b = initialBeat;
    const f = STAGES.find((s) => s.key === b || s.n === b || String(s.n) === String(b) || s.badge === String(b));
    // Normalize the string-keyed steps (showwork, practice) to their canonical key.
    return f ? (f.key === "showwork" || f.key === "practice" ? f.key : f.n) : 1;
  })();
  // --- Stage 1 (manipulate) state — N plates, each holding 0..SIZE pelmeni ---
  const [plates, setPlates] = useState(() => Array(GROUPS).fill(0));
  const [plateFlag, setPlateFlag] = useState(false);     // paint unequal plates red on a bad check
  const [tally, setTally] = useState("");                 // the count box (no Slate)

  // --- Stage 2 (bind) — the child ASSEMBLES the repeated-addition strip by tapping
  // each plate to carry its "+ SIZE" into a running sum (0 → 4 → 4+4 → 4+4+4). The
  // total slate unlocks only once all GROUPS terms are bound.
  const [boundTerms, setBoundTerms] = useState(0);

  // --- Slate (write) value — a single whole-number product slot (layout="row") ---
  const [product, setProduct] = useState("");

  // --- Applied (5) setup gate: a single Slate row capturing count × size ---
  const [setupCount, setSetupCount] = useState("");
  const [setupSize, setSetupSize] = useState("");
  const [setupOk, setSetupOk] = useState(false);
  // --- Words (6) optional scratch is now a standalone BlankSlate (ungraded, no
  // state needed). ---
  // --- Show-work step gate: the child must put ink down before advancing ---
  const [showWorkInked, setShowWorkInked] = useState(false);
  // --- Workbench (3): the sandbox reports a complete row; the child then clicks
  // Check to confirm (no auto-finish). { ready, total } once a valid row is built. ---
  const [wbBuilt, setWbBuilt] = useState(null);

  // --- shared controller backbone (engine wiring + stage nav + outcome state) ---
  // The hook owns everything identical across lessons; M1 supplies only its stage
  // model (advance/back/scaffold key), its intro copy, and its per-stage reset.
  // Map a stage value (number | "showwork") to its scaffold key string.
  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-manipulate";
  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "m1",
    initialStage: startN,
    // Linear advance, threading the string-keyed "showwork" step between 5 and 6,
    // then the generated "practice" coda after Words (6).
    advance: (cur) => (cur === 5 ? "showwork" : cur === "showwork" ? 6 : cur === 6 ? "practice" : cur === "practice" ? "practice" : Math.min(6, (typeof cur === "number" ? cur : 6) + 1)),
    // RaiseScaffold target — one numeric stage back (showwork is ungraded so it
    // never reports an attempt; guard the arithmetic anyway).
    back: (cur) => Math.max(1, (typeof cur === "number" ? cur : 5) - 1),
    scaffoldKeyFor: SCAFFOLD_KEY,
    // The final "practice" stage serves auto-generated MULT_EQUAL_GROUPS variations,
    // paced by the engine (re-roll on correct, fade on a clean streak, transfer probe).
    generatedStages: ["practice"],
    generatorSkill: "MULT_EQUAL_GROUPS",
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setPlates(Array(GROUPS).fill(0)); setPlateFlag(false); setTally("");
      setBoundTerms(0); setProduct("");
      setSetupCount(""); setSetupSize(""); setSetupOk(false); setShowWorkInked(false);
      setWbBuilt(null);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole arc — from filling jars to reading a story and writing the answer. Brilliant, povaryonok!" }),
  });
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, flashBad,
    solved, solvedRef, stars, badInput, cook, setCook, status, setStatus,
    sayPhase, speaking, selfCorrectionsRef,
  } = sc;

  // Selector clicks pass a STAGES `key` string; normalize to the stage VALUE
  // (a number, or "showwork") the render branches compare against.
  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    // The string-keyed steps (showwork, practice) compare by their key in the
    // render branches; numeric stages compare by their numeric `n`.
    return d ? (d.key === "showwork" || d.key === "practice" ? d.key : d.n) : key;
  };

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 3);

  // ---- Stage 1 manipulate: tap a pelmeni onto a plate (equal-group guard) ----
  // A plate maxes at SIZE; a tap past that "spills back" (we simply refuse).
  function addToPlate(i) {
    if (solvedRef.current) return;
    setPlateFlag(false);
    setPlates((p) => {
      if (p[i] >= SIZE) {
        // spill back — refuse the extra, nudge gently
        setCook("think");
        setStatus({ tone: "warn", text: `That jar already has ${SIZE} — every jar gets the SAME ${SIZE}. The extra spills back.` });
        return p;
      }
      const next = p.slice(); next[i] = p[i] + 1;
      return next;
    });
    selfCorrectionsRef.current += 1;
    emit({ type: "place_block", payload: { node_id: NODE } });
  }
  function clearPlate(i) {
    if (solvedRef.current) return;
    setPlateFlag(false);
    setPlates((p) => { const next = p.slice(); next[i] = 0; return next; });
    selfCorrectionsRef.current += 1;
    emit({ type: "remove_block", payload: { node_id: NODE } });
  }

  const allEqualFull = plates.every((c) => c === SIZE);
  const tallyN = parseInt(tally, 10);

  // ---- Stage 1 check (numeric count box; counts every pelmeni) ----
  function checkStage1() {
    if (solved) { nextStage(); return; }
    if (!allEqualFull) {
      setPlateFlag(true);
      setCook("think");
      setStatus({ tone: "warn", text: `Every jar needs the SAME ${SIZE} plums — fill each of the ${GROUPS} jars to ${SIZE} first.` });
      return;
    }
    if (!(tallyN > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write how many plums in all — count every jar." });
      return;
    }
    if (tallyN !== PRODUCT) {
      flashBad();
      const addedFactors = tallyN === GROUPS + SIZE; // 3 + 4 = 7 — the classic "add the factors" slip
      setStatus({ tone: "warn", text: addedFactors
        ? `Careful — don't ADD the numbers. Count the groups: ${GROUPS} jars of ${SIZE}. ${SIZE} + ${SIZE} + ${SIZE} = ?`
        : `Not quite — count every plum: ${GROUPS} jars, ${SIZE} in each.` });
      reportAttempt({ correct: false, answerValue: [tallyN, 1], errorSignature: "other", stars: 0 });
      return;
    }
    award(`Yes! ${GROUPS} jars of ${SIZE} is ${SIZE} + ${SIZE} + ${SIZE} = ${PRODUCT}. Count the groups, not the numbers — now let's write it.`, "mr_mom_goal_1", [PRODUCT, 1]);
  }

  // ---- Slate product check (stages 2,4) ----
  function gradeProduct() {
    const n = parseInt(product, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the total — how many in all?" });
      return { ok: false, errSig: null, n };
    }
    if (n !== PRODUCT) {
      flashBad();
      const addedFactors = n === GROUPS + SIZE;
      setStatus({ tone: "warn", text: addedFactors
        ? `Careful — that's ${GROUPS} + ${SIZE}. We want ${GROUPS} GROUPS of ${SIZE}: ${SIZE} + ${SIZE} + ${SIZE}.`
        : `Not quite — ${GROUPS} groups of ${SIZE}. Add ${SIZE} three times, or multiply.` });
      return { ok: false, errSig: "other", n };
    }
    return { ok: true, errSig: null, n };
  }
  function checkProductStage() {
    if (solved) { nextStage(); return; }
    const { ok, errSig, n } = gradeProduct();
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes! ${GROUPS} × ${SIZE} = ${PRODUCT}. Add the group again and again, or multiply — full marks!`, "mr_mom_goal_1", [PRODUCT, 1]);
  }

  // ---- Stage 2 BIND: tap a plate to carry its "+ SIZE" into the running sum ----
  // Each tap binds one more equal group; once all GROUPS are bound the strip reads
  // SIZE + SIZE + SIZE and the total slate unlocks. (This is the REPEATED-ADDITION
  // construction.)
  const allBound = boundTerms >= GROUPS;
  function bindNextGroup() {
    if (solvedRef.current || allBound) return;
    setBoundTerms((n) => Math.min(GROUPS, n + 1));
    setCook("idle");
    const next = Math.min(GROUPS, boundTerms + 1);
    setStatus(next >= GROUPS
      ? { tone: "ok", text: `${ADD_TERMS.join(" + ")} — three equal groups added up. Now write the total.` }
      : { tone: "normal", text: `Bound ${next} of ${GROUPS} groups: ${Array(next).fill(SIZE).join(" + ")}. Keep adding the group.` });
  }

  // ---- Stage 3 WORKBENCH — BlockSandbox in NUMBER mode (whole-number groups) ----
  // The child stacks equal "group" scoops (size SIZE) on a 0→PRODUCT count line
  // until the row reaches the flag at GROUPS groups. The sandbox only fires onSolve
  // for a SAME-SIZE row that hits the target count, reporting {num: #groups, den:
  // scoop size}; we read num*den as the product (= PRODUCT for an equal-group row).
  // The sandbox signals a complete same-size row — record it and let the child
  // confirm with Check (no auto-finish).
  function onSandboxSolve({ num, den } = {}) {
    if (solvedRef.current) return;
    const total = (num != null && den != null) ? num * den : PRODUCT;
    setProduct(String(total));
    setWbBuilt({ total, num: num ?? GROUPS, den: den ?? SIZE });
    setStatus({ tone: "normal", text: "Row built — press Check to count it up." });
  }
  function checkWorkbench() {
    if (solved) { nextStage(); return; }
    // No valid equal-group row yet (empty, short of the flag, or — like a 4+5+3
    // row — the right total but MIXED sizes). The sandbox only banks `wbBuilt` for a
    // clean same-size row, so here we give the Cook a corrective beat instead of
    // silently doing nothing (the tutor must always respond to a Check).
    if (!wbBuilt) {
      flashBad();
      setCook("think");
      setStatus({ tone: "warn", text: `Those aren't equal groups yet — build ${GROUPS} groups of ${SIZE}, all the SAME size, until the row reaches the flag. Then press Check.` });
      return;
    }
    const { total, num, den } = wbBuilt;
    award(`Yes! ${num} groups of ${den} — built from equal groups and counted up. ${num} × ${den} = ${total}!`, "mr_mom_goal_1", [total, 1]);
  }

  // ---- Stage 5 APPLIED — the required count × size setup gate -----------------
  // Correct (expected) order is count × size. A REVERSED order (size × count) earns
  // a gentle nudge but still unlocks (R-M4: ungraded gate). Then write the product.
  function checkSetup() {
    const c = parseInt(setupCount, 10), s = parseInt(setupSize, 10);
    const p = WORD_BANK[0];
    if (!(c > 0 && s > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the setup — how many groups, times how many in each." });
      return;
    }
    const exact = c === p.groups && s === p.size;
    const reversed = c === p.size && s === p.groups;
    if (!exact && !reversed) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — read the question: ${p.groups} groups of ${p.size}. Write ${p.groups} × ${p.size}.` });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus(reversed
      ? { tone: "ok", text: `That works out the same — but we count groups first: ${p.groups} × ${p.size}. Now write the total.` }
      : { tone: "ok", text: "That's the setup. Now add the group again and again — write the total." });
  }

  // ---- Applied/Words product grader (problem-aware) ----
  function gradeWordProduct(prob) {
    const n = parseInt(product, 10);
    if (!(n > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the total — how many in all?" });
      return { ok: false, errSig: null, n };
    }
    if (n !== prob.product) {
      flashBad();
      const addedFactors = n === prob.groups + prob.size;
      setStatus({ tone: "warn", text: addedFactors
        ? `Careful — that's adding. ${prob.groups} groups of ${prob.size}: count by ${prob.size}s.`
        : `Not quite — ${prob.groups} groups of ${prob.size}. Count them all up.` });
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
    award(`Yes! ${prob.groups} × ${prob.size} = ${prob.product}. Count the groups — full marks, povaryonok!`, "mr_mom_goal_1", [prob.product, 1]);
  }
  function checkWords() {
    if (solved) { nextStage(); return; }
    const prob = WORD_BANK[1];
    const { ok, errSig, n } = gradeWordProduct(prob);
    if (!ok) { if (errSig) reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: errSig, stars: 0 }); return; }
    award(`Yes — ${prob.groups} bowls of ${prob.size} is ${prob.product}. You found the groups all on your own. Brilliant!`, "mr_mom_goal_1", [prob.product, 1]);
  }

  // ---- header reset ----
  function reset() { goStage(1); }

  // "Ready to check": the child has committed what this stage needs.
  const answerReady = !solved && (
    stage === 1 ? (allEqualFull && tally !== "")
    : stage === 2 ? (allBound && product !== "")
    : stage === 5 ? (setupOk && product !== "")
    : (stage === 4 || stage === 6) ? (product !== "")
    : false
  );

  // The repeated-addition strip terms (one per plate).
  const ADD_TERMS = Array(GROUPS).fill(SIZE);

  // ---- stage selector strip (reachability: jump to any stage) ----
  // The current stage is matched by `key` so the string-keyed "showwork" step
  // selects/navigates correctly alongside the numeric stages.
  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;

  // The Cook + speech ribbon, shared by every stage. Corrective-only now: the
  // ribbon stays hidden until a wrong/feedback `status` (tone "warn"); the Cook
  // sprite is always visible. The resting instruction lives in the rail below.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // The rail-as-instruction card (Wave-F): the task copy moves off the deleted
  // goal banner into the FIRST rail card, with the Read-aloud pill on top
  // (reusing the old goal's voice key `mr_mom_goal_1`). The "count the groups"
  // lock card rides below as the rail's concept anchor.
  const LockCard = (
    <div className="m1-lockcard">
      <span className="m1-lockcard-x">×</span>
      <div className="m1-lockcard-note">count the groups,<br />not the numbers</div>
    </div>
  );
  const Rail = (heading, hint) => (
    <RailInstruction
      say={sayPhase}
      speaking={speaking}
      voxSpeaker="mom"
      heading={heading}
      extra={LockCard}
    >
      {hint}
    </RailInstruction>
  );

  // ---- shared write card (stages 2,4) — equation + Slate row + Check --------
  // Returns the <AnswerBar> node for LessonBoard's `answer` slot.
  const writeCard = (onCheck, expr) => (
    <AnswerBar
      eq={
        <>
          {expr}
          <span className="m1-fz-op">=</span>
          <span className="m1-fz-slate">
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
      solved={solved}
      ready={answerReady}
      stars={stars}
      onCheck={onCheck}
      checkLabel={solved ? "Next stage ▸" : "Check"}
    />
  );

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  if (stage === "practice") {
    // PRACTICE — auto-generated MULT_EQUAL_GROUPS variations, paced by the mastery
    // engine (re-roll on correct, fade on a clean streak, transfer probe). The
    // board renders a single number input (integer product) and grades itself.
    body = <GenPracticeBoard skill="MULT_EQUAL_GROUPS" scaffold={sc} />;
  } else if (stage === 1) {
    // STAGE 1 · MANIPULATE — the plates ARE the problem. Tap pelmeni; fill a count box.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <div className="canvas m1-canvas">
            <div className="m1-board-head">Drag the <b>same {SIZE} plums</b> into every jar</div>
            <PlateGroup
              plates={plates}
              cap={SIZE}
              onAdd={addToPlate}
              onClear={clearPlate}
              flagUnequal={plateFlag}
              readOnly={solved}
              pile
            />
            <div className="m1-bowl-hint">
              <span className="m1-bowl-note">drag plums from the tray into a jar · right-click a jar to empty it</span>
            </div>
          </div>
        }
        rail={Rail("Equal Groups", `All ${GROUPS} jars get the SAME ${SIZE}. Extra plums spill back — every jar matches. Then count them all up.`)}
        answer={
          <AnswerBar
            eq={
              <>
                <span className="m1-fz-frac">{GROUPS} jars × {SIZE}</span>
                <span className="m1-fz-op">=</span>
                <span className="m1-countbox">
                  <input
                    className="m1-count-input"
                    inputMode="numeric"
                    value={tally}
                    onChange={(e) => setTally(onlyDigits(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") checkStage1(); }}
                    disabled={!allEqualFull || solved}
                    placeholder="?"
                    aria-label="how many plums in all"
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
  } else if (stage === 2) {
    // STAGE 2 · BIND — the child ASSEMBLES the repeated addition: tap each plate to
    // carry its "+ SIZE" into a running sum (4 → 4+4 → 4+4+4). A plate that's already
    // been bound shows a "+4" badge; the total slate unlocks once all are bound.
    const boundExpr = boundTerms > 0 ? Array(boundTerms).fill(SIZE).join(" + ") : "?";
    const checkBind = () => {
      if (solved) { nextStage(); return; }
      if (!allBound) { flashBad(); setStatus({ tone: "warn", text: `Tap each jar to add its + ${SIZE} first — bind all ${GROUPS} groups into the sum.` }); return; }
      checkProductStage();
    };
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <div className="canvas m1-canvas">
            <div className="m1-board-head">Tap each jar to add its <b>+ {SIZE}</b> to the sum</div>
            <PlateGroup
              plates={Array(GROUPS).fill(SIZE)}
              cap={SIZE}
              onAdd={bindNextGroup}
              readOnly={solved || allBound}
            />
            <div className="m1-addstrip">
              {boundTerms === 0 ? (
                <span className="m1-addstrip-hint">tap a jar to begin: {SIZE}…</span>
              ) : (
                <>
                  {Array(boundTerms).fill(SIZE).map((t, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="m1-addstrip-op">+</span>}
                      <span className="m1-addstrip-term">{t}</span>
                    </React.Fragment>
                  ))}
                  {!allBound && <span className="m1-addstrip-op">+ …</span>}
                  {allBound && <><span className="m1-addstrip-op">=</span><span className="m1-addstrip-blank">{solved ? PRODUCT : "?"}</span></>}
                </>
              )}
            </div>
          </div>
        }
        rail={Rail("Add the Group", `Tap all ${GROUPS} jars to build ${ADD_TERMS.join(" + ")} — that's adding the equal group again and again. Then write the total.`)}
        answer={writeCard(checkBind, <span className="m1-fz-frac">{boundExpr}</span>)}
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · WORKBENCH — BlockSandbox in NUMBER mode, a linear "N groups of M"
    // build. The child stacks SIZE-piece scoops until the row reaches the flag.
    // Wave-F: restructured onto the shared 4-zone <LessonBoard> per the wireframe
    // room-m1-4-workbench.js — rail = <RailInstruction> (the build instruction +
    // Read-aloud + lock card), stage = the BlockSandbox build area (stretching),
    // answer = the Build/Next control bar, tutor = corrective ribbon.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <BlockSandbox
            mode="number"
            bin={[SIZE, 5, 3]}
            targetValue={PRODUCT}
            targetLabel={`${GROUPS} groups of ${SIZE}`}
            solved={solved}
            onSolve={onSandboxSolve}
            onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: NODE } }); }}
            onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: NODE } }); }}
          />
        }
        rail={Rail("Workbench", `Build ${GROUPS} equal groups out of ${SIZE}-piece scoops, all the same size, until the row reaches the flag.`)}
        answer={
          <AnswerBar
            eq={<span className="m1-fz-frac">{GROUPS} × {SIZE}</span>}
            cap="stack equal scoops to the flag, then count it up"
            solved={solved}
            ready={!!wbBuilt && !solved}
            stars={stars}
            onCheck={checkWorkbench}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 4) {
    // STAGE 4 · NUMBERS — a bare 3 × 4 = ? card; write the product.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <div className="canvas m1-canvas m1-canvas-center">
            <div className="m1-bigeq">
              <span className="m1-bigeq-term">{GROUPS}</span>
              <span className="m1-bigeq-op">×</span>
              <span className="m1-bigeq-term">{SIZE}</span>
              <span className="m1-bigeq-op">=</span>
              <span className="m1-bigeq-q">{solved ? PRODUCT : "?"}</span>
            </div>
          </div>
        }
        rail={Rail("Write the Product", `${GROUPS} groups of ${SIZE}. Skip-count ${ADD_TERMS.map((_, i) => SIZE * (i + 1)).join(", ")}, or multiply.`)}
        answer={writeCard(checkProductStage, <span className="m1-fz-frac">{GROUPS} × {SIZE}</span>)}
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · APPLIED — Wave-F: restructured onto the shared 4-zone <LessonBoard>
    // per the wireframe room-m1-6-applied.js — rail = <RailInstruction> (the question
    // story + Read-aloud), stage = the REQUIRED count × size setup gate (the play
    // area), answer = the product Slate + Check, tutor = corrective ribbon. The
    // all-in-one WordProblem center card is gone; the story lives ONCE in the rail.
    const prob = WORD_BANK[0];
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <div className="wp-setup m1-applied-setup">
            <div className="wp-setup-lead">First, write it as count × size</div>
            <div className={"m1-setup-row" + (badInput && !setupOk ? " is-shake" : "")}>
              <Slate
                slots={[{ key: "count", label: "groups" }]}
                values={{ count: setupCount }}
                onChange={(k, v) => setSetupCount(onlyDigits(v))}
                onSubmit={checkSetup}
                layout="row"
                disabled={setupOk || solved}
                autoFocusKey={!setupOk ? "count" : undefined}
                ariaLabel="how many groups"
              />
              <span className="m1-setup-times">×</span>
              <Slate
                slots={[{ key: "size", label: "in each" }]}
                values={{ size: setupSize }}
                onChange={(k, v) => setSetupSize(onlyDigits(v))}
                onSubmit={checkSetup}
                layout="row"
                disabled={setupOk || solved}
                ariaLabel="how many in each group"
              />
              {setupOk
                ? <span className="m1-setup-ok">✓ that's the setup — now solve it</span>
                : <button type="button" className="wp-check" onClick={checkSetup}>Check the setup</button>}
            </div>
            <div className="wp-answer-lead">Now write the total</div>
          </div>
        }
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking}
            voxSpeaker="mom"
            heading="Babushka's kitchen"
            extra={LockCard}
          >
            {prob.prose}
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={
              <span className="m1-fz-slate">
                <Slate
                  slots={[{ key: "product", label: "total" }]}
                  values={{ product }}
                  onChange={(k, v) => setProduct(onlyDigits(v))}
                  onSubmit={checkApplied}
                  layout="row"
                  disabled={!setupOk || solved}
                  autoFocusKey={setupOk ? "product" : undefined}
                  ariaLabel="write the total"
                />
              </span>
            }
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkApplied}
            checkDisabled={!setupOk}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === "showwork") {
    // SHOW WORK — the mandatory free-form blank slate between Applied and Words.
    // Ungraded: the child must put ink down (showWorkInked) to unlock "Next".
    // Never judged/advanced by the engine — Next is a plain nextStage hop.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <ScratchSurface variant="required" slateKey={`showwork:${stage}`} onInkChange={setShowWorkInked} className="m1-sw-surface" style={{ width: "100%", height: 320 }} />
        }
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking}
            voxSpeaker="mom"
            heading="Show Your Work"
            extra={LockCard}
          >
            Before the last story problem — show how you'd count {GROUPS} groups of {SIZE} on a blank slate. Write anything you like; this one isn't graded.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={
              <span className="m1-fz-slate">
                <Slate
                  slots={[{ key: "product", label: "answer" }]}
                  values={{ product }}
                  onChange={(k, v) => setProduct(onlyDigits(v))}
                  layout="row"
                  ariaLabel="write your answer"
                />
              </span>
            }
            ready={showWorkInked}
            onCheck={() => nextStage()}
            checkDisabled={!showWorkInked}
            checkLabel="Next ▸"
          />
        }
        tutor={Tutor}
      />
    );
  } else {
    // STAGE 6 · WORDS — Wave-F: restructured onto the shared 4-zone <LessonBoard>
    // per the wireframe room-m1-7-words.js — rail = <RailInstruction> (the recipe
    // story + Read-aloud), stage = the optional ungraded "show your work" scratch
    // slate (stretching), answer = the product Slate + Check, tutor = corrective
    // ribbon. The all-in-one WordProblem center card is gone.
    const prob = WORD_BANK[1];
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={360}
        stage={
          <ScratchSurface slateKey="words-scratch" className="m1-words-scratch" style={{ width: "100%", height: 320 }} />
        }
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking}
            voxSpeaker="mom"
            heading="Babushka's Recipe"
            extra={LockCard}
          >
            {prob.prose}
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={
              <span className="m1-fz-slate">
                <Slate
                  slots={[{ key: "product", label: "total" }]}
                  values={{ product }}
                  onChange={(k, v) => setProduct(onlyDigits(v))}
                  onSubmit={checkWords}
                  layout="row"
                  disabled={solved}
                  autoFocusKey="product"
                  ariaLabel="write the total"
                />
              </span>
            }
            solved={solved}
            ready={answerReady}
            stars={stars}
            onCheck={checkWords}
            checkLabel={solved ? "Finish ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag={L.tag.replace(/^Lesson \d+ · /, "")}
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      tabs={{
        stages: STAGES.map((s) => ({ key: s.key, badge: s.badge, title: s.tab, sub: s.sub })),
        current: curKey,
        onSelect: (key) => goStage(toStageVal(key)),
      }}
    >
      {body}
    </LessonShell>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  if (n === "showwork") return `Show your work on a blank slate — count ${GROUPS} groups of ${SIZE} however you like, then move on.`;
  switch (n) {
    case 1: return `Three jars, the same four plums in each. Drag plums from the tray into every jar, then count them all up.`;
    case 2: return `All filled — now tap each jar to add its + ${SIZE} to the sum. Build ${Array(GROUPS).fill(SIZE).join(" + ")}, then write the total on the Slate.`;
    case 3: return `The Workbench — build ${GROUPS} equal groups of ${SIZE} from the bin, all the same size, then read the count.`;
    case 4: return `Just the numbers: ${GROUPS} × ${SIZE} = ? Write the product on the Slate.`;
    case 5: return `A question in words, with the numbers shown. Write it as count × size first (${GROUPS} × ${SIZE}), then give the total.`;
    case 6: return `A story this time — read it, find the groups and the size, and write how many in all.`;
    default: return "";
  }
}
