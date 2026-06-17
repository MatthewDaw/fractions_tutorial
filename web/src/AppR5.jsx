// AppR5.jsx — №10 Mixed Numbers (R5, IMPROPER_TO_MIXED). A 0→2 quarter strip
// shows 7/4 pieces shaded — it runs past the 1 mark so it's more than one whole.
// The child learns to CONVERT between improper fractions and mixed numbers in both
// directions, building on a visual number-line strip.
//
// THE INTERACTION ARC (matches wireframe r5.js):
//   Stage 1 · Identify       — 7/4 on a 0→2 strip; fill in the fraction (n and d).
//   Stage 2 · Fill a Whole   — 4/4 on a 0→1 strip; see that d/d = 1 whole.
//   Stage 3 · Read           — 7/4 strip; fill the mixed number (whole + fraction).
//   Stage 4 · How Many Wholes — 11/4 on a 0→3 strip; fill the mixed number.
//   Stage 5 · The Other Way  — start from 1¾, fill the improper fraction 7/4.
//   Stage 6 · Numbers        — no picture; convert both ways from symbols.
//   ★ Practice               — auto-generated IMPROPER_TO_MIXED variations.
//
// LAYOUT: LessonShell / LessonBoard / AnswerBar / TutorRibbon from the shared
// lesson library. Engine wiring via useLessonScaffold. CSS in styles/r5.css.
import React, { useState } from "react";
import Slate from "./components/Slate.jsx";
import FitStage from "./components/FitStage.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";
import "./styles/r5.css";

// ── Stage IDs (interaction logic) ────────────────────────────────────────────
// The badge/name/sub copy comes from the registry (lessons/r5.js) zipped by
// position — no inline identity duplication.
const STAGE_IDS = ["1-identify", "2-fill", "3-read", "4-wholes", "5-back", "6-numbers", "practice"];
const NEXT_STAGE = {
  "1-identify": "2-fill",
  "2-fill": "3-read",
  "3-read": "4-wholes",
  "4-wholes": "5-back",
  "5-back": "6-numbers",
  "6-numbers": "practice",
};

// ── Per-stage problem params ──────────────────────────────────────────────────
// Each stage uses a fixed worked-example (mirrors the wireframe exactly).
function probForStage(s) {
  if (s === "2-fill") return { num: 4, den: 4, wholes: 2 };    // 4/4 on 0→1 strip (wholes=2 means maxWholes for ruler)
  if (s === "4-wholes") return { num: 11, den: 4, wholes: 3 }; // 11/4 on 0→3 strip
  return { num: 7, den: 4, wholes: 2 }; // 7/4 on 0→2 strip (stages 1,3,5,6,practice)
}

function mixedOf(num, den) {
  return { w: Math.floor(num / den), n: num % den, d: den };
}

// ── Greeting per stage ────────────────────────────────────────────────────────
function stageGreeting(s) {
  return {
    "1-identify": "Build it from the strip — four quarters in a whole on the bottom, seven shaded on top. That's 7/4, and it passes the 1 mark, so more than a whole.",
    "2-fill": "All four quarters shaded fills the unit from 0 to 1 — that's 4/4, which is one whole. Top equals bottom always makes one.",
    "3-read": "The first unit is full — one whole. Three quarters spill past the 1 mark — the leftover. So 7/4 is one and three-quarters, 1¾.",
    "4-wholes": "Each whole takes four quarters. Eight quarters make two wholes, and three are left — so 11/4 is 2¾. It's 11 divided by 4, remainder 3.",
    "5-back": "Now go the other way — start from 1¾ and fill in the improper fraction it equals.",
    "6-numbers": "No picture now. Convert both ways from the symbols using the two rules.",
  }[s] ?? "Fresh problems — paced to your mastery.";
}

