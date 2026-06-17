// AppR4.jsx — Lesson No.8 "Equivalent Fractions" (R4, EQ_FRAC). The worked
// example throughout: 1/3. Multiplying top AND bottom by the same number (×k)
// produces an equivalent fraction — 1/3 = 2/6 = 3/9 = 4/12 … — because ×k/k = ×1,
// so the value cannot change. The visual is an "eq-box": a rectangular grid
// divided into `den` columns, the first `num` columns shaded red. A ×k knife
// adds a row per cut, multiplying both counts without moving the shaded area
// (CCSS 4.NF.A.1).
//
// THE INTERACTION ARC (8 stages):
//   1 · Identify   — see 1/3 box, name the fraction (3-choice picker)
//   2 · Double     — ×2 knife demo: 1/3 → 2/6, same amount
//   3 · Triple     — ×3 knife demo: 1/3 → 3/9, same amount
//   4 · Raise      — pick the ×k that reaches a target denominator (12)
//   5 · Find·Pick  — pick top & bottom; box cuts itself to match
//   6 · Find·All   — find every equivalent of 1/3; box + target on right
//   7 · Sort       — drag fractions into bins (1/2, 1/3, 1/4, 1/5)
//   ★ · Practice   — generated EQUIV_FRAC variations paced by mastery engine
//
// LAYOUT: shared LessonShell/LessonBoard/AnswerBar/TutorRibbon; room-specific
// content in styles/r4.css (retains old r4 rules + adds .eq-* rules).
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Rosette from "./components/Rosette.jsx";
import { LessonShell, LessonBoard, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";
import { LESSONS } from "./lessons/index.js";

import "./styles/r4.css";

// ── constants ────────────────────────────────────────────────────────────────
// The worked example: always 1/3 as the base fraction.
const BASE_NUM = 1, BASE_DEN = 3;

// Stage 4 "Raise": the target denominator the child must reach.
const RAISE_TARGET_DEN = 12;

// Sort stage: the four bins with their simplest-form labels.
const SORT_BINS = [
  { n: 1, d: 2 },
  { n: 1, d: 3 },
  { n: 1, d: 4 },
  { n: 1, d: 5 },
];

// Sort stage: initial pile of cards (each card has a simplified value matching one bin).
const SORT_PILE_INIT = [
  { n: 2, d: 4,  binIdx: 0, id: "2/4"  },
  { n: 5, d: 15, binIdx: 1, id: "5/15" },
  { n: 3, d: 12, binIdx: 2, id: "3/12" },  // 1/4
  { n: 2, d: 6,  binIdx: 1, id: "2/6"  },
  { n: 3, d: 6,  binIdx: 0, id: "3/6"  },
  { n: 2, d: 8,  binIdx: 2, id: "2/8"  },
];

// Stage ids aligned with the tab registry (must match tabs array order by position).
const STAGE_IDS = ["identify", "double", "triple", "raise", "findpick", "findall", "sort", "practice"];

// ── EqBox React component ─────────────────────────────────────────────────────
// Renders a rectangular grid with `cols` columns and `rows` rows. The left
// `shaded` columns are filled red; the rest are paper. Mirrors eqBox() from
// the wireframe's eqBox.js helper.
// `guide` adds a dashed red edge on the shaded boundary (proves amount holds).
// `isTarget` adds a red glow (is-target class) to mark the 1/3 reference.
function EqBox({ cols, rows, shaded, guide = false, isTarget = false, small = false }) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <div key={`${r}-${c}`} className={"eq-cell" + (c < shaded ? " is-on" : "")} />
      );
    }
  }
  const guideEdge = guide
    ? <div className="eq-guide-edge" style={{ left: `calc(${(shaded / cols) * 100}% - 1px)` }} />
    : null;

  const cls = [
    "eq-box",
    small ? "is-sm" : "",
    guide ? "is-guide" : "",
    isTarget ? "is-target" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={cls}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {cells}
      {guideEdge}
    </div>
  );
}

// ── EqFrac: the big stacked fraction glyph (red numerator, ink bar, denominator)
function EqFrac({ n, d, cls = "" }) {
  return (
    <div className={"eq-frac " + cls}>
      <div className="bignum">
        <span className="n" style={{ color: "var(--red)" }}>{n}</span>
        <span className="bar" style={{ background: "var(--ink)" }} />
        <span className="d">{d}</span>
      </div>
    </div>
  );
}

