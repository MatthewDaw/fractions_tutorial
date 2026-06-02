// AppR4.jsx — Lesson No.7 "Simplify" (R4, SIMPLIFY). 8/12 and 2/3 are the SAME
// amount. Simplest form = the equivalent fraction with the smallest whole-number
// parts, reached by dividing top AND bottom by a shared factor — legal because
// that is dividing by n/n = 1, so the value cannot change (CCSS 4.NF.A.1).
// Worked example throughout: 8/12 → 4/6 → 2/3.
//
// THE VISUAL (GroupBar): ONE fixed-width whole, partitioned into `den` equal
// cells with `num` FILLED and (den-num) EMPTY/outlined — so "8 OUT OF 12" is
// literally visible. Grouping bundles cells into groups of k (12→6→3 cells;
// 8→4→2 filled). The filled region's left/right extent NEVER MOVES — a
// persistent fill-edge marker proves the amount is identical across 8/12, 4/6,
// 2/3. Each grouping annotates "div k" top + bottom and "div k/k = div 1" so the
// legality is on screen, not just spoken.
//
// THE INTERACTION ARC — stages reachable one-click from the stage selector and
// advanced one-by-one on a correct answer. Two channels fade in opposite
// directions: the manipulative/touch channel shrinks while the STYLUS/writing
// channel grows from "copy one numeral" to "write the whole solution".
//
//   1 · Manipulate — group equal cells by drag. No writing. Correct = reach
//       lowest terms (gcd 1).
//   2 · Bind       — bar PLUS the written fraction beside it; as the bar groups,
//       the child WRITES the equivalent numerator/denominator on the Slate.
//   3 · Fade       — the bar dims; the child PICKS the shared factor symbolically
//       and WRITES the equivalent line on the Slate.
//   4 · Numbers    — a BARE equation 8/12 = ?; the child writes lowest terms.
//   5 · Applied/Words — a word problem; the child reads it, pulls the numbers,
//       and writes the same amount as its simplest name.
//
// LAYOUT comes from the shared lesson library (LessonShell + LessonBoard +
// AnswerBar + TutorRibbon + LessonGoal); the controller backbone (engine wiring,
// stage nav, outcome state) comes from useLessonScaffold. Room-specific content
// CSS lives in styles/r4.css, namespaced .r4-… . Shared building blocks (Cook,
// Rosette, BigFrac, Slate, WordProblem) are imported read-only.
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Slate from "./components/Slate.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";

import "./styles/r4.css";

// Geometry. The bar lives on a 0→1 ruler, so the UNIT (pixels per whole) is just
// the whole SPAN — the GroupBar fills the width and cells are as big as possible.
// The filled region's right edge is fixed at ORIGIN + value·SPAN and never moves
// while grouping — that's the persistent fill-edge ("same amount") marker.
const ORIGIN = 90, SPAN = 660, LINE_Y = 198, BAR_Y = 64;

// The worked example. ORIGINAL is the unsimplified fraction; VALUE its true amount.
const START_NUM = 8, START_DEN = 12;
const VALUE = START_NUM / START_DEN; // = 2/3, the amount that must never change
const LOW_NUM = 2, LOW_DEN = 3;      // lowest terms

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

// ── the five stages of the arc ───────────────────────────────────────────────
const STAGES = [
  { id: "manipulate", n: 1, tag: "Group",      blurb: "Drag a group size — bundle equal cells" },
  { id: "bind",       n: 2, tag: "Bind",       blurb: "Group, then write the equivalent name" },
  { id: "fade",       n: 3, tag: "Fade",       blurb: "Pick the shared factor, then write" },
  { id: "numbers",    n: 4, tag: "Numbers",    blurb: "Bare 8/12 — write lowest terms" },
  { id: "applied",    n: 5, tag: "Applied",    blurb: "Write the fraction, then its simplest name" },
  { id: "showwork",   n: "SW", tag: "Show Work", blurb: "Show your work on a blank slate" },
  { id: "words",      n: 6, tag: "Words",      blurb: "Read the recipe, write the simplest name" },
  { id: "practice",   n: "★", tag: "Practice",  blurb: "Fresh problems — paced to your mastery" },
];

// ── the ÷K chips that ride inside the shared BigFrac ─────────────────────────
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

