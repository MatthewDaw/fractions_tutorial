// AppM1.jsx — Babushka's Lesson m1 (MULT_EQUAL_GROUPS): what multiplication
// MEANS. The worked example is 3 × 4 = 12 — three plates, four pelmeni on every
// plate, count by adding the group again and again, or multiply. Commutativity is
// DEFERRED to m2 (the plates are NEVER rotated); the equal-size-group invariant is
// ENFORCED (extra taps spill back; an unequal plate outlines red).
//
// THE FULL 7-STAGE INTERACTION ARC (mirrors AppR1's scaffold-fade arc):
//   1 · Manipulate — N empty plates + a bowl of identical pelmeni. Tap pelmeni
//        onto each plate until ALL N hold M; fill a plain count box. No Slate.
//   2 · Bind       — filled plates stay; a repeated-addition strip 4 + 4 + 4 fades
//        in beneath (one term per plate); write the total 12 on the Slate.
//   3 · Fade       — plates dim to ghost; the 4 + 4 + 4 line leads; a COLLAPSE
//        tap-button gathers the terms toward 3 × 4; write the product 12.
//   4 · Workbench  — a scoops-into-bowls bin (BowlGroup): build N bowls each
//        holding the same correct M; Build stays disabled until equal. (Optional.)
//   5 · Numbers    — a bare 3 × 4 = ? card; write the product 12 on the Slate.
//   6 · Applied    — a WordProblem (numerals shown) with a REQUIRED setup gate
//        (a single Slate row capturing count × size = 3 × 4); reversed order earns
//        a GENTLE nudge, not a reject (R-M4). Then write the total. Engine attempt
//        fires on the ANSWER.
//   7 · Words      — a plain-language WORD PROBLEM (prose only); an OPTIONAL
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
import React, { useState, useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import PlateGroup, { BowlGroup } from "./components/PlateGroup.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import SettingsButton from "./SettingsButton.jsx";
import { useVoice } from "./voice.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/m1.css";

// The single worked example threaded through every stage: 3 groups of 4 = 12.
const GROUPS = 3;          // N plates
const SIZE = 4;            // M pelmeni per plate
const PRODUCT = GROUPS * SIZE; // 12

// The seven stages, in order. `key` matches the orchestrator's stage ids
// (r1-style numeric-prefixed keys so scaffoldMap's parseStageN works).
const STAGES = [
  { n: 1, key: "1-manipulate", tab: "Manipulate", sub: "fill the plates" },
  { n: 2, key: "2-bind",       tab: "Bind",       sub: "4 + 4 + 4, write 12" },
  { n: 3, key: "3-fade",       tab: "Fade",       sub: "collapse to 3 × 4" },
  { n: 4, key: "4-workbench",  tab: "Workbench",  sub: "build it in bowls" },
  { n: 5, key: "5-numbers",    tab: "Numbers",    sub: "bare 3 × 4 = ?" },
  { n: 6, key: "6-applied",    tab: "Applied",    sub: "write the setup, then total" },
  // String-keyed mandatory "show your work" step (between Applied and Words). A
  // non-numeric `n` keeps the numeric stages 1..7 from renumbering; the selector
  // and goStage route by `key`. scaffoldMap returns L3 for "showwork".
  { n: "sw", key: "showwork",  tab: "Show Work",  sub: "show your work" },
  { n: 7, key: "7-words",      tab: "Words",      sub: "story problem" },
];

const NODE = "MULT_EQUAL_GROUPS";

// Word-problem bank (m1) — verbatim from the plan. Owner drives banter voice keys
// (mr_<owner>_<slug>_*; cat stays meow-only, Babushka carries the answer). The
// Applied stage (6) uses problem 0; the Words stage (7) uses problem 1.
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

export default function AppM1({ no, title, onBack, onRewatchIntro, initialBeat }) {
  // Find the starting stage from the beat key (consume initialBeat like AppR1).
  // `stage` holds either a numeric stage (1..7) OR the string key "showwork" for
  // the inserted mandatory step — so the numeric stages never renumber.
  const startN = (() => {
    const b = initialBeat;
    const f = STAGES.find((s) => s.key === b || s.n === b || String(s.n) === String(b));
    // Normalize the inserted step to its canonical string value "showwork".
    return f ? (f.key === "showwork" ? "showwork" : f.n) : 1;
  })();
  const startKey = STAGES.find((s) => s.n === startN || s.key === startN).key;
  const [stage, setStage] = useState(startN);

  // --- Engine integration ---
  const { emit, judgeAndAdvance } = useLessonEngine({
    nodeId: NODE,
    lessonConfig: { lessonId: "m1", initialBeat: startKey },
  });

  // Track place/remove self-corrections for the current attempt.
  const selfCorrectionsRef = useRef(0);
  const presentEmittedRef = useRef(false);

  // --- Stage 1 (manipulate) state — N plates, each holding 0..SIZE pelmeni ---
  const [plates, setPlates] = useState(() => Array(GROUPS).fill(0));
  const [plateFlag, setPlateFlag] = useState(false);     // paint unequal plates red on a bad check
  const [tally, setTally] = useState("");                 // the count box (no Slate)

  // --- Stage 2 (bind) — the child ASSEMBLES the repeated-addition strip by tapping
  // each plate to carry its "+ SIZE" into a running sum (0 → 4 → 4+4 → 4+4+4). The
  // total slate unlocks only once all GROUPS terms are bound. (Distinct from Fade,
  // which COLLAPSES that finished sum into 3 × 4 — Issue 6.)
  const [boundTerms, setBoundTerms] = useState(0);

  // --- Stage 3 (fade) collapse state — the 4+4+4 line gathered toward 3 × 4 ---
  const [collapsed, setCollapsed] = useState(false);

  // --- Slate (write) value — a single whole-number product slot (layout="row") ---
  const [product, setProduct] = useState("");

  // --- Applied (6) setup gate: a single Slate row capturing count × size ---
  const [setupCount, setSetupCount] = useState("");
  const [setupSize, setSetupSize] = useState("");
  const [setupOk, setSetupOk] = useState(false);
  // --- Words (7) optional scratch is now a standalone BlankSlate (ungraded, no
  // state needed). ---
  // --- Show-work step gate: the child must put ink down before advancing ---
  const [showWorkInked, setShowWorkInked] = useState(false);

  // --- shared outcome state ---
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState({ tone: "normal", text: STAGE_INTRO(1) });

  const { speaking, say, stopVoice } = useVoice();
  const solvedRef = useRef(solved), stageRef = useRef(stage);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  // Emit problem_present for the initial stage on mount.
  useEffect(() => {
    if (!presentEmittedRef.current) {
      presentEmittedRef.current = true;
      emit({
        type: "problem_present",
        payload: { node_id: NODE, scaffold_level: toScaffoldLevel("m1", startKey) },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop any narration when the lesson unmounts.
  useEffect(() => () => stopVoice(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function intro(n) { setStatus({ tone: "normal", text: STAGE_INTRO(n) }); }

  // ---- enter a stage cleanly (selector click OR auto-advance) ----
  // Accepts a numeric stage (1..7), the string key "showwork", OR any STAGES
  // `key` (selector clicks). Normalizes to the canonical stage value: a number
  // for the seven numeric stages, the string "showwork" for the inserted step.
  function goStage(arg) {
    const desc = STAGES.find((s) => s.n === arg || s.key === arg);
    const n = desc ? (desc.key === "showwork" ? "showwork" : desc.n) : arg;
    stopVoice();
    setStage(n); stageRef.current = n;
    setSolved(false); solvedRef.current = false;
    setStars(0); setBadInput(false);
    setPlates(Array(GROUPS).fill(0)); setPlateFlag(false); setTally("");
    setBoundTerms(0);
    setCollapsed(false);
    setProduct("");
    setSetupCount(""); setSetupSize(""); setSetupOk(false);
    setShowWorkInked(false);
    setCook("idle");
    intro(n);
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    const key = STAGES.find((s) => s.n === n || s.key === n)?.key ?? "1-manipulate";
    emit({
      type: "problem_present",
      payload: { node_id: NODE, scaffold_level: toScaffoldLevel("m1", key) },
    });
  }

  // Linear advance order, threading the string-keyed "showwork" step between
  // Applied (6) and Words (7). Routes by key so the numeric stages don't shift.
  function nextStage() {
    const cur = stageRef.current;
    let next;
    if (cur === 6) next = "showwork";
    else if (cur === "showwork") next = 7;
    else next = Math.min(7, (typeof cur === "number" ? cur : 7) + 1);
    if (next === cur) {
      setStatus({ tone: "ok", text: "That's the whole arc — from filling plates to reading a story and writing the answer. Brilliant, povaryonok!" });
      return;
    }
    goStage(next);
  }

  // ---- engine integration helpers ------------------------------------------
  // FadeScaffold → advance; RaiseScaffold → back one stage; else advance-on-correct.
  function applyEngineDecision(dec, isCorrect) {
    if (!dec) return;
    if (dec.kind === "FadeScaffold") {
      nextStage();
    } else if (dec.kind === "RaiseScaffold") {
      // "showwork" is ungraded and never reports an attempt, so RaiseScaffold can
      // only fire from a numeric stage; guard the arithmetic anyway.
      const cur = typeof stageRef.current === "number" ? stageRef.current : 6;
      const prev = Math.max(1, cur - 1);
      if (prev !== stageRef.current) goStage(prev);
    } else if (isCorrect) {
      nextStage();
    }
  }

  // Emit a judged attempt and apply the engine decision. answerValue is [product, 1].
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

  // ---- award + advance on a correct answer ----
  function award(line, voiceKeyOrText, answerValue) {
    setSolved(true); solvedRef.current = true; setStars(3); setCook("cheer");
    setStatus({ tone: "ok", text: line });
    if (voiceKeyOrText) say(voiceKeyOrText);
    const dec = reportAttempt({ correct: true, answerValue: answerValue ?? [PRODUCT, 1], errorSignature: null, stars: 3 });
    applyEngineDecision(dec, true);
  }

  function flashBad() {
    setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
  }

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
        setStatus({ tone: "warn", text: `That plate already has ${SIZE} — every plate gets the SAME ${SIZE}. The extra spills back.` });
        say("Every plate gets the same. The extra spills back.");
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
      setStatus({ tone: "warn", text: `Every plate needs the SAME ${SIZE} pelmeni — fill each of the ${GROUPS} plates to ${SIZE} first.` });
      say("Every plate needs the same. Fill each plate.");
      return;
    }
    if (!(tallyN > 0)) {
      flashBad();
      setStatus({ tone: "warn", text: "Write how many pelmeni in all — count every plate." });
      return;
    }
    if (tallyN !== PRODUCT) {
      flashBad();
      const addedFactors = tallyN === GROUPS + SIZE; // 3 + 4 = 7 — the classic "add the factors" slip
      setStatus({ tone: "warn", text: addedFactors
        ? `Careful — don't ADD the numbers. Count the groups: ${GROUPS} plates of ${SIZE}. ${SIZE} + ${SIZE} + ${SIZE} = ?`
        : `Not quite — count every pelmeni: ${GROUPS} plates, ${SIZE} on each.` });
      say(addedFactors ? "Don't add the numbers. Count the groups." : "Count every pelmeni.");
      reportAttempt({ correct: false, answerValue: [tallyN, 1], errorSignature: "other", stars: 0 });
      return;
    }
    award(`Yes! ${GROUPS} plates of ${SIZE} is ${SIZE} + ${SIZE} + ${SIZE} = ${PRODUCT}. Count the groups, not the numbers — now let's write it.`, "mr_mom_goal_1", [PRODUCT, 1]);
  }

  // ---- Slate product check (stages 2,3,5) ----
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
      say(addedFactors ? "That is adding the numbers. We want groups of." : "Not quite. Three groups of four.");
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
  // construction — Fade then collapses the finished sum into 3 × 4.)
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

  // ---- Stage 3 collapse: gather 4 + 4 + 4 toward 3 × 4 ----
  function collapse() {
    if (solved || collapsed) return;
    setCollapsed(true); setCook("idle");
    setStatus({ tone: "ok", text: `${[...Array(GROUPS)].map(() => SIZE).join(" + ")} is ${GROUPS} groups of ${SIZE} — that's ${GROUPS} × ${SIZE}. Now write the product.` });
    say("mr_mom_goal_1");
  }

  // ---- Stage 4 WORKBENCH — BlockSandbox in NUMBER mode (whole-number groups) ----
  // The child stacks equal "group" scoops (size SIZE) on a 0→PRODUCT count line
  // until the row reaches the flag at GROUPS groups. The sandbox only fires onSolve
  // for a SAME-SIZE row that hits the target count, reporting {num: #groups, den:
  // scoop size}; we read num*den as the product (= PRODUCT for an equal-group row).
  function onSandboxSolve({ num, den } = {}) {
    if (solvedRef.current) return;
    const total = (num != null && den != null) ? num * den : PRODUCT;
    setProduct(String(total));
    award(`Yes! ${num ?? GROUPS} groups of ${den ?? SIZE} — built from equal groups and counted up. ${num ?? GROUPS} × ${den ?? SIZE} = ${total}!`, "mr_mom_goal_1", [total, 1]);
  }

  // ---- Stage 6 APPLIED — the required count × size setup gate -----------------
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
    if (reversed) say("mr_mom_nudge_1");
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

  // ---- the BARE core question for this stage, shown big in the header center ----
  // Every stage surfaces the exact math the child must answer (an equation ending
  // in "= ?"), large and bold, so the question is the most readable thing on screen.
  // Word-problem stages reduce the prose to its bare equation.
  function questionFor(st) {
    if (st === 2) return { a: SIZE, op: "+", b: SIZE, c: SIZE };            // 4 + 4 + 4 = ?
    if (st === 6) { const p = WORD_BANK[0]; return { a: p.groups, op: "×", b: p.size }; }
    if (st === 7) { const p = WORD_BANK[1]; return { a: p.groups, op: "×", b: p.size }; }
    return { a: GROUPS, op: "×", b: SIZE };                                  // 3 × 4 = ?
  }
  // The shared full-width QuestionBand mounted directly under the stage tabs on
  // every stage EXCEPT the final WORDS-only story stage (7). Builds the bare
  // equation body (terms + red ops) from questionFor, with answer "?" until solved,
  // then the solved product. (Replaces the old in-topbar .m1-hdr-q header eq — the
  // question never overlaps the working area.)
  //
  // WHY NOT ON WORDS (stage 7): that stage's whole point is the child READS the
  // prose and extracts the math (count × size) themselves — surfacing the bare
  // 3 × 4 = ? band would give the answer away. So the band renders on every other
  // stage (including Applied, which intentionally shows numerals, and Show-Work)
  // but is suppressed on stage 7. `showBand` gates the mount below.
  const showBand = stage !== 7;
  const Band = (() => {
    const q = questionFor(stage);
    const answer = q.op === "+"
      ? (q.a + q.b + (q.c ?? 0))
      : (q.a * q.b);
    const expr = (
      <>
        {q.a}
        <span className="qb-op">{q.op}</span>
        {q.b}
        {q.c != null && <><span className="qb-op">{q.op}</span>{q.c}</>}
      </>
    );
    return <QuestionBand lead="the question" expr={expr} answer={solved ? answer : "?"} />;
  })();

  // "Ready to check": the child has committed what this stage needs.
  const answerReady = !solved && (
    stage === 1 ? (allEqualFull && tally !== "")
    : stage === 2 ? (allBound && product !== "")
    : stage === 3 ? (collapsed && product !== "")
    : stage === 6 ? (setupOk && product !== "")
    : (stage === 5 || stage === 7) ? (product !== "")
    : false
  );

  // The repeated-addition strip terms (one per plate).
  const ADD_TERMS = Array(GROUPS).fill(SIZE);

  // ---- stage selector strip (reachability: jump to any stage) ----
  // The current stage is matched by `key` so the string-keyed "showwork" step
  // selects/navigates correctly alongside the numeric stages.
  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;
  const curIdx = STAGES.findIndex((s) => s.key === curKey);
  const Selector = (
    <div className="m1-stages" role="tablist" aria-label="Lesson stages">
      {STAGES.map((s, i) => (
        <button
          key={s.key}
          role="tab"
          aria-selected={curKey === s.key}
          className={"m1-stage-tab" + (curKey === s.key ? " is-active" : "") + (curIdx > i ? " is-done" : "")}
          onClick={() => goStage(s.key)}
          title={s.sub}
        >
          <span className="m1-stage-n">{s.n}</span>
          <span className="m1-stage-txt">
            <span className="m1-stage-name">{s.tab}</span>
            <span className="m1-stage-sub">{s.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );

  const TopBar = (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="num-mark">№{no}</span>
        <div>
          <div className="puzzle-tag">Lesson {no} · Equal Groups</div>
          <div className="puzzle-title">{title}</div>
        </div>
      </div>
      <div aria-hidden="true" />
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
      <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("mr_mom_goal_1")}>
        <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
        Read aloud
      </button>
      <div className="goal-text m1-goal-text" data-vox="mr_mom_goal_1" data-vox-speaker="mom">Babushka has <b>{GROUPS} plates</b>, and she wants the <b>same {SIZE} pelmeni</b> on every plate — add the group again and again, or multiply.</div>
    </div>
  );

  // ---- shared write card (stages 2,5) — equation + Slate row + Check ----------
  function WriteCard({ onCheck, expr }) {
    return (
      <div className="m1-fz-answer">
        <div className="m1-fz-eqrow">
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
        </div>
        <div className="m1-fz-cap">{solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : "count the groups, write the total, then Check"}</div>
        <div className="m1-fz-marks">
          {solved && <Rosette count={stars} />}
          <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={onCheck}>{solved ? "Next stage ▸" : "Check"}</button>
        </div>
      </div>
    );
  }

  const Rail = (heading, hint) => (
    <div className="m1-fz-rail">
      <div className="panel">
        <h3>{heading}</h3>
        <div className="hint">{hint}</div>
        <div className="m1-lockcard">
          <span className="m1-lockcard-x">×</span>
          <div className="m1-lockcard-note">count the groups,<br />not the numbers</div>
        </div>
      </div>
    </div>
  );

  const Tutor = (
    <div className="m1-fz-tutor">
      <div className="cook-stage"><Cook expr={cook} width={118} /></div>
      <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
    </div>
  );

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  if (stage === 1) {
    // STAGE 1 · MANIPULATE — the plates ARE the problem. Tap pelmeni; fill a count box.
    body = (
      <div className="m1-fz">
        <div className="m1-fz-stage">
          <div className="canvas m1-canvas">
            <div className="m1-board-head">Drag the <b>same {SIZE}</b> onto every plate</div>
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
              <span className="m1-bowl-note">drag pelmeni from the pile onto a plate · right-click a plate to empty it</span>
            </div>
          </div>
        </div>

        {Rail("Equal Groups", `All ${GROUPS} plates get the SAME ${SIZE}. Extra pelmeni spill back — every plate matches. Then count them all up.`)}

        {/* count box (a plain numeric box, NOT a Slate) */}
        <div className="m1-fz-answer">
          <div className="m1-fz-eqrow">
            <span className="m1-fz-frac">{GROUPS} plates × {SIZE}</span>
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
                aria-label="how many pelmeni in all"
              />
            </span>
          </div>
          <div className="m1-fz-cap">{solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : allEqualFull ? "now count every pelmeni — write the total" : "fill every plate to unlock the count"}</div>
          <div className="m1-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage1}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>

        {Tutor}
      </div>
    );
  } else if (stage === 2) {
    // STAGE 2 · BIND — the child ASSEMBLES the repeated addition: tap each plate to
    // carry its "+ SIZE" into a running sum (4 → 4+4 → 4+4+4). A plate that's already
    // been bound shows a "+4" badge; the total slate unlocks once all are bound.
    const boundExpr = boundTerms > 0 ? Array(boundTerms).fill(SIZE).join(" + ") : "?";
    const checkBind = () => {
      if (solved) { nextStage(); return; }
      if (!allBound) { flashBad(); setStatus({ tone: "warn", text: `Tap each plate to add its + ${SIZE} first — bind all ${GROUPS} groups into the sum.` }); return; }
      checkProductStage();
    };
    body = (
      <div className="m1-fz">
        <div className="m1-fz-stage">
          <div className="canvas m1-canvas">
            <div className="m1-board-head">Tap each plate to add its <b>+ {SIZE}</b> to the sum</div>
            <PlateGroup
              plates={Array(GROUPS).fill(SIZE)}
              cap={SIZE}
              onAdd={bindNextGroup}
              readOnly={solved || allBound}
            />
            <div className="m1-addstrip">
              {boundTerms === 0 ? (
                <span className="m1-addstrip-hint">tap a plate to begin: {SIZE} …</span>
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
        </div>

        {Rail("Add the Group", `Tap all ${GROUPS} plates to build ${ADD_TERMS.join(" + ")} — that's adding the equal group again and again. Then write the total.`)}

        <WriteCard
          onCheck={checkBind}
          expr={<span className="m1-fz-frac">{boundExpr}</span>}
        />

        {Tutor}
      </div>
    );
  } else if (stage === 3) {
    // STAGE 3 · FADE — plates dim to ghost; the 4+4+4 line leads; collapse to 3 × 4.
    body = (
      <div className="m1-fz">
        <div className="m1-fz-stage">
          <div className="canvas m1-canvas m1-faded">
            <div className="m1-fadecheck" aria-hidden="true"><span className="m1-fadecheck-mark">✓</span> plates checked — let the numbers lead</div>
            <PlateGroup plates={Array(GROUPS).fill(SIZE)} cap={SIZE} ghost readOnly />
            <div className="m1-collapse-row">
              {!collapsed ? (
                <>
                  <span className="m1-addstrip-lead">{ADD_TERMS.join(" + ")}</span>
                  <button type="button" className="m1-collapse-btn" onClick={collapse} disabled={solved}>▸ collapse to {GROUPS} × {SIZE}</button>
                </>
              ) : (
                <span className="m1-times-lead">{GROUPS} × {SIZE} <span className="m1-times-eq">=</span> <span className="m1-times-blank">{solved ? PRODUCT : "?"}</span></span>
              )}
            </div>
          </div>
        </div>

        {Rail("Collapse to Times", `${ADD_TERMS.join(" + ")} is ${GROUPS} groups of ${SIZE} — that's ${GROUPS} × ${SIZE}. Collapse it, then write the product.`)}

        <WriteCard
          onCheck={checkProductStage}
          expr={<span className="m1-fz-frac">{collapsed ? `${GROUPS} × ${SIZE}` : ADD_TERMS.join(" + ")}</span>}
        />

        {Tutor}
      </div>
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — BlockSandbox styling, a linear "N groups of M" build.
    // The child stacks SIZE-denominator blocks until the row reaches GROUPS wholes
    // (= GROUPS groups of SIZE pieces). Distractor sizes 5 and 3 in the bin.
    body = (
      <>
        <BlockSandbox
          mode="number"
          bin={[SIZE, 5, 3]}
          targetValue={PRODUCT}
          targetLabel={`${GROUPS} groups of ${SIZE}`}
          solved={solved}
          onSolve={onSandboxSolve}
          onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: NODE } }); }}
          onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: NODE } }); }}
          title="Workbench"
          hint={`Build ${GROUPS} equal groups out of ${SIZE}-piece scoops, all the same size, until the row reaches the flag.`}
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
    // STAGE 5 · NUMBERS — a bare 3 × 4 = ? card; write the product.
    body = (
      <div className="m1-fz">
        <div className="m1-fz-stage">
          <div className="canvas m1-canvas m1-canvas-center">
            <div className="m1-bigeq">
              <span className="m1-bigeq-term">{GROUPS}</span>
              <span className="m1-bigeq-op">×</span>
              <span className="m1-bigeq-term">{SIZE}</span>
              <span className="m1-bigeq-op">=</span>
              <span className="m1-bigeq-q">{solved ? PRODUCT : "?"}</span>
            </div>
            <div className="m1-numbers-cap">No plates now — {GROUPS} groups of {SIZE}. Add {SIZE} three times, or multiply.</div>
          </div>
        </div>

        {Rail("Write the Product", `${GROUPS} groups of ${SIZE}. Skip-count ${ADD_TERMS.map((_, i) => SIZE * (i + 1)).join(", ")}, or multiply.`)}

        <WriteCard
          onCheck={checkProductStage}
          expr={<span className="m1-fz-frac">{GROUPS} × {SIZE}</span>}
        />

        {Tutor}
      </div>
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — WordProblem with a REQUIRED count × size setup gate.
    const prob = WORD_BANK[0];
    body = (
      <div className="m1-fz m1-fz-words">
        <div className="m1-fz-wp">
          <WordProblem
            story={prob.prose}
            tag="Babushka's kitchen"
            readAloud={() => say(prob.say)}
            speaking={speaking}
            answerLead="Now write the total"
            setupLead="First, write it as count × size"
            setup={
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
        </div>
        <div className="m1-fz-tutor">
          <div className="cook-stage"><Cook expr={cook} width={118} /></div>
          <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
        </div>
      </div>
    );
  } else if (stage === "showwork") {
    // SHOW WORK — the mandatory free-form blank slate between Applied and Words.
    // Ungraded: the child must put ink down (showWorkInked) to unlock "Next".
    // Never judged/advanced by the engine — Next is a plain nextStage hop.
    body = (
      <div className="m1-fz m1-fz-words">
        <div className="m1-fz-wp">
          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Show Your Work</h3>
            <div className="hint">Before the last story problem — show how you'd count {GROUPS} groups of {SIZE} on a blank slate. Write anything you like; this one isn't graded.</div>
          </div>
          <div className="bs-surface" style={{ position: "relative", width: 800, height: 360 }}>
            <BlankSlate
              key={`showwork:${stage}`}
              hint="show your work here — write anything you like ✎"
              onInkChange={setShowWorkInked}
              ariaLabel="show your work on a blank slate"
            />
          </div>
          <div className="m1-fz-marks" style={{ marginTop: 12 }}>
            <button
              className={"check" + (showWorkInked ? " ready" : "")}
              disabled={!showWorkInked}
              onClick={() => nextStage()}
            >Next ▸</button>
          </div>
        </div>
        {Tutor}
      </div>
    );
  } else {
    // STAGE 7 · WORDS — prose only; optional ungraded blank-slate scratch.
    const prob = WORD_BANK[1];
    body = (
      <div className="m1-fz m1-fz-words">
        <div className="m1-fz-wp">
          <WordProblem
            story={prob.prose}
            tag="Babushka's Recipe"
            readAloud={() => say(prob.say)}
            speaking={speaking}
            answerLead="Write how many in all"
            setupLead="Optional — show your work here"
            setup={
              <div className="bs-surface m1-words-scratch" style={{ position: "relative" }}>
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
        </div>
        <div className="m1-fz-tutor">
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
      {showBand && Band}
      {Goal}
      {body}
    </div>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  if (n === "showwork") return `Show your work on a blank slate — count ${GROUPS} groups of ${SIZE} however you like, then move on.`;
  switch (n) {
    case 1: return `Three plates, the same four pelmeni on each. Drag pelmeni from the pile onto every plate, then count them all up.`;
    case 2: return `All filled — now tap each plate to add its + ${SIZE} to the sum. Build ${Array(GROUPS).fill(SIZE).join(" + ")}, then write the total on the Slate.`;
    case 3: return `The plates just confirm it now — let the numbers lead. Collapse ${Array(GROUPS).fill(SIZE).join(" + ")} into ${GROUPS} × ${SIZE}, then write the product.`;
    case 4: return `The Workbench — build ${GROUPS} equal groups of ${SIZE} from the bin, all the same size, then read the count.`;
    case 5: return `Just the numbers: ${GROUPS} × ${SIZE} = ? Write the product on the Slate.`;
    case 6: return `A question in words, with the numbers shown. Write it as count × size first (${GROUPS} × ${SIZE}), then give the total.`;
    case 7: return `A story this time — read it, find the groups and the size, and write how many in all.`;
    default: return "";
  }
}
