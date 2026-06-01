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
  { id: "words",      n: 5, tag: "Words",      blurb: "Read the recipe, write the simplest" },
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

  const [status, setStatus] = useState(initialStatus("manipulate"));

  const { soundOn, speaking, say, stopVoice, toggleSound } = useVoice();
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

  return (
    <div className="page">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№{no}</span>
          <div>
            <div className="puzzle-tag">Lesson {no} · Simplifying</div>
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

      <div className="goal">
        <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say("r4Goal")}>
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div className="goal-text">{stageGoal(stage)}</div>
      </div>

      {/* ── WORDS stage (Stage 5): no blocks, no equation — a recipe + Slate ── */}
      {stage === "words" ? (
        <div className="play r4-play-words">
          <WordProblem
            tag="Babushka's Recipe"
            story={WORDS_STORY}
            readAloud={() => say(WORDS_STORY)}
            speaking={speaking}
            answerLead="Write the simplest fraction of the loaf that's left"
            slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
            values={slate}
            onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
            layout="fraction"
            den={LOW_DEN}
            disabled={solved}
            autoFocusKey="n"
            onCheck={(vals) => submitWords(vals)}
            checkLabel={solved ? "Tidied" : "Check"}
            checkDisabled={solved}
          />
          <div className="r4-words-side">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>
            {solved && (
              <div className="r4-words-rosette"><Rosette count={stars} /></div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="play">
            <div className="diagram">
              <div className="canvas" id="r3canvas">
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

                {/* the fraction label + the bar of `num` blocks. Stages 3/4 dim it. */}
                <div className="r4-bar" style={{ left: ORIGIN, top: BAR_Y }}>
                  <div className="btag">
                    <BigFrac
                      num={stage === "numbers" ? START_NUM : num}
                      den={stage === "numbers" ? START_DEN : den}
                    ><DivChips divs={divs} /></BigFrac>
                  </div>
                  <FuseBar
                    num={stage === "numbers" ? START_NUM : num}
                    den={stage === "numbers" ? START_DEN : den}
                    unit={UNIT}
                    animKey={fuseTick}
                    dim={stage === "fade" || stage === "numbers"}
                  />
                  <div className="r4-valnote">same amount: {START_NUM}/{START_DEN} of a tray</div>
                </div>
              </div>
            </div>

            {/* ── the rail changes by stage ──────────────────────────────── */}
            <div className="rail">
              {(stage === "manipulate" || stage === "bind") && (
                <div className="panel">
                  <h3 className="pick-title">Fuse Tool</h3>
                  <div className="hint">Pick a group size. If the blocks split into that many evenly, they fuse into fewer, bigger pieces — and you divide the top <b>and</b> bottom by it.</div>
                  <div className="r4-fuse-tray">
                    {FUSE_CHOICES.map((k) => {
                      const even = num % k === 0 && den % k === 0;
                      return (
                        <button key={k} className={"r4-fuse-btn" + (bounceK === k ? " bounce" : "")}
                          disabled={(stage === "manipulate" && solved) || !even} onClick={() => fuse(k)} title={`Fuse equal groups of ${k}`}>
                          <span className="r4-fuse-k">{k}</span>
                          <span className="r4-fuse-txt">
                            <span className="r4-fuse-title">Fuse by {k}</span>
                            <span className="r4-fuse-sub">{even ? `÷${k} top & bottom` : "won't come out even"}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="r4-card">
                    <BigFrac num={num} den={den} />
                    <div className="r4-card-note">fewer pieces<br /><b>same amount</b></div>
                  </div>
                </div>
              )}

              {stage === "fade" && (
                <div className="panel">
                  <h3 className="pick-title">Shared Factor</h3>
                  <div className="hint">The bar is fading — choose with numbers now. Pick the number that divides <b>both</b> 8 and 12. Then write the tidied line.</div>
                  <div className="r4-factor-tray">
                    {FACTOR_CHOICES.map((k) => {
                      const both = START_NUM % k === 0 && START_DEN % k === 0;
                      return (
                        <button key={k}
                          className={"r4-factor-btn" + (pickedK === k ? " picked" : "") + (bounceK === k ? " bounce" : "")}
                          disabled={solved} onClick={() => pickFactor(k)}
                          aria-pressed={pickedK === k} title={`Divide top and bottom by ${k}`}>
                          ÷{k}
                        </button>
                      );
                    })}
                  </div>
                  <div className="r4-fade-eq">
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
                  <div className="hint">No tools — just the numbers. Divide the top and bottom by their largest shared factor and write the fewest-pieces fraction on the Slate.</div>
                  <div className="r4-card">
                    <BigFrac num={START_NUM} den={START_DEN} />
                    <div className="r4-card-note">write this in<br /><b>lowest terms</b></div>
                  </div>
                </div>
              )}

              {/* ── the WRITING channel: a Slate, present from Stage 2 on ───── */}
              {stage !== "manipulate" && (
                <div className="panel r4-slate-panel">
                  <h3>{stage === "bind" ? "Copy the tidied fraction" : stage === "fade" ? "Write the tidied line" : "Write the answer"}</h3>
                  <div className="hint">{stage === "bind"
                    ? "Write the fraction the bar now shows."
                    : stage === "fade"
                    ? (pickedK ? `You divided by ${pickedK}. Write ${fadeN} over ${fadeD}.` : "Pick a shared factor first.")
                    : "Write 8/12 in its simplest form."}</div>
                  <div className="r4-slate-wrap">
                    <Slate
                      slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
                      values={slate}
                      onChange={(k, v) => setSlate((s) => ({ ...s, [k]: onlyDigits(v) }))}
                      onSubmit={stage === "bind" ? submitBind : stage === "fade" ? submitFade : submitNumbers}
                      layout="fraction"
                      den={slateDen}
                      disabled={solved}
                      autoFocusKey="n"
                      ariaLabel="write the tidied fraction"
                    />
                  </div>
                </div>
              )}

              <div className="panel">
                <h3>Pieces Remaining</h3>
                <div className="r4-meter">
                  <div className="r4-meter-row">
                    <span className="r4-meter-lab">on the bar</span>
                    <span className={"r4-meter-val" + (isFewest ? " fewest" : "")}>{stage === "numbers" ? START_NUM : num}</span>
                  </div>
                  <div className="r4-dots">
                    {Array.from({ length: START_NUM }).map((_, i) => (
                      <span key={i} className={"r4-dot" + (i < (stage === "numbers" ? START_NUM : num) ? (isFewest ? " fewest" : "") : " gone")} />
                    ))}
                  </div>
                  <div className="r4-meter-note">{isFewest ? "Nothing left to tidy — fewest, biggest pieces." : "Fuse to reach the fewest pieces."}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── HUD ───────────────────────────────────────────────────────── */}
          <div className="hud">
            <div className="cook-zone">
              <div className="cook-stage"><Cook expr={cook} width={118} /></div>
              <div className={"ribbon" + (status.tone === "warn" ? " warn" : "")}>{status.text}</div>
            </div>

            <div className="hud-eq">
              {stage === "manipulate" ? (
                <>
                  <div className="qeq">
                    <span>{num}</span><span className="qop">/</span><span>{den}</span>
                    <span className="qop">·</span>
                    <span className="r4-hud-amt">{START_NUM}/{START_DEN} of a tray</span>
                  </div>
                  <div className="qcap">{solved ? "fewest pieces reached — touch a stage to continue" : "fuse equal groups into fewer, bigger blocks"}</div>
                </>
              ) : (
                <>
                  <div className="qeq">
                    <span>{START_NUM}/{START_DEN}</span><span className="qop">=</span>
                    <span className="r4-hud-write">{slate.n || "?"}/{slate.d || "?"}</span>
                  </div>
                  <div className="qcap">{solved
                    ? (stars === 3 ? `tidied all the way — ${START_NUM}/${START_DEN} = ${slate.n}/${slate.d}!` : `correct amount, but it can tidy further`)
                    : "write the tidied fraction on the Slate"}</div>
                </>
              )}
            </div>

            <div className="marks">
              {solved && <Rosette count={stars} />}
              {stage === "manipulate" ? (
                <button className={"check" + (solved ? " done" : "")} onClick={solved ? advanceStage : undefined} disabled={!solved}>
                  {solved ? "Next →" : "Fuse"}
                </button>
              ) : (
                <button className={"check" + (solved ? " done" : "")}
                  onClick={stage === "bind" ? submitBind : stage === "fade" ? submitFade : submitNumbers}>
                  {solved ? "Tidied" : "Check"}
                </button>
              )}
            </div>
          </div>
        </>
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
    case "words":
      return (<>Read Babushka's recipe. The leftover comes out as a messy fraction — <b>write the simplest form</b> of the total.</>);
    default:
      return "";
  }
}

// ── the Stage-5 word problem. The numbers come out as 8/12 of the loaf, which
// must be SIMPLIFIED to 2/3 — exactly the worked example, now told in words. ──
const WORDS_STORY = (
  <>Babushka cut her sourdough loaf into <b>twelve</b> even slices for the week.
  By Friday the family had eaten four of them, so <b>eight</b> slices are left.
  What fraction of the whole loaf is left — written with the fewest, biggest pieces?</>
);
