// AppR5.jsx — №12 Mixed Numbers (R5, IMPROPER_TO_MIXED). A 0→2 quarter strip
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
// WAVE-F MIGRATION: no goal banner (instruction copy lives in <RailInstruction>),
// tutor ribbon corrective-only, shared asset primitives (MixRuler / MixedNum /
// MixedSlots / FracSlots / BigFrac / DigitGrid) from ./components/assets. The
// stage uses the wireframe's .eq-stage / .eq-col / .eq-eq / .eq-cap markup and the
// digit-grid drives the always-open fill-in slots (no Slate, no den→num gate).
// Engine wiring via useLessonScaffold is unchanged. CSS in styles/r5.css.
import React, { useState } from "react";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, RailInstruction } from "./components/lesson";
import { MixRuler, MixedNum, MixedSlots, FracSlots, BigFrac, DigitGrid } from "./components/assets";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";
import "./styles/r5.css";

// ── Stage IDs (interaction logic) ────────────────────────────────────────────
// The badge/name/sub copy comes from the registry (lessons/r5.js) zipped by
// position — no inline identity duplication.
// "Fill a Whole" (a full d/d strip = one whole) comes FIRST, so the child meets
// "one whole" before identifying the improper 7/4 in "Identify". The stage KEYS
// keep their original "1-"/"2-" prefixes (just identifiers); order lives here.
const STAGE_IDS = ["2-fill", "1-identify", "3-read", "4-wholes", "5-back", "6-numbers", "practice"];
const NEXT_STAGE = {
  "2-fill": "1-identify",
  "1-identify": "3-read",
  "3-read": "4-wholes",
  "4-wholes": "5-back",
  "5-back": "6-numbers",
  "6-numbers": "practice",
};

// ── Per-stage problem params ──────────────────────────────────────────────────
// Each stage uses a fixed worked-example (mirrors the wireframe exactly).
function probForStage(s) {
  if (s === "2-fill") return { num: 4, den: 4, wholes: 2 };    // 4/4 on 0→1 strip
  if (s === "4-wholes") return { num: 11, den: 4, wholes: 3 }; // 11/4 on 0→3 strip
  return { num: 7, den: 4, wholes: 2 }; // 7/4 on 0→2 strip (stages 1,3,5,6,practice)
}

function mixedOf(num, den) {
  return { w: Math.floor(num / den), n: num % den, d: den };
}

// ── Greeting per stage (the read-aloud line, formerly on the goal banner) ─────
function stageGreeting(s) {
  return {
    "1-identify": "Read the strip and write the fraction it shows. The bottom counts the equal pieces in one whole; the top counts how many are shaded.",
    "2-fill": "Shade all four quarters and write the fraction it makes. The bottom counts the equal pieces in one whole; the top counts how many are shaded. When the top equals the bottom, the strip is full — four quarters make one whole.",
    "3-read": "The first unit is full — one whole. Three quarters spill past the 1 mark — the leftover. So 7/4 is one and three-quarters, 1¾.",
    "4-wholes": "Each whole takes four quarters. Eight quarters make two wholes, and three are left — so 11/4 is 2¾. It's 11 divided by 4, remainder 3.",
    "5-back": "Now go the other way — start from 1¾ and fill in the improper fraction it equals.",
    "6-numbers": "No picture now. Convert both ways from the symbols using the two rules.",
  }[s] ?? "Fresh problems — paced to your mastery.";
}

