// AppR4.jsx — The Tidying Room (R4, SIMPLIFY): the same amount can be made of
// FEWER, BIGGER pieces. Worked example throughout: 8/12 → 4/6 → 2/3.
//
// THE INTERACTION ARC — five stages, reachable one-click from the stage selector
// and advanced one-by-one on a correct answer. Two channels fade in opposite
// directions: the BLOCK/touch channel shrinks to nothing while the STYLUS/writing
// channel grows from "copy one numeral" to "write the whole solution".
//
//   1 · Manipulate — the blocks ARE the problem: fuse equal groups by touch. No
//       writing. Correct = reach lowest terms (gcd 1).
//   2 · Bind       — blocks PLUS the written fraction beside them; as the bar
//       fuses, the child WRITES the tidied numerator/denominator on the Slate.
//   3 · Fade       — the bar dims to a faint check; the child PICKS the shared
//       factor symbolically, and WRITES the changed line on the Slate.
//   4 · Numbers    — a BARE equation 8/12 = ?; blocks are a faded ghost; the
//       child writes the lowest-terms answer on the Slate.
//   5 · Words      — a plain-language WORD PROBLEM whose answer comes out messy;
//       the child reads it, pulls the numbers, and writes the simplified total.
//
// Structure mirrors the lesson shells from lesson.css (.page/.topbar/.goal/.play/
// .canvas/.plank/.hud/.check …). Room-specific bits live in styles/r4.css,
// namespaced .r4-… . Shared building blocks (Cook, Rosette, BigFrac, Slate,
// WordProblem) are imported read-only.
import React, { useState, useEffect, useRef } from "react";
import Cook from "./components/Cook.jsx";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import Slate from "./components/Slate.jsx";
import WordProblem from "./components/WordProblem.jsx";
import BlankSlate from "./components/BlankSlate.jsx";
import FitStage from "./components/FitStage.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import SettingsButton from "./SettingsButton.jsx";
import { useVoice } from "./voice.js";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "./denominatorColors.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { toScaffoldLevel } from "./runtime/scaffoldMap.js";
import "./styles/r4.css";

// Geometry. The bar lives on a 0→1 ruler, so the UNIT (pixels per whole) is just
// the whole SPAN — the ruler fills the width and blocks are as big as possible.
// The bar's right edge is fixed at ORIGIN + value·SPAN and never moves while
// fusing — that's the "height holds" guide.
const ORIGIN = 60, SPAN = 600, LINE_Y = 232, BAR_Y = 150;

// The worked example. ORIGINAL is the un-tidy fraction; VALUE its true amount.
const START_NUM = 8, START_DEN = 12;
const VALUE = START_NUM / START_DEN; // = 2/3, the amount that must never change
const LOW_NUM = 2, LOW_DEN = 3;      // lowest terms

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

