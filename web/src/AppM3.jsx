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
import React, { useState } from "react";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import BlockSandbox from "./components/BlockSandbox.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import SkipJar from "./components/SkipJar.jsx";
import SkipLine from "./components/SkipLine.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
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

  // --- shared controller backbone (engine wiring + stage nav + outcome state) ---
  // The hook owns everything identical across lessons; M3 supplies only its stage
  // model (advance/back/scaffold key), its intro copy, and its per-stage reset.
  // Map a stage value (number | "showwork") to its scaffold key string.
  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-manipulate";
  // Each numeric stage reports a FIXED surface form to the engine (the latency /
  // fluency channel the attempt counts toward). The hook computes this per stage,
  // so graders no longer thread surfaceForm by hand. ("showwork" is ungraded and
  // never reports — its mapping is never read.)
  const SURFACE_FORM = {
    1: "facts_visual", 2: "facts_guided", 3: "facts_partial", 4: "facts_guided",
    5: "facts_bare", 6: "facts_bare", 7: "facts_transfer",
  };
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award, flashBad,
    solved, solvedRef, stars, badInput, cook, setCook, status, setStatus,
    say, speaking, selfCorrectionsRef,
  } = useLessonScaffold({
    nodeId: NODE_ID,
    lessonId: "m3",
    initialStage: startN,
    // Linear advance, threading the string-keyed "showwork" step between 6 and 7.
    advance: (cur) => (cur === 6 ? "showwork" : cur === "showwork" ? 7 : Math.min(7, (typeof cur === "number" ? cur : 7) + 1)),
    // RaiseScaffold target — one numeric stage back (showwork is ungraded so it
    // never reports an attempt; guard the arithmetic anyway).
    back: (cur) => Math.max(1, (typeof cur === "number" ? cur : 6) - 1),
    scaffoldKeyFor: SCAFFOLD_KEY,
    surfaceFormFor: (key) => SURFACE_FORM[key] ?? ("stage-" + key),
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setScoops(0); setLineFills({}); setPromptIdx(0); setSlate({ product: "" });
      setSetupG({ product: "" }); setSetupS({ product: "" }); setSetupOk(false);
      setShowWorkInked(false); setSandboxBuilt(false);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole arc — from scooping the jar to knowing the fact by heart. Brilliant, povaryonok!" }),
  });

  // Selector clicks pass a STAGES `key` string; normalize to the stage VALUE
  // (a number, or "showwork") the render branches compare against.
  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? (d.key === "showwork" ? "showwork" : d.n) : key;
  };

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
  function gradeProduct(targetProduct, g, s) {
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
      reportAttempt({ correct: false, answerValue: [n, 1], errorSignature: sig, stars: 0 });
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
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE);
    if (!ok) return;
    award(`Yes! ${GROUPS} eights skip-counted up to ${PRODUCT}. ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_jar", [PRODUCT, 1]);
  }

  // ---- Stage 2 (bind) check ----
  function checkStage2() {
    if (solvedRef.current) { nextStage(); return; }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE);
    if (!ok) return;
    award(`Yes! The ribbon counts ${SEQUENCE.join(", ")} — ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_ribbon", [PRODUCT, 1]);
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
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE);
    if (!ok) return;
    award(`Yes! The line lands on ${PRODUCT}. ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_line", [PRODUCT, 1]);
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
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE);
    if (!ok) return;
    award(`Yes! ${GROUPS} groups of ${SIZE} — built and counted to ${PRODUCT}. ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_workbench", [PRODUCT, 1]);
  }

  // ---- Stage 5 · NUMBERS — bare fact + explicit ×1 / ×0 micro-prompts ----
  function checkStage5() {
    if (solvedRef.current) { nextStage(); return; }
    const prompt = FLUENCY_PROMPTS[promptIdx];
    const { ok } = gradeProduct(prompt.p, prompt.g, prompt.s);
    if (!ok) return;
    // Cleared this micro-prompt. Advance the cursor; if more remain, reset the Slate.
    if (promptIdx < FLUENCY_PROMPTS.length - 1) {
      setCook("idle");
      const next = promptIdx + 1;
      const np = FLUENCY_PROMPTS[next];
      // Report this micro-prompt as a correct attempt (fluency evidence) WITHOUT
      // advancing the stage — only the final prompt's award() drives stage flow.
      reportAttempt({ correct: true, answerValue: [prompt.p, 1], errorSignature: null, stars: 3 });
      setStatus({ tone: "ok", text: `${prompt.g} × ${prompt.s} = ${prompt.p}. Now: ${np.g} × ${np.s} = ?` });
      say(np.s === 0 ? "mr_mom_goal_timeszero" : np.s === 1 ? "mr_mom_goal_timesone" : "mr_mom_goal_bare");
      setSlate({ product: "" });
      setPromptIdx(next);
      selfCorrectionsRef.current = 0;
      // Re-anchor latency for the next micro-prompt.
      emit({ type: "problem_present", payload: { node_id: NODE_ID, scaffold_level: toScaffoldLevel("m3", "5-numbers") } });
      return;
    }
    award(`${prompt.g} × ${prompt.s} = ${prompt.p}. Times-zero is always zero, times-one keeps the number — you know them now.`, "mr_mom_goal_fluent", [prompt.p, 1]);
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
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE);
    if (!ok) return;
    award(`Yes! ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_applied", [PRODUCT, 1]);
  }

  // ---- Stage 7 · WORDS — prose only; optional ungraded scratch ----
  function checkStage7() {
    if (solvedRef.current) { nextStage(); return; }
    const { ok } = gradeProduct(PRODUCT, GROUPS, SIZE);
    if (!ok) return;
    award(`Yes! ${GROUPS} bundles of ${SIZE} — ${GROUPS} × ${SIZE} = ${PRODUCT}.`, "mr_mom_goal_words", [PRODUCT, 1]);
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

  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="mr_mom_goal" voxSpeaker="mom">
      Babushka has <b>{GROUPS}</b> jars and scoops <b>{SIZE}</b> mushrooms into each — skip-count to the total, then learn the fact by heart: <b>{GROUPS} × {SIZE}</b>.
    </LessonGoal>
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

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ---- shared answer bar (the equation row + Slate + Check) for the four-zone
  // write stages (1,2,3,4,5). Returns the <AnswerBar> node for LessonBoard's
  // `answer` slot; the caller supplies its own onCheck, Slate disabled state, and
  // caption. ----
  const writeBar = ({ fact, onCheck, disabled, cap }) => (
    <AnswerBar
      eq={
        <>
          <span className="m3-fz-fact">{fact}</span>
          <span className="m3-fz-op">=</span>
          <span className="m3-fz-slate">{ProductSlate({ onSubmit: onCheck, disabled })}</span>
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

  if (stage === 1) {
    // STAGE 1 · MANIPULATE — the SkipJar IS the problem. No writing but the count box.
    body = (
      <LessonBoard
        footHeight={158}
        railWidth={360}
        rowGap={10}
        marginTop={6}
        stage={
          <FitStage className="canvas m3-fz-canvas" id="m3canvas">
            <SkipJar groupSize={SIZE} groups={GROUPS} filled={scoops} onScoop={doScoop} />
          </FitStage>
        }
        rail={
          <HintRail heading="Count by Eights" hint={<>Each scoop drops a group of <b>{SIZE}</b> distinct cubes into the jar. Watch {GROUPS} groups of {SIZE} pile up — skip-count the running total: {SEQUENCE.slice(0, 3).join(", ")}…</>}>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{GROUPS} × {SIZE}</span>
              <div className="m3-factcard-note">{GROUPS} scoops<br />of {SIZE} each</div>
            </div>
          </HintRail>
        }
        answer={writeBar({
          fact: `${GROUPS} × ${SIZE}`,
          onCheck: checkStage1,
          disabled: scoops < GROUPS || solved,
          cap: solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : scoops >= GROUPS ? "read the tally — write the total" : "fill the jar to unlock the answer",
        })}
        tutor={Tutor}
      />
    );
  } else if (stage === 2) {
    // STAGE 2 · BIND — jar + printed skip-count ribbon (early terms shown) + equation.
    body = (
      <LessonBoard
        footHeight={158}
        railWidth={360}
        rowGap={10}
        marginTop={6}
        stage={
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
        }
        rail={
          <HintRail heading="Write the Product" hint={`The ribbon counts ${SEQUENCE.slice(0, -1).join(", ")}… one more ${SIZE} lands on the answer. Write the final number on the Slate.`}>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{GROUPS} × {SIZE} = ?</span>
              <div className="m3-factcard-note">count by {SIZE}</div>
            </div>
          </HintRail>
        }
        answer={writeBar({
          fact: `${GROUPS} × ${SIZE}`,
          onCheck: checkStage2,
          disabled: solved,
          cap: solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : "write the final number on the Slate, then Check",
        })}
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · FADE — the jar ghosts; the SkipLine leads with two blank interior terms.
    body = (
      <LessonBoard
        footHeight={158}
        railWidth={360}
        rowGap={10}
        marginTop={6}
        stage={
          <FitStage className="canvas m3-fz-canvas" id="m3canvas">
            <div className="m3-fade">
              <div className="m3-fade-jar"><SkipJar groupSize={SIZE} groups={GROUPS} filled={GROUPS} onScoop={() => {}} ghost /></div>
              <SkipLine sequence={SEQUENCE} blanks={FADE_BLANKS} values={lineFills} onFill={onLineFill} />
            </div>
          </FitStage>
        }
        rail={
          <HintRail heading="Fill the Line" hint={`The jar just confirms it now — let the number line lead. Two hops are missing; count on by ${SIZE} to fill them, then write the product.`}>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{GROUPS} × {SIZE} = ?</span>
              <div className="m3-factcard-note">hops of {SIZE}</div>
            </div>
          </HintRail>
        }
        answer={writeBar({
          fact: `${GROUPS} × ${SIZE}`,
          onCheck: checkStage3,
          disabled: solved,
          cap: solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : lineComplete ? "the line is full — write the product" : "fill the missing hops first",
        })}
        tutor={Tutor}
      />
    );
  } else if (stage === 4) {
    // STAGE 4 · WORKBENCH — shared <BlockSandbox> in NUMBER mode: build "7 groups of 8".
    // The bin offers whole-number group SIZES — the right size (8) plus two distractor
    // sizes (5, 6). The line spans 0→PRODUCT (56); dropping seven "8" blocks fills it.
    // The shared <BlockSandbox> is the working area; building 7 groups of 8 UNLOCKS
    // the bottom brown answer bar (same markup as every other M3 stage), where the
    // child WRITES the product 56 and presses Check to solve + advance.
    body = (
      <LessonBoard
        rail={null}
        footHeight={158}
        rowGap={10}
        marginTop={6}
        stageClassName="bare"
        stage={
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
        }
        answer={writeBar({
          fact: `${GROUPS} × ${SIZE}`,
          onCheck: checkStage4,
          disabled: !sandboxBuilt || solved,
          cap: solved ? `full marks — ${GROUPS} × ${SIZE} = ${PRODUCT}!` : sandboxBuilt ? "the groups are built — write the product, then Check" : "build the groups first",
        })}
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — the bare fact from recall, then explicit ×1 / ×0.
    const prompt = FLUENCY_PROMPTS[promptIdx];
    body = (
      <LessonBoard
        footHeight={158}
        railWidth={360}
        rowGap={10}
        marginTop={6}
        stage={
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
        }
        rail={
          <HintRail heading="Know It By Heart" hint={`The fluency target: answer from recall. After ${GROUPS} × ${SIZE}, two quick ones — times-one and times-zero.`}>
            <div className="m3-factcard">
              <span className="m3-factcard-eq">{prompt.g} × {prompt.s}</span>
              <div className="m3-factcard-note">{promptIdx + 1} of {FLUENCY_PROMPTS.length}</div>
            </div>
          </HintRail>
        }
        answer={writeBar({
          fact: `${prompt.g} × ${prompt.s}`,
          onCheck: checkStage5,
          disabled: solved,
          cap: solved ? "full marks — you know your times facts!" : "write the product from memory, then Check",
        })}
        tutor={Tutor}
      />
    );
  } else if (stage === 6) {
    // STAGE 6 · APPLIED — WordProblem (numerals shown) + required setup gate.
    const story = (
      <>Babushka fills <b>{GROUPS}</b> jars with mushrooms, <b>{SIZE}</b> in each jar — how many mushrooms in all?</>
    );
    body = (
      <LessonBoard
        variant="wide"
        className="m3-fz-words"
        tutorWidth={220}
        marginTop={6}
        content={
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
        }
        tutor={<TutorRibbon cook={cook} status={status} narrow />}
      />
    );
  } else if (stage === "showwork") {
    // SHOW WORK — the mandatory free-form blank slate between Applied and Words.
    // Ungraded: the child must put ink down (showWorkInked) to unlock "Next".
    // Never judged/advanced by the engine — Next is a plain goStage hop.
    body = (
      <LessonBoard
        variant="wide"
        className="m3-fz-words m3-showwork"
        tutorWidth={220}
        marginTop={6}
        content={
          <>
            <div className="panel m3-sw-panel">
              <h3>Show Your Work</h3>
              <div className="hint">Before the last story problem — show how you'd skip-count {GROUPS} × {SIZE} on a blank slate. Write anything you like; this one isn't graded.</div>
            </div>
            <div className="bs-surface m3-sw-surface">
              <BlankSlate
                key={`showwork:${stage}`}
                hint="show your work here — write anything you like ✎"
                onInkChange={setShowWorkInked}
                ariaLabel="show your work on a blank slate"
              />
            </div>
            <div className="lbar-marks m3-sw-marks">
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
    const story = (
      <>
        Grandpa ties up <b>seven bundles</b> of sausages for the winter, and slips{" "}
        <b>seven sausages</b> into every bundle. "I will guard them all," he says.{" "}
        How many sausages did he tie up in all?
      </>
    );
    body = (
      <LessonBoard
        variant="wide"
        className="m3-fz-words"
        tutorWidth={220}
        marginTop={6}
        content={
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
        }
        tutor={<TutorRibbon cook={cook} status={status} narrow />}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag="Times Facts"
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      tabs={{
        stages: STAGES.map((s) => ({ key: s.key, badge: s.n, title: s.tab, sub: s.sub })),
        current: curKey,
        onSelect: (key) => goStage(toStageVal(key)),
      }}
      band={stage !== 7 ? QBand : null}
      goal={Goal}
    >
      {body}
    </LessonShell>
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