// ── Per-stage rail copy (the wireframe's .panel .hint instruction) ────────────
function railHeading(s) {
  return {
    "1-identify": "Fill In the Fraction",
    "2-fill": "Fill One Whole",
    "3-read": "Read the Mixed Number",
    "4-wholes": "How Many Wholes Fit?",
    "5-back": "Break the Whole Back",
    "6-numbers": "Just the Numbers",
  }[s] ?? "Practice";
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AppR5({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {
  // Per-stage answer slots. Reset on stage change via resetStage.
  // For fraction slots: { n, d }; for mixed slots: { w, n }; for stage 6: { iw, in, fn, fd }
  const [fracVals, setFracVals] = useState({ n: "", d: "" });
  const [mixVals, setMixVals] = useState({ w: "", n: "" });
  const [s6Vals, setS6Vals] = useState({ iw: "", in: "", fn: "", fd: "" }); // stage 6 both-ways
  const [bad, setBad] = useState(false);
  // Which slot is active for the digit-grid picker (stages 1–6)
  const [activeSlot, setActiveSlot] = useState(null); // e.g. "n","d","w"
  // Drag-to-place: the digit selected in the picker (or null). The board only
  // changes when it's dropped onto (or its armed slot tapped) a number slot.
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));

  const shakeBad = () => { setBad(true); setTimeout(() => setBad(false), 460); };

  // ── shared scaffold ──────────────────────────────────────────────────────────
  const sc = useLessonScaffold({
    nodeId: "IMPROPER_TO_MIXED",
    lessonId: "r5",
    initialStage: "2-fill",
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
      setPicked(null);
      // Set the initial active slot for digit-grid stages
      if (s === "1-identify") setActiveSlot("n");
      else if (s === "2-fill") setActiveSlot("n");
      else if (s === "3-read" || s === "4-wholes") setActiveSlot("w");
      else if (s === "5-back") setActiveSlot("n");
      else if (s === "6-numbers") setActiveSlot("iw");
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
    sayPhase, speaking, stageRef,
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

  // ── Digit-grid pick handler (stages 1–6) ─────────────────────────────────────
  // Clicking a digit fills the active slot and advances to the next open slot.
  function handleDigitPick(digit) {
    if (solved) return;
    const v = String(digit);
    if (isIdentify || isFill || isBack) {
      // improper fraction: top then bottom
      if (activeSlot === "n") {
        setFracVals((s) => ({ ...s, n: v }));
        setActiveSlot("d");
      } else {
        setFracVals((s) => ({ ...s, d: v }));
        setActiveSlot("n");
      }
    } else if (isRead || isWholes) {
      // mixed number: whole then leftover top
      if (activeSlot === "w") {
        setMixVals((s) => ({ ...s, w: v }));
        setActiveSlot("n");
      } else {
        setMixVals((s) => ({ ...s, n: v }));
        setActiveSlot("w");
      }
    } else if (isNumbers) {
      // Both-ways: cycle the active slot iw → in → fn → iw. (fd is fixed.)
      if (activeSlot === "iw") {
        setS6Vals((s) => ({ ...s, iw: v }));
        setActiveSlot("in");
      } else if (activeSlot === "in") {
        setS6Vals((s) => ({ ...s, in: v }));
        setActiveSlot("fn");
      } else {
        setS6Vals((s) => ({ ...s, fn: v }));
        setActiveSlot("iw");
      }
    }
  }

  // ── Drag-to-place commit (stages 1–6) ───────────────────────────────────────
  // A digit dropped onto (or, when armed, tapped into) a slot lands THERE — the
  // slot is explicit, so no "active slot" juggling. A denominator never takes 0.
  const place = (kind) => (slot, k) => {
    if (solved) return;
    const v = k == null ? picked : k;
    if (v == null) return;
    if (slot === "d" && v < 1) return; // a bottom number can't be 0
    const s = String(v);
    if (kind === "frac") setFracVals((cur) => ({ ...cur, [slot]: s }));
    else if (kind === "mixed") setMixVals((cur) => ({ ...cur, [slot]: s }));
    else if (kind === "s6mixed") setS6Vals((cur) => ({ ...cur, [slot === "w" ? "iw" : "in"]: s }));
    else if (kind === "s6frac") setS6Vals((cur) => ({ ...cur, fn: s }));
    setPicked(null);
  };
  const fracArmed = { n: picked != null, d: picked != null && picked >= 1 };
  const mixArmed = { w: picked != null, n: picked != null };

  // The digit currently shown as "on" in the digit grid (the last committed digit)
  const activeDigitVal = (() => {
    if (isIdentify || isFill || isBack) {
      const v = activeSlot === "n" ? fracVals.n : fracVals.d;
      return v !== "" ? parseInt(v, 10) : null;
    }
    if (isRead || isWholes) {
      const v = activeSlot === "w" ? mixVals.w : mixVals.n;
      return v !== "" ? parseInt(v, 10) : null;
    }
    if (isNumbers) {
      const v = activeSlot === "iw" ? s6Vals.iw : activeSlot === "in" ? s6Vals.in : s6Vals.fn;
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
    if (isIdentify || isBack || isFill) answerReady = fracVals.n !== "" && fracVals.d !== "";
    else if (isRead || isWholes) answerReady = mixVals.w !== "" && mixVals.n !== "";
    else if (isNumbers) answerReady = s6Vals.iw !== "" && s6Vals.in !== "" && s6Vals.fn !== "";
  }

  // ── Tutor ribbon — corrective-only (shown only on warn status) ────────────────
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── Rail: instruction (the deleted goal copy) as the FIRST rail card ─────────
  const railBody = (() => {
    if (isIdentify) return (
      <>Read the strip and write the fraction it shows. Pick a number and drop it in:
      the <b>bottom</b> is how many equal pieces make <b>one whole</b>, and the
      <b> top</b> is how many pieces are <b>shaded</b>.</>
    );
    if (isFill) return (
      <>Shade all <b>4</b> quarters and write the fraction it makes. The
      <b> bottom</b> is how many equal pieces make <b>one whole</b>; the <b>top</b> is
      how many are <b>shaded</b>. When the <b>top equals the bottom</b>, the strip is
      full — <b>4/4</b> is <b>one whole</b>.</>
    );
    if (isRead) return (
      <>Read it off the strip and fill it in. The first unit <b>0→1</b> is full —
      that's <b>1 whole</b>. Past the <b>1</b> mark, <b>3</b> more quarters are
      shaded — the leftover <b>3/4</b>. So <b>7/4 = 1¾</b>: the <b>whole</b> is the
      full units, the <b>fraction</b> is what's left.</>
    );
    if (isWholes) return (
      <><b>11</b> quarters. Each whole needs <b>4</b>: so <b>8</b> fills <b>two</b>
      wholes, and <b>3</b> are left over. Fill in <b>2¾</b>. (That's just
      <b> 11 ÷ 4 = 2 remainder 3</b> — the remainder is the leftover pieces.)</>
    );
    if (isBack) return (
      <>Now go the <b>other way</b>: start from <b>1¾</b> and break the whole unit
      back into <b>quarters</b>. <b>1</b> whole is <b>4</b> quarters; add the
      <b> 3</b> leftover and you have <b>7</b> — so fill in <b>7/4</b>. The rule:
      <b> whole × bottom + top</b>, kept over the same bottom.</>
    );
    if (isNumbers) return (
      <>No strip now — both rules from the symbols. <b>Improper → mixed:</b> divide
      top by bottom; the answer is the <b>whole</b>, the remainder is the new
      <b> top</b> ({NUM} ÷ {DEN} = {mixed.w} r{mixed.n} → <b>{mixed.w}¾</b>).{" "}
      <b>Mixed → improper:</b> <b>whole × bottom + top</b> over the same bottom
      ({mixed.w} × {DEN} + {mixed.n} = <b>{NUM}/{DEN}</b>).</>
    );
    return null;
  })();

  const Rail = (
    <RailInstruction
      say={sayPhase} speaking={speaking} voxSpeaker="mom"
      heading={railHeading(stage)}
    >
      {railBody}
    </RailInstruction>
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
      >
        <GenPracticeBoard skill="IMPROPER_TO_MIXED" scaffold={sc} />
      </LessonShell>
    );
  }

  // ── STAGES 1–6: shared LessonBoard layout ────────────────────────────────────
  // The fill-in slots are driven by the DigitGrid (tap a digit → it lands in the
  // active slot). Slots are tappable to re-select which one the next digit fills.
  const fracActive = activeSlot === "n" || activeSlot === "d" ? activeSlot : null;

  // ── Stage area (mirrors the wireframe .eq-stage / .eq-col / .eq-eq markup) ────
  const Stage = (
    <div className="eq-stage" style={{ gap: 34 }}>
      <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={solved} max={9} />
      <div className="eq-col" style={{ gap: 18 }}>

        {/* ── Stage 1 — Identify: 7/4 strip + fill the fraction ── */}
        {isIdentify && (
          <>
            <MixRuler num={NUM} den={DEN} wholes={MAX_WHOLES} w={520} />
            <div className={"eq-slots-row" + (bad ? " bad" : "")}>
              <FracSlots
                n={fracVals.n || "?"} d={fracVals.d || "?"}
                active={null} big={56}
                onDropDigit={place("frac")} armedN={fracArmed.n} armedD={fracArmed.d}
              />
            </div>
          </>
        )}

        {/* ── Stage 2 — Fill a Whole: 4/4 = 1 whole ── */}
        {isFill && (
          <>
            <MixRuler num={NUM} den={DEN} wholes={1} w={320} />
            <div className={"eq-stage-inline" + (bad ? " bad" : "")} style={{ gap: 16 }}>
              <FracSlots
                n={fracVals.n || "?"} d={fracVals.d || "?"}
                active={null} big={56}
                onDropDigit={place("frac")} armedN={fracArmed.n} armedD={fracArmed.d}
              />
              <div className="eq-eq" style={{ fontStyle: "normal" }}>
                = <b style={{ color: "var(--red)" }}>1</b> whole
              </div>
            </div>
          </>
        )}

        {/* ── Stage 3 — Read: 7/4 → mixed number ── */}
        {isRead && (
          <>
            <MixRuler num={NUM} den={DEN} wholes={MAX_WHOLES} w={520} />
            <div className={"eq-stage-inline" + (bad ? " bad" : "")} style={{ gap: 18 }}>
              <BigFrac n={NUM} d={DEN} big={48} />
              <div className="eq-eq">=</div>
              <MixedSlots
                whole={mixVals.w || "?"} n={mixVals.n || "?"} d={DEN}
                active={null}
                onDropDigit={place("mixed")} armed={mixArmed}
              />
            </div>
          </>
        )}

        {/* ── Stage 4 — How Many Wholes: 11/4 → mixed number ── */}
        {isWholes && (
          <>
            <MixRuler num={NUM} den={DEN} wholes={MAX_WHOLES} w={660} />
            <div className={"eq-stage-inline" + (bad ? " bad" : "")} style={{ gap: 18 }}>
              <BigFrac n={NUM} d={DEN} big={48} />
              <div className="eq-eq">=</div>
              <MixedSlots
                whole={mixVals.w || "?"} n={mixVals.n || "?"} d={DEN}
                active={null}
                onDropDigit={place("mixed")} armed={mixArmed}
              />
            </div>
          </>
        )}

        {/* ── Stage 5 — The Other Way: 1¾ → improper fraction ── */}
        {isBack && (
          <>
            <MixRuler num={NUM} den={DEN} wholes={MAX_WHOLES} w={520} />
            <div className={"eq-stage-inline" + (bad ? " bad" : "")} style={{ gap: 18 }}>
              <MixedNum whole={mixed.w} n={mixed.n} d={DEN} />
              <div className="eq-eq">=</div>
              <FracSlots
                n={fracVals.n || "?"} d={fracVals.d || "?"}
                active={null} big={56}
                onDropDigit={place("frac")} armedN={fracArmed.n} armedD={fracArmed.d}
              />
            </div>
          </>
        )}

        {/* ── Stage 6 — Numbers: convert both ways (no strip) ── */}
        {isNumbers && (
          <div className="eq-col" style={{ gap: 28 }}>
            <div className="eq-col" style={{ gap: 8 }}>
              <span className="eq-lab">improper → mixed</span>
              <div className={"eq-stage-inline" + (bad ? " bad" : "")} style={{ gap: 16 }}>
                <BigFrac n={NUM} d={DEN} big={48} />
                <div className="eq-eq">→</div>
                <MixedSlots
                  whole={s6Vals.iw || "?"} n={s6Vals.in || "?"} d={DEN}
                  active={null}
                  onDropDigit={place("s6mixed")} armed={mixArmed}
                />
                <span className="eq-cap">{NUM} ÷ {DEN} = {mixed.w} remainder {mixed.n}</span>
              </div>
            </div>
            <div className="eq-col" style={{ gap: 8 }}>
              <span className="eq-lab">mixed → improper</span>
              <div className={"eq-stage-inline" + (bad ? " bad" : "")} style={{ gap: 16 }}>
                <MixedNum whole={mixed.w} n={mixed.n} d={DEN} />
                <div className="eq-eq">→</div>
                <FracSlots
                  n={s6Vals.fn || "?"} d={DEN}
                  active={null} big={48}
                  onDropDigit={place("s6frac")} armedN={picked != null}
                />
                <span className="eq-cap">{mixed.w} × {DEN} + {mixed.n} = {NUM}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Answer bar — wireframe checkBar: just Check (no caption) ───────────────────
  const Answer = (
    <AnswerBar
      solved={solved}
      ready={answerReady}
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
    >
      <LessonBoard
        footHeight={196}
        railWidth={396}
        rowGap={12}
        stage={Stage}
        rail={Rail}
        answer={Answer}
        tutor={Tutor}
      />
    </LessonShell>
  );
}
