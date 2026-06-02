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
import PlateGroup, { BowlGroup } from "./components/PlateGroup.jsx";
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
  const startN = (() => {
    const b = initialBeat;
    const f = STAGES.find((s) => s.key === b || s.n === b || String(s.n) === String(b));
    return f ? f.n : 1;
  })();
  const [stage, setStage] = useState(startN);

  // --- Engine integration ---
  const { emit, judgeAndAdvance } = useLessonEngine({
    nodeId: NODE,
    lessonConfig: { lessonId: "m1", initialBeat: initialBeat != null ? String(initialBeat) : String(startN) },
  });

  // Track place/remove self-corrections for the current attempt.
  const selfCorrectionsRef = useRef(0);
  const presentEmittedRef = useRef(false);

  // --- Stage 1 (manipulate) state — N plates, each holding 0..SIZE pelmeni ---
  const [plates, setPlates] = useState(() => Array(GROUPS).fill(0));
  const [plateFlag, setPlateFlag] = useState(false);     // paint unequal plates red on a bad check
  const [tally, setTally] = useState("");                 // the count box (no Slate)

  // --- Stage 3 (fade) collapse state — the 4+4+4 line gathered toward 3 × 4 ---
  const [collapsed, setCollapsed] = useState(false);

  // --- Slate (write) value — a single whole-number product slot (layout="row") ---
  const [product, setProduct] = useState("");

  // --- Applied (6) setup gate: a single Slate row capturing count × size ---
  const [setupCount, setSetupCount] = useState("");
  const [setupSize, setSetupSize] = useState("");
  const [setupOk, setSetupOk] = useState(false);
  // --- Words (7) optional ungraded scratch (never gates) ---
  const [scratchCount, setScratchCount] = useState("");
  const [scratchSize, setScratchSize] = useState("");

  // --- shared outcome state ---
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState({ tone: "normal", text: STAGE_INTRO(1) });

  const { soundOn, speaking, say, stopVoice, toggleSound } = useVoice();
  const solvedRef = useRef(solved), stageRef = useRef(stage);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  // Emit problem_present for the initial stage on mount.
  useEffect(() => {
    if (!presentEmittedRef.current) {
      presentEmittedRef.current = true;
      emit({
        type: "problem_present",
        payload: { node_id: NODE, scaffold_level: toScaffoldLevel("m1", STAGES.find((s) => s.n === startN)?.key ?? "1-manipulate") },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop any narration when the lesson unmounts.
  useEffect(() => () => stopVoice(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function intro(n) { setStatus({ tone: "normal", text: STAGE_INTRO(n) }); }

  // ---- enter a stage cleanly (selector click OR auto-advance) ----
  function goStage(n) {
    stopVoice();
    setStage(n); stageRef.current = n;
    setSolved(false); solvedRef.current = false;
    setStars(0); setBadInput(false);
    setPlates(Array(GROUPS).fill(0)); setPlateFlag(false); setTally("");
    setCollapsed(false);
    setProduct("");
    setSetupCount(""); setSetupSize(""); setSetupOk(false);
    setScratchCount(""); setScratchSize("");
    setCook("idle");
    intro(n);
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    const key = STAGES.find((s) => s.n === n)?.key ?? "1-manipulate";
    emit({
      type: "problem_present",
      payload: { node_id: NODE, scaffold_level: toScaffoldLevel("m1", key) },
    });
  }

  function nextStage() {
    const n = Math.min(7, stageRef.current + 1);
    if (n === stageRef.current) {
      setStatus({ tone: "ok", text: "That's the whole arc — from filling plates to reading a story and writing the answer. Brilliant, povaryonok!" });
      return;
    }
    goStage(n);
  }

  // ---- engine integration helpers ------------------------------------------
  // FadeScaffold → advance; RaiseScaffold → back one stage; else advance-on-correct.
  function applyEngineDecision(dec, isCorrect) {
    if (!dec) return;
    if (dec.kind === "FadeScaffold") {
      nextStage();
    } else if (dec.kind === "RaiseScaffold") {
      const prev = Math.max(1, stageRef.current - 1);
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

  // ---- Stage 3 collapse: gather 4 + 4 + 4 toward 3 × 4 ----
  function collapse() {
    if (solved || collapsed) return;
    setCollapsed(true); setCook("idle");
    setStatus({ tone: "ok", text: `${[...Array(GROUPS)].map(() => SIZE).join(" + ")} is ${GROUPS} groups of ${SIZE} — that's ${GROUPS} × ${SIZE}. Now write the product.` });
    say("mr_mom_goal_1");
  }

  // ---- Stage 4 WORKBENCH — reuse BlockSandbox styling (linear N groups of M) ----
  // The sandbox builds a same-size row to a target; we target GROUPS groups by
  // having the child stack SIZE-denominator blocks (a clean "N groups of M" build).
  function onSandboxSolve() {
    if (solvedRef.current) return;
    setProduct(String(PRODUCT));
    award(`Yes! ${GROUPS} groups of ${SIZE} — built from equal groups and counted up. ${GROUPS} × ${SIZE} = ${PRODUCT}!`, "mr_mom_goal_1", [PRODUCT, 1]);
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

  // "Ready to check": the child has committed what this stage needs.
  const answerReady = !solved && (
    stage === 1 ? (allEqualFull && tally !== "")
    : stage === 3 ? (collapsed && product !== "")
    : stage === 6 ? (setupOk && product !== "")
    : (stage === 2 || stage === 5 || stage === 7) ? (product !== "")
    : false
  );

  // The repeated-addition strip terms (one per plate).
  const ADD_TERMS = Array(GROUPS).fill(SIZE);

  // ---- stage selector strip (reachability) ----
  const Selector = (
    <div className="m1-stages" role="tablist" aria-label="Lesson stages">
      {STAGES.map((s) => (
        <button
          key={s.n}
          role="tab"
          aria-selected={stage === s.n}
          className={"m1-stage-tab" + (stage === s.n ? " is-active" : "") + (stage > s.n ? " is-done" : "")}
          onClick={() => goStage(s.n)}
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
      <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("mr_mom_goal_1")}>
        <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
        Read aloud
      </button>
      <div className="goal-text" data-vox="mr_mom_goal_1" data-vox-speaker="mom">Babushka has <b>{GROUPS} plates</b>, and she wants the <b>same {SIZE} pelmeni</b> on every plate — add the group again and again, or multiply.</div>
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
            <div className="m1-board-head">Put the <b>same {SIZE}</b> on every plate</div>
            <PlateGroup
              plates={plates}
              cap={SIZE}
              onAdd={addToPlate}
              onClear={clearPlate}
              flagUnequal={plateFlag}
              readOnly={solved}
            />
            <div className="m1-bowl-hint">
              <span className="m1-bowl">🥟 bowl of pelmeni</span>
              <span className="m1-bowl-note">tap a plate to drop one on · right-click a plate to empty it</span>
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
    // STAGE 2 · BIND — filled plates stay; the repeated-addition strip fades in.
    body = (
      <div className="m1-fz">
        <div className="m1-fz-stage">
          <div className="canvas m1-canvas">
            <div className="m1-board-head">Each plate is one <b>+ {SIZE}</b></div>
            <PlateGroup plates={Array(GROUPS).fill(SIZE)} cap={SIZE} readOnly />
            <div className="m1-addstrip">
              {ADD_TERMS.map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="m1-addstrip-op">+</span>}
                  <span className="m1-addstrip-term">{t}</span>
                </React.Fragment>
              ))}
              <span className="m1-addstrip-op">=</span>
              <span className="m1-addstrip-blank">{solved ? PRODUCT : "?"}</span>
            </div>
          </div>
        </div>

        {Rail("Add the Group", `Three plates, ${SIZE} on each: ${ADD_TERMS.join(" + ")}. Write the total on the Slate.`)}

        <WriteCard
          onCheck={checkProductStage}
          expr={<span className="m1-fz-frac">{ADD_TERMS.join(" + ")}</span>}
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
          bin={[SIZE, 5, 3]}
          targetValue={GROUPS}
          targetLabel={`${GROUPS} groups of ${SIZE}`}
          rulerWholes={GROUPS}
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
  } else {
    // STAGE 7 · WORDS — prose only; optional ungraded scratch that never gates.
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
            setupLead="Optional — write it as count × size first"
            setup={
              <div className="m1-setup-row">
                <Slate
                  slots={[{ key: "count", label: "groups" }]}
                  values={{ count: scratchCount }}
                  onChange={(k, v) => setScratchCount(onlyDigits(v))}
                  layout="row"
                  disabled={solved}
                  ariaLabel="optional: how many groups"
                />
                <span className="m1-setup-times">×</span>
                <Slate
                  slots={[{ key: "size", label: "in each" }]}
                  values={{ size: scratchSize }}
                  onChange={(k, v) => setScratchSize(onlyDigits(v))}
                  layout="row"
                  disabled={solved}
                  ariaLabel="optional: how many in each group"
                />
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
      {Goal}
      {Selector}
      {body}
    </div>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  switch (n) {
    case 1: return `Three plates, the same four pelmeni on each. Tap pelmeni onto every plate, then count them all up.`;
    case 2: return `All filled — each plate is one + ${SIZE}. ${Array(GROUPS).fill(SIZE).join(" + ")} = ? Write the total on the Slate.`;
    case 3: return `The plates just confirm it now — let the numbers lead. Collapse ${Array(GROUPS).fill(SIZE).join(" + ")} into ${GROUPS} × ${SIZE}, then write the product.`;
    case 4: return `The Workbench — build ${GROUPS} equal groups of ${SIZE} from the bin, all the same size, then read the count.`;
    case 5: return `Just the numbers: ${GROUPS} × ${SIZE} = ? Write the product on the Slate.`;
    case 6: return `A question in words, with the numbers shown. Write it as count × size first (${GROUPS} × ${SIZE}), then give the total.`;
    case 7: return `A story this time — read it, find the groups and the size, and write how many in all.`;
    default: return "";
  }
}
