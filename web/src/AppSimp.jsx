// AppSimp.jsx — Lesson №9 "Simplify" (#/simp). The child learns to BUNDLE cells
// (÷) to reach the simplest name — the inverse of Equivalent Fractions. Same
// GroupBar visual as AppR4; same engine node (SIMPLIFY); fresh 7-stage arc that
// matches the wireframe's simp tab strip exactly.
//
// STAGES (wireframe order):
//   1 · identify   — MC chip: which fraction is shown? (8/12 pre-correct)
//   2 · bundle     — drag ÷2, go from 8/12 to 4/6 (one step only)
//   3 · lowest     — keep bundling until gcd=1 (reaches 2/3)
//   4 · bigbundle  — drag ÷4 (GCF), 8/12 → 2/3 in one move
//   5 · pick       — MC chips: pick simplest top then bottom from lists
//   6 · numbers    — bare Slate: write 8/12 in lowest terms
//   7 · practice   — GenPracticeBoard (auto-generated SIMPLIFY)
//
// The GroupBar + drag mechanic are lifted verbatim from AppR4 — bundling is
// fuseing in reverse. `lessonId:"simp"` routes engine events to the right
// scaffold; `nodeId:"SIMPLIFY"` keeps mastery on the shared skill node.
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Slate from "./components/Slate.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import { LessonShell, LessonBoard, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";
import { LESSONS } from "./lessons/index.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";

import "./styles/r4.css";   // GroupBar + shared grouping styles already exist
import "./styles/simp.css"; // simp-specific overrides

// ── geometry (mirrors AppR4) ────────────────────────────────────────────────
const ORIGIN = 90, SPAN = 660, LINE_Y = 198, BAR_Y = 64;
const START_NUM = 8, START_DEN = 12;
const VALUE = START_NUM / START_DEN;
const LOW_NUM = 2, LOW_DEN = 3;

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

// Stage ids in wireframe order.
const STAGE_IDS = ["identify", "bundle", "lowest", "bigbundle", "pick", "numbers", "practice"];

// ── DivChips: the ÷K chips stacked beside the fraction (same as r4) ─────────
function DivChips({ divs }) {
  if (!divs.length) return null;
  return (
    <div className="r4-divrow">
      {divs.map((k, i) => (
        <span key={i} className={"r4-divchip" + (i === divs.length - 1 ? " pop" : "")}>÷{k}</span>
      ))}
    </div>
  );
}

