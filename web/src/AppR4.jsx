// AppR4.jsx — Lesson №7 "Equivalent Fractions" (R4, EQ_FRAC). The worked
// example throughout: 1/3. Multiplying top AND bottom by the same number (×k)
// produces an equivalent fraction — 1/3 = 2/6 = 3/9 = 4/12 … — because ×k/k = ×1,
// so the value cannot change. The visual is an "eq-box": a rectangular grid
// divided into `den` columns, the first `num` columns shaded red. A ×k knife
// adds a row per cut, multiplying both counts without moving the shaded area
// (CCSS 4.NF.A.1).
//
// THE INTERACTION ARC (6 stages):
//   1 · Double     — ×2 knife demo: 1/3 → 2/6, same amount
//   2 · Triple     — ×3 knife demo: 1/3 → 3/9, same amount
//   3 · Raise      — pick the ×k that reaches a target denominator (12)
//   4 · Find·All   — find every equivalent of 1/3; box + target on right
//   5 · Sort       — drag fractions into bins (1/2, 1/3, 1/4, 1/5)
//   ★ · Practice   — generated EQUIV_FRAC variations paced by mastery engine
//
// LAYOUT: shared LessonShell/LessonBoard/AnswerBar/TutorRibbon; room-specific
// content in styles/r4.css (retains old r4 rules + adds .eq-* rules).
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Rosette from "./components/Rosette.jsx";
import { LessonShell, LessonBoard, TutorRibbon, RailInstruction, UndoSplitButton } from "./components/lesson";
import { KnifeRack, useKnifeCut } from "./components/lesson/KnifeRack.jsx";
import { EqBox, EqFrac, DigitGrid, BigFrac, FracSlots } from "./components/assets";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { useLessonIdentity } from "./lessons/useLessonIdentity.js";

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
const STAGE_IDS = ["double", "triple", "raise", "findall", "sort", "practice"];

// Find·All number range: the digit pills (and the achievable equivalents) run
// 0..FINDALL_MAX, so the child can build 4/12 — not just the single-digit 2/6
// and 3/9. Keep the picker's `max` and EQUIV_KEYS in lockstep via this bound.
const FINDALL_MAX = 12;
// Every equivalent of 1/3 the picker can build (0..FINDALL_MAX), EXCLUDING the
// original 1/3 itself: 2/6, 3/9, 4/12. Find·All unlocks only when the child has
// found ALL of these (they are all the same amount as 1/3). Computed from the
// worked example so it stays correct if BASE_NUM/BASE_DEN ever change.
const EQUIV_KEYS = (() => {
  const out = [];
  for (let d = 1; d <= FINDALL_MAX; d++)
    for (let n = 1; n <= FINDALL_MAX; n++)
      if (n * BASE_DEN === d * BASE_NUM && !(n === BASE_NUM && d === BASE_DEN)) out.push(`${n}/${d}`);
  return out;
})();

// EqBox, EqFrac, DigitGrid, BigFrac are imported from the shared Wave-F asset
// library (./components/assets). The ×k SPLITTING KNIVES are the ONE shared rack —
// <KnifeRack> + useKnifeCut (components/lesson/KnifeRack.jsx), the same knives used
// in den/num/unlike-den — so every "cut into N" knife in the app is one component.