// ── EqTool: a single splitting knife button (×k) ─────────────────────────────
function EqTool({ k, on = false, frozen = false, onClick }) {
  return (
    <div
      className={"eq-tool" + (on ? " is-on" : "") + (frozen ? " is-frozen" : "")}
      onClick={frozen ? undefined : onClick}
      role={frozen ? undefined : "button"}
      tabIndex={frozen ? -1 : 0}
      onKeyDown={frozen ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
    >
      <span className="eq-tool-x">×{k}</span>
      <span className="eq-tool-lab">cut each cell into {k}</span>
    </div>
  );
}

// ── DigitGrid: the 0–9 number picker used by Find·Pick and Find·All ──────────
// Splits into two columns (0–4 | 5–9). `on` highlights the currently selected digit.
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

// ── BigFracInline: an inline stacked fraction (same markup as wireframe) ──────
function BigFracInline({ n, d }) {
  return (
    <span className="bignum">
      <span className="n" style={{ color: "var(--red)" }}>{n}</span>
      <span className="bar" style={{ background: "var(--ink)" }} />
      <span className="d">{d}</span>
    </span>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function AppR4({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {

  // Stage 1 "Identify": which choice is selected (null | "1/3" | "1/2" | "3/1")
  const [identifyChoice, setIdentifyChoice] = useState(null);

  // Stage 4 "Raise": which ×k tool the child picked
  const [raiseTool, setRaiseTool] = useState(null);
  const [raiseBounce, setRaiseBounce] = useState(null);

  // Stages 5 & 6 "Find·Pick" / "Find·All": the chosen top and bottom digits.
  // Phase: "top" → picking the top, "bottom" → picking the bottom, "done" → both chosen.
  const [pickPhase, setPickPhase] = useState("top"); // "top" | "bottom" | "done"
  const [pickN, setPickN] = useState(null);
  const [pickD, setPickD] = useState(null);

  // Stage 6 "Find·All": the list of confirmed equivalent pairs found so far.
  const [foundAll, setFoundAll] = useState([]);

  // Stage 7 "Sort": pile of remaining cards + cards already placed in each bin.
  const [sortPile, setSortPile] = useState(SORT_PILE_INIT);
  const [sortBins, setSortBins] = useState(SORT_BINS.map(() => []));
  const [dragCard, setDragCard] = useState(null); // { id, n, d, binIdx, x, y }
  const [hotBin, setHotBin] = useState(null);
  const binRefs = useRef([]);
  const suppressSortClick = useRef(false);

  // ── shared controller backbone ───────────────────────────────────────────
  const sc = useLessonScaffold({
    nodeId: "SIMPLIFY",
    lessonId: "r4",
    initialStage: "identify",
    stagesOrder: STAGE_IDS,
    scaffoldKeyFor: (s) => s,
    generatedStages: ["practice"],
    generatorSkill: "SIMPLIFY",
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setIdentifyChoice(null);
      setRaiseTool(null); setRaiseBounce(null);
      setPickPhase("top"); setPickN(null); setPickD(null);
      setFoundAll([]);
      setSortPile(SORT_PILE_INIT); setSortBins(SORT_BINS.map(() => []));
      setDragCard(null); setHotBin(null);
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

  // ── identity + tab strip ──────────────────────────────────────────────────
  const ident = useLessonIdentity("r4");
  const L = LESSONS.r4;
  const layout = L.layout || { railW: 452, footH: 150 };
  const tabStages = ident.stages.map((s, i) => ({
    key: STAGE_IDS[i],
    badge: s.badge,
    title: s.title,
    sub: s.sub,
  }));

  function initialStatus(s) {
    switch (s) {
      case "identify":  return { tone: "normal", text: "The box is cut into 3 equal columns and one is shaded red. Name the shaded fraction." };
      case "double":    return { tone: "normal", text: "The ×2 knife cuts every cell in two. Three columns become six, one shaded becomes two — 1/3 is 2/6, the very same amount." };
      case "triple":    return { tone: "normal", text: "Now the ×3 knife cuts every cell into three. Three become nine, one becomes three — 1/3 is 3/9." };
      case "raise":     return { tone: "normal", text: "Pick the knife that makes the bottom number exactly 12. Thirds cut into four each give 12 cells." };
      case "findpick":  return { tone: "normal", text: "The knives are put away. Pick a top number, then a bottom number — the box will cut itself to match. Find one equivalent of 1/3." };
      case "findall":   return { tone: "normal", text: "The target on the right is fixed at 1/3. Find every equivalent — 2/6, 3/9, 4/12, 5/15 … How many can you find?" };
      case "sort":      return { tone: "normal", text: "Each bin is a simplest fraction. Drag each new fraction into the bin it equals." };
      default:          return { tone: "normal", text: "" };
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  function reset() { goStage(stageRef.current); }

  // Derive the eq-box state for Find·Pick and Find·All stages.
  // When both digits are picked: if d is a multiple of 3 use the eqBox row-cut model
  // (cols=3, rows=d/3, shaded=1) so the guide edge stays put — this is the wireframe
  // "cuts itself to match" behaviour. For non-multiples show d columns with n shaded
  // as a generic grid (no guide edge, so the child can see the mismatch visually).
  function pickBoxState() {
    if (pickD !== null && pickD > 0) {
      if (pickD % BASE_DEN === 0) {
        const factor = pickD / BASE_DEN;
        return { cols: BASE_DEN, rows: factor, shaded: BASE_NUM, guide: true };
      }
      // Non-multiple: simple d-column grid, n shaded — shows the mismatch
      const n = pickN ?? 0;
      return { cols: pickD, rows: 1, shaded: Math.min(n, pickD), guide: false };
    }
    // Default: show 1/3 uncut
    return { cols: BASE_DEN, rows: 1, shaded: BASE_NUM, guide: true };
  }

  // Is the current find-pick answer an equivalent of 1/3?
  function isEquiv(n, d) {
    if (!n || !d || d === 0) return false;
    return n * BASE_DEN === d * BASE_NUM; // n/d === 1/3
  }

  // ── Stage 1: Identify ─────────────────────────────────────────────────────
  function submitIdentify(choice) {
    if (solvedRef.current) return;
    const correct = choice === "1/3";
    setIdentifyChoice(choice);
    if (correct) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: "Yes! One shaded column out of three equal columns is 1/3. The bottom counts all columns, the top counts the shaded ones. Next!" });
      const dec = reportAttempt({ correct: true, answerValue: choice, errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: `Not quite — count the columns: three total, one shaded. The shaded part is 1 out of 3, so it's written 1/3.` });
      reportAttempt({ correct: false, answerValue: choice, errorSignature: "wrong_choice", stars: 0 });
    }
  }

  // ── Stage 4: Raise ────────────────────────────────────────────────────────
  function pickRaiseTool(k) {
    if (solvedRef.current) return;
    const resultDen = BASE_DEN * k;
    if (resultDen === RAISE_TARGET_DEN) {
      setRaiseTool(k);
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: `The ×${k} knife cuts 3 into ${resultDen} — that's the bottom of ${RAISE_TARGET_DEN}! And the top: 1 × ${k} = ${k}. So 1/3 = ${k}/${resultDen}. Next!` });
      const dec = reportAttempt({ correct: true, answerValue: k, errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else {
      setRaiseTool(k);
      setRaiseBounce(k);
      setCook("think");
      setStatus({ tone: "warn", text: `×${k} gives a bottom of ${resultDen}, not ${RAISE_TARGET_DEN}. Try again — which knife gets the bottom to exactly ${RAISE_TARGET_DEN}?` });
      setTimeout(() => setRaiseBounce(null), 460);
      reportAttempt({ correct: false, answerValue: k, errorSignature: "wrong_factor", stars: 0 });
    }
  }

  // ── Stage 5: Find·Pick — digit grid flows through two phases ─────────────
  function pickDigit(k) {
    if (solvedRef.current) return;
    if (pickPhase === "top") {
      setPickN(k);
      setPickPhase("bottom");
      setPickD(null);
      setStatus({ tone: "normal", text: `Top is ${k}. Now pick the bottom number — the box will cut to match.` });
    } else if (pickPhase === "bottom") {
      setPickD(k);
      setPickPhase("done");
      // Check equivalence
      const equiv = isEquiv(pickN, k);
      if (equiv && k > 0) {
        setSolved(true); setStars(3); setCook("cheer");
        setStatus({ tone: "ok", text: `${pickN}/${k} — the box kept the same red amount as 1/3! That's an equivalent fraction. ×${k / BASE_DEN} on top AND bottom. Next!` });
        const dec = reportAttempt({ correct: true, answerValue: [pickN, k], errorSignature: null, stars: 3 });
        setTimeout(() => applyEngineDecision(dec, true), 1500);
      } else if (k === 0) {
        setCook("think");
        setStatus({ tone: "warn", text: "The bottom can't be zero — that's not a fraction. Pick again." });
        setPickPhase("bottom");
        setPickD(null);
      } else {
        setCook("think");
        setStatus({ tone: "warn", text: `${pickN}/${k} — the box landed on a different amount than 1/3. The red edge moved! Try a pair where both numbers multiply by the same amount.` });
        reportAttempt({ correct: false, answerValue: [pickN, k], errorSignature: "not_equiv", stars: 0 });
        // Let them try again
        setTimeout(() => {
          setPickPhase("top"); setPickN(null); setPickD(null);
          setCook("idle");
          setStatus({ tone: "normal", text: "Try again — pick a new top number. Remember: multiply both by the same amount." });
        }, 1400);
      }
    }
  }

  // ── Stage 6: Find·All ─────────────────────────────────────────────────────
  function findAllDigit(k) {
    if (solvedRef.current) return;
    if (pickPhase === "top") {
      setPickN(k);
      setPickPhase("bottom");
      setPickD(null);
    } else if (pickPhase === "bottom") {
      const n = pickN, d = k;
      setPickD(d);
      setPickPhase("done");
      if (d === 0) {
        setCook("think");
        setStatus({ tone: "warn", text: "The bottom can't be zero. Try again." });
        setPickPhase("bottom"); setPickD(null);
        return;
      }
      const equiv = isEquiv(n, d);
      const key = `${n}/${d}`;
      const alreadyFound = foundAll.some((f) => f.key === key);
      if (equiv && !alreadyFound) {
        const next = [...foundAll, { n, d, key }];
        setFoundAll(next);
        const enough = next.length >= 4;
        setCook(enough ? "cheer" : "idle");
        setStatus({ tone: "ok", text: enough
          ? `Amazing — you found ${next.length} equivalents of 1/3! ${next.map(f => f.key).join(", ")} … and more. Next!`
          : `${key} — the box matches the target! That's ${next.length} found. Keep going!` });
        if (enough) {
          setSolved(true); setStars(3);
          const dec = reportAttempt({ correct: true, answerValue: next.map(f => f.key), errorSignature: null, stars: 3 });
          setTimeout(() => applyEngineDecision(dec, true), 1500);
        } else {
          reportAttempt({ correct: true, answerValue: [n, d], errorSignature: null, stars: 2 });
        }
      } else if (alreadyFound) {
        setStatus({ tone: "warn", text: `${key} was already found! Try a different equivalent of 1/3.` });
        setCook("think");
      } else {
        setStatus({ tone: "warn", text: `${n}/${d} — the boxes don't match. The amounts are different. Try again.` });
        setCook("think");
        reportAttempt({ correct: false, answerValue: [n, d], errorSignature: "not_equiv", stars: 0 });
      }
      setTimeout(() => {
        if (!solvedRef.current) {
          setPickPhase("top"); setPickN(null); setPickD(null);
        }
      }, 1200);
    }
  }

  // ── Stage 7: Sort drag-and-drop ───────────────────────────────────────────
  function overBin(ev) {
    for (let i = 0; i < binRefs.current.length; i++) {
      const r = binRefs.current[i]?.getBoundingClientRect();
      if (!r) continue;
      const pad = 20;
      if (ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
          ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad) return i;
    }
    return null;
  }

  function grabCard(e, card) {
    if (solvedRef.current) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!e || e.clientX == null) return;
    const startX = e.clientX, startY = e.clientY;
    let moved = false;
    setDragCard({ ...card, x: startX, y: startY });
    const hover = (ev) => {
      if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) moved = true;
      setDragCard((d) => d ? { ...d, x: ev.clientX, y: ev.clientY } : null);
      setHotBin(overBin(ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", hover);
      window.removeEventListener("pointerup", up);
      const targetBin = overBin(ev);
      setDragCard(null); setHotBin(null);
      if (moved && targetBin !== null) {
        suppressSortClick.current = true;
        placeCard(card, targetBin);
      }
    };
    window.addEventListener("pointermove", hover);
    window.addEventListener("pointerup", up);
  }

  function placeCard(card, binIdx) {
    if (solvedRef.current) return;
    const correct = card.binIdx === binIdx;
    if (correct) {
      const remaining = sortPile.filter((c) => c.id !== card.id);
      setSortPile(remaining);
      setSortBins((bins) => bins.map((b, i) => i === binIdx ? [...b, card] : b));
      if (remaining.length === 0) {
        setSolved(true); setStars(3); setCook("cheer");
        setStatus({ tone: "ok", text: "All sorted! Every fraction is in its equivalent bin. Next!" });
        const dec = reportAttempt({ correct: true, answerValue: "all_sorted", errorSignature: null, stars: 3 });
        setTimeout(() => applyEngineDecision(dec, true), 1500);
      } else {
        setCook("idle");
        setStatus({ tone: "ok", text: `${card.n}/${card.d} → the ${SORT_BINS[binIdx].n}/${SORT_BINS[binIdx].d} bin. ${remaining.length} left!` });
      }
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: `${card.n}/${card.d} doesn't equal ${SORT_BINS[binIdx].n}/${SORT_BINS[binIdx].d}. Think: does the top fit into the bottom the same number of times?` });
      reportAttempt({ correct: false, answerValue: `${card.n}/${card.d}→bin${binIdx}`, errorSignature: "wrong_bin", stars: 0 });
    }
  }

  useEffect(() => () => { setDragCard(null); setHotBin(null); }, []);

  // ── shared chrome ─────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="r4Goal" voxSpeaker="mom">
      {renderGoal(L.goals?.[stage] || "")}
    </LessonGoal>
  );
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── per-stage body ────────────────────────────────────────────────────────
  let body = null;

  if (stage === "practice") {
    body = <GenPracticeBoard skill="EQ_FRAC" scaffold={sc} />;

  } else if (stage === "identify") {
    // Stage 1: show the 3×1 box and three multiple-choice picks.
    const CHOICES = ["1/3", "1/2", "3/1"];
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
              The whole box is split into <b>3</b> equal columns and <b>one</b> is
              shaded red. So the shaded part is <b>one out of three</b> — the
              fraction <b>1/3</b>. The bottom number counts <b>all</b> the columns;
              the top counts the <b>shaded</b> ones.
            </div>
          </div>
        }
        stage={
          <div className="eq-stage">
            <div className="eq-col">
              <span className="eq-lab">the box</span>
              <EqBox cols={3} rows={1} shaded={1} />
            </div>
            <div className="eq-col">
              <EqFrac n={1} d={3} />
              <div className="eq-cap">one shaded column out of three equal columns</div>
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <span className="r4-s-amt">shaded part:</span>
              <span className="den-choices">
                {CHOICES.map((c) => (
                  <span
                    key={c}
                    className={"den-choice" + (identifyChoice === c ? " is-on" : "")}
                    onClick={() => !solved && submitIdentify(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") !solved && submitIdentify(c); }}
                    aria-pressed={identifyChoice === c}
                  >{c}</span>
                ))}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : identifyChoice === "1/3" ? " ready" : "")}
                  onClick={solved ? nextStage : () => identifyChoice && submitIdentify(identifyChoice)}
                  disabled={!solved && !identifyChoice}
                >{solved ? "Next →" : "Check"}</button>
              </div>
            </div>
            <div className="r4-s-cap">one shaded of three equal columns → 1/3</div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "double" || stage === "triple") {
    // Stages 2 & 3: show before/after boxes with the ×k knife.
    const factor = stage === "double" ? 2 : 3;
    const afterN = BASE_NUM * factor, afterD = BASE_DEN * factor;
    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">{stage === "double" ? "Cut Each Cell in Two" : "Cut Each Cell in Three"}</h3>
            <div className="hint">
              {stage === "double"
                ? <>Drag the <b>×2</b> knife across the box. It slices <b>every</b> cell into <b>two</b> — so the <b>3</b> columns become <b>6</b> cells and the <b>1</b> shaded column becomes <b>2</b> shaded cells. The red edge shows the shaded amount <b>did not move</b>: <b>1/3 and 2/6 are the same amount</b>.</>
                : <>Same box, a bigger cut. Drag the <b>×3</b> knife across it: every cell becomes <b>three</b>, so the <b>3</b> columns become <b>9</b> cells and the <b>1</b> shaded column becomes <b>3</b>. The red edge shows the amount <b>did not move</b>: <b>1/3 and 3/9 are the same amount</b>.</>}
            </div>
            <div className="eq-tools">
              <EqTool k={factor} on frozen />
            </div>
          </div>
        }
        stage={
          <div className="eq-stage">
            <div className="eq-col">
              <span className="eq-lab">before</span>
              <EqBox cols={BASE_DEN} rows={1} shaded={BASE_NUM} guide />
              <EqFrac n={BASE_NUM} d={BASE_DEN} />
            </div>
            <div className="eq-eq">=</div>
            <div className="eq-col">
              <span className="eq-lab">after the ×{factor} cut</span>
              <EqBox cols={BASE_DEN} rows={factor} shaded={BASE_NUM} guide />
              <EqFrac n={afterN} d={afterD} />
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <BigFracInline n={BASE_NUM} d={BASE_DEN} />
              <span className="r4-s-eq">=</span>
              <BigFracInline n={afterN} d={afterD} />
              <span className="r4-s-amt">same amount — top ×{factor}, bottom ×{factor}</span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : " ready")}
                  onClick={() => {
                    if (solved) { nextStage(); return; }
                    setSolved(true); setStars(3); setCook("cheer");
                    setStatus({ tone: "ok", text: `The ×${factor} cut ${stage === "double" ? "doubles" : "triples"} both numbers — 1/3 = ${afterN}/${afterD}, the very same amount. Next!` });
                    const dec = reportAttempt({ correct: true, answerValue: factor, errorSignature: null, stars: 3 });
                    setTimeout(() => applyEngineDecision(dec, true), 1500);
                  }}
                >{solved ? "Next →" : "Got it →"}</button>
              </div>
            </div>
            <div className="r4-s-cap">the ×{factor} cut {factor === 2 ? "doubles" : "triples"} both numbers, so the value is unchanged</div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "raise") {
    // Stage 4: pick the ×k knife that reaches a bottom of 12.
    // Show the box cut by the currently selected tool (correct or not) so the
    // child can see what each ×k actually produces, matching the wireframe.
    const RAISE_TOOLS = [2, 3, 4, 5];
    const displayFactor = raiseTool || 1;
    const displayDen = BASE_DEN * displayFactor;
    const displayNum = BASE_NUM * displayFactor;
    const solved_factor = raiseTool && BASE_DEN * raiseTool === RAISE_TARGET_DEN ? raiseTool : null;
    const boxLabel = raiseTool
      ? `your box — now ${displayNum}/${displayDen}`
      : "your box — 1/3 to start";
    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">Raise the Bottom to {RAISE_TARGET_DEN}</h3>
            <div className="hint">
              The box starts at <b>1/3</b>. Pick the knife that makes the bottom
              number exactly <b>{RAISE_TARGET_DEN}</b>. Thirds cut into <b>four</b>{" "}
              each give <b>12</b> cells — so the <b>×4</b> tool is right (3 × 4 = 12),
              and the top rises the same way (1 × 4 = 4). The amount stays put.
            </div>
            <div className="eq-tools">
              {RAISE_TOOLS.map((k) => (
                <EqTool
                  key={k}
                  k={k}
                  on={raiseTool === k}
                  frozen={solved}
                  onClick={() => pickRaiseTool(k)}
                />
              ))}
            </div>
          </div>
        }
        stage={
          <div className="eq-stage">
            <div className="eq-col">
              <span className="eq-lab">{boxLabel}</span>
              <EqBox
                cols={BASE_DEN}
                rows={displayFactor}
                shaded={BASE_NUM}
                guide
              />
            </div>
            <div className="eq-col">
              <EqFrac n={BASE_NUM} d={BASE_DEN} />
              <div className="eq-eq">→</div>
              {raiseTool
                ? <EqFrac n={displayNum} d={displayDen} />
                : <div className="eq-cap">target bottom: <b>{RAISE_TARGET_DEN}</b></div>}
              <div className="eq-cap">target bottom number: <b>{RAISE_TARGET_DEN}</b></div>
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <BigFracInline n={BASE_NUM} d={BASE_DEN} />
              <span className="r4-s-eq">=</span>
              {raiseTool
                ? <BigFracInline n={displayNum} d={displayDen} />
                : <span className="r4-bigeq-q">?</span>}
              <span className="r4-s-amt">
                {solved_factor
                  ? `the ×${solved_factor} knife reached a bottom of ${RAISE_TARGET_DEN}`
                  : raiseTool
                    ? `×${raiseTool} gives ${displayDen}, not ${RAISE_TARGET_DEN} — try again`
                    : `pick the knife in the panel — which ×? gives 3 × ? = ${RAISE_TARGET_DEN}`}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : "")}
                  onClick={solved ? nextStage : undefined}
                  disabled={!solved}
                >{solved ? "Next →" : "Pick a knife →"}</button>
              </div>
            </div>
            <div className="r4-s-cap">3 × 4 = 12, so 1/3 = 4/12</div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "findpick" || stage === "findall") {
    // Stages 5 & 6: digit grid + live box.
    const box = pickBoxState();
    const showTarget = stage === "findall";
    const digitHandler = stage === "findall" ? findAllDigit : pickDigit;
    const activeDigit = pickPhase === "top" ? pickN : pickD;
    const fracDisplay = (
      <div className="bignum" style={{ fontSize: 52 }}>
        <span
          className={"n" + (pickPhase === "top" ? " eq-slot-active" : "")}
          style={{ color: "var(--red)" }}
        >
          {pickN !== null ? pickN : "?"}
        </span>
        <span className="bar" style={{ background: "var(--ink)" }} />
        <span className={"d" + (pickPhase === "bottom" ? " eq-slot-active" : "")}>
          {pickD !== null ? pickD : "?"}
        </span>
      </div>
    );

    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">{stage === "findpick" ? "Choose the Numbers" : "Find Every Equivalent"}</h3>
            <div className="hint">
              {stage === "findpick"
                ? <>The knives are <b>put away</b>. Now <b>choose</b> a top number and a bottom number — the box cuts itself to match. When your pair keeps the <b>same red amount</b> as <b>1/3</b>, it is an equivalent.</>
                : <>The <b>target</b> on the right is fixed at <b>1/3</b>. Work <b>your</b> box with the numbers: every pair that keeps the <b>same red amount</b> as the target is an equivalent — <b>2/6</b>, <b>3/9</b>, <b>4/12</b>, <b>5/15</b> … How <b>many</b> can you find?</>}
            </div>
            {stage === "findall" && foundAll.length > 0 && (
              <div className="eq-found">
                {foundAll.map((f) => (
                  <span key={f.key} className="eq-chip is-found">{f.key}</span>
                ))}
              </div>
            )}
          </div>
        }
        stage={
          <div className="eq-stage">
            <DigitGrid on={activeDigit} onPick={digitHandler} disabled={solved || (stage === "findpick" && pickPhase === "done")} />
            <div className="eq-col">
              {fracDisplay}
              <div className="eq-cap">
                {pickPhase === "top" ? "pick the top, then the bottom — the box splits to match"
                  : pickPhase === "bottom" ? "now pick the bottom number"
                  : "the box landed — check the amount"}
              </div>
            </div>
            <div className="eq-col">
              <span className="eq-lab">it cuts as you choose</span>
              <EqBox cols={box.cols} rows={box.rows} shaded={box.shaded} guide={box.guide} />
            </div>
            {showTarget && (
              <>
                <div className="eq-eq">match<br />→</div>
                <div className="eq-col">
                  <span className="eq-lab">target — 1/3</span>
                  <EqBox cols={BASE_DEN} rows={1} shaded={BASE_NUM} guide isTarget />
                </div>
              </>
            )}
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <BigFracInline n={BASE_NUM} d={BASE_DEN} />
              <span className="r4-s-eq">=</span>
              {pickN !== null && pickD !== null
                ? <BigFracInline n={pickN} d={pickD} />
                : <span className="r4-bigeq-q">?</span>}
              <span className="r4-s-amt">
                {solved
                  ? (stage === "findall" ? `your box matches the target — ${foundAll.length} equivalent${foundAll.length > 1 ? "s" : ""} found` : "the box landed on the same amount ✓")
                  : (stage === "findall" ? "keep going — find every fraction equal to 1/3" : "choose top & bottom; a match keeps the red edge in place")}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : "")}
                  onClick={solved ? nextStage : undefined}
                  disabled={!solved}
                >{solved ? "Next →" : "Choose the numbers"}</button>
              </div>
            </div>
            <div className="r4-s-cap">
              {stage === "findall"
                ? "keep going — find every fraction equal to 1/3"
                : "choose top & bottom; a match keeps the red edge in place"}
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "sort") {
    // Stage 7: drag fractions into equivalent bins.
    const totalCards = SORT_PILE_INIT.length;
    const placed = totalCards - sortPile.length;
    body = (
      <LessonBoard
        variant="split"
        footHeight={layout.footH}
        railWidth={layout.railW}
        rowGap={12}
        marginTop={8}
        rail={
          <div className="panel">
            <h3 className="pick-title">Sort the Fractions</h3>
            <div className="hint">
              Each bin is labelled with a <b>simplest</b> fraction. A new fraction
              appears on the left — drag it into the bin it is <b>equal to</b>.{" "}
              <b>2/4</b> goes to <b>1/2</b>; <b>5/15</b> goes to <b>1/3</b>;{" "}
              <b>3/12</b> goes to <b>1/4</b>. Think: does the top fit into the
              bottom the same number of times?
            </div>
          </div>
        }
        stage={
          <div className="eq-sort">
            {/* pile */}
            <div className="eq-pile">
              <span className="eq-lab">drag each fraction to its bin</span>
              {sortPile.map((card) => (
                <div
                  key={card.id}
                  className="eq-card"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => grabCard(e, card)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${card.n} over ${card.d}`}
                >
                  <BigFracInline n={card.n} d={card.d} />
                </div>
              ))}
              {sortPile.length === 0 && <span className="eq-lab" style={{ color: "var(--red)" }}>all sorted!</span>}
            </div>
            {/* bins */}
            <div className="eq-bins">
              {SORT_BINS.map((bin, i) => (
                <div
                  key={i}
                  ref={(el) => { binRefs.current[i] = el; }}
                  className={"eq-bin" + (hotBin === i ? " is-hot" : "")}
                >
                  <div className="eq-bin-head">
                    <BigFracInline n={bin.n} d={bin.d} />
                  </div>
                  <div className="eq-bin-body">
                    {sortBins[i].map((card) => (
                      <div key={card.id} className="eq-card">
                        <BigFracInline n={card.n} d={card.d} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <span className="r4-s-amt">
                sorted <b>{placed}</b> of <b>{totalCards}</b>
                {sortPile.length > 0 ? ` — drag ${sortPile[0].n}/${sortPile[0].d} into its bin` : " — all done!"}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : "")}
                  onClick={solved ? nextStage : undefined}
                  disabled={!solved}
                >{solved ? "Next →" : "Drop each fraction in the bin equal to it"}</button>
              </div>
            </div>
            <div className="r4-s-cap">drop each fraction in the bin equal to it</div>
          </div>
        }
        tutor={Tutor}
      />
    );
  }

  // Sort drag ghost
  const SortGhost = dragCard && createPortal(
    <div
      className="eq-card eq-drag-ghost"
      style={{ left: dragCard.x, top: dragCard.y, position: "fixed", transform: "translate(-50%,-50%)", zIndex: 9999, pointerEvents: "none", border: "2px solid var(--red)" }}
      aria-hidden="true"
    >
      <BigFracInline n={dragCard.n} d={dragCard.d} />
    </div>,
    document.body
  );

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
      band={null}
      goal={Goal}
      extra={SortGhost}
    >
      {body}
    </LessonShell>
  );
}

// ── render a registry goal string into JSX ───────────────────────────────────
function renderGoal(src) {
  if (!src) return "";
  const parts = src.split(/(\*[^*]+\*)/g).filter(Boolean);
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