// ── DigitGrid — 0–9 number picker (two columns: 0–4 | 5–9) ──────────────────
// `on` highlights the currently committed digit. Clicking calls onPick(digit).
function DigitGrid({ on = null, onPick, disabled = false }) {
  const col = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i).map((k) => (
      <div
        key={k}
        className={"den-num" + (k === on ? " is-on" : "")}
        onClick={disabled ? undefined : () => onPick(k)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={disabled ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") onPick(k); }}
        aria-pressed={k === on}
        aria-label={String(k)}
      >
        {k}
      </div>
    ));
  return (
    <div className="eq-numgrid">
      <div className="den-numcol">{col(0, 4)}</div>
      <div className="den-numcol">{col(5, 9)}</div>
    </div>
  );
}

// ── MixRuler React component ──────────────────────────────────────────────────
// A number-line strip running 0 → maxWholes, cut into `den` pieces per whole,
// with the first `num` pieces shaded. Whole boundaries get a heavier divider;
// labels 0,1,2… sit below the strip.
function MixRuler({ num, den, maxWholes, width = 520 }) {
  const total = maxWholes * den;
  const segW = width / total;
  return (
    <div className="r5-ruler-wrap" style={{ width }}>
      <div className="r5-ruler" style={{ width }}>
        {Array.from({ length: total }).map((_, i) => {
          const shaded = i < num;
          const isWholeEnd = (i + 1) % den === 0 && i + 1 < total;
          return (
            <div
              key={i}
              className={"r5-seg" + (shaded ? " is-on" : "") + (isWholeEnd ? " whole-end" : "")}
              style={{ width: segW }}
            />
          );
        })}
      </div>
      <div className="r5-ruler-labels" style={{ width }}>
        {Array.from({ length: maxWholes + 1 }).map((_, i) => (
          <span key={i} style={{ left: (i * den * segW) }}>{i}</span>
        ))}
      </div>
    </div>
  );
}

// ── BigFracDisplay — a static improper fraction glyph (red top, ink bar) ─────
function BigFracDisplay({ num, den, size = 56 }) {
  return (
    <div className="r5-bigfrac" style={{ fontSize: size }}>
      <span className="r5-bf-n">{num}</span>
      <span className="r5-bf-bar" />
      <span className="r5-bf-d">{den}</span>
    </div>
  );
}

// ── MixedNumDisplay — a static mixed number glyph ────────────────────────────
function MixedNumDisplay({ w, n, d, size = 48 }) {
  return (
    <span className="r5-mixnum" style={{ fontSize: size }}>
      <span className="r5-mn-whole">{w}</span>
      <span className="r5-mn-frac">
        <span className="r5-mn-n">{n}</span>
        <span className="r5-mn-d">{d}</span>
      </span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AppR5({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {
  // Per-stage answer slots. Reset on stage change via resetStage.
  // For fraction slots: { n, d }; for mixed slots: { w, n }; for stage 6: { iw, in: inN, fn, fd }
  const [fracVals, setFracVals] = useState({ n: "", d: "" });
  const [mixVals, setMixVals] = useState({ w: "", n: "" });
  const [s6Vals, setS6Vals] = useState({ iw: "", in: "", fn: "", fd: "" }); // stage 6 both-ways
  const [bad, setBad] = useState(false);
  // Which slot is active for the digit-grid picker (stages 1–4)
  const [activeSlot, setActiveSlot] = useState(null); // e.g. "n","d","w"

  const shakeBad = () => { setBad(true); setTimeout(() => setBad(false), 460); };
  const onlyDigits = (s) => s.replace(/[^0-9]/g, "").slice(0, 2);

  // ── shared scaffold ──────────────────────────────────────────────────────────
  const sc = useLessonScaffold({
    nodeId: "IMPROPER_TO_MIXED",
    lessonId: "r5",
    initialStage: "1-identify",
    generatedStages: ["practice"],
    generatorSkill: "IMPROPER_TO_MIXED",
    advance: (cur) => NEXT_STAGE[cur],
    back: (cur) => {
      const idx = STAGE_IDS.indexOf(cur);
      return idx > 0 ? STAGE_IDS[idx - 1] : undefined;
    },
    introFor: (s) => ({ tone: "normal", text: stageGreeting(s) }),
    resetStage: (s) => {
      setFracVals({ n: "", d: "" });
      setMixVals({ w: "", n: "" });
      setS6Vals({ iw: "", in: "", fn: "", fd: "" });
      setBad(false);
      // Set the initial active slot for digit-grid stages
      if (s === "1-identify") setActiveSlot("n");
      else if (s === "2-fill") setActiveSlot("n");
      else if (s === "3-read" || s === "4-wholes") setActiveSlot("w");
      else setActiveSlot(null);
    },
    stumpingRecipe,
    inKitchen: false,
    onEnd: (dec) => {
      if (dec?.kind === "ReturnToKitchen") { onReturnToKitchen?.(); return; }
      goStage(stageRef.current);
    },
  });
  const {
    stage, goStage, nextStage,
    emit, reportAttempt, award,
    solved, solvedRef, stars, cook, setCook, status, setStatus,
    say, speaking, stageRef,
  } = sc;

  // ── identity + tab strip ─────────────────────────────────────────────────────
  const ident = useLessonIdentity("r5");
  const tabStages = ident.stages.map((s, i) => ({
    key: STAGE_IDS[i],
    badge: s.badge,
    title: s.title,
    sub: s.sub,
  }));

  // ── stage problem ─────────────────────────────────────────────────────────────
  const prob = probForStage(stage);
  const { num: NUM, den: DEN, wholes: MAX_WHOLES } = prob;
  const mixed = mixedOf(NUM, DEN);   // { w, n, d }

  const isPractice = stage === "practice";
  const isIdentify = stage === "1-identify";
  const isFill = stage === "2-fill";
  const isRead = stage === "3-read";
  const isWholes = stage === "4-wholes";
  const isBack = stage === "5-back";
  const isNumbers = stage === "6-numbers";

  // ── Digit-grid pick handler (stages 1–4) ─────────────────────────────────────
  // Clicking a digit fills the active slot and advances to the next open slot.
  function handleDigitPick(digit) {
    if (solved) return;
    const v = String(digit);
    if (isIdentify) {
      if (activeSlot === "n") {
        setFracVals((s) => ({ ...s, n: v }));
        setActiveSlot("d");
      } else {
        setFracVals((s) => ({ ...s, d: v }));
        setActiveSlot("n");
      }
    } else if (isFill) {
      // For d/d = 1 whole, picking a digit fills the active slot and advances
      if (activeSlot === "n") {
        setFracVals((s) => ({ ...s, n: v }));
        setActiveSlot("d");
      } else {
        setFracVals((s) => ({ ...s, d: v }));
        setActiveSlot("n");
      }
    } else if (isRead || isWholes) {
      if (activeSlot === "w") {
        setMixVals((s) => ({ ...s, w: v }));
        setActiveSlot("n");
      } else {
        setMixVals((s) => ({ ...s, n: v }));
        setActiveSlot("w");
      }
    }
  }

  // The digit currently shown as "on" in the digit grid (the last committed digit)
  const activeDigitVal = (() => {
    if (isIdentify || isFill) {
      const v = activeSlot === "n" ? fracVals.n : fracVals.d;
      return v !== "" ? parseInt(v, 10) : null;
    }
    if (isRead || isWholes) {
      const v = activeSlot === "w" ? mixVals.w : mixVals.n;
      return v !== "" ? parseInt(v, 10) : null;
    }
    return null;
  })();

  // ── CHECK logic ───────────────────────────────────────────────────────────────
  function checkAnswer() {
    if (solved) { nextStage(); return; }

    // Stage 1: fill the fraction n and d from strip (answer: 7/4)
    if (isIdentify) {
      const n = parseInt(fracVals.n, 10), d = parseInt(fracVals.d, 10);
      if (fracVals.n === "" || fracVals.d === "") { shakeBad(); setStatus({ tone: "warn", text: "Fill both slots — the top (how many shaded) and the bottom (pieces per whole)." }); return; }
      if (n !== NUM || d !== DEN) {
        shakeBad(); setCook("think");
        reportAttempt({ correct: false, answerValue: [n, d], stars: 0 });
        setStatus({ tone: "warn", text: "Not quite — count the shaded pieces for the top, and how many pieces make one whole for the bottom." });
        return;
      }
      award(`Yes! ${NUM}/${DEN} — ${NUM} shaded pieces, ${DEN} per whole. It runs past the 1 mark — more than a whole!`, "r5FullMarks", [NUM, DEN], { stars: 3 });
      return;
    }

    // Stage 2: fill d/d = 1 whole — answer: both slots = 4
    if (isFill) {
      const n = parseInt(fracVals.n, 10), d = parseInt(fracVals.d, 10);
      if (fracVals.n === "" || fracVals.d === "") { shakeBad(); setStatus({ tone: "warn", text: "Fill both slots — top and bottom should both be " + DEN + "." }); return; }
      if (n !== DEN || d !== DEN) {
        shakeBad(); setCook("think");
        reportAttempt({ correct: false, answerValue: [n, d], stars: 0 });
        setStatus({ tone: "warn", text: "All " + DEN + " pieces shaded — both top and bottom are " + DEN + "." });
        return;
      }
      award(`${DEN}/${DEN} = 1 whole. Top equals bottom always makes exactly one whole!`, "r5FullMarks", [DEN, DEN], { stars: 3 });
      return;
    }

    // Stage 3: fill the mixed number (whole=1, n=3, d=4)
    if (isRead) {
      const w = parseInt(mixVals.w, 10), n = parseInt(mixVals.n, 10);
      if (mixVals.w === "" || mixVals.n === "") { shakeBad(); setStatus({ tone: "warn", text: "Fill the whole number and the leftover fraction top." }); return; }
      if (w !== mixed.w || n !== mixed.n) {
        shakeBad(); setCook("think");
        reportAttempt({ correct: false, answerValue: [w, n], stars: 0 });
        setStatus({ tone: "warn", text: "The first unit 0→1 is full (that's " + mixed.w + " whole). Past the 1 mark, " + mixed.n + " more quarters are left over." });
        return;
      }
      award(`${NUM}/${DEN} = ${mixed.w}¾. One whole plus ${mixed.n}/${DEN} leftover — you read the strip!`, "r5FullMarks", [w, n], { stars: 3 });
      return;
    }

    // Stage 4: fill mixed number for 11/4 (answer: 2¾)
    if (isWholes) {
      const w = parseInt(mixVals.w, 10), n = parseInt(mixVals.n, 10);
      if (mixVals.w === "" || mixVals.n === "") { shakeBad(); setStatus({ tone: "warn", text: "Fill the whole number and the leftover fraction top." }); return; }
      if (w !== mixed.w || n !== mixed.n) {
        shakeBad(); setCook("think");
        reportAttempt({ correct: false, answerValue: [w, n], stars: 0 });
        setStatus({ tone: "warn", text: NUM + " ÷ " + DEN + " = " + mixed.w + " remainder " + mixed.n + ". That's the whole and the leftover." });
        return;
      }
      award(`${NUM}/${DEN} = ${mixed.w} and ${mixed.n}/${DEN}. ${NUM} ÷ ${DEN} = ${mixed.w} remainder ${mixed.n} — division made visual!`, "r5FullMarks", [w, n], { stars: 3 });
      return;
    }

    // Stage 5: fill the improper fraction from 1¾ (answer: 7/4)
    if (isBack) {
      const n = parseInt(fracVals.n, 10), d = parseInt(fracVals.d, 10);
      if (fracVals.n === "" || fracVals.d === "") { shakeBad(); setStatus({ tone: "warn", text: "Fill the top and the bottom — whole × bottom + top, over the same bottom." }); return; }
      if (n !== NUM || d !== DEN) {
        shakeBad(); setCook("think");
        reportAttempt({ correct: false, answerValue: [n, d], stars: 0 });
        setStatus({ tone: "warn", text: "1 whole is " + DEN + " quarters. " + DEN + " + " + mixed.n + " = " + NUM + " — fill " + NUM + "/" + DEN + "." });
        return;
      }
      award(`1¾ = ${NUM}/${DEN}. One whole is ${DEN} quarters, plus ${mixed.n} leftover = ${NUM}. Whole × bottom + top!`, "r5FullMarks", [n, d], { stars: 3 });
      return;
    }

    // Stage 6: convert both ways
    if (isNumbers) {
      // improper→mixed: iw and in must be correct (1 and 3 for 7/4)
      // mixed→improper: fn must be correct (7 for 7/4, fd fixed to 4)
      const iw = parseInt(s6Vals.iw, 10);
      const inN = parseInt(s6Vals.in, 10);
      const fn = parseInt(s6Vals.fn, 10);
      const allFilled = s6Vals.iw !== "" && s6Vals.in !== "" && s6Vals.fn !== "";
      if (!allFilled) { shakeBad(); setStatus({ tone: "warn", text: "Fill all three slots — the whole, the leftover top, and the improper top." }); return; }
      const ok = iw === mixed.w && inN === mixed.n && fn === NUM;
      if (!ok) {
        shakeBad(); setCook("think");
        reportAttempt({ correct: false, answerValue: [iw, inN, fn], stars: 0 });
        setStatus({ tone: "warn", text: "Check both directions: 7 ÷ 4 = 1 remainder 3 → 1¾; and 1 × 4 + 3 = 7 → 7/4." });
        return;
      }
      award("Both ways — 7/4 → 1¾ (divide), and 1¾ → 7/4 (multiply and add). Full marks!", "r5FullMarks", [iw, inN, fn], { stars: 3 });
      return;
    }
  }

  // ── Stage-specific readiness (lights up the Check button) ────────────────────
  let answerReady = false;
  if (!solved) {
    if (isIdentify || isBack) answerReady = fracVals.n !== "" && fracVals.d !== "";
    else if (isFill) answerReady = fracVals.n !== "" && fracVals.d !== "";
    else if (isRead || isWholes) answerReady = mixVals.w !== "" && mixVals.n !== "";
    else if (isNumbers) answerReady = s6Vals.iw !== "" && s6Vals.in !== "" && s6Vals.fn !== "";
  }

  // ── Tutor ribbon ──────────────────────────────────────────────────────────────
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── Goal ──────────────────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="r5Goal" voxSpeaker="mom">
      {isIdentify && <>Count the shaded pieces and fill in the fraction — how many make one whole, and how many are shaded?</>}
      {isFill && <>Shade all {DEN} pieces. See that {DEN}/{DEN} = <b>1 whole</b>. Top equals bottom always makes one.</>}
      {isRead && <><b>{NUM}/{DEN}</b> on the strip — fill in the mixed number. One full unit is the whole; the rest is the fraction part.</>}
      {isWholes && <><b>{NUM}/{DEN}</b> — how many whole units fill, and what's left over? {NUM} ÷ {DEN} = {mixed.w} remainder {mixed.n}.</>}
      {isBack && <>Start from <b>1¾</b> and fill in the improper fraction. Break the whole into {DEN} quarters, then add the leftover.</>}
      {isNumbers && <>No picture — convert both ways. <b>Improper → mixed:</b> divide. <b>Mixed → improper:</b> whole × bottom + top.</>}
      {isPractice && "Fresh problems — paced to your mastery."}
    </LessonGoal>
  );

  // ── Check label ───────────────────────────────────────────────────────────────
  const checkLabel = solved ? (NEXT_STAGE[stage] ? "Next ▸" : "Again") : "Check";

  // ── PRACTICE ──────────────────────────────────────────────────────────────────
  if (isPractice) {
    return (
      <LessonShell
        no={ident.no}
        tag={ident.tag.replace(/^Lesson\s+\d+\s*·\s*/, "")}
        title={title || ident.title}
        onBack={onBack}
        onRewatchIntro={onRewatchIntro}
        onReset={() => goStage(stage)}
        tabs={{ stages: tabStages, current: stage, onSelect: goStage }}
        goal={Goal}
      >
        <GenPracticeBoard skill="IMPROPER_TO_MIXED" scaffold={sc} />
      </LessonShell>
    );
  }

  // ── STAGES 1–6: shared LessonBoard layout ────────────────────────────────────

  // ── Stage area ───────────────────────────────────────────────────────────────
  const Stage = (
    <FitStage className="r5-board-fit">
      <div className="r5-stage-canvas">

        {/* ── Stages 1–4: digit-grid left + ruler + inline equation right ── */}
        {(isIdentify || isFill || isRead || isWholes) && (
          <div className="r5-stage-row">
            <DigitGrid on={activeDigitVal} onPick={handleDigitPick} disabled={solved} />
            <div className="r5-stage-col">
              {/* Ruler */}
              {(isIdentify || isRead) && (
                <MixRuler num={NUM} den={DEN} maxWholes={MAX_WHOLES} width={520} />
              )}
              {isFill && (
                <MixRuler num={NUM} den={DEN} maxWholes={1} width={320} />
              )}
              {isWholes && (
                <MixRuler num={NUM} den={DEN} maxWholes={MAX_WHOLES} width={660} />
              )}

              {/* Inline equation slots below the ruler */}
              {(isIdentify || isFill) && (
                <div className={"r5-stage-eq" + (bad ? " bad" : "")}>
                  <Slate
                    slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
                    values={fracVals}
                    onChange={(k, v) => setFracVals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                    onSubmit={checkAnswer}
                    layout="fraction"
                    den={DEN}
                    disabled={solved}
                    autoFocusKey={fracVals.n === "" ? "n" : "d"}
                    ariaLabel={isIdentify ? "fill in the fraction" : "fill 4/4 to show one whole"}
                  />
                  {isFill && (
                    <span className="r5-ans-eq">= <b style={{ color: "var(--red)" }}>1</b> whole</span>
                  )}
                </div>
              )}

              {(isRead || isWholes) && (
                <div className="r5-stage-eq">
                  <BigFracDisplay num={NUM} den={DEN} size={48} />
                  <span className="r5-ans-op">=</span>
                  <div className={"r5-write" + (bad ? " bad" : "")}>
                    <Slate
                      slots={[{ key: "w", label: "whole" }]}
                      values={{ w: mixVals.w }}
                      onChange={(k, v) => setMixVals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                      onSubmit={checkAnswer}
                      layout="row"
                      den={DEN}
                      disabled={solved}
                      autoFocusKey={mixVals.w === "" ? "w" : undefined}
                      ariaLabel="how many wholes"
                    />
                    <span className="r5-and">and</span>
                    <Slate
                      slots={[{ key: "n", label: "top" }, { key: "d", fixed: true, digit: DEN, label: "bottom" }]}
                      values={{ n: mixVals.n }}
                      onChange={(k, v) => setMixVals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                      onSubmit={checkAnswer}
                      layout="fraction"
                      den={DEN}
                      disabled={solved}
                      autoFocusKey={mixVals.w !== "" && mixVals.n === "" ? "n" : undefined}
                      ariaLabel="leftover fraction"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Stage 3 ruler also shown via isRead in the block above ── */}

        {/* ── Stage 5: equation below the ruler — 1¾ = [slots] ── */}
        {isBack && (
          <MixRuler num={NUM} den={DEN} maxWholes={MAX_WHOLES} width={520} />
        )}
        {isBack && (
          <div className="r5-stage-eq">
            <MixedNumDisplay w={mixed.w} n={mixed.n} d={DEN} size={48} />
            <span className="r5-ans-op">=</span>
            <div className={"r5-write" + (bad ? " bad" : "")}>
              <Slate
                slots={[{ key: "n", label: "top" }, { key: "d", label: "bottom" }]}
                values={fracVals}
                onChange={(k, v) => setFracVals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                onSubmit={checkAnswer}
                layout="fraction"
                den={DEN}
                disabled={solved}
                autoFocusKey={fracVals.n === "" ? "n" : "d"}
                ariaLabel="fill in the improper fraction"
              />
            </div>
          </div>
        )}

        {/* ── Stage 6: no picture — a split equation panel ── */}
        {isNumbers && (
          <div className="r5-numbers-panel">
            <div className="r5-numbers-row">
              <span className="r5-numbers-lab">improper → mixed</span>
              <div className="r5-numbers-eq">
                <BigFracDisplay num={NUM} den={DEN} size={48} />
                <span className="r5-eq-arrow">→</span>
                <div className={"r5-write" + (bad ? " bad" : "")}>
                  <Slate
                    slots={[{ key: "iw", label: "whole" }]}
                    values={{ iw: s6Vals.iw }}
                    onChange={(k, v) => setS6Vals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                    onSubmit={checkAnswer}
                    layout="row"
                    den={DEN}
                    disabled={solved}
                    autoFocusKey={s6Vals.iw === "" ? "iw" : undefined}
                    ariaLabel="whole number"
                  />
                  <span className="r5-and">and</span>
                  <Slate
                    slots={[{ key: "in", label: "top" }, { key: "d6", fixed: true, digit: DEN, label: "bottom" }]}
                    values={{ in: s6Vals.in }}
                    onChange={(k, v) => setS6Vals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                    onSubmit={checkAnswer}
                    layout="fraction"
                    den={DEN}
                    disabled={solved}
                    autoFocusKey={s6Vals.iw !== "" && s6Vals.in === "" ? "in" : undefined}
                    ariaLabel="leftover fraction"
                  />
                </div>
                <span className="r5-numbers-cap">{NUM} ÷ {DEN} = {mixed.w} remainder {mixed.n}</span>
              </div>
            </div>
            <div className="r5-numbers-row">
              <span className="r5-numbers-lab">mixed → improper</span>
              <div className="r5-numbers-eq">
                <MixedNumDisplay w={mixed.w} n={mixed.n} d={DEN} size={48} />
                <span className="r5-eq-arrow">→</span>
                <div className={"r5-write" + (bad ? " bad" : "")}>
                  <Slate
                    slots={[{ key: "fn", label: "top" }, { key: "fd", fixed: true, digit: DEN, label: "bottom" }]}
                    values={{ fn: s6Vals.fn }}
                    onChange={(k, v) => setS6Vals((s) => ({ ...s, [k]: onlyDigits(v) }))}
                    onSubmit={checkAnswer}
                    layout="fraction"
                    den={DEN}
                    disabled={solved}
                    autoFocusKey={s6Vals.in !== "" && s6Vals.fn === "" ? "fn" : undefined}
                    ariaLabel="improper fraction top"
                  />
                </div>
                <span className="r5-numbers-cap">{mixed.w} × {DEN} + {mixed.n} = {NUM}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </FitStage>
  );

  // ── Hint rail ─────────────────────────────────────────────────────────────────
  const Rail = (
    <div className="panel">
      {isIdentify && (
        <>
          <h3 className="pick-title">Fill In the Fraction</h3>
          <div className="hint">
            The strip runs <b>0 → 2</b>, cut into <b>quarters</b>. Pick a number and drop
            it in: the <b>bottom</b> is how many pieces make one whole (<b>4</b>), the
            <b> top</b> is how many are shaded (<b>7</b>). So it's <b>7/4</b> — and the red
            runs <b>past the 1 mark</b>, so it's more than one whole.
          </div>
        </>
      )}
      {isFill && (
        <>
          <h3 className="pick-title">Fill One Whole</h3>
          <div className="hint">
            Shade all <b>4</b> quarters and fill the fraction: <b>4/4</b>. The unit from
            <b> 0</b> to <b>1</b> is completely red — a full unit is <b>one whole</b>.
            Whenever the <b>top equals the bottom</b>, you have exactly <b>1</b>. That's
            how wholes hide inside an improper fraction.
          </div>
        </>
      )}
      {isRead && (
        <>
          <h3 className="pick-title">Read the Mixed Number</h3>
          <div className="hint">
            Read it off the strip and fill it in. The first unit <b>0→1</b> is full —
            that's <b>1 whole</b>. Past the <b>1</b> mark, <b>3</b> more quarters are
            shaded — the leftover <b>3/4</b>. So <b>7/4 = 1¾</b>: the <b>whole</b> is the
            full units, the <b>fraction</b> is what's left.
          </div>
        </>
      )}
      {isWholes && (
        <>
          <h3 className="pick-title">How Many Wholes Fit?</h3>
          <div className="hint">
            <b>11</b> quarters. Each whole needs <b>4</b>: so <b>8</b> fills <b>two</b>
            wholes, and <b>3</b> are left over. Fill in <b>2¾</b>. (That's just
            <b> 11 ÷ 4 = 2 remainder 3</b> — the remainder is the leftover pieces.)
          </div>
        </>
      )}
      {isBack && (
        <>
          <h3 className="pick-title">Break the Whole Back</h3>
          <div className="hint">
            Go the <b>other way</b>: start from <b>1¾</b> and break the whole unit
            back into <b>quarters</b>. <b>1</b> whole is <b>4</b> quarters; add the
            <b> 3</b> leftover and you have <b>7</b> — so fill in <b>7/4</b>.
            Rule: <b>whole × bottom + top</b>.
          </div>
        </>
      )}
      {isNumbers && (
        <>
          <h3 className="pick-title">Just the Numbers</h3>
          <div className="hint">
            <b>Improper → mixed:</b> divide top by bottom; the quotient is the
            <b> whole</b>, the remainder is the new top
            ({NUM} ÷ {DEN} = {mixed.w} r{mixed.n} → <b>{mixed.w}¾</b>).{" "}
            <b>Mixed → improper:</b> whole × bottom + top over the same bottom
            ({mixed.w} × {DEN} + {mixed.n} = <b>{NUM}/{DEN}</b>).
          </div>
        </>
      )}
    </div>
  );

  // ── Answer bar content ────────────────────────────────────────────────────────
  // Stages 1–4: answers are in the stage canvas; AnswerBar holds only Check.
  // Stage 5 (back): answer slots in stage canvas; AnswerBar holds only Check.
  // Stage 6: answers in stage canvas; AnswerBar holds only Check note.
  const Answer = (
    <AnswerBar
      eq={
        isNumbers ? (
          <span className="r5-ans-note">Fill in all slots above, then check.</span>
        ) : null
      }
      cap={
        solved
          ? (isIdentify || isFill) ? `${fracVals.n}/${fracVals.d} — correct!`
          : isBack ? `1¾ = ${NUM}/${DEN} — correct!`
          : (isRead || isWholes) ? `${NUM}/${DEN} = ${mixed.w} and ${mixed.n}/${DEN} — correct!`
          : null
          : isIdentify ? "pick a number and fill in the top, then the bottom"
          : isFill ? `fill in ${DEN}/${DEN} to show one whole`
          : isRead ? "fill the whole number and the leftover top"
          : isWholes ? "fill the whole number and the leftover top"
          : isBack ? "fill the top and bottom of the improper fraction"
          : "fill all slots above, then check"
      }
      solved={solved}
      ready={answerReady || (isNumbers && s6Vals.iw !== "" && s6Vals.in !== "" && s6Vals.fn !== "")}
      stars={stars}
      onCheck={checkAnswer}
      checkLabel={checkLabel}
    />
  );

  return (
    <LessonShell
      no={ident.no}
      tag={ident.tag.replace(/^Lesson\s+\d+\s*·\s*/, "")}
      title={title || ident.title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={() => goStage(stage)}
      tabs={{ stages: tabStages, current: stage, onSelect: goStage }}
      goal={Goal}
    >
      <LessonBoard
        footHeight={198}
        railWidth={372}
        rowGap={12}
        stage={Stage}
        rail={Rail}
        answer={Answer}
        tutor={Tutor}
      />
    </LessonShell>
  );
}