// ── GroupBar: ONE fixed-width whole (the tray = 1). The track is ALWAYS the full
// SPAN — that constant width is what makes the amount visibly invariant. The
// track holds `den` equal cells, the first `num` FILLED, the rest EMPTY/outlined
// (so "8 OUT OF 12" is literally visible). Regrouping is conveyed by the snap
// animation + the cell count itself changing. A single persistent fill-edge sits
// at left = num*(SPAN/den) = VALUE*SPAN — IDENTICAL across 8/12, 4/6, 2/3 — and
// never moves as den/num change; it carries a "same amount" cap. A count chip
// reads "<num> of <den>" over the filled run, and a div-row annotates the last
// grouping: "÷k" over top, "÷k" under bottom, and "÷k/k = ÷1".
// `dim` fades the wrapper (Fade/Numbers ghost) via .is-ghost. ─────────────────
function GroupBar({ num, den, unit, animKey, dim, lastK }) {
  const cellW = unit / den;            // width of one cell at this partition
  const fill = denomColor(den);
  const cut = denomTone(den, 0.55);
  const labColor = denomTextColor(den);
  const hatch = denomHatch(den), hatchSize = denomHatchSize(den);
  const edgeX = num * cellW;           // = VALUE * unit — never moves as den changes
  const labSize = cellW < 40 ? 11 : cellW < 58 ? 13 : 15;
  return (
    <div className={"r4-groupbar" + (animKey ? " r4-fuse-anim" : "") + (dim ? " is-ghost" : "")}>
      {/* the whole = the track. Width is the full SPAN for every grouping. */}
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

        {/* the persistent fill-edge — fixed at VALUE*unit, NEVER moves */}
        <span className="r4-gb-filledge" style={{ left: edgeX }}>
          <span className="r4-gb-edgecap">same amount</span>
        </span>

        {/* count chip over the filled run: "<num> of <den>" */}
        <span className="r4-gb-counttag" style={{ left: edgeX / 2 }}>{num} of {den}</span>
      </div>

      {/* division legality of the last grouping: ÷k top + ÷k bottom = ÷1. Shown
         whenever a grouping has happened (lastK), so it stays visible at lowest
         terms too — it explains why the amount never changed. */}
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

export default function AppR4({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {
  // The fuse mechanic's live state (used by Manipulate, Bind, and seeded for Fade).
  const [num, setNum] = useState(START_NUM);
  const [den, setDen] = useState(START_DEN);
  const [divs, setDivs] = useState([]);        // the ÷K chips earned, in order
  const [fuseTick, setFuseTick] = useState(0); // bump to replay the snap anim
  const [bounceK, setBounceK] = useState(0);   // a fuse-by-K that didn't come out even

  // Stylus answers (per-stage Slate). Reset between stages.
  const [slate, setSlate] = useState({ n: "", d: "" });

  // Stage 3 (Fade): which shared factor the child picks, symbolically.
  const [pickedK, setPickedK] = useState(0);

  // ── DRAG state (Change B): the fuse/factor chips are DRAG-and-drop. A ghost
  // follows the pointer; the bar (Manipulate/Bind) or the fade-equation (Fade)
  // is the highlighting drop target. A pointer tap (no movement) is a no-op —
  // only a real drag (pointer) or keyboard activation (non-pointer) places.
  // `drag` = { x, y, k, kind } while a chip is in flight; `hotDrop` = pointer is
  // over the live drop target. Refs to the drop-target DOM nodes drive hit-test.
  const [drag, setDrag] = useState(null);
  const [hotDrop, setHotDrop] = useState(false);
  const barDropRef = useRef(null);   // Manipulate / Bind: the bar+ruler region
  const fadeDropRef = useRef(null);  // Fade: the symbolic 8/12 = ?/? equation
  const suppressClickRef = useRef(false); // a completed drag must not also click
  // Defensive: clear any in-flight drag on unmount.
  useEffect(() => () => { setDrag(null); setHotDrop(false); }, []);

  // Applied (Stage 5): word→math gate. The child first WRITES the fraction the
  // words describe (8/12) in the setup Slate; once that's checked (setupOk) the
  // simplified answer unlocks. Words (Stage 6): an OPTIONAL, ungraded scratch
  // Slate for 8/12 — it never gates the answer.
  const [setupAns, setSetupAns] = useState({ n: "", d: "" });
  const [setupOk, setSetupOk] = useState(false);

  // Show Work (mandatory blank-slate step between Applied and Words): a pure
  // presence gate — Next unlocks once the child puts ANY ink on the slate.
  const [showWorkInked, setShowWorkInked] = useState(false);

  // ── shared controller backbone (engine wiring + stage nav + outcome state) ──
  // The hook owns everything identical across lessons; R4 supplies only its stage
  // model (ordered ids → index-derived advance/back), its intro copy, and its
  // per-stage reset. R4 keeps DOMAIN state (above) + bounceK (its own bad-input
  // flash, distinct from the hook's flashBad).
  const SCAFFOLD_KEY = (s) => s; // R4 stage ids ARE scaffoldMap keys ("manipulate"…)
  const sc = useLessonScaffold({
    nodeId: "SIMPLIFY",
    lessonId: "r4",
    initialStage: "manipulate",
    stagesOrder: STAGES.map((s) => s.id),
    scaffoldKeyFor: SCAFFOLD_KEY,
    // The final "practice" stage serves auto-generated SIMPLIFY variations, paced
    // by the engine (re-roll on correct, fade on a clean streak, transfer probe).
    generatedStages: ["practice"],
    generatorSkill: "SIMPLIFY",
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setNum(START_NUM); setDen(START_DEN); setDivs([]); setFuseTick(0); setBounceK(0);
      setSlate({ n: "", d: "" }); setPickedK(0);
      setSetupAns({ n: "", d: "" }); setSetupOk(false); setShowWorkInked(false);
    },
    // U3: certified mastery from a stumping kitchen recipe returns to the kitchen.
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

  // Derived view state.
  const UNIT = SPAN;                       // 0→1 ruler fills the whole span
  const isFewest = gcd(num, den) === 1;    // nothing left to simplify (lowest terms)
  const barRightX = ORIGIN + VALUE * UNIT; // the fixed fill-edge x (the amount holds)
  const lastK = divs.length ? divs[divs.length - 1] : 0; // last grouping → div k annotation

  function initialStatus(s) {
    switch (s) {
      case "manipulate": return { tone: "normal", text: "Eight out of twelve — a lot of tiny pieces. Drag a group size onto the bar to bundle equal cells. Divide the top and bottom by the same number; the filled edge holds, so the amount stays the same." };
      case "bind":       return { tone: "normal", text: "Group the bar into bigger cells, and each time, copy the new equivalent name onto the Slate. The bar IS that fraction — and it's still the same amount as 8/12." };
      case "fade":       return { tone: "normal", text: "The bar is fading. Pick the number that divides BOTH 8 and 12, then write the equivalent line. Same number on top and bottom is dividing by 1." };
      case "numbers":    return { tone: "normal", text: "Just the numbers now: 8/12. Write the equivalent fraction in lowest terms — the same amount with the smallest numbers." };
      case "applied":    return { tone: "normal", text: "A question in words. First write the fraction it describes — 8/12 — then its simplest name unlocks." };
      case "showwork":   return { tone: "normal", text: "Show your work on the blank slate — write anything you like. When you've put something down, you can move on." };
      case "words":      return { tone: "normal", text: "Read the recipe. The leftover comes out unwieldy — write the same amount as its simplest name." };
      default:           return { tone: "normal", text: "" };
    }
  }

  // ── the group mechanic: bundle equal groups of K. Succeeds only if K divides
  // BOTH top and bottom (comes out even); otherwise bounces. Used by Manipulate +
  // Bind. (Internal name kept as fuse(); user-facing wording is "group".) ──
  function fuse(k) {
    if (solvedRef.current) return;
    if (num % k === 0 && den % k === 0) {
      const nn = num / k, nd = den / k;
      setNum(nn); setDen(nd);
      setDivs((d) => [...d, k]);
      setFuseTick((t) => t + 1);
      setCook("idle");
      const isLowest = gcd(nn, nd) === 1;
      // Count a self-correction if this is a re-group.
      selfCorrectionsRef.current += 1;
      emit({ type: "place_block", payload: { node_id: "SIMPLIFY", k } });
      if (stageRef.current === "manipulate") {
        if (isLowest) {
          setSolved(true); setStars(3); setCook("cheer");
          setStatus({ tone: "ok", text: `Lowest terms! ${nn} out of ${nd} — divide ${k} top and ${k} bottom, that's dividing by 1, so the filled edge held and it's the same amount. Next stage!` });
          say("r4Fewest");
          // Report correct to engine and apply decision.
          const dec = reportAttempt({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
          setTimeout(() => applyEngineDecision(dec, true), 1500);
        } else {
          setStatus({ tone: "ok", text: `Grouped into bigger cells — divide ${k} top and ${k} bottom (dividing by 1), so the edge held. Keep going — group it down to its simplest name.` });
          say("r4Bigger");
        }
      } else {
        // Bind: grouping changes the target; the child must now WRITE this new form.
        setStatus({ tone: "ok", text: isLowest
          ? `Simplest name — ${nn} out of ${nd}, the same amount as 8/12. Now write ${nn} over ${nd} on the Slate.`
          : `Bigger cells — ${nn} out of ${nd}, still the same amount as 8/12. Copy that equivalent name onto the Slate (or group again first).` });
        say(isLowest ? "r4Fewest" : "r4Bigger");
      }
    } else {
      setBounceK(k); setCook("think");
      setTimeout(() => setBounceK(0), 460);
      setStatus({ tone: "warn", text: `Group-by-${k} doesn't come out even — ${num} and ${den} can't both split into ${k}s. Pick a number that divides both evenly.` });
      say("r4Uneven");
    }
  }

  // ── Stage 3 (Fade): pick a shared factor symbolically (dims the bar) ─────────
  function pickFactor(k) {
    if (solvedRef.current) return;
    if (START_NUM % k === 0 && START_DEN % k === 0) {
      setPickedK(k); setCook("idle");
      setStatus({ tone: "ok", text: `${k} divides both 8 and 12 — same number top and bottom, so that's dividing by 1. 8/12 = ${START_NUM / k}/${START_DEN / k}. Write that equivalent line on the Slate.` });
      say("r4Bigger");
    } else {
      setPickedK(0); setCook("think"); setBounceK(k);
      setTimeout(() => setBounceK(0), 460);
      setStatus({ tone: "warn", text: `${k} doesn't divide both 8 and 12. Pick a number that splits the TOP and the BOTTOM evenly.` });
      say("r4Uneven");
    }
  }

  // ── DRAG-to-place (Change B): grab a Fuse/Factor chip and drag it onto its
  // drop target (the bar for fuse, the fade equation for factor). A ghost tracks
  // the pointer in real time; releasing OVER the target performs the action
  // (fuse / pickFactor). Releasing elsewhere cancels. A near-zero-movement
  // pointer press is a no-op (the onClick guard ignores pointer clicks via
  // e.detail>=1), so a tap never places an object — only drag does. Keyboard
  // activation (e.detail===0) still places, for non-pointer a11y.
  // Mirrors AppR5 grabBlock. ──
  function dropRectFor(kind) {
    const node = kind === "factor" ? fadeDropRef.current : barDropRef.current;
    return node ? node.getBoundingClientRect() : null;
  }
  function overDrop(kind, ev) {
    const r = dropRectFor(kind);
    if (!r) return false;
    const pad = 36;
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
           ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }
  function grabChip(e, k, kind) {
    if (solvedRef.current) return;
    // overflow-disabled chips never start a drag (mirror the action guards).
    if (kind === "fuse" && !(num % k === 0 && den % k === 0)) return;
    if (e && e.preventDefault) e.preventDefault();
    // No pointer info (keyboard / synthetic) → keyboard activation falls through to onClick.
    if (!e || e.clientX == null) return;
    const startX = e.clientX, startY = e.clientY;
    let moved = false;
    setDrag({ x: startX, y: startY, k, kind });
    const hover = (ev) => {
      if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) moved = true;
      setDrag({ x: ev.clientX, y: ev.clientY, k, kind });
      setHotDrop(overDrop(kind, ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", hover);
      window.removeEventListener("pointerup", up);
      setDrag(null); setHotDrop(false);
      // A real drag that lands on the target performs the action here, and the
      // browser's synthetic click that follows is suppressed (in onClick) so we
      // never double-fire. A no-movement pointer tap is ignored by the onClick
      // guard (e.detail>=1), so it does nothing — drag is required.
      if (moved) {
        suppressClickRef.current = true;
        if (overDrop(kind, ev)) {
          if (kind === "factor") pickFactor(k); else fuse(k);
        }
      }
    };
    window.addEventListener("pointermove", hover);
    window.addEventListener("pointerup", up);
  }

  // ── grading the written answer (Bind / Fade / Numbers / Words) ───────────────
  // The Slate answer is correct iff it is the SAME amount as 8/12. Full stars
  // require lowest terms; a correct-but-not-lowest amount earns fewer.
  // Returns true/false (boolean) as before — engine reporting is done by callers.
  function gradeSlate({ requireLowest, n: nOverride, d: dOverride } = {}) {
    if (solvedRef.current) return false;
    const tn = parseInt(nOverride != null ? nOverride : slate.n, 10);
    const td = parseInt(dOverride != null ? dOverride : slate.d, 10);
    if (!(tn > 0) || !(td > 0)) {
      setCook("think");
      setStatus({ tone: "warn", text: "Write the equivalent fraction — a top number and a bottom number." });
      return false;
    }
    const sameValue = tn * START_DEN === td * START_NUM; // tn/td === 8/12
    if (!sameValue) {
      setCook("think");
      // classic slip: top divided by some K but bottom not divided by the SAME K.
      const kTop = START_NUM % tn === 0 ? START_NUM / tn : 0;
      const dividedDifferently = kTop > 0 && START_DEN % kTop === 0 && td !== START_DEN / kTop;
      setStatus({ tone: "warn", text: dividedDifferently
        ? "Careful — divide the top AND the bottom by the SAME number. They must come from one shared cut."
        : `Not the same amount — keep it equal to ${START_NUM}/${START_DEN}. Divide top and bottom by their shared factor.` });
      say("r4KeepSame");
      // Report incorrect to the engine.
      reportAttempt({ correct: false, answerValue: [tn, td], errorSignature: dividedDifferently ? "scaled_bottom_only" : null, stars: 0 });
      return false;
    }
    const fully = gcd(tn, td) === 1;
    // CCSS: 4/8 IS correct (it equals 1/2). A same-amount answer that is not yet in
    // lowest terms is ACCEPTED as correct with two stars and a gentle nudge — never
    // rejected. Fully-reduced earns the full three. (Even on requireLowest stages.)
    const st = fully ? 3 : 2;
    setSolved(true); solvedRef.current = true; setStars(st); setCook("cheer");
    setStatus({ tone: "ok", text: fully
      ? `Yes! ${START_NUM}/${START_DEN} = ${tn}/${td} — the same amount, its simplest name, povaryonok! Next stage!`
      : `Right — ${tn}/${td} is the same amount as ${START_NUM}/${START_DEN}, so that's correct! Two marks — can you find its smallest name? Divide top and bottom once more.` });
    say(fully ? "r3FullMarks" : "r4Bigger");
    return true;
  }

  // Per-stage submit handlers.
  function submitBind() {
    // Bind accepts any equal-amount form the bar currently shows (partial credit),
    // but advance only once they've written a same-amount fraction.
    const ok = gradeSlate({ requireLowest: false });
    if (ok) {
      const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
      const dec = reportAttempt({ correct: true, answerValue: [tn, td], errorSignature: null, stars: gcd(tn, td) === 1 ? 3 : 2 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    }
  }
  function submitFade() {
    if (!pickedK) {
      setCook("think");
      setStatus({ tone: "warn", text: "First pick the shared factor that divides both 8 and 12." });
      return;
    }
    const ok = gradeSlate({ requireLowest: false });
    if (ok) {
      const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
      const dec = reportAttempt({ correct: true, answerValue: [tn, td], errorSignature: null, stars: gcd(tn, td) === 1 ? 3 : 2 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    }
  }
  function submitNumbers() {
    const ok = gradeSlate({ requireLowest: true });
    if (ok) {
      const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
      // UX: a same-amount form earns two stars and an encouraging nudge (the lesson
      // never punishes an equivalent). MASTERY: on a stage whose GOAL is the simplest
      // name, a not-yet-reduced answer is NOT a demonstration of SIMPLIFY — reporting
      // it as correct would inflate P_known (the brief's false-positive trap). So the
      // engine `correct` is gated on full reduction; `not_simplified` records the gap.
      const fully = gcd(tn, td) === 1;
      const st = fully ? 3 : 2;
      const dec = reportAttempt({ correct: fully, answerValue: [tn, td], errorSignature: fully ? null : "not_simplified", stars: st });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    }
  }
  function submitWords(vals) {
    const v = vals || slate;
    const ok = gradeSlate({ requireLowest: true, n: v.n, d: v.d });
    if (ok) {
      const tn = parseInt(v.n, 10), td = parseInt(v.d, 10);
      // See submitNumbers: engine `correct` gated on full reduction (anti false-positive).
      const fully = gcd(tn, td) === 1;
      const st = fully ? 3 : 2;
      reportAttempt({ correct: fully, answerValue: [tn, td], errorSignature: fully ? null : "not_simplified", stars: st });
      // last stage — just settle; the selector lets a demo user loop back.
    }
  }

  // ── Applied (Stage 5): the word→math SETUP gate ─────────────────────────────
  // The child first writes the fraction the words describe (8/12). Only when that
  // matches does the simplified answer unlock (setupOk). This gate is ungraded by
  // the engine — it's a comprehension check; the engine reportAttempt fires on the
  // simplified ANSWER, exactly like Numbers.
  function checkSetup() {
    const sn = parseInt(setupAns.n, 10), sd = parseInt(setupAns.d, 10);
    if (!(sn > 0 && sd > 0)) {
      setCook("think");
      setStatus({ tone: "warn", text: "Write the fraction the words give — a top number and a bottom number." });
      return;
    }
    if (!(sn === START_NUM && sd === START_DEN)) {
      setCook("think");
      setStatus({ tone: "warn", text: `Not quite — the words say ${START_NUM} of ${START_DEN} pieces are left. Write ${START_NUM} over ${START_DEN} first.` });
      return;
    }
    setSetupOk(true); setCook("idle");
    setStatus({ tone: "ok", text: `That's it — ${START_NUM}/${START_DEN} of the loaf is left. Now write the same amount as its simplest name.` });
  }
  // Applied answer: same lowest-terms grading + engine path as Numbers.
  function submitApplied(vals) {
    if (!setupOk) {
      setCook("think");
      setStatus({ tone: "warn", text: `First write the fraction the words describe (${START_NUM}/${START_DEN}) and check it.` });
      return;
    }
    const v = vals || slate;
    const ok = gradeSlate({ requireLowest: true, n: v.n, d: v.d });
    if (ok) {
      const tn = parseInt(v.n, 10), td = parseInt(v.d, 10);
      // See submitNumbers: engine `correct` gated on full reduction (anti false-positive).
      const fully = gcd(tn, td) === 1;
      const st = fully ? 3 : 2;
      const dec = reportAttempt({ correct: fully, answerValue: [tn, td], errorSignature: fully ? null : "not_simplified", stars: st });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    }
  }

  // Reset the CURRENT stage (toolbar ⟲).
  function reset() { goStage(stageRef.current); }

  // ruler labels: 0 and 1 only.
  const RLAB = [[0, "0"], [den, "1"]];

  // the group choices offered in Manipulate / Bind. 2 and 3 reach lowest terms.
  const FUSE_CHOICES = [2, 3];
  // the factor chips offered in Fade — includes a decoy (5) that splits neither.
  const FACTOR_CHOICES = [2, 3, 4, 5];

  // Fade derived: the symbolic "after" form once a factor's picked.
  const fadeN = pickedK ? START_NUM / pickedK : null;
  const fadeD = pickedK ? START_DEN / pickedK : null;
  // the denominator that colors the Slate fraction bar for the current stage
  const slateDen = stage === "fade" && fadeD ? fadeD
    : stage === "bind" ? den
    : LOW_DEN;

  // "Ready to check": the child has committed the answer the current stage needs,
  // so the Check button lights up (shared .check.ready glow). The writing stages
  // (bind/fade/numbers/applied/words) need both Slate digits; fade also needs a
  // shared factor picked; applied needs its setup gate cleared first. Manipulate
  // has no writing — its readiness is "lowest terms reached" (isFewest).
  const slateFilled = slate.n !== "" && slate.d !== "";
  const answerReady = !solved && (
    stage === "manipulate" ? isFewest
    : stage === "fade" ? (!!pickedK && slateFilled)
    : stage === "applied" ? (setupOk && slateFilled)
    : slateFilled
  );

  // ── shared chrome: the goal banner + the question band + the tutor ribbon ────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="r4Goal" voxSpeaker="mom">
      {stageGoal(stage)}
    </LessonGoal>
  );

  // THE QUESTION (Change A): the canonical full-width band, mounted directly under
  // the stage tabs on every stage EXCEPT the final words-only stage. Shows the
  // bare equation 8/12 = ?; the "?" becomes the solved lowest-terms value (2/3)
  // once solved. On the WORDS stage the band is deliberately omitted — the whole
  // point there is that the child reads the prose and extracts the math; showing
  // the bare equation would give the answer away. (Applied keeps it; numerals.)
  const Band = (
    <QuestionBand
      lead="the question"
      expr={<BigFrac num={START_NUM} den={START_DEN} />}
      answer={solved ? <BigFrac num={LOW_NUM} den={LOW_DEN} /> : "?"}
    />
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── the dragging GHOST (Change B): follows the pointer while a Fuse/Factor chip
  // is in flight. Portaled to <body> so its position:fixed resolves against the
  // VIEWPORT (the #stage carries a transform: scale() that would otherwise become
  // the containing block and drift the ghost up-left of the cursor). Mounted via
  // LessonShell's `extra` slot, after the body. ──
  const Ghost = drag && createPortal(
    <div
      className={"r4-drag-ghost" + (drag.kind === "factor" ? " r4-drag-ghost-factor" : " r4-drag-ghost-fuse") + (hotDrop ? " is-hot" : "")}
      style={{ left: drag.x, top: drag.y, position: "fixed" }}
      aria-hidden="true"
    >
      {drag.kind === "factor"
        ? <span className="r4-drag-ghost-k">÷{drag.k}</span>
        : <><span className="r4-fuse-k">{drag.k}</span><span className="r4-drag-ghost-lab">Group by {drag.k}</span></>}
    </div>,
    document.body
  );

  // ── Per-stage body ──────────────────────────────────────────────────────────
  let body = null;

  if (stage === "practice") {
    // PRACTICE — auto-generated SIMPLIFY variations, paced by the mastery engine.
    body = <GenPracticeBoard skill="SIMPLIFY" scaffold={sc} />;
  } else if (stage === "showwork") {
    // SHOW WORK — MANDATORY BLANK-SLATE STEP (between Applied and Words). A pure
    // presence gate: the child writes anything on a 100%-blank slate; "Next"
    // unlocks once any ink lands (onInkChange). Ungraded — no engine judge;
    // advancement is a plain goStage to Words.
    body = (
      <LessonBoard
        variant="split"
        footHeight={132}
        railWidth={452}
        rowGap={12}
        marginTop={8}
        rail={null}
        stage={
          <FitStage className="r4-s-fit r4-s-fit-showwork" axis="y">
            <div className="wp-card r4-s-card">
              <div className="wp-card-head">
                <span className="wp-tag">Show Your Work</span>
              </div>
              <p className="wp-story r4-s-story-text">
                Show how you'd simplify <b>{START_NUM}/{START_DEN}</b> — write anything you like on the slate. When you've put something down, tap Next.
              </p>
            </div>
            <div className="r4-s-setup">
              <span className="r4-s-setup-lead">Show your work here</span>
              <div className="bs-surface" style={{ position: "relative", width: 1120, height: 330 }}>
                <BlankSlate
                  key={`showwork:${stage}`}
                  hint="show your work here — write anything you like ✎"
                  onInkChange={setShowWorkInked}
                  ariaLabel="show your work on a blank slate"
                />
              </div>
            </div>
          </FitStage>
        }
        answer={
          <div className="lbar r4-s-answer-words">
            <div className="r4-s-ansprompt">When you've shown your work, move on</div>
            <div className="r4-s-answrite">
              <div className="r4-s-marks">
                <button
                  className={"check" + (showWorkInked ? " ready" : "")}
                  disabled={!showWorkInked}
                  onClick={() => goStage("words")}
                >Next →</button>
              </div>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );
  } else if (stage === "applied" || stage === "words") {
    // WORDS / APPLIED — story card (+ Applied setup gate) as the stage; the
    // simplest-name Slate + Check is the answer card; Cook + ribbon is the tutor.
    // The words-only stage omits the QuestionBand and gets a taller story
    // (.r4-s-onlywords); the FitStage axis="y" wrapper on showwork is separate.
    body = (
      <LessonBoard
        variant="split"
        footHeight={158}
        railWidth={452}
        rowGap={12}
        marginTop={8}
        rail={null}
        className={stage === "words" ? "r4-s-onlywords" : ""}
        stage={
          <div className="r4-s-story">
            <div className="wp-card r4-s-card">
              <div className="wp-card-head">
                <span className="wp-tag">{stage === "applied" ? "Babushka's Kitchen" : "Babushka's Recipe"}</span>
                <button
                  type="button"
                  className={"wp-readaloud" + (speaking ? " speaking" : "")}
                  onClick={() => say(stage === "applied" ? APPLIED_SAY : WORDS_SAY)}
                  aria-label="Read the recipe aloud"
                >
                  <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
                  Read aloud
                </button>
              </div>
              <p className="wp-story r4-s-story-text">{stage === "applied" ? APPLIED_STORY : WORDS_STORY}</p>
            </div>

            {/* the word→math surface: REQUIRED gate (Applied) / OPTIONAL scratch (Words) */}
            <div className="r4-s-setup">
              <span className="r4-s-setup-lead">
                {stage === "applied" ? "First, write the fraction the words describe" : "Optional — show your work here"}
              </span>
              {stage === "applied" ? (
                <div className="r4-s-setup-row">
                  <Slate
                    slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
                    values={setupAns}
                    onChange={(k, v) => setSetupAns((s) => ({ ...s, [k]: onlyDigits(v) }))}
                    onSubmit={checkSetup}
                    layout="fraction"
                    den={START_DEN}
                    disabled={setupOk || solved}
                    autoFocusKey={!setupOk ? "n" : undefined}
                    ariaLabel="write the fraction the words describe"
                  />
                  {setupOk
                    ? <span className="r4-setup-ok">✓ that's {START_NUM}/{START_DEN} — now write its simplest name</span>
                    : <button type="button" className="wp-check" onClick={checkSetup}>Check the fraction</button>}
                </div>
              ) : (
                <div className="bs-surface r4-s-scratch-surface" style={{ position: "relative" }}>
                  <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
                </div>
              )}
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer-words">
            <div className="r4-s-ansprompt">
              {stage === "applied" ? "Now write the same amount as its simplest name" : "Write the same amount as its simplest name"}
            </div>
            <div className="r4-s-answrite">
              <Slate
                slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
                values={slate}
                onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
                onSubmit={stage === "applied" ? () => submitApplied(slate) : () => submitWords(slate)}
                layout="fraction"
                den={LOW_DEN}
                disabled={(stage === "applied" && (!setupOk || solved)) || (stage === "words" && solved)}
                autoFocusKey={(stage === "applied" ? setupOk && !solved : !solved) ? "n" : undefined}
                ariaLabel="write the simplest fraction"
              />
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
                  onClick={() => (solved ? nextStage() : stage === "applied" ? submitApplied(slate) : submitWords(slate))}
                  disabled={stage === "applied" && !setupOk && !solved}
                >{solved ? (stage === "words" ? "Done" : "Next →") : "Check"}</button>
              </div>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );
  } else {
    // MANIPULATE / BIND / FADE / NUMBERS — the bar/fuse canvas (or bare equation)
    // is the stage; the per-stage tool panel is the rail; the live amount or the
    // 8/12 = [Slate] equation is the answer; Cook + ribbon is the tutor.

    // The per-stage rail panel (fuse tool / shared factor / lowest terms).
    let railNode = null;
    if (stage === "manipulate" || stage === "bind") {
      railNode = (
        <div className="panel">
          <h3 className="pick-title">Group Tool</h3>
          <div className="hint"><b>Drag</b> a group size onto the bar. If the cells split into that many evenly, they bundle into bigger cells — divide the top <b>and</b> bottom by it. Same number top and bottom is dividing by 1, so the amount can't change.</div>
          <div className="r4-fuse-tray">
            {FUSE_CHOICES.map((k) => {
              const even = num % k === 0 && den % k === 0;
              return (
                <button key={k} className={"r4-fuse-btn" + (bounceK === k ? " bounce" : "") + (drag && drag.kind === "fuse" && drag.k === k ? " is-dragging" : "")}
                  style={{ touchAction: "none" }}
                  disabled={(stage === "manipulate" && solved) || !even}
                  onPointerDown={(e) => grabChip(e, k, "fuse")}
                  onClick={(e) => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } if (e.detail !== 0) return; /* pointer tap: drag required */ fuse(k); }}
                  title={`Drag onto the bar to group equal cells by ${k}`}>
                  <span className="r4-fuse-k">{k}</span>
                  <span className="r4-fuse-txt">
                    <span className="r4-fuse-title">Group by {k}</span>
                    <span className="r4-fuse-sub">{even ? `div ${k} top & bottom` : "won't come out even"}</span>
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
            <div className="r4-meter-note">{isFewest ? "Lowest terms — its simplest name. Same amount as 8/12." : "Group to reach its simplest name."}</div>
          </div>
        </div>
      );
    } else if (stage === "fade") {
      railNode = (
        <div className="panel">
          <h3 className="pick-title">Shared Factor</h3>
          <div className="hint">The bar is fading — choose with numbers now. <b>Drag</b> the ÷ number that divides <b>both</b> 8 and 12 onto the equation. Same number top and bottom is dividing by 1, so the amount stays the same.</div>
          <div className="r4-factor-tray">
            {FACTOR_CHOICES.map((k) => (
              <button key={k}
                className={"r4-factor-btn" + (pickedK === k ? " picked" : "") + (bounceK === k ? " bounce" : "") + (drag && drag.kind === "factor" && drag.k === k ? " is-dragging" : "")}
                style={{ touchAction: "none" }}
                disabled={solved}
                onPointerDown={(e) => grabChip(e, k, "factor")}
                onClick={(e) => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } if (e.detail !== 0) return; /* pointer tap: drag required */ pickFactor(k); }}
                aria-pressed={pickedK === k} title={`Drag onto the equation to divide top and bottom by ${k}`}>
                ÷{k}
              </button>
            ))}
          </div>
          <div
            ref={fadeDropRef}
            className={"r4-fade-eq" + (drag && drag.kind === "factor" ? " r4-droptarget" : "") + (drag && drag.kind === "factor" && hotDrop ? " is-hot" : "")}
          >
            <span className="r4-fade-frac">{START_NUM}/{START_DEN}</span>
            <span className="r4-fade-op">=</span>
            <span className={"r4-fade-frac r4-fade-out" + (pickedK ? " on" : "")}>
              {pickedK ? `${fadeN}/${fadeD}` : "?/?"}
            </span>
          </div>
        </div>
      );
    } else if (stage === "numbers") {
      railNode = (
        <div className="panel">
          <h3 className="pick-title">Lowest Terms</h3>
          <div className="hint">No tools — just the numbers. Divide the top and bottom by their largest shared factor (dividing by 1), then write the equivalent fraction in lowest terms — its simplest name — on the Slate.</div>
          <div className="r4-card">
            <BigFrac num={START_NUM} den={START_DEN} />
            <div className="r4-card-note">write this in<br /><b>lowest terms</b></div>
          </div>
        </div>
      );
    }

    // The canvas (bar/fuse or bare equation). NOT FitStage-wrapped — fixed
    // ORIGIN-based absolute children; flexed to fill the stage zone via r4.css.
    const canvas = (
      <div
        ref={(stage === "manipulate" || stage === "bind") ? barDropRef : null}
        className={"canvas r4-s-canvas" + (drag && drag.kind === "fuse" ? " r4-droptarget" : "") + (drag && drag.kind === "fuse" && hotDrop ? " is-hot" : "")}
        id="r3canvas"
      >
        {stage === "numbers" ? (
          <div className="r4-bare-eq">
            <BigFrac num={START_NUM} den={START_DEN} />
            <span className="r4-bigeq-op">=</span>
            <span className="r4-bigeq-q">{solved ? <BigFrac num={LOW_NUM} den={LOW_DEN} /> : "?"}</span>
          </div>
        ) : (
          <>
            <div className={"eqstate eqfloat r4-simplestflag" + (isFewest ? " ok" : "")}>
              {isFewest ? "✓ simplest name" : "group it down"}
            </div>

            {/* the fixed fill-edge guide — the filled run's right edge never moves */}
            <div className="r4-guide" style={{ left: barRightX, top: BAR_Y - 26, height: (LINE_Y - BAR_Y) + 26 + 6 }}>
              <span className="r4-guide-cap">same amount</span>
            </div>

            {/* ruler 0 → 1, a tick every 1/den */}
            <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: UNIT }} />
            {Array.from({ length: den + 1 }).map((_, k) => (
              <span key={k} className="ntick" style={{ left: ORIGIN + (k / den) * UNIT, top: LINE_Y, height: (k === 0 || k === den) ? 14 : 8 }} />
            ))}
            {RLAB.map(([k, lab]) => (
              <span key={k} className="nlab ng" style={{ left: ORIGIN + (k / den) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
            ))}

            {/* the fraction label + the GroupBar (num filled, den-num empty).
                Stage 3 dims it. */}
            <div className="r4-bar" style={{ left: ORIGIN, top: BAR_Y }}>
              <div className="btag">
                <BigFrac num={num} den={den}><DivChips divs={divs} /></BigFrac>
              </div>
              <GroupBar num={num} den={den} unit={UNIT} animKey={fuseTick} dim={stage === "fade"} lastK={lastK} />
              <div className="r4-valnote">same amount: {START_NUM}/{START_DEN} of a tray</div>
            </div>
          </>
        )}
      </div>
    );

    // The answer card: manipulate shows the live amount + Group/Next; the writing
    // stages show 8/12 = [Slate] + Check, all on one midline.
    const answerNode = stage === "manipulate" ? (
      <div className="lbar r4-s-answer">
        <div className="r4-s-eqrow">
          <span className="r4-s-frac"><BigFrac num={num} den={den} /></span>
          <span className="r4-s-eq">=</span>
          <span className="r4-s-amt">{START_NUM}/{START_DEN} of a tray</span>
          <div className="r4-s-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
              onClick={solved ? nextStage : undefined} disabled={!solved}>
              {solved ? "Next →" : "Group to simplify"}
            </button>
          </div>
        </div>
        <div className="r4-s-cap">{solved ? "simplest name reached — next stage" : "drag a group size to bundle equal cells — the filled edge can't move"}</div>
      </div>
    ) : (
      <div className="lbar r4-s-answer">
        <div className="r4-s-eqrow">
          <span className="r4-s-frac"><BigFrac num={START_NUM} den={START_DEN} /></span>
          <span className="r4-s-eq">=</span>
          <span className="r4-s-slate">
            <Slate
              slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
              values={slate}
              onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
              onSubmit={stage === "bind" ? submitBind : stage === "fade" ? submitFade : submitNumbers}
              layout="fraction"
              den={slateDen}
              disabled={solved}
              autoFocusKey={solved ? undefined : "n"}
              ariaLabel="write the equivalent fraction"
            />
          </span>
          <div className="r4-s-marks">
            {solved && <Rosette count={stars} />}
            <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
              onClick={stage === "bind" ? submitBind : stage === "fade" ? submitFade : submitNumbers}>
              {solved ? "Done" : "Check"}
            </button>
          </div>
        </div>
        <div className="r4-s-cap">{solved
          ? (stars === 3 ? `simplest name — ${START_NUM}/${START_DEN} = ${slate.n}/${slate.d}, the same amount!` : "same amount, but it can simplify further")
          : stage === "fade"
          ? (pickedK ? `you divided by ${pickedK} — write ${fadeN} over ${fadeD}` : "pick a shared factor, then write the equivalent line")
          : "write the equivalent fraction on the Slate, then Check"}</div>
      </div>
    );

    body = (
      <LessonBoard
        variant="split"
        footHeight={150}
        railWidth={452}
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
      no={no}
      tag="Simplifying"
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      resetTitle="Start this stage over"
      tabs={{
        stages: STAGES.map((s) => ({ key: s.id, badge: s.n, title: s.tag, sub: s.blurb })),
        current: stage,
        onSelect: goStage,
      }}
      band={stage !== "words" && stage !== "showwork" && stage !== "practice" ? Band : null}
      goal={Goal}
      extra={Ghost}
    >
      {body}
    </LessonShell>
  );
}

// ── per-stage goal copy (captions, since the audience reads) ──────────────────
function stageGoal(stage) {
  switch (stage) {
    case "manipulate":
      return (<>Babushka's answer came out as <b>8 out of 12</b> pieces. Drag a group size onto the bar to bundle the cells — divide the top <b>and</b> bottom by the same number. The filled edge can't move, so the amount stays the same.</>);
    case "bind":
      return (<>Group the bar into bigger cells — and each time, <b>copy the new name</b> onto the Slate. 4 out of 6, then 2 out of 3: all the SAME amount as 8/12.</>);
    case "fade":
      return (<>The bar is fading. <b>Pick the number</b> that divides BOTH 8 and 12, then <b>write</b> the equivalent line yourself. Same number top and bottom — that's dividing by 1.</>);
    case "numbers":
      return (<>Just the numbers: <b>{START_NUM}/{START_DEN} = ?</b> Write the equivalent fraction in lowest terms — its simplest name. No bar to lean on.</>);
    case "applied":
      return (<>A question in words. First <b>write the fraction</b> it describes ({START_NUM}/{START_DEN}); once that's checked, <b>write the same amount with its simplest name</b>.</>);
    case "showwork":
      return (<>Now <b>show your work</b> on the blank slate — write anything you like. When you've put something down, tap <b>Next</b>.</>);
    case "words":
      return (<>Read Babushka's recipe. The leftover comes out as an unwieldy fraction — <b>write the same amount as its simplest name</b>.</>);
    default:
      return "";
  }
}

// ── the Applied (Stage 5) sentence. The fraction numerals are SHOWN; the child
// transcribes 8/12 in the setup gate, then writes the lowest-terms form. ──
const APPLIED_STORY = (
  <><b>{START_NUM}/{START_DEN}</b> of the loaf is left — write the same amount with its simplest name.</>
);

// ── the Stage-6 word problem. The numbers come out as 8/12 of the loaf, which
// must be SIMPLIFIED to 2/3 — exactly the worked example, now told in words. ──
const WORDS_STORY = (
  <>Babushka cut her sourdough loaf into <b>twelve</b> even slices for the week.
  By Friday the family had eaten four of them, so <b>eight</b> slices are left.
  What fraction of the whole loaf is left — written as its simplest name?</>
);

// Plain-string versions for Read-aloud: say() stringifies its argument, so a JSX
// node would be spoken as "[object Object]". These carry the same words.
const APPLIED_SAY = `${START_NUM}/${START_DEN} of the loaf is left — write the same amount with its simplest name.`;
const WORDS_SAY = "Babushka cut her sourdough loaf into twelve even slices for the week. By Friday the family had eaten four of them, so eight slices are left. What fraction of the whole loaf is left, written as its simplest name?";
