// AppSimp.jsx — Lesson №9 "Simplify" (#/simp). The child learns to BUNDLE cells
// (÷) to reach the simplest name — the inverse of Equivalent Fractions. Same
// equal-area SQUARE visual as AppR4 (the shared EqBox); same engine node
// (SIMPLIFY); 7-stage arc that matches the wireframe's simp tab strip exactly.
//
// STAGES (wireframe order):
//   1 · identify   — MC chip: which fraction is shown? (8/12 pre-correct)
//   2 · bundle     — drag ÷2, go from 8/12 to 4/6 (one step only)
//   3 · lowest     — keep bundling until gcd=1 (reaches 2/3)
//   4 · bigbundle  — drag ÷4 (GCF), 8/12 → 2/3 in one move
//   5 · pick       — drag-to-place top & bottom; build the simplest name
//   6 · practice   — GenPracticeBoard (auto-generated SIMPLIFY)
//
// Wave-F re-skin: the bundle stages draw the shared EqBox (cols=3, rows shrink
// as cells merge) with an EqTools(÷k, divide) rack — a faithful match to the
// wireframe simp screens (room-simp-*.js use eqBox() + eqTools({divide:true})).
// `lessonId:"simp"` routes engine events to the right scaffold; `nodeId:"SIMPLIFY"`
// keeps mastery on the shared skill node. The fuse() engine logic is unchanged —
// only the visual markup moved onto the shared asset library.
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Rosette from "./components/Rosette.jsx";
import { LessonShell, LessonBoard, TutorRibbon, RailInstruction } from "./components/lesson";
import { EqBox, EqFrac, EqTools, BigFrac, DigitGrid, DigitSlot } from "./components/assets";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";

import "./styles/r4.css";   // shared .eq-stage / answer-row layout (eq.css family)
import "./styles/simp.css"; // simp-specific overrides

// ── geometry ─────────────────────────────────────────────────────────────────
// The simplify box mirrors the equivalence box: 3 columns, the left 2 columns
// shaded (8/12 → 2 of 3 columns). Bundling (÷k) MERGES rows, so `rows = den/3`
// shrinks (4 → 2 → 1) while the shaded columns (and red edge) stay put.
const COLS = 3;
const START_NUM = 8, START_DEN = 12;
const LOW_NUM = 2, LOW_DEN = 3;

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }

// How many of the 3 columns are inked for a given num/den (8/12→2, 4/6→2, 2/3→2).
const shadedCols = (n, d) => Math.round(n / (d / COLS));

// Stage ids in wireframe order.
const STAGE_IDS = ["identify", "bundle", "lowest", "bigbundle", "pick", "practice"];

// ── MC chip list for identify ────────────────────────────────────────────────
const IDENTIFY_CHOICES = ["8/12", "8/4", "4/8", "12/8"];
// (The pick stage no longer uses fixed MC lists — it uses the shared
// DigitGrid drag-to-place number picker, building any top/bottom from 0–9.)