// ── the five stages of the arc ───────────────────────────────────────────────
const STAGES = [
  { id: "manipulate", n: 1, tag: "Manipulate", blurb: "Fuse equal groups by touch" },
  { id: "bind",       n: 2, tag: "Bind",       blurb: "Fuse, then write the tidied fraction" },
  { id: "fade",       n: 3, tag: "Fade",       blurb: "Pick the shared factor, then write" },
  { id: "numbers",    n: 4, tag: "Numbers",    blurb: "Bare 8/12 — write lowest terms" },
  { id: "applied",    n: 5, tag: "Applied",    blurb: "Write the fraction, then simplify it" },
  { id: "showwork",   n: "SW", tag: "Show Work", blurb: "Show your work on a blank slate" },
  { id: "words",      n: 6, tag: "Words",      blurb: "Read the recipe, write the simplest" },
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

// ── the messy bar: `num` filled blocks of size 1/den, fused into fewer/bigger
// pieces. Color tracks the CURRENT denominator (8/12 neutral → gold sixths →
// orange thirds). `dim` fades it to a faint check (Stage 3 / 4 ghost). ─────────
function FuseBar({ num, den, unit, animKey, dim }) {
  const pieceW = unit / den;
  const fill = denomColor(den);
  const cut = denomTone(den, 0.55);
  const labColor = denomTextColor(den);
  const hatch = denomHatch(den), hatchSize = denomHatchSize(den);
  return (
    <div className={"plank lit" + (animKey ? " r4-fuse-anim" : "") + (dim ? " r4-ghost" : "")} style={{ width: num * pieceW }}>
      <div className="plank-body">
        {Array.from({ length: num }).map((_, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: fill,
            borderRight: i < num - 1 ? `1.5px solid ${cut}` : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
            <span className="piece-lab" style={{ color: labColor, fontSize: pieceW < 40 ? 11 : pieceW < 58 ? 13 : 15 }}>1/{den}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppR4({ no, title, onBack, onRewatchIntro }) {
  // Which arc stage is showing. Start at the beginning.
  const [stage, setStage] = useState("manipulate");

  // --- Engine integration (U10) ---
  const { emit, judgeAndAdvance, scaffoldLevel, decision } = useLessonEngine({
    nodeId: "SIMPLIFY",
    lessonConfig: { lessonId: "r4", initialBeat: "manipulate" },
  });
  const selfCorrectionsRef = useRef(0);
  const presentEmittedRef = useRef(false);

  // The fuse mechanic's live state (used by Manipulate, Bind, and seeded for Fade).
  const [num, setNum] = useState(START_NUM);
  const [den, setDen] = useState(START_DEN);
  const [divs, setDivs] = useState([]);        // the ÷K chips earned, in order
  const [fuseTick, setFuseTick] = useState(0); // bump to replay the snap anim
  const [bounceK, setBounceK] = useState(0);   // a fuse-by-K that didn't come out even

  // Shared per-stage outcome.
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [cook, setCook] = useState("idle");

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

  const [status, setStatus] = useState(initialStatus("manipulate"));

  const { speaking, say, stopVoice } = useVoice();
  const solvedRef = useRef(solved);
  const stageRef = useRef(stage);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  // Leaving a beat must never leave audio playing.
  useEffect(() => () => stopVoice(), [stopVoice]);

  // Emit problem_present for the initial stage on mount.
  useEffect(() => {
    if (!presentEmittedRef.current) {
      presentEmittedRef.current = true;
      emit({
        type: "problem_present",
        payload: { node_id: "SIMPLIFY", scaffold_level: toScaffoldLevel("r4", "manipulate") },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- engine integration helpers ------------------------------------------
  function reportAttemptR4({ correct, answerValue, errorSignature, stars: starCount }) {
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

  function applyEngineDecisionR4(dec, isCorrect) {
    if (!dec) return;
    if (dec.kind === "FadeScaffold") {
      advanceStage();
    } else if (dec.kind === "RaiseScaffold") {
      const i = STAGES.findIndex((x) => x.id === stageRef.current);
      if (i > 0) gotoStage(STAGES[i - 1].id);
    } else if (isCorrect) {
      advanceStage();
    }
  }

  // Derived view state.
  const UNIT = SPAN;                       // 0→1 ruler fills the whole span
  const isFewest = gcd(num, den) === 1;    // nothing left to tidy (lowest terms)
  const barRightX = ORIGIN + VALUE * UNIT; // the fixed height guide / bar end
  const showCanvas = stage !== "words";    // Words has no blocks at all

  function initialStatus(s) {
    switch (s) {
      case "manipulate": return { tone: "normal", text: "Eight twelfths — a lot of tiny pieces. Fuse equal groups into bigger blocks. The amount stays the same." };
      case "bind":       return { tone: "normal", text: "Fuse the blocks, and each time, copy the new tidied fraction onto the Slate." };
      case "fade":       return { tone: "normal", text: "The bar is fading. Pick the number that divides BOTH 8 and 12, then write the tidied line." };
      case "numbers":    return { tone: "normal", text: "Just the numbers now: 8/12. Write it in its lowest terms — fewest, biggest pieces." };
      case "applied":    return { tone: "normal", text: "A question in words. First write the fraction it describes — 8/12 — then the simplest form unlocks." };
      case "showwork":   return { tone: "normal", text: "Show your work on the blank slate — write anything you like. When you've put something down, you can move on." };
      case "words":      return { tone: "normal", text: "Read the recipe. The pieces come out messy — write the simplest fraction for the total." };
      default:           return { tone: "normal", text: "" };
    }
  }

  // ── jump to any stage (selector) — fully resets that stage's working state ──
  function gotoStage(s) {
    stopVoice();
    setStage(s); stageRef.current = s;
    setNum(START_NUM); setDen(START_DEN); setDivs([]); setFuseTick(0); setBounceK(0);
    setSolved(false); solvedRef.current = false; setStars(0); setCook("idle");
    setSlate({ n: "", d: "" }); setPickedK(0);
    setSetupAns({ n: "", d: "" }); setSetupOk(false); setShowWorkInked(false);
    setStatus(initialStatus(s));
    // Emit problem_present for the new stage.
    selfCorrectionsRef.current = 0;
    emit({
      type: "problem_present",
      payload: { node_id: "SIMPLIFY", scaffold_level: toScaffoldLevel("r4", s) },
    });
  }

  // advance to the next stage on a correct answer (last stage loops back to map cue)
  function advanceStage() {
    const i = STAGES.findIndex((x) => x.id === stageRef.current);
    if (i < STAGES.length - 1) gotoStage(STAGES[i + 1].id);
  }

  // ── the fuse mechanic: fuse equal groups of K. Succeeds only if K divides BOTH
  // top and bottom (comes out even); otherwise bounces. Used by Manipulate + Bind. ──
  function fuse(k) {
    if (solvedRef.current) return;
    if (num % k === 0 && den % k === 0) {
      const nn = num / k, nd = den / k;
      setNum(nn); setDen(nd);
      setDivs((d) => [...d, k]);
      setFuseTick((t) => t + 1);
      setCook("idle");
      const tidy = gcd(nn, nd) === 1;
      // Count a self-correction if this is a re-fuse.
      selfCorrectionsRef.current += 1;
      emit({ type: "place_block", payload: { node_id: "SIMPLIFY", k } });
      if (stageRef.current === "manipulate") {
        if (tidy) {
          setSolved(true); setStars(3); setCook("cheer");
          setStatus({ tone: "ok", text: `Fewest pieces! ${nn} big block${nn === 1 ? "" : "s"} out of ${nd} — ÷${k} top and bottom, and the amount held. Next stage!` });
          say("r4Fewest");
          // Report correct to engine and apply decision.
          const dec = reportAttemptR4({ correct: true, answerValue: [nn, nd], errorSignature: null, stars: 3 });
          setTimeout(() => applyEngineDecisionR4(dec, true), 1500);
        } else {
          setStatus({ tone: "ok", text: `Fused into bigger blocks — ÷${k} top and bottom. Keep going — can you tidy it further?` });
          say("r4Bigger");
        }
      } else {
        // Bind: fusing changes the target; the child must now WRITE this new form.
        setStatus({ tone: "ok", text: tidy
          ? `Fewest pieces — ${nn} out of ${nd}. Now write ${nn} over ${nd} on the Slate.`
          : `Bigger blocks — ${nn} out of ${nd}. Copy that fraction onto the Slate (or fuse again first).` });
        say(tidy ? "r4Fewest" : "r4Bigger");
      }
    } else {
      setBounceK(k); setCook("think");
      setTimeout(() => setBounceK(0), 460);
      setStatus({ tone: "warn", text: `Fuse-by-${k} doesn't come out even — ${num} and ${den} can't both split into ${k}s. Try another group size.` });
      say("r4Uneven");
    }
  }

  // ── Stage 3 (Fade): pick a shared factor symbolically (dims the bar) ─────────
  function pickFactor(k) {
    if (solvedRef.current) return;
    if (START_NUM % k === 0 && START_DEN % k === 0) {
      setPickedK(k); setCook("idle");
      setStatus({ tone: "ok", text: `${k} divides both 8 and 12. So 8/12 = ${START_NUM / k}/${START_DEN / k}. Write that tidied line on the Slate.` });
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
      setStatus({ tone: "warn", text: "Write the tidied fraction — a top number and a bottom number." });
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
      reportAttemptR4({ correct: false, answerValue: [tn, td], errorSignature: dividedDifferently ? "scaled_bottom_only" : null, stars: 0 });
      return false;
    }
    const fully = gcd(tn, td) === 1;
    if (requireLowest && !fully) {
      setCook("think");
      setStatus({ tone: "warn", text: `${tn}/${td} is the right amount, but not the fewest pieces yet. Tidy it all the way down.` });
      say("r4Bigger");
      // Report as incorrect (not-simplified).
      reportAttemptR4({ correct: false, answerValue: [tn, td], errorSignature: "not_simplified", stars: 0 });
      return false;
    }
    // success
    const st = fully ? 3 : 2;
    setSolved(true); solvedRef.current = true; setStars(st); setCook("cheer");
    setStatus({ tone: "ok", text: fully
      ? `Yes! ${START_NUM}/${START_DEN} tidies all the way to ${tn}/${td} — the fewest, biggest pieces, povaryonok! Next stage!`
      : `Right amount — ${tn}/${td} equals ${START_NUM}/${START_DEN}. Two marks. Try to take it all the way to lowest terms.` });
    say(fully ? "r3FullMarks" : "r3Partial");
    return true;
  }

  // Per-stage submit handlers.
  function submitBind() {
    // Bind accepts any equal-amount form the bar currently shows (partial credit),
    // but advance only once they've written a same-amount fraction.
    const ok = gradeSlate({ requireLowest: false });
    if (ok) {
      const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
      const dec = reportAttemptR4({ correct: true, answerValue: [tn, td], errorSignature: null, stars: gcd(tn, td) === 1 ? 3 : 2 });
      setTimeout(() => applyEngineDecisionR4(dec, true), 1500);
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
      const dec = reportAttemptR4({ correct: true, answerValue: [tn, td], errorSignature: null, stars: gcd(tn, td) === 1 ? 3 : 2 });
      setTimeout(() => applyEngineDecisionR4(dec, true), 1500);
    }
  }
  function submitNumbers() {
    const ok = gradeSlate({ requireLowest: true });
    if (ok) {
      const tn = parseInt(slate.n, 10), td = parseInt(slate.d, 10);
      const dec = reportAttemptR4({ correct: true, answerValue: [tn, td], errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecisionR4(dec, true), 1500);
    }
  }
  function submitWords(vals) {
    const v = vals || slate;
    const ok = gradeSlate({ requireLowest: true, n: v.n, d: v.d });
    if (ok) {
      const tn = parseInt(v.n, 10), td = parseInt(v.d, 10);
      reportAttemptR4({ correct: true, answerValue: [tn, td], errorSignature: null, stars: 3 });
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
    setStatus({ tone: "ok", text: `That's it — ${START_NUM}/${START_DEN} of the loaf is left. Now write it with the fewest, biggest pieces.` });
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
      const dec = reportAttemptR4({ correct: true, answerValue: [tn, td], errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecisionR4(dec, true), 1500);
    }
  }

  // Reset the CURRENT stage (toolbar ⟲).
  function reset() { gotoStage(stageRef.current); }

  // ruler labels: 0 and 1 only.
  const RLAB = [[0, "0"], [den, "1"]];

  // the fuse choices offered in Manipulate / Bind. 2 and 3 reach a tidy result.
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
  // has no writing — its readiness is "fewest pieces reached" (isFewest).
  const slateFilled = slate.n !== "" && slate.d !== "";
  const answerReady = !solved && (
    stage === "manipulate" ? isFewest
    : stage === "fade" ? (!!pickedK && slateFilled)
    : stage === "applied" ? (setupOk && slateFilled)
    : slateFilled
  );

  return (
    <div className="page" data-vox-speaker="cook">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№{no}</span>
          <div>
            <div className="puzzle-tag">Lesson {no} · Simplifying</div>
            <div className="puzzle-title">{title}</div>
          </div>
        </div>
        <div className="controls">
          {onBack && <button className="ctrl-btn" title="Back to the lesson map" onClick={onBack}>←</button>}
          {onRewatchIntro && (
            <button className="ctrl-btn" title="Rewatch the intro video" aria-label="Rewatch the intro video" onClick={onRewatchIntro}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 8.4 L16 12 L10 15.6 Z" fill="currentColor" /></svg>
            </button>
          )}
          <SettingsButton />
          <button className="ctrl-btn" title="Start this stage over" onClick={reset}>⟲</button>
        </div>
      </div>

      {/* ── the stage selector: jump to any arc stage in one click ─────────── */}
      <div className="r4-stagebar" role="tablist" aria-label="Lesson stages">
        {STAGES.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={stage === s.id}
            className={"r4-stagechip" + (stage === s.id ? " active" : "")}
            onClick={() => gotoStage(s.id)}
            title={s.blurb}
          >
            <span className="r4-stage-n">{s.n}</span>
            <span className="r4-stage-tx">
              <span className="r4-stage-tag">{s.tag}</span>
              <span className="r4-stage-blurb">{s.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      {/* ── THE QUESTION (Change A): the canonical full-width band, mounted
         directly under the stage tabs on every stage EXCEPT the final words-only
         stage. Shows the bare equation 8/12 = ?; the "?" becomes the solved
         lowest-terms value (2/3) once solved. On the WORDS stage the band is
         deliberately omitted — the whole point there is that the child reads the
         prose and extracts the math themselves, so showing the bare equation
         would give the answer away. (Applied keeps it; it shows numerals.) ── */}
      {stage !== "words" && (
        <QuestionBand
          lead="the question"
          expr={<BigFrac num={START_NUM} den={START_DEN} />}
          answer={solved ? <BigFrac num={LOW_NUM} den={LOW_DEN} /> : "?"}
        />
      )}

      <div className="goal">
        <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("r4Goal")}>
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div className="goal-text" data-vox="r4Goal" data-vox-speaker="mom">{stageGoal(stage)}</div>
      </div>

      {stage === "showwork" ? (
        /* ════════════════════════════════════════════════════════════════════
           SHOW WORK — MANDATORY BLANK-SLATE STEP (between Applied and Words)
           A pure presence gate: the child writes anything on a 100%-blank slate;
           "Next" unlocks once any ink lands (onInkChange). Ungraded — no engine
           judge; advancement is a plain goStage to Words. ── */
        <div className="r4-s r4-s-wordsmode">
          <div className="r4-s-story">
            <FitStage className="r4-s-fit" axis="y">
              <div className="wp-card r4-s-card">
                <div className="wp-card-head">
                  <span className="wp-tag">Show Your Work</span>
                </div>
                <p className="wp-story r4-s-story-text">
                  Show how you'd tidy <b>{START_NUM}/{START_DEN}</b> — write anything you like on the slate. When you've put something down, tap Next.
                </p>
              </div>
              <div className="r4-s-setup">
                <span className="r4-s-setup-lead">Show your work here</span>
                <div className="bs-surface" style={{ position: "relative", width: 800, height: 360 }}>
                  <BlankSlate
                    key={`showwork:${stage}`}
                    hint="show your work here — write anything you like ✎"
                    onInkChange={setShowWorkInked}
                    ariaLabel="show your work on a blank slate"
                  />
                </div>
              </div>
            </FitStage>
          </div>

          <div className="r4-s-answer r4-s-answer-words">
            <div className="r4-s-ansprompt">When you've shown your work, move on</div>
            <div className="r4-s-answrite">
              <div className="r4-s-marks">
                <button
                  className={"check" + (showWorkInked ? " ready" : "")}
                  disabled={!showWorkInked}
                  onClick={() => gotoStage("words")}
                >Next →</button>
              </div>
            </div>
          </div>

          <div className="r4-s-tutor">
            <div className="cook-stage"><Cook expr={cook} width={118} /></div>
            <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
          </div>
        </div>
      ) : (stage === "applied" || stage === "words") ? (
        /* ════════════════════════════════════════════════════════════════════
           WORDS / APPLIED — DETERMINISTIC FIXED-ZONE LAYOUT
             · .r4-s-story  — recipe card + (Applied) the required setup gate
             · .r4-s-answer — answer Slate + Check, ONE bordered card (bottom-left)
             · .r4-s-tutor  — Cook + ribbon (bottom-right)
           Every zone is a fixed rectangle with clamped text, so a longer string
           or a different font can never reflow one zone onto another. ── */
        <div className={"r4-s r4-s-wordsmode" + (stage === "words" ? " r4-s-onlywords" : "")}>
          {/* STORY ZONE (fixed rect, top) */}
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
                    ? <span className="r4-setup-ok">✓ that's {START_NUM}/{START_DEN} — now simplify it</span>
                    : <button type="button" className="wp-check" onClick={checkSetup}>Check the fraction</button>}
                </div>
              ) : (
                <div className="bs-surface r4-s-scratch-surface" style={{ position: "relative" }}>
                  <BlankSlate key="words-scratch" hint="optional — show your work here ✎" />
                </div>
              )}
            </div>
          </div>

          {/* ANSWER ZONE — Slate + Check, ONE card (fixed rect, bottom-left) */}
          <div className="r4-s-answer r4-s-answer-words">
            <div className="r4-s-ansprompt">
              {stage === "applied" ? "Now write it with the fewest, biggest pieces" : "Write the simplest fraction of the loaf left"}
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
                  onClick={() => (solved ? advanceStage() : stage === "applied" ? submitApplied(slate) : submitWords(slate))}
                  disabled={stage === "applied" && !setupOk && !solved}
                >{solved ? (stage === "words" ? "Tidied" : "Next →") : "Check"}</button>
              </div>
            </div>
          </div>

          {/* TUTOR ZONE (fixed rect, bottom-right) */}
          <div className="r4-s-tutor">
            <div className="cook-stage"><Cook expr={cook} width={118} /></div>
            <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           MANIPULATE / BIND / FADE / NUMBERS — DETERMINISTIC FIXED-ZONE LAYOUT
             · .r4-s-blocks — the bar/fuse canvas (or bare equation)  (top-left)
             · .r4-s-rail   — the per-stage tool/hint + pieces meter   (top-right)
             · .r4-s-answer — equation + answer Slate + Check, ONE card (bottom-left)
             · .r4-s-tutor  — Cook + ribbon                            (bottom-right)
           Heights never depend on text content (clamped), so a longer string or a
           different font can never grow a zone into its neighbour. ── */
        <div className="r4-s">
          {/* ── BLOCK / EQUATION ZONE (fixed rect, top-left) ── */}
          <div className="r4-s-blocks">
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
                  <div className={"eqstate eqfloat r4-tidy" + (isFewest ? " ok" : "")}>
                    {isFewest ? "✓ fewest pieces" : "tidy it down"}
                  </div>

                  {/* the fixed height guide — the bar's right edge keeps meeting it */}
                  <div className="r4-guide" style={{ left: barRightX, top: BAR_Y - 26, height: (LINE_Y - BAR_Y) + 26 + 6 }}>
                    <span className="r4-guide-cap">amount holds</span>
                  </div>

                  {/* ruler 0 → 1, a tick every 1/den */}
                  <div className="nline" style={{ top: LINE_Y, left: ORIGIN, right: "auto", width: UNIT }} />
                  {Array.from({ length: den + 1 }).map((_, k) => (
                    <span key={k} className="ntick" style={{ left: ORIGIN + (k / den) * UNIT, top: LINE_Y, height: (k === 0 || k === den) ? 14 : 8 }} />
                  ))}
                  {RLAB.map(([k, lab]) => (
                    <span key={k} className="nlab ng" style={{ left: ORIGIN + (k / den) * UNIT, top: LINE_Y + 12 }}>{lab}</span>
                  ))}

                  {/* the fraction label + the bar of `num` blocks. Stage 3 dims it. */}
                  <div className="r4-bar" style={{ left: ORIGIN, top: BAR_Y }}>
                    <div className="btag">
                      <BigFrac num={num} den={den}><DivChips divs={divs} /></BigFrac>
                    </div>
                    <FuseBar num={num} den={den} unit={UNIT} animKey={fuseTick} dim={stage === "fade"} />
                    <div className="r4-valnote">same amount: {START_NUM}/{START_DEN} of a tray</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── TOOL / HINT RAIL (fixed rect, top-right) ── */}
          <div className="r4-s-rail">
            {(stage === "manipulate" || stage === "bind") && (
              <div className="panel">
                <h3 className="pick-title">Fuse Tool</h3>
                <div className="hint"><b>Drag</b> a group size onto the bar. If the blocks split into that many evenly, they fuse into fewer, bigger pieces — divide the top <b>and</b> bottom by it.</div>
                <div className="r4-fuse-tray">
                  {FUSE_CHOICES.map((k) => {
                    const even = num % k === 0 && den % k === 0;
                    return (
                      <button key={k} className={"r4-fuse-btn" + (bounceK === k ? " bounce" : "") + (drag && drag.kind === "fuse" && drag.k === k ? " is-dragging" : "")}
                        style={{ touchAction: "none" }}
                        disabled={(stage === "manipulate" && solved) || !even}
                        onPointerDown={(e) => grabChip(e, k, "fuse")}
                        onClick={(e) => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } if (e.detail !== 0) return; /* pointer tap: drag required */ fuse(k); }}
                        title={`Drag onto the bar to fuse equal groups of ${k}`}>
                        <span className="r4-fuse-k">{k}</span>
                        <span className="r4-fuse-txt">
                          <span className="r4-fuse-title">Fuse by {k}</span>
                          <span className="r4-fuse-sub">{even ? `÷${k} top & bottom` : "won't come out even"}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="r4-meter">
                  <div className="r4-meter-row">
                    <span className="r4-meter-lab">on the bar</span>
                    <span className={"r4-meter-val" + (isFewest ? " fewest" : "")}>{num}</span>
                  </div>
                  <div className="r4-dots">
                    {Array.from({ length: START_NUM }).map((_, i) => (
                      <span key={i} className={"r4-dot" + (i < num ? (isFewest ? " fewest" : "") : " gone")} />
                    ))}
                  </div>
                  <div className="r4-meter-note">{isFewest ? "Nothing left to tidy — fewest, biggest pieces." : "Fuse to reach the fewest pieces."}</div>
                </div>
              </div>
            )}

            {stage === "fade" && (
              <div className="panel">
                <h3 className="pick-title">Shared Factor</h3>
                <div className="hint">The bar is fading — choose with numbers now. <b>Drag</b> the ÷ number that divides <b>both</b> 8 and 12 onto the equation.</div>
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
            )}

            {stage === "numbers" && (
              <div className="panel">
                <h3 className="pick-title">Lowest Terms</h3>
                <div className="hint">No tools — just the numbers. Divide the top and bottom by their largest shared factor, then write the fewest-pieces fraction on the Slate.</div>
                <div className="r4-card">
                  <BigFrac num={START_NUM} den={START_DEN} />
                  <div className="r4-card-note">write this in<br /><b>lowest terms</b></div>
                </div>
              </div>
            )}
          </div>

          {/* ── EQUATION + ANSWER, ONE UNIT (fixed rect, bottom-left) ── */}
          <div className="r4-s-answer">
            {stage === "manipulate" ? (
              /* Manipulate has no writing — show the live amount + Fuse/Next. */
              <>
                <div className="r4-s-eqrow">
                  <span className="r4-s-frac"><BigFrac num={num} den={den} /></span>
                  <span className="r4-s-eq">=</span>
                  <span className="r4-s-amt">{START_NUM}/{START_DEN} of a tray</span>
                  <div className="r4-s-marks">
                    {solved && <Rosette count={stars} />}
                    <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
                      onClick={solved ? advanceStage : undefined} disabled={!solved}>
                      {solved ? "Next →" : "Fuse to tidy"}
                    </button>
                  </div>
                </div>
                <div className="r4-s-cap">{solved ? "fewest pieces reached — next stage" : "fuse equal groups into fewer, bigger blocks"}</div>
              </>
            ) : (
              /* Bind / Fade / Numbers: 8/12 = [Slate], all one midline, Check beside. */
              <>
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
                      ariaLabel="write the tidied fraction"
                    />
                  </span>
                  <div className="r4-s-marks">
                    {solved && <Rosette count={stars} />}
                    <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")}
                      onClick={stage === "bind" ? submitBind : stage === "fade" ? submitFade : submitNumbers}>
                      {solved ? "Tidied" : "Check"}
                    </button>
                  </div>
                </div>
                <div className="r4-s-cap">{solved
                  ? (stars === 3 ? `tidied all the way — ${START_NUM}/${START_DEN} = ${slate.n}/${slate.d}!` : "correct amount, but it can tidy further")
                  : stage === "fade"
                  ? (pickedK ? `you divided by ${pickedK} — write ${fadeN} over ${fadeD}` : "pick a shared factor, then write the tidied line")
                  : "write the tidied fraction on the Slate, then Check"}</div>
              </>
            )}
          </div>

          {/* ── TUTOR ZONE (fixed rect, bottom-right) ── */}
          <div className="r4-s-tutor">
            <div className="cook-stage"><Cook expr={cook} width={118} /></div>
            <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
          </div>
        </div>
      )}

      {/* ── the dragging GHOST (Change B): follows the pointer in real time while
         a Fuse/Factor chip is in flight. Fixed-position, pointer-events:none. ── */}
      {drag && (
        <div
          className={"r4-drag-ghost" + (drag.kind === "factor" ? " r4-drag-ghost-factor" : " r4-drag-ghost-fuse") + (hotDrop ? " is-hot" : "")}
          style={{ left: drag.x, top: drag.y, position: "fixed" }}
          aria-hidden="true"
        >
          {drag.kind === "factor"
            ? <span className="r4-drag-ghost-k">÷{drag.k}</span>
            : <><span className="r4-fuse-k">{drag.k}</span><span className="r4-drag-ghost-lab">Fuse by {drag.k}</span></>}
        </div>
      )}
    </div>
  );
}

// ── per-stage goal copy (captions, since the audience reads) ──────────────────
function stageGoal(stage) {
  switch (stage) {
    case "manipulate":
      return (<>Babushka's answer came out as <b>{START_NUM}/{START_DEN}</b> — too many tiny pieces. Fuse equal groups into bigger blocks until it's tidy. The amount never changes.</>);
    case "bind":
      return (<>Fuse the bar into fewer, bigger blocks — and each time, <b>copy the new fraction</b> onto the Slate. The stack IS that number.</>);
    case "fade":
      return (<>The blocks are fading. <b>Pick the number</b> that divides both 8 and 12, then <b>write</b> the tidied line yourself.</>);
    case "numbers":
      return (<>Just the numbers: <b>{START_NUM}/{START_DEN} = ?</b> Write it in lowest terms on the Slate — no blocks to lean on.</>);
    case "applied":
      return (<>A question in words. First <b>write the fraction</b> it describes ({START_NUM}/{START_DEN}); once that's checked, <b>write it with the fewest, biggest pieces</b>.</>);
    case "showwork":
      return (<>Now <b>show your work</b> on the blank slate — write anything you like. When you've put something down, tap <b>Next</b>.</>);
    case "words":
      return (<>Read Babushka's recipe. The leftover comes out as a messy fraction — <b>write the simplest form</b> of the total.</>);
    default:
      return "";
  }
}

// ── the Applied (Stage 5) sentence. The fraction numerals are SHOWN; the child
// transcribes 8/12 in the setup gate, then writes the lowest-terms form. ──
const APPLIED_STORY = (
  <><b>{START_NUM}/{START_DEN}</b> of the loaf is left — write it with the fewest, biggest pieces.</>
);

// ── the Stage-6 word problem. The numbers come out as 8/12 of the loaf, which
// must be SIMPLIFIED to 2/3 — exactly the worked example, now told in words. ──
const WORDS_STORY = (
  <>Babushka cut her sourdough loaf into <b>twelve</b> even slices for the week.
  By Friday the family had eaten four of them, so <b>eight</b> slices are left.
  What fraction of the whole loaf is left — written with the fewest, biggest pieces?</>
);

// Plain-string versions for Read-aloud: say() stringifies its argument, so a JSX
// node would be spoken as "[object Object]". These carry the same words.
const APPLIED_SAY = `${START_NUM}/${START_DEN} of the loaf is left — write it with the fewest, biggest pieces.`;
const WORDS_SAY = "Babushka cut her sourdough loaf into twelve even slices for the week. By Friday the family had eaten four of them, so eight slices are left. What fraction of the whole loaf is left, written with the fewest, biggest pieces?";