// ── main component ────────────────────────────────────────────────────────────
export default function AppR4({ no, title, onBack, onRewatchIntro, stumpingRecipe = null, onReturnToKitchen }) {

  // Stages 1 & 2 "Double" / "Triple": has the child dragged the ×k knife across
  // the box yet? Until then the "after" box stays uncut (rows=1, == before) and
  // Next is gated. `cutDone` flips when the knife is released over the box, which
  // animates the slice (rows 1 → factor) and reports the attempt.
  const [cutDone, setCutDone] = useState(false);
  const afterBoxRef = useRef(null);                 // the "after" box the knife cuts
  const raiseBoxRef = useRef(null);                 // the Raise box the knife cuts

  // Stage 4 "Raise": which ×k tool the child picked
  const [raiseTool, setRaiseTool] = useState(null);
  const [raiseBounce, setRaiseBounce] = useState(null);

  // Stage 4 "Find·All": the chosen top and bottom digits the child builds.
  const [pickN, setPickN] = useState(null);
  const [pickD, setPickD] = useState(null);
  // Drag-to-place: the digit selected in the picker (or null). A number only
  // lands when dropped onto (or its armed slot tapped) the top/bottom slot.
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));

  // Stage 6 "Find·All": the list of confirmed equivalent pairs found so far.
  const [foundAll, setFoundAll] = useState([]);

  // Stage 7 "Sort": pile of remaining cards + cards already placed in each bin.
  const [sortPile, setSortPile] = useState(SORT_PILE_INIT);
  const [sortBins, setSortBins] = useState(SORT_BINS.map(() => []));
  const [dragCard, setDragCard] = useState(null); // { id, n, d, binIdx, x, y }
  const [hotBin, setHotBin] = useState(null);
  const [sortDone, setSortDone] = useState(false); // every card placed; awaits Check
  const binRefs = useRef([]);
  const suppressSortClick = useRef(false);

  // ── shared controller backbone ───────────────────────────────────────────
  const sc = useLessonScaffold({
    nodeId: "SIMPLIFY",
    lessonId: "r4",
    initialStage: "double",
    stagesOrder: STAGE_IDS,
    scaffoldKeyFor: (s) => s,
    generatedStages: ["practice"],
    generatorSkill: "SIMPLIFY",
    introFor: (s) => initialStatus(s),
    resetStage: () => {
      setCutDone(false);
      setRaiseTool(null); setRaiseBounce(null);
      setPickN(null); setPickD(null); setPicked(null);
      setFoundAll([]);
      setSortPile(SORT_PILE_INIT); setSortBins(SORT_BINS.map(() => []));
      setDragCard(null); setHotBin(null); setSortDone(false);
    },
    stumpingRecipe,
    inKitchen: false,
    onEnd: (dec) => { if (dec?.kind === "ReturnToKitchen") onReturnToKitchen?.(); },
  });

  const {
    stage, goStage, nextStage,
    emit, reportAttempt,
    solved, setSolved, solvedRef, stars, setStars, cook, setCook, status, setStatus,
    sayPhase, speaking, selfCorrectionsRef, stageRef,
  } = sc;

  // The ×k splitting knives are the SHARED rack/drag (components/lesson/KnifeRack).
  // EVERY stage uses the SAME interaction: drag a knife onto a box (useKnifeCut
  // hit-tests it and fires the cut). Double/Triple cut the "after" box → applyCut
  // (a knife labelled n cuts each cell into n, so 1/3 → n/3n). Raise drags onto
  // its own box → pickRaiseTool (which cuts the preview box to that ×k). No knife
  // is ever a click-only button — drag is the one model, with tap as a11y fallback.
  const knife = useKnifeCut(afterBoxRef, (k) => applyCut(k, BASE_NUM * k, BASE_DEN * k), solved || cutDone);
  // Like Double/Triple, a knife can't be picked up again until the current cut is
  // undone — once a tool is chosen (raiseTool set) the rack is blocked until undoRaise.
  const raiseKnife = useKnifeCut(raiseBoxRef, pickRaiseTool, solved || raiseTool != null);

  // ── identity + tab strip ──────────────────────────────────────────────────
  const ident = useLessonIdentity("r4");
  // Wireframe sizing: no per-room railW/footH declared, so use the shell
  // defaults (railW 396, footH floored to 196 per the Wave-F contract §5).
  const RAIL_W = 396, FOOT_H = 196;
  const tabStages = ident.stages.map((s, i) => ({
    key: STAGE_IDS[i],
    badge: s.badge,
    title: s.title,
    sub: s.sub,
  }));

  function initialStatus(s) {
    switch (s) {
      case "double":    return { tone: "normal", text: "The ×2 knife cuts every cell in two. Three columns become six, one shaded becomes two — 1/3 is 2/6, the very same amount." };
      case "triple":    return { tone: "normal", text: "Now the ×3 knife cuts every cell into three. Three become nine, one becomes three — 1/3 is 3/9." };
      case "raise":     return { tone: "normal", text: "Pick the knife that makes the bottom number exactly 12. Thirds cut into four each give 12 cells." };
      case "findall":   return { tone: "normal", text: "The target on the right is fixed at 1/3. Find every equivalent you can build, and add each to your list." };
      case "sort":      return { tone: "normal", text: "Each bin is a simplest fraction. Drag each new fraction into the bin it equals." };
      default:          return { tone: "normal", text: "" };
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  function reset() { goStage(stageRef.current); }

  // Derive the eq-box state for the Find·All stage.
  // When both digits are picked: if d is a multiple of 3 use the eqBox row-cut model
  // (cols=3, rows=d/3, shaded=1) so the guide edge stays put — this is the wireframe
  // "cuts itself to match" behaviour. For non-multiples show d columns with n shaded
  // as a generic grid (no guide edge, so the child can see the mismatch visually).
  function pickBoxState() {
    if (pickD !== null && pickD > 0) {
      // HONEST render of the child's ACTUAL fraction: pickD columns with the left
      // pickN shaded — never snap to the 1/3 amount. A true equivalent (2/6, 4/12)
      // fills the SAME red width as the target; a wrong pair (1/6) fills a visibly
      // different width, so the box never lies and Check can say "try again".
      const n = Math.max(0, Math.min(pickN ?? 0, pickD));
      return { cols: pickD, rows: 1, shaded: n, guide: true };
    }
    // No denominator chosen yet → the fraction reads ?/? (or n/?). With no bottom
    // number there are no pieces to draw, so the box stays EMPTY (not a stray 1/3)
    // until the child starts choosing — it "cuts as you choose".
    return { cols: 1, rows: 1, shaded: 0, guide: false, empty: true };
  }

  // Is the current find-pick answer an equivalent of 1/3?
  function isEquiv(n, d) {
    if (!n || !d || d === 0) return false;
    return n * BASE_DEN === d * BASE_NUM; // n/d === 1/3
  }

  // ── Stages 1 & 2: Double / Triple — drag the ×k knife across the box ───────
  // The shared useKnifeCut (above) handles the grab/drag/hit-test against the
  // after-box and fires applyCut on release. Perform the cut (also reachable by
  // keyboard / tap on the knife). The cut only
  // SETS state (cutDone) — it animates the slice and prompts for Check, but does
  // NOT award. Grading happens on the explicit Check click (see checkCut).
  function applyCut(factor, afterN, afterD) {
    if (solvedRef.current || cutDone) return;
    setCutDone(true);
    setCook("idle");
    setStatus({ tone: "normal", text: `The ×${factor} cut sliced every cell into ${factor} — now 1/3 looks like ${afterN}/${afterD}. Press Check to see if it's the same amount.` });
  }

  // Undo the cut — fuse the cells back into the original box so the knife can be
  // dropped again. Only meaningful on the Double/Triple stages (the cut stages).
  function undoCut(factor) {
    if (solvedRef.current) return;
    setCutDone(false);
    setCook("idle");
    setStatus({ tone: "normal", text: `Put the cells back together — drag the ×${factor} knife onto the box to cut it again.` });
  }

  // Grade the cut on the explicit Check click (Double/Triple).
  function checkCut(factor, afterN, afterD) {
    if (solved) { nextStage(); return; }
    if (!cutDone) return;
    setSolved(true); setStars(3); setCook("cheer");
    const text = `The ×${factor} cut ${factor === 2 ? "doubles" : "triples"} both numbers — every cell split into ${factor}, so 1/3 = ${afterN}/${afterD}, the very same amount. The red edge never moved. Next!`;
    setStatus({ tone: "ok", text });
    // Log the attempt; do NOT auto-advance. The child sees the success, then taps
    // "Next →" (checkCut's solved branch → nextStage) to move to the next step.
    reportAttempt({ correct: true, answerValue: factor, errorSignature: null, stars: 3 });
  }

  // ── Stage 4: Raise ────────────────────────────────────────────────────────
  // Picking a knife only SETS the selection (and cuts the box for preview) — it
  // does not award. Grading waits for the explicit Check click (see checkRaise).
  function pickRaiseTool(k) {
    if (solvedRef.current) return;
    setRaiseTool(k);
    setCook("think");
    const resultDen = BASE_DEN * k;
    setStatus({ tone: "normal", text: `×${k} cuts 3 into ${resultDen}. Press Check to see if that's a bottom of ${RAISE_TARGET_DEN}.` });
  }

  // Undo the Raise preview cut — clear the picked knife so the box returns to 1/3.
  function undoRaise() {
    if (solvedRef.current) return;
    setRaiseTool(null);
    setCook("idle");
    setStatus({ tone: "normal", text: `Box is back to 1/3 — drag a knife onto it to cut again.` });
  }

  // Grade the picked knife on the explicit Check click (Raise).
  function checkRaise() {
    if (solved) { nextStage(); return; }
    if (raiseTool == null) return;
    const k = raiseTool;
    const resultDen = BASE_DEN * k;
    if (resultDen === RAISE_TARGET_DEN) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: `The ×${k} knife cuts 3 into ${resultDen} — that's the bottom of ${RAISE_TARGET_DEN}! And the top: 1 × ${k} = ${k}. So 1/3 = ${k}/${resultDen}. Next!` });
      reportAttempt({ correct: true, answerValue: k, errorSignature: null, stars: 3 });
    } else {
      setRaiseBounce(k);
      setCook("think");
      setStatus({ tone: "warn", text: `×${k} gives a bottom of ${resultDen}, not ${RAISE_TARGET_DEN}. Try again — which knife gets the bottom to exactly ${RAISE_TARGET_DEN}?` });
      setTimeout(() => setRaiseBounce(null), 460);
      reportAttempt({ correct: false, answerValue: k, errorSignature: "wrong_factor", stars: 0 });
    }
  }

  // ── Drag-to-place: drop a digit onto the top or bottom slot. Order doesn't
  // matter — once BOTH slots hold a number we evaluate the pair. A denominator
  // never accepts 0 (the slot isn't armed for it), so d ≥ 1 here. ──────────────
  // Dropping a digit only SETS that slot — grading waits for the Check click
  // (no auto-finish when both slots happen to be filled).
  const placePick = () => (slot, k) => {
    if (solvedRef.current) return;
    const v = k == null ? picked : k;
    if (v == null) return;
    if (slot === "d" && v < 1) return;
    setPicked(null);
    if (slot === "n") setPickN(v); else setPickD(v);
    setStatus({ tone: "normal", text: "Set the top and bottom, then press Check." });
  };
  // Grade the built pair on the explicit Check click (Find·All): find EVERY
  // equivalent of 1/3 the picker can build.
  function checkPick() {
    if (solved) { nextStage(); return; }
    if (pickN == null || pickD == null) return;
    evalFind(pickN, pickD);
  }

  // ── Find·All — collect every equivalent of 1/3 ─────────────────────────────
  // The child builds equivalents one at a time. Each correct, NEW equivalent joins
  // the found list (the eq-chip row in the rail); the step unlocks ONLY when every
  // achievable equivalent (EQUIV_KEYS = 2/6, 3/9) is on the list. The original 1/3
  // and repeats are gently rejected so the list grows toward "all of them".
  function evalFind(n, d) {
    if (!isEquiv(n, d)) {
      setCook("think");
      setStatus({ tone: "warn", text: `${n}/${d} — the box landed on a different amount than 1/3. The red edge moved! Try a pair where both numbers multiply by the same amount.` });
      reportAttempt({ correct: false, answerValue: [n, d], errorSignature: "not_equiv", stars: 0 });
      return;
    }
    if (n === BASE_NUM && d === BASE_DEN) {
      setCook("think");
      setStatus({ tone: "warn", text: `That's the original 1/3 — find a DIFFERENT equivalent, like 2/6 or 3/9.` });
      return;
    }
    const key = `${n}/${d}`;
    if (foundAll.some((f) => f.key === key)) {
      setCook("think");
      setStatus({ tone: "warn", text: `${key} is already on your list — find another equivalent of 1/3.` });
      setTimeout(() => { if (!solvedRef.current) { setPickN(null); setPickD(null); } }, 1000);
      return;
    }
    const next = [...foundAll, { n, d, key }];
    setFoundAll(next);
    const remaining = EQUIV_KEYS.filter((k) => !next.some((f) => f.key === k));
    if (remaining.length === 0) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: `You found every equivalent of 1/3 you can build — ${next.map((f) => f.key).join(", ")}. They are all the same amount! Next!` });
      reportAttempt({ correct: true, answerValue: next.map((f) => f.key), errorSignature: null, stars: 3 });
    } else {
      setCook("idle");
      setStatus({ tone: "ok", text: `${key} matches 1/3 — added to your list! ${remaining.length} more to find.` });
      reportAttempt({ correct: true, answerValue: [n, d], errorSignature: null, stars: 2 });
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
        // All cards placed — the manipulation is complete, but do NOT award yet.
        // The child presses Check to finish (see checkSort).
        setSortDone(true); setCook("idle");
        setStatus({ tone: "ok", text: "Every fraction is in a bin — press Check to finish." });
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

  // Grade the completed sort on the explicit Check click.
  function checkSort() {
    if (solved) { nextStage(); return; }
    if (!sortDone) return;
    setSolved(true); setStars(3); setCook("cheer");
    setStatus({ tone: "ok", text: "All sorted! Every fraction is in its equivalent bin. Next!" });
    reportAttempt({ correct: true, answerValue: "all_sorted", errorSignature: null, stars: 3 });
  }

  // Sort-stage drag state cleanup on unmount. (Knife drag state lives in
  // useKnifeCut, which cleans up after itself — see KnifeRack.jsx.)
  useEffect(() => () => { setDragCard(null); setHotBin(null); }, []);

  // ── shared chrome ─────────────────────────────────────────────────────────
  // Wave-F: no goal banner. The instruction copy moves into <RailInstruction>
  // (the first rail card) per room/stage below. Tutor ribbon is corrective-only.
  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── per-stage body ────────────────────────────────────────────────────────
  let body = null;

  if (stage === "practice") {
    body = <GenPracticeBoard skill="EQ_FRAC" scaffold={sc} />;

  } else if (stage === "double" || stage === "triple") {
    // Stages 1 & 2: drag the ×k knife across the "after" box to slice it.
    // Until the cut is made the after-box mirrors the before-box (rows=1, 1/3);
    // dragging the knife onto it animates the slice to rows=factor (2/6 or 3/9),
    // proving the red "same amount" edge never moved. Next is gated on the cut.
    const factor = stage === "double" ? 2 : 3;
    const afterN = BASE_NUM * factor, afterD = BASE_DEN * factor;
    const afterRows = cutDone ? factor : 1;
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
            heading={stage === "double" ? "Cut Each Cell in Two" : "Cut Each Cell in Three"}
            extra={
              <KnifeRack
                options={[factor]}
                onGrab={knife.grabKnife}
                onTap={knife.tapKnife}
                disabled={cutDone || solved}
                label={cutDone ? "cut made — the amount held" : "drag the knife across the right-hand box →"}
                describe={(k) => `cut each cell into ${k}`}
              />
            }
          >
            {stage === "double"
              ? <>Drag the <b>×2</b> knife across the box. It slices <b>every</b> cell into <b>two</b> — so the <b>3</b> columns become <b>6</b> cells and the <b>1</b> shaded column becomes <b>2</b> shaded cells. The red edge shows the shaded amount <b>did not move</b>: <b>1/3 and 2/6 are the same amount</b>.</>
              : <>Same box, a bigger cut. Drag the <b>×3</b> knife across it: every cell becomes <b>three</b>, so the <b>3</b> columns become <b>9</b> cells and the <b>1</b> shaded column becomes <b>3</b>. The red edge shows the amount <b>did not move</b>: <b>1/3 and 3/9 are the same amount</b>.</>}
          </RailInstruction>
        }
        stage={
          <div className="eq-stage">
            <div className="eq-col">
              <span className="eq-lab">{cutDone ? `after the ×${factor} cut` : `drop the ×${factor} knife here`}</span>
              <div
                ref={afterBoxRef}
                className={"eq-cut-target" + (knife.hotTarget ? " is-hot" : "") + (cutDone ? " is-cut" : "")}
              >
                <UndoSplitButton show={cutDone && !solved} onUndo={() => undoCut(factor)} />
                <EqBox cols={BASE_DEN} rows={afterRows} shaded={BASE_NUM} guide />
              </div>
              <EqFrac n={cutDone ? afterN : BASE_NUM} d={cutDone ? afterD : BASE_DEN} />
            </div>
            <div className="eq-eq">=</div>
            <div className="eq-col">
              <span className="eq-lab">before</span>
              <EqBox cols={BASE_DEN} rows={1} shaded={BASE_NUM} guide />
              <EqFrac n={BASE_NUM} d={BASE_DEN} />
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <BigFrac n={BASE_NUM} d={BASE_DEN} />
              <span className="r4-s-eq">=</span>
              {cutDone
                ? <BigFrac n={afterN} d={afterD} />
                : <span className="r4-bigeq-q">?</span>}
              <span className="r4-s-amt">
                {cutDone
                  ? `same amount — top ×${factor}, bottom ×${factor}`
                  : `drag the ×${factor} knife onto the box to make the cut`}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : "")}
                  onClick={() => checkCut(factor, afterN, afterD)}
                  disabled={!cutDone && !solved}
                >{solved ? "Next →" : cutDone ? "Check" : "Drag the knife →"}</button>
              </div>
            </div>
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
        footHeight={FOOT_H}
        railWidth={RAIL_W}
        rowGap={12}
        marginTop={8}
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking} voxSpeaker="cook"
            heading={`Raise the Bottom to ${RAISE_TARGET_DEN}`}
            extra={
              <KnifeRack
                options={RAISE_TOOLS}
                onGrab={raiseKnife.grabKnife}
                onTap={raiseKnife.tapKnife}
                disabled={solved || raiseTool != null}
                label={raiseTool != null ? "undo your cut to pick another knife" : "drag the knife that makes the bottom 12 onto the box →"}
                describe={(k) => `cut each cell into ${k}`}
              />
            }
          >
            The box starts at <b>1/3</b>. Pick the knife that makes the bottom
            number exactly <b>{RAISE_TARGET_DEN}</b>. Thirds cut into <b>four</b>{" "}
            each give <b>12</b> cells — so the <b>×4</b> tool is right (3 × 4 = 12),
            and the top rises the same way (1 × 4 = 4). The amount stays put.
          </RailInstruction>
        }
        stage={
          <div className="eq-stage">
            <div className="eq-col">
              <span className="eq-lab">{raiseTool ? boxLabel : "drag a knife onto your box →"}</span>
              <div
                ref={raiseBoxRef}
                className={"eq-cut-target" + (raiseKnife.hotTarget ? " is-hot" : "") + (raiseTool ? " is-cut" : "")}
              >
                <UndoSplitButton show={!!raiseTool && !solved} onUndo={undoRaise} />
                <EqBox
                  cols={BASE_DEN}
                  rows={displayFactor}
                  shaded={BASE_NUM}
                  guide
                />
              </div>
              <EqFrac n={raiseTool ? displayNum : BASE_NUM} d={raiseTool ? displayDen : BASE_DEN} />
            </div>
            <div className="eq-eq">=</div>
            <div className="eq-col">
              <span className="eq-lab">target</span>
              <EqFrac n="?" d={RAISE_TARGET_DEN} />
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <BigFrac n={BASE_NUM} d={BASE_DEN} />
              <span className="r4-s-eq">=</span>
              {raiseTool
                ? <BigFrac n={displayNum} d={displayDen} />
                : <span className="r4-bigeq-q">?</span>}
              <span className="r4-s-amt">
                {solved_factor
                  ? `the ×${solved_factor} knife reached a bottom of ${RAISE_TARGET_DEN}`
                  : raiseTool
                    ? `×${raiseTool} gives ${displayDen}, not ${RAISE_TARGET_DEN} — try again`
                    : `drag a knife onto the box — which ×? gives 3 × ? = ${RAISE_TARGET_DEN}`}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : "")}
                  onClick={checkRaise}
                  disabled={raiseTool == null && !solved}
                >{solved ? "Next →" : raiseTool != null ? "Check" : "Drag a knife →"}</button>
              </div>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );

  } else if (stage === "findall") {
    // Stage 4 (Find·All): digit grid + live box + the fixed 1/3 target.
    const box = pickBoxState();
    const fracDisplay = (
      <FracSlots
        n={pickN !== null ? pickN : "?"}
        d={pickD !== null ? pickD : "?"}
        active={null} big={52}
        onDropDigit={placePick()}
        armedN={picked != null} armedD={picked != null && picked >= 1}
      />
    );

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
            heading="Find Every Equivalent"
            extra={
              foundAll.length > 0 ? (
                <div className="eq-found">
                  {foundAll.map((f) => (
                    <span key={f.key} className="eq-chip is-found">{f.key}</span>
                  ))}
                </div>
              ) : null
            }
          >
            <>The <b>target</b> on the right is fixed at <b>1/3</b>. Work <b>your</b> box with the numbers: every pair that keeps the <b>same red amount</b> as the target is an equivalent. How <b>many</b> can you find?</>
          </RailInstruction>
        }
        stage={
          <div className="eq-stage">
            <DigitGrid mode="drag" max={FINDALL_MAX} selected={picked} onSelect={togglePicked} disabled={solved} />
            <div className="eq-col">
              {fracDisplay}
            </div>
            <div className="eq-col">
              <span className="eq-lab">it cuts as you choose</span>
              <EqBox cols={box.cols} rows={box.rows} shaded={box.shaded} guide={box.guide} />
            </div>
            <div className="eq-eq">match<br />→</div>
            <div className="eq-col">
              <span className="eq-lab">target — 1/3</span>
              <EqBox cols={BASE_DEN} rows={1} shaded={BASE_NUM} guide target />
            </div>
          </div>
        }
        answer={
          <div className="lbar r4-s-answer">
            <div className="r4-s-eqrow">
              <BigFrac n={BASE_NUM} d={BASE_DEN} />
              <span className="r4-s-eq">=</span>
              {pickN !== null && pickD !== null
                ? <BigFrac n={pickN} d={pickD} />
                : <span className="r4-bigeq-q">?</span>}
              <span className="r4-s-amt">
                {solved
                  ? `every equivalent found — ${foundAll.map((f) => f.key).join(", ")} ✓`
                  : foundAll.length > 0
                    ? `found ${foundAll.map((f) => f.key).join(", ")} — ${EQUIV_KEYS.length - foundAll.filter((f) => EQUIV_KEYS.includes(f.key)).length} more to find`
                    : "choose a top & bottom that match 1/3 — find every equivalent"}
              </span>
              <div className="r4-s-marks">
                {solved && <Rosette count={stars} />}
                <button
                  className={"check" + (solved ? " done" : "")}
                  onClick={() => checkPick()}
                  disabled={(pickN == null || pickD == null) && !solved}
                >{solved ? "Next →" : "Check"}</button>
              </div>
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
        footHeight={FOOT_H}
        railWidth={RAIL_W}
        rowGap={12}
        marginTop={8}
        rail={
          <RailInstruction
            say={sayPhase} speaking={speaking} voxSpeaker="cook"
            heading="Sort the Fractions"
          >
            Each bin is labelled with a <b>simplest</b> fraction. A new fraction
            appears on the left — drag it into the bin it is <b>equal to</b>.{" "}
            <b>2/4</b> goes to <b>1/2</b>; <b>5/15</b> goes to <b>1/3</b>;{" "}
            <b>3/12</b> goes to <b>1/4</b>. Think: does the top fit into the
            bottom the same number of times?
          </RailInstruction>
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
                  <BigFrac n={card.n} d={card.d} />
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
                    <BigFrac n={bin.n} d={bin.d} />
                  </div>
                  <div className="eq-bin-body">
                    {sortBins[i].map((card) => (
                      <div key={card.id} className="eq-card">
                        <BigFrac n={card.n} d={card.d} />
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
                  onClick={checkSort}
                  disabled={!sortDone && !solved}
                >{solved ? "Next →" : sortDone ? "Check" : "Drop each fraction in the bin equal to it"}</button>
              </div>
            </div>
          </div>
        }
        tutor={Tutor}
      />
    );
  }

  // Knife drag ghost (Double/Triple) — the shared <Knife> sprite follows the
  // cursor, rendered by useKnifeCut (knife.KnifeGhostPortal).

  // Sort drag ghost
  const SortGhost = dragCard && createPortal(
    <div
      className="eq-card eq-drag-ghost"
      style={{ left: dragCard.x, top: dragCard.y, position: "fixed", transform: "translate(-50%,-50%)", zIndex: 9999, pointerEvents: "none", border: "2px solid var(--red)" }}
      aria-hidden="true"
    >
      <BigFrac n={dragCard.n} d={dragCard.d} />
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
      extra={<>{knife.KnifeGhostPortal}{raiseKnife.KnifeGhostPortal}{SortGhost}</>}
    >
      {body}
    </LessonShell>
  );
}