export default function AppSimp({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {
  // ── bar state (bundle / lowest / bigbundle) ───────────────────────────────
  const [num, setNum] = useState(START_NUM);
  const [den, setDen] = useState(START_DEN);
  const [divs, setDivs] = useState([]);
  const [fuseTick, setFuseTick] = useState(0);
  const [bounceK, setBounceK] = useState(0);
  // True once the child has performed at least one bundle action this stage —
  // gates the answer-bar Check button (the grading is no longer auto-run).
  const [bundled, setBundled] = useState(false);


  // ── identify MC answer ────────────────────────────────────────────────────
  const [identPick, setIdentPick] = useState(null);

  // ── pick answer (top + bottom) — the shared drag-to-place number model ────
  // pickTop/pickBottom hold the committed slot values; `picked` is the armed
  // digit (chosen in the grid, not yet dropped). Same pattern as AppDen/AppNum:
  // tap a digit to arm it, then drag it onto a slot (or tap an armed slot).
  const [pickTop, setPickTop] = useState(null);
  const [pickBottom, setPickBottom] = useState(null);
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));
  // numerator accepts any digit; denominator refuses 0 (can't divide by zero).
  const numArmed = picked != null;
  const denArmed = picked != null && picked >= 1;
  const placeTop = (k) => { if (solvedRef.current) return; const v = k ?? picked; if (v == null) return; setPickTop(v); setPicked(null); };
  const placeBottom = (k) => { if (solvedRef.current) return; const v = k ?? picked; if (v == null || v < 1) return; setPickBottom(v); setPicked(null); };

  // ── drag state (bundle / lowest / bigbundle) ─────────────────────────────
  const [drag, setDrag] = useState(null);
  const [hotDrop, setHotDrop] = useState(false);
  const barDropRef = useRef(null);
  const suppressClickRef = useRef(false);
  useEffect(() => () => { setDrag(null); setHotDrop(false); }, []);

  // ── scaffold backbone ─────────────────────────────────────────────────────
  const sc = useLessonScaffold({
    nodeId: "SIMPLIFY",
    lessonId: "simp",
    initialStage: "identify",
    stagesOrder: STAGE_IDS,
    scaffoldKeyFor: (s) => s,
    generatedStages: ["practice"],
    generatorSkill: "SIMPLIFY",
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setNum(START_NUM); setDen(START_DEN); setDivs([]); setFuseTick(0); setBounceK(0);
      setBundled(false);
      setIdentPick(null);
      setPickTop(null); setPickBottom(null); setPicked(null);
    },
    stumpingRecipe,
    inKitchen: false,
    onEnd: (dec) => { if (dec?.kind === "ReturnToKitchen") onReturnToKitchen?.(); },
  });

  const {
    stage, goStage, nextStage,
    emit, reportAttempt, flashBad,
    solved, setSolved, solvedRef, stars, setStars, cook, setCook, status, setStatus,
    sayPhase, speaking, selfCorrectionsRef, stageRef,
  } = sc;

  // ── identity from registry ────────────────────────────────────────────────
  const ident = useLessonIdentity("simp");
  // Wireframe sizing: no per-room railW/footH declared → shell defaults
  // (railW 396, footH floored to 196 per the Wave-F contract §5).
  const RAIL_W = 396, FOOT_H = 196;
  const tabStages = ident.stages.map((s, i) => ({
    key: STAGE_IDS[i],
    badge: s.badge,
    title: s.title,
    sub: s.sub,
  }));

  // ── derived ───────────────────────────────────────────────────────────────
  const isFewest = gcd(num, den) === 1;
  const lastK = divs.length ? divs[divs.length - 1] : 0;

  function initialStatus(s) {
    switch (s) {
      case "identify":   return { tone: "normal", text: "Twelve cells, eight shaded — count them up and name the fraction. Which choice shows how many are shaded out of how many total?" };
      case "bundle":     return { tone: "normal", text: "Drag the ÷2 bundle tool onto the box. Every two cells merge into one — 12 becomes 6, 8 becomes 4. The red edge does not move: 8/12 and 4/6 are the same amount." };
      case "lowest":     return { tone: "normal", text: "Keep bundling until no group fits anymore. When nothing divides both top and bottom evenly, you're at the simplest name — the fewest possible pieces." };
      case "bigbundle":  return { tone: "normal", text: "One big bundle jumps straight to simplest. The biggest number that divides both 8 and 12 is 4 — drag ÷4 to reach 2/3 in a single move." };
      case "pick":       return { tone: "normal", text: "Pick the top and bottom that keep the same amount as 8/12 but use the fewest pieces. Reduce it as far as it will go." };
      default:           return { tone: "normal", text: "" };
    }
  }

  // ── bundle mechanic (bundle / lowest / bigbundle) ─────────────────────────
  // For "bundle" stage: only ÷2, expected to reach 4/6 (one step).
  // For "lowest" stage: ÷2 or ÷3, expected to reach lowest terms.
  // For "bigbundle" stage: only ÷4 (GCF), should reach lowest in one move.
  // fuse() ONLY records the bundled fraction now — it no longer grades. The
  // child manipulates the box freely, then presses Check (submitBundle) to be
  // graded. This keeps the explicit Check gate consistent with the MC stages.
  function fuse(k) {
    if (solvedRef.current) return;
    // Big Bundle (step 4): reach simplest in ONE move with the GREATEST common
    // factor. Any other tool is REJECTED on the first move — even one that divides
    // evenly (e.g. ÷2 on 8/12) — and the child is pushed toward the GCF. (The
    // bundle/lowest stages still accept any even divisor, one step at a time.)
    if (stageRef.current === "bigbundle" && divs.length === 0 && k !== gcd(num, den)) {
      const g = gcd(num, den);
      const even = num % k === 0 && den % k === 0;
      setBounceK(k); setCook("think");
      setTimeout(() => setBounceK(0), 460);
      setStatus({ tone: "warn", text: even
        ? `÷${k} would work, but Big Bundle reaches the simplest name in ONE move — use the BIGGEST factor. The greatest common factor of ${num} and ${den} is ${g}, so drag ÷${g}.`
        : `÷${k} doesn't come out even. The greatest common factor of ${num} and ${den} is ${g} — drag ÷${g} to bundle it all at once.` });
      return;
    }
    if (num % k === 0 && den % k === 0) {
      const nn = num / k, nd = den / k;
      setNum(nn); setDen(nd);
      setDivs((d) => [...d, k]);
      setFuseTick((t) => t + 1);
      setBundled(true);
      setCook("idle");
      selfCorrectionsRef.current += 1;
      emit({ type: "place_block", payload: { node_id: "SIMPLIFY", k } });
      setStatus({ tone: "normal", text: `Bundled by ÷${k} — ${nn}/${nd}. Keep bundling or press Check when you're ready.` });
    } else {
      setBounceK(k); setCook("think");
      setTimeout(() => setBounceK(0), 460);
      setStatus({ tone: "warn", text: `÷${k} doesn't come out even — ${num} and ${den} can't both split into ${k}s. Pick a number that divides both evenly.` });
    }
  }

  // ── undo a bundle (bundle / lowest / bigbundle) ───────────────────────────
  // Reverses the LAST ÷k by multiplying both top and bottom back by k and
  // popping it off the history. The cells un-merge (rows grow back) and the red
  // guide edge stays put — same amount, more pieces again. Once nothing is left
  // to undo, the answer-bar Check gate (bundled) closes again.
  function unfuse() {
    if (solvedRef.current) return;
    if (!divs.length) return;
    const k = divs[divs.length - 1];
    const nn = num * k, nd = den * k;
    setNum(nn); setDen(nd);
    setDivs((d) => d.slice(0, -1));
    setFuseTick((t) => t + 1);
    setBounceK(0);
    setCook("idle");
    setBundled(divs.length > 1);
    setStatus({ tone: "normal", text: `Undid ÷${k} — back to ${nn}/${nd}. Same red amount, more pieces. Bundle again or press Check when you're ready.` });
  }

  // ── bundle submit (bundle / lowest / bigbundle) ──────────────────────────
  // Grades the CURRENT bundled fraction on an explicit Check click.
  function submitBundle() {
    if (solvedRef.current) return;
    if (!bundled) {
      setCook("think");
      setStatus({ tone: "warn", text: "Bundle the cells first — drag a ÷ tool onto the box (or tap it)." });
      return;
    }
    const nn = num, nd = den;
    const isLowest = gcd(nn, nd) === 1;
    const lastDiv = divs.length ? divs[divs.length - 1] : 0;

    if (stageRef.current === "bundle") {
      // Bundle stage: ONE step of ÷2. Reach 4/6 → correct.
      if (nn === 4 && nd === 6) {
        setSolved(true); setStars(3); setCook("cheer");
        setStatus({ tone: "ok", text: "8/12 = 4/6 — the ÷2 bundle merged every two cells into one. Same red amount, fewer pieces. Next stage!" });
        reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
      } else {
        flashBad();
        setStatus({ tone: "warn", text: `Not 4/6 yet — ${nn}/${nd}. This stage wants a single ÷2 bundle: 8/12 → 4/6.` });
        reportAttempt({ correct: false, answerValue: [nn, nd], errorSignature: "wrong_bundle", stars: 0 });
      }
    } else if (stageRef.current === "lowest") {
      if (isLowest) {
        setSolved(true); setStars(3); setCook("cheer");
        setStatus({ tone: "ok", text: `Lowest terms! ${nn}/${nd} — no group divides both evenly anymore. That's the simplest name for the same amount. Next stage!` });
        reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
      } else {
        flashBad();
        setStatus({ tone: "warn", text: `Not lowest yet — ${nn}/${nd} still has a common factor. Keep bundling until no group fits, then Check.` });
        reportAttempt({ correct: false, answerValue: [nn, nd], errorSignature: "not_simplified", stars: 0 });
      }
    } else if (stageRef.current === "bigbundle") {
      if (isLowest && lastDiv === 4) {
        setSolved(true); setStars(3); setCook("cheer");
        setStatus({ tone: "ok", text: `One big bundle — ÷${lastDiv} took 8/12 straight to ${nn}/${nd}! That's the GCF shortcut: the biggest shared factor in a single move. Next stage!` });
        reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
      } else if (isLowest) {
        // Reached lowest terms, but not via the single ÷4 GCF move.
        setSolved(true); setStars(2); setCook("cheer");
        setStatus({ tone: "ok", text: `${nn}/${nd} is lowest terms — but the big bundle is one ÷4 move. Try ÷4 next time to jump straight there.` });
        reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: "not_one_move", stars: 2 });
      } else {
        flashBad();
        setStatus({ tone: "warn", text: `Not simplest yet — ${nn}/${nd}. For the big bundle, use ÷4 (the GCF) to divide BOTH 8 and 12 all the way down in one move.` });
        reportAttempt({ correct: false, answerValue: [nn, nd], errorSignature: "wrong_amount", stars: 0 });
      }
    }
  }

  // ── drag-to-place (same pattern as AppR4's knife drop) ───────────────────
  function overDrop(ev) {
    const r = barDropRef.current ? barDropRef.current.getBoundingClientRect() : null;
    if (!r) return false;
    const pad = 36;
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
           ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }
  function grabChip(e, k) {
    if (solvedRef.current) return;
    // Every ÷ tool is draggable — even ones that won't divide evenly. The child
    // can attempt any; on release fuse(k) applies it ONLY if it comes out even,
    // otherwise nothing changes (a gentle bounce + nudge). No grab-time blocking.
    if (e && e.preventDefault) e.preventDefault();
    if (!e || e.clientX == null) return;
    const startX = e.clientX, startY = e.clientY;
    let moved = false;
    setDrag({ x: startX, y: startY, k });
    const hover = (ev) => {
      if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) moved = true;
      setDrag({ x: ev.clientX, y: ev.clientY, k });
      setHotDrop(overDrop(ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", hover);
      window.removeEventListener("pointerup", up);
      setDrag(null); setHotDrop(false);
      if (moved) {
        suppressClickRef.current = true;
        if (overDrop(ev)) fuse(k);
      }
    };
    window.addEventListener("pointermove", hover);
    window.addEventListener("pointerup", up);
  }

  // ── identify submit ───────────────────────────────────────────────────────
  function submitIdentify() {
    if (!identPick) {
      setCook("think");
      setStatus({ tone: "warn", text: "Pick the fraction that names the shaded part." });
      return;
    }
    if (identPick === "8/12") {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: "8 out of 12 — that's 8/12. Lots of little pieces for this amount; next we'll bundle them down to the simplest name." });
      reportAttempt({ correct: true, answerValue: identPick, errorSignature: null, stars: 3 });
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: `${identPick} is not right — count the shaded cells (top) and the total cells (bottom). How many shaded? How many total?` });
      reportAttempt({ correct: false, answerValue: identPick, errorSignature: "wrong_fraction", stars: 0 });
    }
  }

  // ── pick submit ───────────────────────────────────────────────────────────
  function submitPick() {
    if (pickTop === null || pickBottom === null) {
      setCook("think");
      setStatus({ tone: "warn", text: "Choose both a top number and a bottom number." });
      return;
    }
    const tn = pickTop, td = pickBottom;
    const sameValue = tn * START_DEN === td * START_NUM;
    const fully = sameValue && gcd(tn, td) === 1;
    if (fully) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: `${tn}/${td} — same red amount as 8/12 and the fewest possible pieces. That's the simplest name! Next stage.` });
      reportAttempt({ correct: true, answerValue: [tn, td], errorSignature: null, stars: 3 });
    } else if (sameValue) {
      setCook("think");
      setStatus({ tone: "warn", text: `${tn}/${td} has the right amount — but it's not the simplest. Can you find a pair with even fewer pieces?` });
      reportAttempt({ correct: false, answerValue: [tn, td], errorSignature: "not_simplified", stars: 0 });
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: `${tn}/${td} doesn't equal 8/12. The red amount must stay the same — try different numbers.` });
      reportAttempt({ correct: false, answerValue: [tn, td], errorSignature: "wrong_amount", stars: 0 });
    }
  }

  function reset() { goStage(stageRef.current); }

  // Bundle stage only offers ÷2; lowest stage offers ÷2 and ÷3 (step-by-step);
  // bigbundle stage offers ÷2, ÷3, ÷4 (decoy included so ÷4 is the GCF pick).
  const FUSE_CHOICES =
    stage === "bundle"    ? [2] :
    stage === "lowest"    ? [2, 3] :
    stage === "bigbundle" ? [4] :
    [];

  // "Ready to check" per stage.
  const answerReady = !solved && (
    stage === "identify"  ? !!identPick :
    stage === "bundle" || stage === "lowest" || stage === "bigbundle" ? bundled :
    stage === "pick"   ? (pickTop !== null && pickBottom !== null) :
    false
  );

  // ── shared chrome ─────────────────────────────────────────────────────────
  // Wave-F: no goal banner, no QuestionBand. The instruction copy lives in
  // <RailInstruction> (the first rail card) per stage below. Tutor ribbon is
  // corrective-only. The Read-aloud pill speaks the stage's narration.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // The in-flight ÷k bundle tool following the cursor (drag ghost).
  const Ghost = drag && createPortal(
    <div
      className={"eq-tool eq-knife-ghost" + (hotDrop ? " is-hot" : "")}
      style={{ left: drag.x, top: drag.y, position: "fixed", transform: "translate(-50%,-50%)", zIndex: 9999, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <span className="eq-tool-x">÷{drag.k}</span>
      <span className="eq-tool-lab">bundle every {drag.k} cells</span>
    </div>,
    document.body
  );

  // ── per-stage body ────────────────────────────────────────────────────────
  let body = null;

  if (stage === "practice") {
    body = <GenPracticeBoard skill="SIMPLIFY" scaffold={sc} />;

  } else if (stage === "identify") {
    // Stage 1: MC chips — pick the fraction name. The box is the shared EqBox
    // (3 cols × 4 rows, 2 columns shaded → 8/12), matching room-simp.js.
    body = (
      <LessonBoard
        variant="split"
        footHeight={FOOT_H}
        railWidth={RAIL_W}
        rowGap={12}
        marginTop={8}
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking} voxSpeaker="cook"
            heading="Name the Shaded Part"
          >
            The box has <b>12</b> equal cells and <b>8</b> are shaded — count the top
            (shaded) and the bottom (total) to name the fraction.
          </RailInstruction>
        }
        stage={
          <div className="eq-stage simp-identify-canvas">
            <div className="eq-col">
              <span className="eq-lab">the box</span>
              <EqBox cols={COLS} rows={4} shaded={2} guide />
            </div>
            <div className="eq-col simp-id-choices">
              <span className="eq-lab">Which fraction?</span>
              <div className="den-choices simp-mc-row">
                {IDENTIFY_CHOICES.map((ch) => (
                  <button
                    key={ch}
                    className={"den-choice simp-mc-chip" + (identPick === ch ? " is-on" : "") + (solved && ch === "8/12" ? " is-correct" : "")}
                    disabled={solved}
                    onClick={() => { if (!solved) setIdentPick(ch); }}
                  >{ch}</button>
                ))}
              </div>
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <span className="simp-ans-prompt">shaded part:</span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
                  onClick={solved ? nextStage : submitIdentify}
                >{solved ? "Next →" : "Check"}</button>
              </div>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "pick") {
    // Stage 5: pick the simplest top and bottom from two independent MC lists.
    body = (
      <LessonBoard
        variant="split"
        footHeight={FOOT_H}
        railWidth={RAIL_W}
        rowGap={12}
        marginTop={8}
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking} voxSpeaker="cook"
            heading="Pick the Simplest Name"
          >
            The target is <b>8/12</b>. <b>Pick a number</b>, then <b>drop it</b> on
            the top or bottom to build a fraction with the <b>same red amount</b>
            but the <b>fewest pieces</b>. Reduce it as far as it will go.
          </RailInstruction>
        }
        stage={
          <div className="eq-stage simp-pick-canvas">
            <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={solved} />
            <div className="simp-pick-build">
              <div className="simp-pick-frac">
                <DigitSlot
                  className="simp-slot"
                  value={pickTop}
                  armed={numArmed && !solved}
                  disabled={solved}
                  onPlace={placeTop}
                  aria-label="top number — drop a number here"
                />
                <span className="simp-pick-bar" />
                <DigitSlot
                  className="simp-slot"
                  value={pickBottom}
                  armed={denArmed && !solved}
                  disabled={solved}
                  onPlace={placeBottom}
                  aria-label="bottom number — drop a number here"
                />
              </div>
              <div className="simp-pick-eq"><span>=</span></div>
              <div className="simp-pick-target">
                <span className="simp-pick-label">target</span>
                <BigFrac n={START_NUM} d={START_DEN} />
              </div>
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <span className="simp-ans-prompt">simplest name for 8/12:</span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
                  onClick={solved ? nextStage : submitPick}
                >{solved ? "Next →" : "Check"}</button>
              </div>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else {
    // bundle / lowest / bigbundle — the shared EqBox with a drag-to-place ÷k
    // bundle rack. Bundling MERGES cells: rows shrink (4 → 2 → 1) while the
    // shaded columns and the fixed red guide edge never move.
    const rows = den / COLS;
    const shaded = shadedCols(num, den);
    const railNode = (
      <RailInstruction
        say={sayPhase} speaking={speaking} voxSpeaker="cook"
        heading={
          stage === "bundle" ? "Bundle Every Two Cells" :
          stage === "lowest" ? "Keep Bundling" :
          "One Big Bundle"
        }
        extra={
          <>
            <EqTools
              sizes={FUSE_CHOICES}
              on={null}
              divide
              renderTool={(k) => {
                const even = num % k === 0 && den % k === 0;
                return (
                  <div
                    className={"eq-tool is-draggable" + (bounceK === k ? " bounce" : "") + (drag && drag.k === k ? " is-dragging" : "") + (solved ? " is-frozen" : "")}
                    style={{ touchAction: "none" }}
                    role="button"
                    tabIndex={solved ? -1 : 0}
                    onPointerDown={solved ? undefined : (e) => grabChip(e, k)}
                    onClick={solved ? undefined : (e) => {
                      if (suppressClickRef.current) { suppressClickRef.current = false; return; }
                      if (e.detail !== 0) return;
                      fuse(k);
                    }}
                    onKeyDown={solved ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fuse(k); } }}
                    title={`Drag onto the box to bundle cells by ${k}`}
                  >
                    <span className="eq-tool-x">÷{k}</span>
                    <span className="eq-tool-lab">{even ? `bundle every ${k} cells` : "won't come out even"}</span>
                  </div>
                );
              }}
            />
            <div className="eq-tool-hint">
              {isFewest ? "simplest name — nothing bundles anymore" : "drag a tool onto the box (or tap)"}
            </div>
            {divs.length > 0 && !solved && (
              <button type="button" className="eq-undo" onClick={unfuse}
                      title="Undo the last bundle">
                <span className="eq-undo-icon" aria-hidden="true">↺</span> undo bundle
              </button>
            )}
          </>
        }
      >
        {stage === "bundle" && <>Drag the <b>÷2</b> tool onto the box. Every two cells merge into one — 12 becomes 6, 8 becomes 4. The red edge does not move: <b>8/12 = 4/6</b>, the same amount with fewer pieces.</>}
        {stage === "lowest" && <>Bundle again and again until <b>no tool</b> divides both top and bottom evenly. When nothing fits, you're at the <b>simplest name</b>.</>}
        {stage === "bigbundle" && <>One big bundle jumps straight to simplest. Drag the <b>÷4</b> tool — the greatest common factor of 8 and 12 — to reach 2/3 in a single move.</>}
      </RailInstruction>
    );

    const canvas = (
      <div className="eq-stage simp-bundle-stage">
        <div className="eq-col">
          <span className="eq-lab">{isFewest ? "simplest name" : "bundle it down"}</span>
          <div
            ref={barDropRef}
            className={"eq-cut-target" + (drag ? "" : " is-cut") + (drag && hotDrop ? " is-hot" : "")}
          >
            <EqBox cols={COLS} rows={rows} shaded={shaded} guide />
          </div>
          <EqFrac n={num} d={den} />
        </div>
        <div className="eq-eq">{lastK > 0 ? `÷${lastK}` : "="}</div>
        <div className="eq-col">
          <span className="eq-lab">start — {START_NUM}/{START_DEN}</span>
          <EqBox cols={COLS} rows={4} shaded={2} guide />
          <EqFrac n={START_NUM} d={START_DEN} />
        </div>
      </div>
    );

    const answerNode = (
      <div className="lbar r4-s-answer">
        <div className="r4-s-eqrow">
          <span className="r4-s-frac"><BigFrac n={num} d={den} /></span>
          <span className="r4-s-eq">=</span>
          <span className="r4-s-frac"><BigFrac n={START_NUM} d={START_DEN} /></span>
          <span className="r4-s-amt">{lastK > 1 ? `same amount — top ÷${lastK}, bottom ÷${lastK}` : "same amount"}</span>
          <div className="r4-s-marks">
            {solved && <Rosette count={stars} />}
            <button
              className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
              onClick={solved ? nextStage : submitBundle}
              disabled={!solved && !answerReady}
            >{solved ? "Next →" : "Check"}</button>
          </div>
        </div>
      </div>
    );

    body = (
      <LessonBoard
        variant="split"
        footHeight={FOOT_H}
        railWidth={RAIL_W}
        rowGap={12}
        marginTop={8}
        rail={railNode}
        stage={canvas}
        answer={answerNode}
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={ident.no}
      tag={ident.tag.replace(/^Lesson\s+\d+\s*·\s*/, "")}
      title={title || ident.title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      resetTitle="Start this stage over"
      tabs={{
        stages: tabStages,
        current: stage,
        onSelect: goStage,
      }}
      extra={Ghost}
    >
      {body}
    </LessonShell>
  );
}
