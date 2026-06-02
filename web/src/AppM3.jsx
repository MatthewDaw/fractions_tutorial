// AppM3.jsx — The Cook's Lesson (m3, MULT_FACTS): TIMES FACTS — skip-count to the
// answer, then know it by heart. The fluency layer: a prereq of r2 (cross-multiply)
// and r4 (simplify). The worked example threaded through every stage is 7 × 8 = 56.
//
// THE FULL 7-STAGE INTERACTION ARC (same scaffold-fade shape as AppR1): the
// manipulative (jar/scoop) channel shrinks to nothing while the written (Slate)
// channel grows from "read the tally" to "write the product from recall".
//
//   1 · Manipulate — SkipJar: drag the scoop into the jar N times; each handful
//        bumps a VISIBLE running tally (8,16,24…) — the anti-drift device. Read the
//        total into a plain count box. No writing.
//   2 · Bind       — jar + a printed skip-count ribbon (early terms shown) + the
//        equation 7 × 8 = __; the child writes the final product 56 on the Slate.
//   3 · Fade       — the jar dims to a ghost; a SkipLine number-line leads with two
//        interior terms blank; fill them, then write the product.
//   4 · Workbench  — the shared <BlockSandbox> styling: build "7 groups of 8" out
//        of same-size pieces and count to 56 (optional support rung).
//   5 · Numbers    — a BARE 7 × 8 = __ card; write the product from recall. Adds
//        explicit ×0 / ×1 micro-prompts (the fluency target).
//   6 · Applied    — a WordProblem (numerals shown) with a REQUIRED setup gate:
//        write groups × size first, then the product unlocks.
//   7 · Words      — a plain-language WORD PROBLEM; an OPTIONAL ungraded scratch;
//        extract groups & size unaided and write the product.
//
// Engine: v1 carries the product as [product, 1] (R-B5); the single Slate slot is
// graded by parseInt; multiplication misconceptions fingerprint as 'other' until
// the ErrorSignature union extension lands (O1). judgeAndAdvance fires ONLY at
// submit boundaries; applyEngineDecision maps FadeScaffold→advance /
// RaiseScaffold→back-one / else advance-on-correct.
//
// Reuses (read-only): Cook, Rosette, Slate (layout="row"), WordProblem,
// BlockSandbox, useVoice. New manipulatives: SkipJar, SkipLine. Voice keys
// (m3i_* intro, mr_* in-room) are added centrally in a later phase — say()
// degrades gracefully (stays silent) if a clip is absent, so a missing clip
// never crashes the room.
import React, { useState, useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import SkipJar from "./components/SkipJar.jsx";
import SkipLine from "./components/SkipLine.jsx";
import SettingsButton from "./SettingsButton.jsx";
import { useVoice } from "./voice.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/m3.css";

const NODE_ID = "MULT_FACTS";

// The single worked example threaded through every stage: 7 × 8 = 56.
const GROUPS = 7, SIZE = 8, PRODUCT = GROUPS * SIZE; // 7, 8, 56
// The full skip-count sequence for the SkipLine (8,16,…,56).
const SEQUENCE = Array.from({ length: GROUPS }, (_, i) => (i + 1) * SIZE);
// Two INTERIOR terms blanked in Fade (24 at idx 2, 40 at idx 4).
const FADE_BLANKS = [2, 4];

// The seven stages, in order. r1-style numeric-prefixed keys 1-manipulate … 7-words.
const STAGES = [
  { n: 1, key: "1-manipulate", tab: "Manipulate", sub: "scoop & read the jar" },
  { n: 2, key: "2-bind",       tab: "Bind",       sub: "jar + write 56" },
  { n: 3, key: "3-fade",       tab: "Fade",       sub: "fill the skip-line" },
  { n: 4, key: "4-workbench",  tab: "Workbench",  sub: "build 7 groups of 8" },
  { n: 5, key: "5-numbers",    tab: "Numbers",    sub: "bare 7 × 8 = ?" },
  { n: 6, key: "6-applied",    tab: "Applied",    sub: "write the setup, then total" },
  // String-keyed mandatory "show your work" step (between Applied and Words). A
  // non-numeric `n` keeps the numeric stages 1..7 from renumbering; the selector
  // and goStage route by `key`. scaffoldMap returns L3 for "showwork".
  { n: "sw", key: "showwork",  tab: "Show Work",  sub: "show your work" },
  { n: 7, key: "7-words",      tab: "Words",      sub: "story problem" },
];

// Numbers-stage micro fluency prompts: the bare fact, then explicit ×1 and ×0.
// Each is { g, s, p } with product p = g*s. The child clears them in order.
const FLUENCY_PROMPTS = [
  { g: GROUPS, s: SIZE, p: PRODUCT },   // 7 × 8 = 56  (the worked fact)
  { g: SIZE,   s: 1,    p: SIZE },      // 8 × 1 = 8   (×1 edge case)
  { g: SIZE,   s: 0,    p: 0 },         // 8 × 0 = 0   (×0 edge case)
];

// ---------------- main ----------------
export default function AppM3({ no, title, onBack, onRewatchIntro, initialBeat }) {
  // Which arc stage we're on (1..7). initialBeat lets the orchestrator deep-link
  // by stage key (e.g. "5-numbers") or by number — mirrors AppR1's initialStage.
  // `stage` holds either a numeric stage (1..7) OR the string key "showwork" for
  // the inserted mandatory step — so the numeric stages never renumber.
  const startN = (() => {
    const f = STAGES.find((s) => s.key === initialBeat || s.n === initialBeat || String(s.n) === String(initialBeat));
    // Normalize the inserted step to its canonical string value "showwork".
    return f ? (f.key === "showwork" ? "showwork" : f.n) : 1;
  })();
  const startKey = STAGES.find((s) => s.n === startN || s.key === startN).key;
  const [stage, setStage] = useState(startN);

  // --- Engine integration ---
  const { emit, judgeAndAdvance } = useLessonEngine({
    nodeId: NODE_ID,
    lessonConfig: { lessonId: "m3", initialBeat: startKey },
  });

  // Track place/remove self-corrections for the current attempt.
  const selfCorrectionsRef = useRef(0);
  const presentEmittedRef = useRef(false);

  // --- Stage 1 (manipulate) state: scoops poured into the jar ---
  const [scoops, setScoops] = useState(0);

  // --- Stage 3 (fade) skip-line fills (index → digit string) ---
  const [lineFills, setLineFills] = useState({});

  // --- Stage 5 (numbers) fluency-prompt cursor ---
  const [promptIdx, setPromptIdx] = useState(0);

  // --- Slate (the single whole-number product slot), shared by write stages ---
  const [slate, setSlate] = useState({ product: "" });

  // --- Applied setup gate (groups × size). The Words optional scratch is now a
  // standalone BlankSlate (ungraded, no state needed). ---
  const [setupG, setSetupG] = useState({ product: "" }); // count
  const [setupS, setSetupS] = useState({ product: "" }); // size
  const [setupOk, setSetupOk] = useState(false);

  // --- Show-work step gate: the child must put ink down before advancing ---
  const [showWorkInked, setShowWorkInked] = useState(false);

  // --- Stage 4 (workbench) "built the groups" gate. BlockSandbox's onSolve flips
  // this true (the line is built out of correct same-size groups), which UNLOCKS
  // the bottom answer bar; the SOLVE itself still comes from the WRITTEN product. ---
  const [sandboxBuilt, setSandboxBuilt] = useState(false);

  // --- shared outcome state ---
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState({ tone: "normal", text: STAGE_INTRO(startN) });

  const { speaking, say, stopVoice } = useVoice();
  const stageRef = useRef(stage), solvedRef = useRef(solved);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  // Emit problem_present for the initial stage on mount.
  useEffect(() => {
    if (!presentEmittedRef.current) {
      presentEmittedRef.current = true;
      emit({ type: "problem_present", payload: { node_id: NODE_ID, scaffold_level: toScaffoldLevel("m3", startKey) } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop any narration when the room unmounts.
  useEffect(() => () => stopVoice(), []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setScoops(0);
    setLineFills({});
    setPromptIdx(0);
    setSlate({ product: "" });
    setSetupG({ product: "" }); setSetupS({ product: "" }); setSetupOk(false);
    setShowWorkInked(false);
    setSandboxBuilt(false);
    setCook("idle");
    setStatus({ tone: "normal", text: STAGE_INTRO(n) });
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    const key = STAGES.find((s) => s.n === n || s.key === n).key;
    emit({ type: "problem_present", payload: { node_id: NODE_ID, scaffold_level: toScaffoldLevel("m3", key) } });
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
      setStatus({ tone: "ok", text: "That's the whole arc — from scooping the jar to knowing the fact by heart. Brilliant, povaryonok!" });
      return;
    }
    goStage(next);
  }

  // ---- engine integration helpers ------------------------------------------
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

  // Emit a judged attempt and apply the engine decision. v1 carries the product as
  // [product, 1]; every multiplication misconception fingerprints as 'other'.
  function reportAttempt({ correct, product, errorSignature, stars: starCount, surfaceForm }) {
    const value = product != null ? [product, 1] : null;
    const dec = judgeAndAdvance(
      { value, modality: "tap", recognizerConfidence: null },
      {
        correct,
        errorSignature: errorSignature ?? null,
        stars: starCount ?? 0,
        hintMaxRung: 0,
        selfCorrections: selfCorrectionsRef.current,
        surfaceForm: surfaceForm ?? ("stage-" + stageRef.current),
      }
    );
    selfCorrectionsRef.current = 0;
    return dec;
  }

  // ---- award + advance on a correct answer ----
  function award(line, voiceKey, product, surfaceForm) {
    setSolved(true); solvedRef.current = true; setStars(3); setCook("cheer");
    setStatus({ tone: "ok", text: line });
    if (voiceKey) say(voiceKey);
    const dec = reportAttempt({ correct: true, product, errorSignature: null, stars: 3, surfaceForm });
    applyEngineDecision(dec, true);
  }

  function flashBad() {
    setBadInput(true); setCook("think"); setTimeout(() => setBadInput(false), 460);
  }

  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 3);

  // Classify a wrong product into a (v1: 'other') misconception code. We still
  // pass the diagnostic so the upcoming union extension can route on it.
  function wrongSignature(n, g, s) {
    if (n === g + s) return "other";          // added the factors (g+s)
    if (s !== 0 && n % s === 0 && n / s !== g) return "other"; // skip-count drift
    return "other";
  }

  // ---- shared product grader (the single Slate slot) ----
  // Grades `slate.product` against the active prompt's product. Returns {ok}.
  function gradeProduct(targetProduct, g, s, surfaceForm) {
    const n = parseInt(slate.product, 10);
    if (!(slate.product !== "" && !isNaN(n))) {
      flashBad();
      setStatus({ tone: "warn", text: "Write the product — how many in all?" });
      say("mr_mom_nudge_write");
      return { ok: false };
    }
    if (n !== targetProduct) {
      flashBad();
      const sig = wrongSignature(n, g, s);
      const reachedSum = n === g + s;
      setStatus({ tone: "warn", text: reachedSum
        ? `Careful — that's ${g} plus ${s}. We want ${g} groups of ${s} — skip-count: ${SIZE_HINT(g, s)}`
        : `Not quite — count by ${s}: ${SIZE_HINT(g, s)} How many in all?` });
      say(reachedSum ? "mr_mom_nudge_addvsmult" : "mr_mom_nudge_skipcount");
      reportAttempt({ correct: false, product: n, errorSignature: sig, stars: 0, surfaceForm });
      return { ok: false };
    }
    return { ok: true };
  }

  // ---- Stage 1 mechanic: pour one scoop ----
  function doScoop() {
    if (solvedRef.current) return;
    setScoops((c) => {
      const next = Math.min(GROUPS, c + 1);
      if (next !== c) {
        setCook("idle");
        const tally = next * SIZE;
        setStatus({ tone: next >= GROUPS ? "ok" : "normal", text: next >= GROUPS
          ? `Full jar — ${GROUPS} groups of ${SIZE} cubes. Count them all: ${tally}. Write it in the box.`
          : `${next} group${next === 1 ? "" : "s"} of ${SIZE} in the jar — ${tally} cubes so far. Keep scooping.` });
        emit({ type: "place_block", payload: { node_id: NODE_ID } });
      }
      return next;
    });
  }

  // ---- Stage 1 check (numeric box; reads the running tally) ----
  function checkStage1() {
    if (solvedRef.current) { nextStage(); return; }
    if (scoops < GROUPS) {
      setCook("think");
      setStatus({ tone: "warn", text: `Fill the jar first — ${GROUPS} scoops of ${SIZE}.` });
      say("mr_mom_nudge_fill");
      return;
    }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE, "facts_visual");
    if (!ok) return;
    award(`Yes! ${GROUPS} eights skip-counted up to ${PRODUCT}. ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_jar", PRODUCT, "facts_visual");
  }

  // ---- Stage 2 (bind) check ----
  function checkStage2() {
    if (solvedRef.current) { nextStage(); return; }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE, "facts_guided");
    if (!ok) return;
    award(`Yes! The ribbon counts ${SEQUENCE.join(", ")} — ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_ribbon", PRODUCT, "facts_guided");
  }

  // ---- Stage 3 (fade) ----
  // A DROPPED chip is graded here: a correct number SNAPS into the slot and locks
  // (persisted into lineFills); a wrong number BOUNCES back (not persisted) and
  // fires the "not quite" nudge — so a wrong drop never leaves a wrong digit stuck
  // on the line. lineComplete reads only persisted correct values.
  function onLineFill(index, value) {
    if (solvedRef.current) return;
    const correct = parseInt(value, 10) === SEQUENCE[index];
    if (!correct) {
      selfCorrectionsRef.current += 1;
      setCook("think");
      setStatus({ tone: "warn", text: `Not that one — keep the rhythm. Count on by ${SIZE} from the term before.` });
      return; // bounce: don't persist a wrong fill
    }
    setLineFills((m) => ({ ...m, [index]: value }));
    setCook("idle");
    setStatus({ tone: "normal", text: "Good — that's the next hop. Fill the rest, then write the product." });
  }
  const lineComplete = FADE_BLANKS.every((i) => parseInt(lineFills[i], 10) === SEQUENCE[i]);
  function checkStage3() {
    if (solvedRef.current) { nextStage(); return; }
    if (!lineComplete) {
      setCook("think");
      setStatus({ tone: "warn", text: "Fill the missing hops on the line first — keep counting by " + SIZE + "." });
      say("mr_mom_nudge_skipline");
      return;
    }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE, "facts_partial");
    if (!ok) return;
    award(`Yes! The line lands on ${PRODUCT}. ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_line", PRODUCT, "facts_partial");
  }

  // ---- Stage 4 · WORKBENCH — shared <BlockSandbox> in NUMBER mode, "7 groups of 8" ----
  // In number mode the bin offers whole-number GROUP sizes (8 plus distractors) and
  // the line spans 0→PRODUCT (the total count). The sandbox fires onSolve({num,den})
  // with num = how many groups were dropped, den = the group SIZE; the PRODUCT is
  // num*den. Building the right groups only UNLOCKS the bottom answer bar (a support
  // rung, like "fill the missing hops first"); the child then WRITES the product 56
  // on the Slate and presses Check — the SOLVE comes from the written 56, not the build.
  function onSandboxSolve({ num, den }) {
    if (solvedRef.current) return;
    if (den !== SIZE) return;           // only groups of the right size count the build
    if (num * den !== PRODUCT) return;  // and only when the row reaches the full product
    setSandboxBuilt(true);
    setCook("idle");
    setStatus({ tone: "ok", text: `Built it — ${num} groups of ${den} reach ${PRODUCT}. Now write the product and Check.` });
  }

  // ---- Stage 4 check: the WRITTEN product (gated behind the built row) ----
  function checkStage4() {
    if (solvedRef.current) { nextStage(); return; }
    if (!sandboxBuilt) {
      setCook("think");
      setStatus({ tone: "warn", text: `Build the groups first — drop "${SIZE}" blocks onto the line until they reach ${PRODUCT}.` });
      say("mr_mom_nudge_fill");
      return;
    }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE, "facts_guided");
    if (!ok) return;
    award(`Yes! ${GROUPS} groups of ${SIZE} — built and counted to ${PRODUCT}. ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_workbench", PRODUCT, "facts_guided");
  }

  // ---- Stage 5 · NUMBERS — bare fact + explicit ×1 / ×0 micro-prompts ----
  function checkStage5() {
    if (solvedRef.current) { nextStage(); return; }
    const prompt = FLUENCY_PROMPTS[promptIdx];
    const { ok } = gradeProduct(prompt.p, prompt.g, prompt.s, "facts_bare");
    if (!ok) return;
    // Cleared this micro-prompt. Advance the cursor; if more remain, reset the Slate.
    if (promptIdx < FLUENCY_PROMPTS.length - 1) {
      setCook("idle");
      const next = promptIdx + 1;
      const np = FLUENCY_PROMPTS[next];
      // Report this micro-prompt as a correct attempt (fluency evidence) WITHOUT
      // advancing the stage — only the final prompt's award() drives stage flow.
      reportAttempt({ correct: true, product: prompt.p, errorSignature: null, stars: 3, surfaceForm: "facts_bare" });
      setStatus({ tone: "ok", text: `${prompt.g} × ${prompt.s} = ${prompt.p}. Now: ${np.g} × ${np.s} = ?` });
      say(np.s === 0 ? "mr_mom_goal_timeszero" : np.s === 1 ? "mr_mom_goal_timesone" : "mr_mom_goal_bare");
      setSlate({ product: "" });
      setPromptIdx(next);
      selfCorrectionsRef.current = 0;
      // Re-anchor latency for the next micro-prompt.
      emit({ type: "problem_present", payload: { node_id: NODE_ID, scaffold_level: toScaffoldLevel("m3", "5-numbers") } });
      return;
    }
    award(`${prompt.g} × ${prompt.s} = ${prompt.p}. Times-zero is always zero, times-one keeps the number — you know them now.`, "mr_mom_goal_fluent", prompt.p, "facts_bare");
  }

  // ---- Stage 6 · APPLIED — required word→math setup gate (groups × size) ----
  function checkSetup() {
    const g = parseInt(setupG.product, 10), s = parseInt(setupS.product, 10);
    if (!(setupG.product !== "" && !isNaN(g) && setupS.product !== "" && !isNaN(s))) {
      flashBad();
      setStatus({ tone: "warn", text: "Write both numbers from the question — how many groups, and how many in each." });
      return;
    }
    const exact = g === GROUPS && s === SIZE;
    const reversed = g === SIZE && s === GROUPS;
    if (!exact && !reversed) {
      flashBad();
      setStatus({ tone: "warn", text: `Not quite — copy the two numbers the question gives: ${GROUPS} groups of ${SIZE}.` });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: reversed
      ? `That's the same total either way — ${GROUPS} × ${SIZE} or ${SIZE} × ${GROUPS}. Now write the product.`
      : "That's the setup. Now write the product." });
  }
  function checkStage6() {
    if (solvedRef.current) { nextStage(); return; }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE, "facts_bare");
    if (!ok) return;
    award(`Yes! ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_applied", PRODUCT, "facts_bare");
  }

  // ---- Stage 7 · WORDS — prose only; optional ungraded scratch ----
  function checkStage7() {
    if (solvedRef.current) { nextStage(); return; }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE, "facts_transfer");
    if (!ok) return;
    award(`Yes! ${GROUPS} bundles of ${SIZE} — ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_words", PRODUCT, "facts_transfer");
  }

  function reset() { goStage(1); }

  // "Ready to check": the child has committed what the stage needs.
  const answerReady = !solved && (
    stage === 1 ? (scoops >= GROUPS && slate.product !== "")
    : stage === 3 ? (lineComplete && slate.product !== "")
    : stage === 4 ? (sandboxBuilt && slate.product !== "")
    : stage === 6 ? (setupOk && slate.product !== "")
    : (slate.product !== "")
  );

  // ---- stage selector strip (reachability: jump to any stage) ----
  // The current stage is matched by `key` so the string-keyed "showwork" step
  // selects/navigates correctly alongside the numeric stages.
  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;
  const curIdx = STAGES.findIndex((s) => s.key === curKey);
  const Selector = (
    <div className="m3-stages" role="tablist" aria-label="Lesson stages">
      {STAGES.map((s, i) => (
        <button
          key={s.key}
          role="tab"
          aria-selected={curKey === s.key}
          className={"m3-stage-tab" + (curKey === s.key ? " is-active" : "") + (curIdx > i ? " is-done" : "")}
          onClick={() => goStage(s.key)}
          title={s.sub}
        >
          <span className="m3-stage-n">{s.n}</span>
          <span className="m3-stage-txt">
            <span className="m3-stage-name">{s.tab}</span>
            <span className="m3-stage-sub">{s.sub}</span>
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
          <div className="puzzle-tag">Lesson {no} · Times Facts</div>
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
      <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("mr_mom_goal")}>
        <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
        Read aloud
      </button>
      <div className="goal-text" data-vox="mr_mom_goal" data-vox-speaker="mom">Babushka has <b>{GROUPS}</b> jars and scoops <b>{SIZE}</b> mushrooms into each — skip-count to the total, then learn the fact by heart: <b>{GROUPS} × {SIZE}</b>.</div>
    </div>
  );

  // ---- Per-stage body -------------------------------------------------------
  let body = null;

  const ProductSlate = ({ onSubmit, disabled }) => (
    <Slate
      slots={[{ key: "product", label: "product" }]}
      values={slate}
      onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
      onSubmit={onSubmit}
      layout="row"
      disabled={disabled}
      autoFocusKey="product"
      ariaLabel="write the product"
    />
  );

  // The shared QuestionBand mounts ONCE, directly under the stage-selector tabs
  // (see the return below). It shows THIS lesson's current bare fact with a red "?"
  // that becomes the solved product. The Numbers stage cycles its factors through
  // the ×1/×0 micro-prompts, so the band reads the active prompt there.
  const qbPrompt = stage === 5 ? FLUENCY_PROMPTS[promptIdx] : { g: GROUPS, s: SIZE, p: PRODUCT };
  const QBand = (
    <QuestionBand
      lead="the question"
      expr={<>{qbPrompt.g} <span className="qb-op">&times;</span> {qbPrompt.s}</>}
      answer={solved ? qbPrompt.p : "?"}
    />
  );

  const Tutor = (
    <div className="m3-fz-tutor">
      <div className="cook-stage"><Cook expr={cook} width={118} /></div>
      <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
    </div>
  );

  if (stage === 1) {
    // STAGE 1 · MANIPULATE — the SkipJar IS the problem. No writing but the count box.
    body = (
      <div className="m3-fz">
        <div className="m3-fz-stage">
          <FitStage className="canvas m3-fz-canvas" id="m3canvas">
            <SkipJar groupSize={SIZE} groups={GROUPS} filled={scoops} onScoop={doScoop} />
          </FitStage>
        </div>

        <div className="m3-fz-rail">
          <div className="panel">
            <h3>Count by Eights</h3>
            <div className="hint">Each scoop drops a group of <b>{SIZE}</b> distinct cubes into the jar. Watch {GROUPS} groups of {SIZE} pile up — skip-count the running total: {SEQUENCE.slice(0, 3).join(", ")}…</div>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{GROUPS} × {SIZE}</span>
              <div className="m3-factcard-note">{GROUPS} scoops<br />of {SIZE} each</div>
            </div>
          </div>
        </div>

        <div className="m3-fz-answer">
          <div className="m3-fz-eqrow">
            <span className="m3-fz-fact">{GROUPS} × {SIZE}</span>
            <span className="m3-fz-op">=</span>
            <span className="m3-fz-slate">{ProductSlate({ onSubmit: checkStage1, disabled: scoops < GROUPS || solved })}</span>
          </div>
          <div className="m3-fz-cap">{solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : scoops >= GROUPS ? "read the tally — write the total" : "fill the jar to unlock the answer"}</div>
          <div className="m3-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage1}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>
        {Tutor}
      </div>
    );
  } else if (stage === 2) {
    // STAGE 2 · BIND — jar + printed skip-count ribbon (early terms shown) + equation.
    body = (
      <div className="m3-fz">
        <div className="m3-fz-stage">
          <FitStage className="canvas m3-fz-canvas" id="m3canvas">
            <div className="m3-bind">
              <div className="m3-bind-jar"><SkipJar groupSize={SIZE} groups={GROUPS} filled={GROUPS} onScoop={() => {}} /></div>
              <div className="m3-ribbon" aria-label="skip-count ribbon">
                <span className="m3-ribbon-lead">count by {SIZE}s</span>
                {SEQUENCE.map((v, i) => (
                  <span
                    key={i}
                    className={"m3-ribbon-term" + (i === SEQUENCE.length - 1 ? " is-blank" : "")}
                    data-step={SIZE}
                  >
                    {i === SEQUENCE.length - 1 ? "?" : v}
                  </span>
                ))}
              </div>
            </div>
          </FitStage>
        </div>

        <div className="m3-fz-rail">
          <div className="panel">
            <h3>Write the Product</h3>
            <div className="hint">The ribbon counts {SEQUENCE.slice(0, -1).join(", ")}… one more {SIZE} lands on the answer. Write the final number on the Slate.</div>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{GROUPS} × {SIZE} = ?</span>
              <div className="m3-factcard-note">count by {SIZE}</div>
            </div>
          </div>
        </div>

        <div className="m3-fz-answer">
          <div className="m3-fz-eqrow">
            <span className="m3-fz-fact">{GROUPS} × {SIZE}</span>
            <span className="m3-fz-op">=</span>
            <span className="m3-fz-slate">{ProductSlate({ onSubmit: checkStage2, disabled: solved })}</span>
          </div>
          <div className="m3-fz-cap">{solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : "write the final number on the Slate, then Check"}</div>
          <div className="m3-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage2}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>
        {Tutor}
      </div>
    );
  } else if (stage === 3) {
    // STAGE 3 · FADE — the jar ghosts; the SkipLine leads with two blank interior terms.
    body = (
      <div className="m3-fz">
        <div className="m3-fz-stage">
          <FitStage className="canvas m3-fz-canvas" id="m3canvas">
            <div className="m3-fade">
              <div className="m3-fade-jar"><SkipJar groupSize={SIZE} groups={GROUPS} filled={GROUPS} onScoop={() => {}} ghost /></div>
              <SkipLine sequence={SEQUENCE} blanks={FADE_BLANKS} values={lineFills} onFill={onLineFill} />
            </div>
          </FitStage>
        </div>

        <div className="m3-fz-rail">
          <div className="panel">
            <h3>Fill the Line</h3>
            <div className="hint">The jar just confirms it now — let the number line lead. Two hops are missing; count on by {SIZE} to fill them, then write the product.</div>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{GROUPS} × {SIZE} = ?</span>
              <div className="m3-factcard-note">hops of {SIZE}</div>
            </div>
          </div>
        </div>

        <div className="m3-fz-answer">
          <div className="m3-fz-eqrow">
            <span className="m3-fz-fact">{GROUPS} × {SIZE}</span>
            <span className="m3-fz-op">=</span>
            <span className="m3-fz-slate">{ProductSlate({ onSubmit: checkStage3, disabled: solved })}</span>
          </div>
          <div className="m3-fz-cap">{solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : lineComplete ? "the line is full — write the product" : "fill the missing hops first"}</div>
          <div className="m3-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage3}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>
        {Tutor}
      </div>
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — shared <BlockSandbox> in NUMBER mode: build "7 groups of 8".
    // The bin offers whole-number group SIZES — the right size (8) plus two distractor
    // sizes (5, 6). The line spans 0→PRODUCT (56); dropping seven "8" blocks fills it.
    // The shared <BlockSandbox> is the working area; building 7 groups of 8 UNLOCKS
    // the bottom brown answer bar (same markup as every other M3 stage), where the
    // child WRITES the product 56 and presses Check to solve + advance.
    body = (
      <div className="m3-workbench">
        <div className="m3-workbench-area">
          <BlockSandbox
            mode="number"
            bin={[SIZE, 5, 6]}
            targetValue={PRODUCT}
            targetLabel={`${GROUPS} groups of ${SIZE}`}
            solved={solved}
            onSolve={onSandboxSolve}
            onPlace={() => { selfCorrectionsRef.current += 1; emit({ type: "place_block", payload: { node_id: NODE_ID } }); }}
            onRemove={() => { selfCorrectionsRef.current += 1; emit({ type: "remove_block", payload: { node_id: NODE_ID } }); }}
            title="Workbench"
            hint={`Build ${GROUPS} groups of ${SIZE} — drop "${SIZE}" blocks onto the line until they reach ${PRODUCT}, then write the product below.`}
          />
        </div>

        <div className="m3-fz-answer m3-workbench-answer">
          <div className="m3-fz-eqrow">
            <span className="m3-fz-fact">{GROUPS} × {SIZE}</span>
            <span className="m3-fz-op">=</span>
            <span className="m3-fz-slate">{ProductSlate({ onSubmit: checkStage4, disabled: !sandboxBuilt || solved })}</span>
          </div>
          <div className="m3-fz-cap">{solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : sandboxBuilt ? "the groups are built — write the product, then Check" : "build the groups first"}</div>
          <div className="m3-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage4}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>
        <div className="m3-workbench-tutor">{Tutor}</div>
      </div>
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — the bare fact from recall, then explicit ×1 / ×0.
    const prompt = FLUENCY_PROMPTS[promptIdx];
    body = (
      <div className="m3-fz">
        <div className="m3-fz-stage">
          <FitStage className="canvas m3-fz-canvas m3-fz-canvas-center" id="m3canvas">
            <div className="m3-bigeq">
              <span className="m3-bigeq-term">{prompt.g}</span>
              <span className="m3-bigeq-op">×</span>
              <span className="m3-bigeq-term">{prompt.s}</span>
              <span className="m3-bigeq-op">=</span>
              <span className="m3-bigeq-q">{solved ? prompt.p : "?"}</span>
            </div>
            <div className="m3-numbers-cap">
              {prompt.s === 0 ? "Times zero is always zero — nothing in any group."
                : prompt.s === 1 ? "Times one keeps the number — one in each group."
                : "From memory now — and skip-count by " + prompt.s + " if you need a way back."}
            </div>
            <div className="m3-prompt-dots" aria-hidden="true">
              {FLUENCY_PROMPTS.map((_, i) => (
                <span key={i} className={"m3-prompt-dot" + (i < promptIdx ? " is-done" : i === promptIdx ? " is-active" : "")} />
              ))}
            </div>
          </FitStage>
        </div>

        <div className="m3-fz-rail">
          <div className="panel">
            <h3>Know It By Heart</h3>
            <div className="hint">The fluency target: answer from recall. After {GROUPS} × {SIZE}, two quick ones — times-one and times-zero.</div>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{prompt.g} × {prompt.s}</span>
              <div className="m3-factcard-note">{promptIdx + 1} of {FLUENCY_PROMPTS.length}</div>
            </div>
          </div>
        </div>

        <div className="m3-fz-answer">
          <div className="m3-fz-eqrow">
            <span className="m3-fz-fact">{prompt.g} × {prompt.s}</span>
            <span className="m3-fz-op">=</span>
            <span className="m3-fz-slate">{ProductSlate({ onSubmit: checkStage5, disabled: solved })}</span>
          </div>
          <div className="m3-fz-cap">{solved ? "full marks — you know your times facts!" : "write the product from memory, then Check"}</div>
          <div className="m3-fz-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={checkStage5}>{solved ? "Next stage ▸" : "Check"}</button>
          </div>
        </div>
        {Tutor}
      </div>
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — WordProblem (numerals shown) + required setup gate.
    const story = (
      <>Babushka fills <b>{GROUPS}</b> jars with mushrooms, <b>{SIZE}</b> in each jar — how many mushrooms in all?</>
    );
    body = (
      <div className="m3-fz m3-fz-words">
        <div className="m3-fz-wp">
          <WordProblem
            story={story}
            tag="Babushka's kitchen"
            readAloud={() => say("mr_mom_goal_applied")}
            speaking={speaking}
            answerLead="Now write the product"
            setupLead="First, write it as groups × size"
            setup={
              <>
                <div className={"m3-setup-row" + (badInput && !setupOk ? " is-shake" : "")}>
                  <Slate slots={[{ key: "product", label: "groups" }]} values={setupG} onChange={(k, v) => setSetupG({ product: onlyDigits(v) })} onSubmit={checkSetup} layout="row" disabled={setupOk || solved} ariaLabel="how many groups" />
                  <span className="m3-setup-op">×</span>
                  <Slate slots={[{ key: "product", label: "size" }]} values={setupS} onChange={(k, v) => setSetupS({ product: onlyDigits(v) })} onSubmit={checkSetup} layout="row" disabled={setupOk || solved} ariaLabel="how many in each group" />
                </div>
                {setupOk
                  ? <span className="m3-setup-ok">✓ that's the setup — now solve it</span>
                  : <button type="button" className="wp-check" onClick={checkSetup}>Check the setup</button>}
              </>
            }
            slots={[{ key: "product", label: "product" }]}
            values={slate}
            onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
            layout="row"
            disabled={!setupOk || solved}
            autoFocusKey={setupOk ? "product" : undefined}
            onCheck={checkStage6}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={!setupOk}
          />
        </div>
        {Tutor}
      </div>
    );
  } else if (stage === "showwork") {
    // SHOW WORK — the mandatory free-form blank slate between Applied and Words.
    // Ungraded: the child must put ink down (showWorkInked) to unlock "Next".
    // Never judged/advanced by the engine — Next is a plain goStage hop.
    body = (
      <div className="m3-fz m3-fz-words">
        <div className="m3-fz-wp">
          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Show Your Work</h3>
            <div className="hint">Before the last story problem — show how you'd skip-count {GROUPS} × {SIZE} on a blank slate. Write anything you like; this one isn't graded.</div>
          </div>
          <div className="bs-surface" style={{ position: "relative", width: 800, height: 360 }}>
            <BlankSlate
              key={`showwork:${stage}`}
              hint="show your work here — write anything you like ✎"
              onInkChange={setShowWorkInked}
              ariaLabel="show your work on a blank slate"
            />
          </div>
          <div className="m3-fz-marks" style={{ marginTop: 12 }}>
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
    const story = (
      <>
        Grandpa ties up <b>seven bundles</b> of sausages for the winter, and slips{" "}
        <b>seven sausages</b> into every bundle. "I will guard them all," he says.{" "}
        How many sausages did he tie up in all?
      </>
    );
    body = (
      <div className="m3-fz m3-fz-words">
        <div className="m3-fz-wp">
          <WordProblem
            story={story}
            tag="Grandpa's Pantry"
            readAloud={() => say("mr_grandpa_bundles_1")}
            speaking={speaking}
            answerLead="Write how many in all"
            setupLead="Optional — show your work here"
            setup={
              <div className="bs-surface m3-words-scratch">
                <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
              </div>
            }
            slots={[{ key: "product", label: "product" }]}
            values={slate}
            onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
            layout="row"
            disabled={solved}
            autoFocusKey="product"
            onCheck={checkStage7}
            checkLabel={solved ? "Finish ▸" : "Check"}
          />
        </div>
        {Tutor}
      </div>
    );
  }

  return (
    <div className="page" data-vox-speaker="cook">
      <div className="foxing" />
      {TopBar}
      {Selector}
      {/* The bare-equation QuestionBand shows the math on every stage EXCEPT the
          final words-only stage (7), where the whole point is for the child to
          read the prose and extract the math themselves — showing the equation
          would give it away. (Applied (6) intentionally keeps numerals.) */}
      {stage !== 7 && QBand}
      {Goal}
      {body}
    </div>
  );
}

// A skip-count hint string for the active fact (e.g. "8, 16, 24, … 56").
function SIZE_HINT(g, s) {
  if (s === 0) return "every group has 0, so the total is 0.";
  if (g <= 0) return String(s);
  const seq = Array.from({ length: Math.min(g, 4) }, (_, i) => (i + 1) * s);
  return seq.join(", ") + (g > 4 ? `, … ${g * s}` : "");
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  if (n === "showwork") return `Show your work on a blank slate — skip-count ${GROUPS} × ${SIZE} however you like, then move on.`;
  switch (n) {
    case 1: return `Babushka scoops ${SIZE} mushrooms into each of ${GROUPS} jars. Drag the scoop into the jar and watch the tally count by ${SIZE}.`;
    case 2: return `The ribbon already counts ${SEQUENCE.slice(0, -1).join(", ")}… — one more ${SIZE} lands on the answer. Write the product.`;
    case 3: return `The jar just confirms it now — fill the missing hops on the line, then write ${GROUPS} × ${SIZE}.`;
    case 4: return `The Workbench — drop "${SIZE}" blocks onto the line until they reach ${PRODUCT}. That's ${GROUPS} groups of ${SIZE}: ${GROUPS} × ${SIZE} = ${PRODUCT}.`;
    case 5: return `Just the numbers: ${GROUPS} × ${SIZE} = ? Write it from memory — then a quick times-one and times-zero.`;
    case 6: return `A question in words. Write it as groups × size first, then give the product.`;
    case 7: return "A story this time — read it, find the groups and the size, and write how many in all.";
    default: return "";
  }
}