// ── GroupBar: identical to AppR4's GroupBar ──────────────────────────────────
function GroupBar({ num, den, unit, animKey, dim, lastK }) {
  const cellW = unit / den;
  const fill = denomColor(den);
  const cut = denomTone(den, 0.55);
  const labColor = denomTextColor(den);
  const hatch = denomHatch(den), hatchSize = denomHatchSize(den);
  const edgeX = num * cellW;
  const labSize = cellW < 40 ? 11 : cellW < 58 ? 13 : 15;
  return (
    <div className={"r4-groupbar" + (animKey ? " r4-fuse-anim" : "") + (dim ? " is-ghost" : "")}>
      <div className="r4-gb-track" style={{ width: unit }}>
        {Array.from({ length: den }).map((_, i) => {
          const filled = i < num;
          return (
            <div
              key={i}
              className={"r4-gb-cell " + (filled ? "is-filled" : "is-empty")}
              style={{
                width: cellW,
                background: filled ? fill : "transparent",
                borderRight: i < den - 1 ? `1.5px solid ${cut}` : "none",
              }}
            >
              {filled && <div className="piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />}
              <span className="r4-gb-cut" />
              <span className="piece-lab" style={{ color: filled ? labColor : cut, fontSize: labSize }}>1/{den}</span>
            </div>
          );
        })}
        <span className="r4-gb-filledge" style={{ left: edgeX }}>
          <span className="r4-gb-edgecap">same amount</span>
        </span>
        <span className="r4-gb-counttag" style={{ left: edgeX / 2 }}>{num} of {den}</span>
      </div>
      {lastK > 1 && (
        <div className="r4-gb-divrow">
          <span className="r4-gb-div">÷{lastK}</span>
          <span className="r4-gb-div">÷{lastK}</span>
          <span className="r4-gb-divone">÷{lastK}/{lastK} = ÷1</span>
        </div>
      )}
    </div>
  );
}

// ── MC chip lists for identify + pick ───────────────────────────────────────
const IDENTIFY_CHOICES = ["8/12", "8/4", "4/8", "12/8"];
// Pick stage: the child selects from a short list of equivalent / wrong pairs.
const PICK_TOP_CHOICES    = [2, 4, 8, 3];   // 2 is correct; 4 = 4/6; 8 = 8/12; 3 wrong
const PICK_BOTTOM_CHOICES = [3, 6, 12, 4];  // 3 is correct; 6 = 4/6; 12 = 8/12; 4 wrong

export default function AppSimp({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {
  // ── bar state (bundle / lowest / bigbundle) ───────────────────────────────
  const [num, setNum] = useState(START_NUM);
  const [den, setDen] = useState(START_DEN);
  const [divs, setDivs] = useState([]);
  const [fuseTick, setFuseTick] = useState(0);
  const [bounceK, setBounceK] = useState(0);

  // ── slate answer (numbers stage) ─────────────────────────────────────────
  const [slate, setSlate] = useState({ n: "", d: "" });

  // ── identify MC answer ────────────────────────────────────────────────────
  const [identPick, setIdentPick] = useState(null);

  // ── pick MC answer (top + bottom) ────────────────────────────────────────
  const [pickTop, setPickTop] = useState(null);
  const [pickBottom, setPickBottom] = useState(null);

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
      setSlate({ n: "", d: "" });
      setIdentPick(null);
      setPickTop(null); setPickBottom(null);
    },
    stumpingRecipe,
    inKitchen: false,
    onEnd: (dec) => { if (dec?.kind === "ReturnToKitchen") onReturnToKitchen?.(); },
  });

  const {
    stage, goStage, nextStage,
    emit, reportAttempt, applyEngineDecision,
    solved, setSolved, solvedRef, stars, setStars, cook, setCook, status, setStatus,
    say, speaking, selfCorrectionsRef, stageRef,
  } = sc;

  // ── identity from registry ────────────────────────────────────────────────
  const ident = useLessonIdentity("simp");
  const L = LESSONS.simp;
  const layout = L?.layout || { railW: 452, footH: 150 };
  const tabStages = ident.stages.map((s, i) => ({
    key: STAGE_IDS[i],
    badge: s.badge,
    title: s.title,
    sub: s.sub,
  }));

  // ── derived ───────────────────────────────────────────────────────────────
  const UNIT = SPAN;
  const isFewest = gcd(num, den) === 1;
  const barRightX = ORIGIN + VALUE * UNIT;
  const lastK = divs.length ? divs[divs.length - 1] : 0;

  function initialStatus(s) {
    switch (s) {
      case "identify":   return { tone: "normal", text: "Twelve cells, eight shaded — count them up and name the fraction. Which choice shows how many are shaded out of how many total?" };
      case "bundle":     return { tone: "normal", text: "Drag the ÷2 bundle tool onto the bar. Every two cells merge into one — 12 becomes 6, 8 becomes 4. The red edge does not move: 8/12 and 4/6 are the same amount." };
      case "lowest":     return { tone: "normal", text: "Keep bundling until no group fits anymore. When nothing divides both top and bottom evenly, you're at the simplest name — the fewest possible pieces." };
      case "bigbundle":  return { tone: "normal", text: "One big bundle jumps straight to simplest. The biggest number that divides both 8 and 12 is 4 — drag ÷4 to reach 2/3 in a single move." };
      case "pick":       return { tone: "normal", text: "Pick the top and bottom that keep the same amount as 8/12 but use the fewest pieces. 4/6 matches too — but 2/3 is as low as it goes." };
      case "numbers":    return { tone: "normal", text: "No picture — just the numbers. Write 8/12 in lowest terms: divide top and bottom by their greatest common factor." };
      default:           return { tone: "normal", text: "" };
    }
  }

  // ── bundle mechanic (bundle / lowest / bigbundle) ─────────────────────────
  // For "bundle" stage: only ÷2, expected to reach 4/6 (one step).
  // For "lowest" stage: ÷2 or ÷3, expected to reach lowest terms.
  // For "bigbundle" stage: only ÷4 (GCF), should reach lowest in one move.
  function fuse(k) {
    if (solvedRef.current) return;
    if (num % k === 0 && den % k === 0) {
      const nn = num / k, nd = den / k;
      setNum(nn); setDen(nd);
      setDivs((d) => [...d, k]);
      setFuseTick((t) => t + 1);
      setCook("idle");
      const isLowest = gcd(nn, nd) === 1;
      selfCorrectionsRef.current += 1;
      emit({ type: "place_block", payload: { node_id: "SIMPLIFY", k } });

      if (stageRef.current === "bundle") {
        // Bundle stage: ONE step of ÷2. Reach 4/6 → done.
        if (nd === 6 && nn === 4) {
          setSolved(true); setStars(3); setCook("cheer");
          setStatus({ tone: "ok", text: "8/12 = 4/6 — the ÷2 bundle merged every two cells into one. Same red amount, fewer pieces. Next stage!" });
          say("r4Bigger");
          const dec = reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
          setTimeout(() => applyEngineDecision(dec, true), 1500);
        } else {
          setStatus({ tone: "ok", text: `Grouped! ${nn}/${nd} — keep going if you need, or move on.` });
        }
      } else if (stageRef.current === "lowest") {
        if (isLowest) {
          setSolved(true); setStars(3); setCook("cheer");
          setStatus({ tone: "ok", text: `Lowest terms! ${nn}/${nd} — no group divides both evenly anymore. That's the simplest name for the same amount. Next stage!` });
          say("r4Fewest");
          const dec = reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
          setTimeout(() => applyEngineDecision(dec, true), 1500);
        } else {
          setStatus({ tone: "ok", text: `Bigger cells — ${nn} out of ${nd}, still the same amount. Keep bundling until no group fits.` });
          say("r4Bigger");
        }
      } else if (stageRef.current === "bigbundle") {
        if (isLowest) {
          setSolved(true); setStars(3); setCook("cheer");
          setStatus({ tone: "ok", text: `One big bundle — ÷${k} took 8/12 straight to ${nn}/${nd}! That's the GCF shortcut: the biggest shared factor in a single move. Next stage!` });
          say("r4Fewest");
          const dec = reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
          setTimeout(() => applyEngineDecision(dec, true), 1500);
        } else {
          setStatus({ tone: "ok", text: `Grouped to ${nn}/${nd}. For the big bundle, try a factor that divides BOTH 8 and 12 all the way to lowest terms in one move.` });
        }
      }
    } else {
      setBounceK(k); setCook("think");
      setTimeout(() => setBounceK(0), 460);
      setStatus({ tone: "warn", text: `÷${k} doesn't come out even — ${num} and ${den} can't both split into ${k}s. Pick a number that divides both evenly.` });
      say("r4Uneven");
    }
  }

  // ── drag-to-place (same pattern as AppR4) ────────────────────────────────
  function overDrop(ev) {
    const r = barDropRef.current ? barDropRef.current.getBoundingClientRect() : null;
    if (!r) return false;
    const pad = 36;
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
           ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }
  function grabChip(e, k) {
    if (solvedRef.current) return;
    if (num % k !== 0 || den % k !== 0) return;
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
      say("r4Fewest");
      const dec = reportAttempt({ correct: true, answerValue: identPick, errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
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
      say("r4Fewest");
      const dec = reportAttempt({ correct: true, answerValue: [tn, td], errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
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

  // ── numbers submit ────────────────────────────────────────────────────────
  function submitNumbers() {
    if (solvedRef.current) return;
    const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
    if (!(tn > 0) || !(td > 0)) {
      setCook("think");
      setStatus({ tone: "warn", text: "Write the equivalent fraction — a top number and a bottom number." });
      return;
    }
    const sameValue = tn * START_DEN === td * START_NUM;
    if (!sameValue) {
      setCook("think");
      setStatus({ tone: "warn", text: `${tn}/${td} is not the same amount as 8/12. Divide the top and bottom by the same number — that's dividing by 1, so the value can't change.` });
      say("r4KeepSame");
      reportAttempt({ correct: false, answerValue: [tn, td], errorSignature: null, stars: 0 });
      return;
    }
    const fully = gcd(tn, td) === 1;
    const st = fully ? 3 : 2;
    setSolved(true); solvedRef.current = true; setStars(st); setCook("cheer");
    setStatus({ tone: "ok", text: fully
      ? `Yes! ${START_NUM}/${START_DEN} = ${tn}/${td} — the same amount, its simplest name!`
      : `Right — ${tn}/${td} is the same amount as ${START_NUM}/${START_DEN}, but it can simplify further. Divide top and bottom once more to reach the smallest pair.` });
    say(fully ? "r3FullMarks" : "r4Bigger");
    const dec = reportAttempt({ correct: fully, answerValue: [tn, td], errorSignature: fully ? null : "not_simplified", stars: st });
    setTimeout(() => applyEngineDecision(dec, true), 1500);
  }

  function reset() { goStage(stageRef.current); }

  const RLAB = [[0, "0"], [den, "1"]];

  // Bundle stage only offers ÷2; lowest stage offers ÷2 and ÷3 (step-by-step);
  // bigbundle stage offers ÷2, ÷3, ÷4 (decoy included so ÷4 is the GCF pick).
  const FUSE_CHOICES =
    stage === "bundle"    ? [2] :
    stage === "lowest"    ? [2, 3] :
    stage === "bigbundle" ? [2, 3, 4] :
    [];

  // "Ready to check" per stage.
  const slateFilled = slate.n !== "" && slate.d !== "";
  const answerReady = !solved && (
    stage === "identify"  ? !!identPick :
    stage === "bundle" || stage === "lowest" || stage === "bigbundle" ? isFewest :
    stage === "pick"   ? (pickTop !== null && pickBottom !== null) :
    stage === "numbers" ? slateFilled :
    false
  );

  // ── shared chrome ─────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="simpGoal" voxSpeaker="mom">
      {renderGoal(L?.goals?.[stage] || "")}
    </LessonGoal>
  );

  const Band = (
    <QuestionBand
      lead="the question"
      expr={<BigFrac num={START_NUM} den={START_DEN} />}
      answer={solved ? <BigFrac num={LOW_NUM} den={LOW_DEN} /> : "?"}
    />
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  const Ghost = drag && createPortal(
    <div
      className={"r4-drag-ghost r4-drag-ghost-fuse" + (hotDrop ? " is-hot" : "")}
      style={{ left: drag.x, top: drag.y, position: "fixed" }}
      aria-hidden="true"
    >
      <span className="r4-fuse-k">{drag.k}</span>
      <span className="r4-drag-ghost-lab">Bundle by {drag.k}</span>
    </div>,
    document.body
  );

  // ── per-stage body ────────────────────────────────────────────────────────
  let body = null;

  if (stage === "practice") {
    body = <GenPracticeBoard skill="SIMPLIFY" scaffold={sc} />;

  } else if (stage === "identify") {
    // Stage 1: MC chips — pick the fraction name.
    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">Name the Shaded Part</h3>
            <div className="hint">
              The box has <b>12</b> equal cells and <b>8</b> are shaded — count the top
              (shaded) and the bottom (total) to name the fraction.
            </div>
          </div>
        }
        stage={
          <div className="canvas simp-identify-canvas">
            <div className="simp-id-box-wrap">
              <span className="eq-lab">the box</span>
              <SimpBox cols={3} rows={4} shadedCols={2} />
            </div>
            <div className="simp-id-choices">
              <span className="simp-id-label">Which fraction?</span>
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
            <div className="r4-s-cap">{solved ? "8 shaded of 12 equal cells → 8/12" : "count the shaded cells (top) and the total cells (bottom)"}</div>
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
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">Pick the Simplest Name</h3>
            <div className="hint">
              The target is <b>8/12</b>. Choose a top and bottom that keep the
              <b> same red amount</b> but use the <b>fewest pieces</b>. 4/6 matches
              too — but <b>2/3</b> is as low as it goes.
            </div>
          </div>
        }
        stage={
          <div className="canvas simp-pick-canvas">
            <div className="simp-pick-cols">
              <div className="simp-pick-group">
                <span className="simp-pick-label">Top number</span>
                <div className="simp-mc-col">
                  {PICK_TOP_CHOICES.map((v) => (
                    <button
                      key={v}
                      className={"simp-pick-chip" + (pickTop === v ? " is-on" : "") + (solved && v === LOW_NUM ? " is-correct" : "")}
                      disabled={solved}
                      onClick={() => { if (!solved) setPickTop(v); }}
                    >{v}</button>
                  ))}
                </div>
              </div>
              <div className="simp-pick-frac-preview">
                <BigFrac
                  num={pickTop !== null ? pickTop : "?"}
                  den={pickBottom !== null ? pickBottom : "?"}
                />
              </div>
              <div className="simp-pick-group">
                <span className="simp-pick-label">Bottom number</span>
                <div className="simp-mc-col">
                  {PICK_BOTTOM_CHOICES.map((v) => (
                    <button
                      key={v}
                      className={"simp-pick-chip" + (pickBottom === v ? " is-on" : "") + (solved && v === LOW_DEN ? " is-correct" : "")}
                      disabled={solved}
                      onClick={() => { if (!solved) setPickBottom(v); }}
                    >{v}</button>
                  ))}
                </div>
              </div>
              <div className="simp-pick-eq">
                <span>=</span>
              </div>
              <div className="simp-pick-target">
                <span className="simp-pick-label">target</span>
                <BigFrac num={START_NUM} den={START_DEN} />
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
            <div className="r4-s-cap">{solved ? `${LOW_NUM}/${LOW_DEN} — same amount, fewest pieces — simplest` : "pick the top and bottom that match 8/12 with the fewest pieces"}</div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "numbers") {
    // Stage 6: bare Slate.
    const slateDen = LOW_DEN;
    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">Lowest Terms</h3>
            <div className="hint">No tools — just the numbers. Divide the top and bottom by their largest shared factor (dividing by 1), then write the equivalent fraction in lowest terms on the Slate.</div>
            <div className="r4-card">
              <BigFrac num={START_NUM} den={START_DEN} />
              <div className="r4-card-note">write this in<br /><b>lowest terms</b></div>
            </div>
          </div>
        }
        stage={
          <div className="canvas r4-s-canvas">
            <div className="r4-bare-eq">
              <BigFrac num={START_NUM} den={START_DEN} />
              <span className="r4-bigeq-op">=</span>
              <span className="r4-bigeq-q">{solved ? <BigFrac num={LOW_NUM} den={LOW_DEN} /> : "?"}</span>
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <span className="r4-s-frac"><BigFrac num={START_NUM} den={START_DEN} /></span>
              <span className="r4-s-eq">=</span>
              <span className="r4-s-slate">
                <Slate
                  slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
                  values={slate}
                  onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
                  onSubmit={submitNumbers}
                  layout="fraction"
                  den={slateDen}
                  disabled={solved}
                  autoFocusKey={solved ? undefined : "n"}
                  ariaLabel="write the simplest fraction"
                />
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
                  onClick={solved ? nextStage : submitNumbers}
                >{solved ? "Done" : "Check"}</button>
              </div>
            </div>
            <div className="r4-s-cap">{solved
              ? (stars === 3 ? `simplest name — ${START_NUM}/${START_DEN} = ${slate.n}/${slate.d}` : "same amount, but it can simplify further")
              : "write the equivalent fraction on the Slate, then Check"}</div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else {
    // bundle / lowest / bigbundle — bar with drag-to-place group tool.
    const railNode = (
      <div className="panel">
        <h3 className="pick-title">
          {stage === "bundle" ? "Bundle Every Two Cells" :
           stage === "lowest" ? "Keep Bundling" :
           "One Big Bundle"}
        </h3>
        <div className="hint">
          {stage === "bundle" && <>Drag the <b>÷2</b> tool onto the bar. Every two cells merge into one — 12 becomes 6, 8 becomes 4. The red edge does not move: <b>8/12 = 4/6</b>, the same amount with fewer pieces.</>}
          {stage === "lowest" && <>Bundle again and again until <b>no tool</b> divides both top and bottom evenly. When nothing fits, you're at the <b>simplest name</b>.</>}
          {stage === "bigbundle" && <>One big bundle jumps straight to simplest. Drag the <b>÷4</b> tool — the greatest common factor of 8 and 12 — to reach 2/3 in a single move.</>}
        </div>
        <div className="r4-fuse-tray">
          {FUSE_CHOICES.map((k) => {
            const even = num % k === 0 && den % k === 0;
            return (
              <button key={k}
                className={"r4-fuse-btn" + (bounceK === k ? " bounce" : "") + (drag && drag.k === k ? " is-dragging" : "")}
                style={{ touchAction: "none" }}
                disabled={solved || !even}
                onPointerDown={(e) => grabChip(e, k)}
                onClick={(e) => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } if (e.detail !== 0) return; fuse(k); }}
                title={`Drag onto the bar to bundle cells by ${k}`}
              >
                <span className="r4-fuse-k">{k}</span>
                <span className="r4-fuse-txt">
                  <span className="r4-fuse-title">Bundle by {k}</span>
                  <span className="r4-fuse-sub">{even ? `÷${k} top & bottom` : "won't come out even"}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="r4-meter">
          <div className="r4-meter-row">
            <span className="r4-meter-lab">filled cells</span>
            <span className={"r4-meter-val" + (isFewest ? " fewest" : "")}>{num}</span>
          </div>
          <div className="r4-dots">
            {Array.from({ length: START_NUM }).map((_, i) => (
              <span key={i} className={"r4-dot" + (i < num ? (isFewest ? " fewest" : "") : " gone")} />
            ))}
          </div>
          <div className="r4-meter-note">{isFewest ? "Lowest terms — simplest name. Same amount as 8/12." : "Bundle to reach the simplest name."}</div>
        </div>
      </div>
    );

    const canvas = (
      <div
        ref={barDropRef}
        className={"canvas r4-s-canvas" + (drag ? " r4-droptarget" : "") + (drag && hotDrop ? " is-hot" : "")}
        id="simpcanvas"
      >
        <div className={"eqstate eqfloat r4-simplestflag" + (isFewest ? " ok" : "")}>
          {isFewest ? "✓ simplest name" : "bundle it down"}
        </div>
        <div className="r4-guide" style={{ left: barRightX, top: BAR_Y - 26, height: (LINE_Y - BAR_Y) + 26 + 6 }}>
          <span className="r4-guide-cap">same amount</span>
        </div>
        <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: UNIT }} />
        {Array.from({ length: den + 1 }).map((_, k) => (
          <span key={k} className="ntick" style={{ left: ORIGIN + (k / den) * UNIT, top: LINE_Y, height: (k === 0 || k === den) ? 14 : 8 }} />
        ))}
        {RLAB.map(([k, lab]) => (
          <span key={k} className="nlab ng" style={{ left: ORIGIN + (k / den) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
        ))}
        <div className="r4-bar" style={{ left: ORIGIN, top: BAR_Y }}>
          <div className="btag">
            <BigFrac num={num} den={den}><DivChips divs={divs} /></BigFrac>
          </div>
          <GroupBar num={num} den={den} unit={UNIT} animKey={fuseTick} dim={false} lastK={lastK} />
          <div className="r4-valnote">same amount: {START_NUM}/{START_DEN} of a tray</div>
        </div>
      </div>
    );

    const answerNode = (
      <div className="lbar r4-s-answer">
        <div className="r4-s-eqrow">
          <span className="r4-s-frac"><BigFrac num={num} den={den} /></span>
          <span className="r4-s-eq">=</span>
          <span className="r4-s-amt">{START_NUM}/{START_DEN} of a tray</span>
          <div className="r4-s-marks">
            {solved && <Rosette count={stars} />}
            <button
              className={"check" + (solved ? " done" : "")}
              onClick={solved ? nextStage : undefined}
              disabled={!solved}
            >{solved ? "Next →" : stage === "bundle" ? "Bundle to 4/6" : stage === "bigbundle" ? "One big bundle" : "Bundle to simplest"}</button>
          </div>
        </div>
        <div className="r4-s-cap">
          {solved
            ? (stage === "bundle" ? "8/12 = 4/6 — same amount, fewer pieces"
               : stage === "bigbundle" ? `÷4 straight to ${num}/${den} — the GCF shortcut`
               : `lowest terms — ${num}/${den} is the simplest name for 8/12`)
            : "drag a bundle tool onto the bar — the filled edge can't move"}
        </div>
      </div>
    );

    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
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
      band={stage !== "identify" && stage !== "practice" ? Band : null}
      goal={Goal}
      extra={Ghost}
    >
      {body}
    </LessonShell>
  );
}

// ── SimpBox: a simple CSS grid of cells mirroring the wireframe's eqBox ─────
// cols × rows cells, shadedCols columns filled. Kept local — it's only used
// in the identify stage. The real manipulative is the GroupBar (AppR4).
function SimpBox({ cols, rows, shadedCols }) {
  const total = cols * rows;
  const cells = Array.from({ length: total }, (_, i) => {
    const col = i % cols;
    return col < shadedCols;
  });
  return (
    <div className="simp-box" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {cells.map((filled, i) => (
        <div key={i} className={"simp-box-cell" + (filled ? " is-filled" : "")} />
      ))}
    </div>
  );
}

// ── render registry goal string into JSX ─────────────────────────────────────
function renderGoal(src) {
  if (!src) return "";
  const filled = src.replace(/\{n\}/g, String(START_NUM)).replace(/\{d\}/g, String(START_DEN));
  const parts = filled.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*")
          ? <b key={i}>{p.slice(1, -1)}</b>
          : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}
