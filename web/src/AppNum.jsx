// AppNum.jsx — №4 "The Top Number" (Numerator). A NEW lesson, built on the shared
// shell (LessonShell + LessonBoard) from day one, with identity + tab strip pulled
// from the central registry (web/src/lessons/num.js). Taught on the same 0→1 RULER
// (and 2-D square) as den: the TOP number COUNTS how many of the equal pieces are
// shaded. Arc: paint K/N (Paint) → explore top numbers (Shade) → read a shaded
// picture (Count) → fill every piece, n/n = 1 (Whole) → match two squares by the
// top (Build) → rebuild both numbers (Make) → reason from bare symbols (Numbers) →
// a word problem with the numbers in it (Story) → a plain story problem (Words) →
// generated-feel practice (★).
//
// MECHANICS live HERE as React state/handlers (picks, slate writes, paint, count).
// Only identity/copy/tab DATA comes from the registry. The ruler/square markup +
// CSS are shared with den (den.css), so num.css holds only the few num-specific
// bits (the slate slot in the answer bar, the scratch surface for Words).
//
// ENGINE NOTE (same caution as AppDen): there is NO dedicated NUMERATOR skill node
// in web/src/engine/graph.ts and no matching generator. graph.ts/generators are
// NOT in this page's edit ownership, so — exactly like den — we ride the nearest
// existing node, FRACTION_ON_LINE (the ruler/unit-fraction lesson), so the
// engine/scaffold backbone, voice, Tier-2 nudges, and stage nav run like every
// other lesson and nothing throws. Practice is a LOCAL, locally-graded re-rolling
// "name the shaded fraction" game (no generator dependency). Flagged as contention:
// a real NUMERATOR node + generator should be authored in a future pass.
import React, { useState, useRef, useEffect } from "react";
import Slate from "./components/Slate.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, RailInstruction, ScratchSurface, UndoSplitButton } from "./components/lesson";
import { KnifeRack, useKnifeCut } from "./components/lesson/KnifeRack.jsx";
import { DigitGrid, DigitSlot, CellBox, Ruler, FractionBuilder, BigFrac } from "./components/assets";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";
import CompareInput from "./components/lesson/CompareInput.jsx";
import "./styles/den.css";
import "./styles/num.css";

// Identity + tab strip are DATA — sourced from the central registry, not inlined.
const L = LESSONS.num;

// Real engine node we ride for the scaffold backbone (see ENGINE NOTE above).
const NODE = "FRACTION_ON_LINE";

// The render/scaffold stage MODEL (logic, not chrome). Pairs each registry tab
// (keyed by its badge `t.n`) with a stable scaffold key + stage number. Tab
// LABELS / SUBS / order come from L.tabs; the wiring stays HERE.
const STAGE_BY_BADGE = {
  // NOTE: internal stage numbers (n) are kept STABLE so the render branches /
  // grader keys never renumber; only the DISPLAYED badges renumber after the
  // Make stage (old n=6) was deleted. So badge "6" now maps to Numbers (n=7), etc.
  "1": { n: 1, key: "1-paint" },
  "2": { n: 2, key: "2-shade" },
  "3": { n: 3, key: "3-count" },
  "4": { n: 4, key: "4-whole" },
  "5": { n: 5, key: "5-build" },
  "6": { n: 7, key: "7-numbers" },
  "7": { n: 8, key: "8-story" },
  "8": { n: 9, key: "9-words" },
  "★": { n: "practice", key: "practice" },
};
const STAGES = L.tabs.map((t) => {
  const m = STAGE_BY_BADGE[t.n];
  return { n: m.n, key: m.key, badge: t.n, tab: t.name, sub: t.sub };
});

// Fixed worked examples per teaching stage (mirror the wireframe snapshots).
const PAINT_DEN = 4;           // stage 1 — paint 3/4
const PAINT_TOP = 3;
const SHADE_DEN = 8;           // stage 2 — ruler split into 8; set the top to 2
const SHADE_TOP = 2;           //           target top number → 2/8
const COUNT_DEN = 8;           // stage 3 — read the picture
const COUNT_TOP = 6;           //           6 of 8 shaded → top number 6
const WHOLE_DEN = 7;           // stage 4 — pick top = 7 to fill all → 7/7 = 1
const BUILD_DEN = 6;           // stage 5 — bottom fixed at 6
const BUILD_TARGET = 4;        //           target top = 4 → 4/6
const NUMBERS_PAIR = [3, 1];   // stage 7 — 3/5 vs 1/5 (bigger top wins → 3/5)
const NUMBERS_DEN = 5;
const STORY_ANS = [5, 8];      // stage 8 — Babushka's tray: 5/8
const WORDS_ANS = [4, 6];      // stage 9 — six pieces, jam on four: 4/6

// The bare k/d fraction glyph (ink bar, red top), reused across stages. Pass
// `topSlot`/`denSlot` to replace the numerator/denominator with a custom node
// (e.g. a <DigitSlot> drop target for drag-to-place number entry).
function Frac({ top, d, size, topColor = "var(--red)", topSlot, denSlot }) {
  return (
    <div className="bignum" style={size ? { fontSize: size } : undefined}>
      {topSlot ?? <span className="n" style={{ color: topColor }}>{top}</span>}
      <span className="bar" style={{ background: "var(--ink)" }} />
      {denSlot ?? <span className="d">{d}</span>}
    </div>
  );
}

// The knife cut tool (rack + drag-to-cut hook) is the SHARED template — imported
// above from components/lesson/KnifeRack.jsx — so the splitting tool is identical
// everywhere and lives in the question rail (not the play area), exactly like den.

// A varied "name the shaded fraction" problem for the practice coda. Two DIFFERENT
// counts: a denominator 3..9 and a numerator 1..den.
function makePractice(seed) {
  const D = [3, 4, 5, 6, 8][seed % 5];
  const k = 1 + ((seed * 3 + 1) % (D - 1)); // 1..D-1
  return { d: D, k };
}

export default function AppNum({ onBack, onRewatchIntro }) {
  const no = L.num.replace("№", "");
  const title = L.title;

  // ---- Stage 1 (Paint) — divide count (0 = not yet cut by the knife) + painted --
  const [paintDiv, setPaintDiv] = useState(0); // pieces the strip is cut into (0 = uncut)
  const [paintCut, setPaintCut] = useState(false);
  const [painted, setPainted] = useState([]);

  // ---- Drag-to-place: the digit selected in the picker (or null). The board
  // only changes when it's dropped onto (or its armed slot tapped) a number slot.
  // A numerator accepts any digit (0 included); a denominator never accepts 0. ----
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));
  const numArmed = picked != null;
  const denArmed = picked != null && picked >= 1;
  // route a drop (k) or an armed-slot tap (no arg → use `picked`) to a handler.
  const placeTop = (handler) => (k) => {
    const v = k == null ? picked : k;
    if (v == null) return;
    handler(v);
    setPicked(null);
  };

  // ---- Stage 2 (Shade) — chosen top number; starts EMPTY (?/8), target 2/8 ----
  const [shadeTop, setShadeTop] = useState(null);

  // ---- Stage 3 (Count) — slate value for the top number ----
  const [countVal, setCountVal] = useState({});

  // ---- Stage 4 (Whole) — chosen top number; starts EMPTY (?/7), target 7/7 ----
  const [wholeTop, setWholeTop] = useState(null);

  // ---- Stage 5 (Build) — set BOTH numbers; starts EMPTY (?/?), target 4/6 ----
  const [buildTop, setBuildTop] = useState(null);
  const [buildDen, setBuildDen] = useState(null);

  // ---- Stage 7 (Numbers) — which bare fraction is bigger ----
  const [numbersSym, setNumbersSym] = useState("");

  // ---- Stages 8/9/★ (Story / Words / Practice) — slate fraction values ----
  // STORY (stage 8) is now a hands-on fraction BUILDER: the child shapes {num,den}
  // on the shared <FractionBuilder> bar (the tray starts cut into its given pieces).
  // Story builder starts at 1 and 1 (one filled piece of one) — the child builds
  // UP to the answer 5/8; it never pre-shows the answer.
  const [storyVal, setStoryVal] = useState({ num: 1, den: 1 });
  const [wordsVal, setWordsVal] = useState({});
  const [pracVal, setPracVal] = useState({});
  const [pracSeed, setPracSeed] = useState(0);
  const prac = makePractice(pracSeed);

  // ---- shared controller backbone (engine wiring + stage nav + outcome state) --
  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-paint";
  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "num",
    initialStage: 1,
    // Derive next/prev from the STAGES order so deleting a stage (Make) needs no
    // hand-edited cur±1 math — the internal numbers can skip values freely.
    advance: (cur) => {
      const i = STAGES.findIndex((s) => s.n === cur || s.key === cur);
      return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1].n : (STAGES[STAGES.length - 1].n);
    },
    back: (cur) => {
      const i = STAGES.findIndex((s) => s.n === cur || s.key === cur);
      return i > 0 ? STAGES[i - 1].n : cur;
    },
    scaffoldKeyFor: SCAFFOLD_KEY,
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setCountVal({});
      setNumbersSym("");
      setPaintDiv(0);
      setPaintCut(false);
      setPainted([]);
      setStoryVal({ num: 1, den: 1 });
      setWordsVal({});
      setPracVal({});
      setPicked(null);
      setShadeTop(null);   // stage 2 starts empty (?/8)
      setWholeTop(null);   // stage 4 starts empty (?/7)
      setBuildTop(null);   // stage 5 starts empty (?/?)
      setBuildDen(null);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the top number — it counts how many of the equal pieces are filled. When it matches the bottom, you have one whole. Brilliant work!" }),
  });
  const {
    stage, goStage, nextStage,
    reportAttempt, award, flashBad,
    solved, solvedRef, stars, status, setStatus,
    sayPhase, speaking,
  } = sc;

  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? (d.key === "practice" ? "practice" : d.n) : key;
  };
  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;

  // ── Dragging-knife cut input (Stage 1 Paint: cut the strip into N) ───────────
  const cutTargetRef = useRef(null);
  function onKnifeCut(n) {
    if (solvedRef.current) return;
    if (stage === 1) cutPaint(n);
  }
  const knife = useKnifeCut(cutTargetRef, onKnifeCut, solved);

  // Undo the strip cut — put it back together so the child can re-cut it.
  function undoCut() {
    if (solvedRef.current) return;
    if (stage === 1) { setPaintDiv(0); setPaintCut(false); setPainted([]); }
  }

  function reset() { goStage(1); }

  // ---- Stage 2 (Shade) — set the top number to 2 (target 2/8) ----------------
  // Dropping a digit only SETS the top (and shades that many pieces); grading
  // waits for the explicit Check click (see checkShade).
  function pickShade(k) {
    if (solvedRef.current) return;
    setShadeTop(k);
    setStatus({ tone: "normal", text: `${k} over ${SHADE_DEN} — ${k} of the ${SHADE_DEN} pieces are red. Press Check when the top is ${SHADE_TOP}.` });
  }
  function checkShade() {
    if (solved) { nextStage(); return; }
    if (shadeTop === SHADE_TOP) {
      award(`Yes — set the top to ${SHADE_TOP}, so ${SHADE_TOP} of the ${SHADE_DEN} pieces are red. The fraction is ${SHADE_TOP}/${SHADE_DEN}.`, null, [SHADE_TOP, SHADE_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: shadeTop == null
        ? `Drop a number on the top of the fraction first — set it to ${SHADE_TOP}.`
        : `That shades ${shadeTop}. Set the top number to ${SHADE_TOP} so ${SHADE_TOP} pieces are red.` });
      reportAttempt({ correct: false, answerValue: [shadeTop || 0, SHADE_DEN], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 3 (Count) — write the top number ---------------------------------
  function checkCount() {
    if (solved) { nextStage(); return; }
    const t = parseInt(countVal.top, 10);
    if (t === COUNT_TOP) {
      award(`Yes — ${COUNT_TOP} of the ${COUNT_DEN} pieces are red, so the top number is ${COUNT_TOP}. The fraction is ${COUNT_TOP}/${COUNT_DEN}.`, null, [COUNT_TOP, COUNT_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Count the red pieces again — the top number is exactly how many are shaded.` });
      reportAttempt({ correct: false, answerValue: [t || 0, COUNT_DEN], errorSignature: "other", stars: 0, modality: "write" });
    }
  }

  // ---- Stage 4 (Whole) — pick top so EVERY piece fills -------------------------
  // Picks only SET the value; grading waits for an explicit Check click.
  function pickWhole(k) { if (!solvedRef.current) setWholeTop(k); }
  function checkWhole() {
    if (solved) { nextStage(); return; }
    if (wholeTop === WHOLE_DEN) {
      award(`Whole! ${WHOLE_DEN} out of ${WHOLE_DEN} pieces — every one is red. When the top equals the bottom, the fraction is 1.`, null, [WHOLE_DEN, WHOLE_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `${wholeTop} of ${WHOLE_DEN} are filled. ${wholeTop < WHOLE_DEN ? "Pick a bigger top number to shade every piece." : "That's more than the whole — pick exactly the bottom number."}` });
      reportAttempt({ correct: false, answerValue: [wholeTop, WHOLE_DEN], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 5 (Build) — set BOTH the top and bottom so YOUR square matches the
  // target (4/6). Drops only SET the slots; grading waits for the Check click. ----
  function pickBuild(k, slot) {
    if (solvedRef.current) return;
    if (slot === "den") setBuildDen(k); else setBuildTop(k);
  }
  function checkBuild() {
    if (solved) { nextStage(); return; }
    if (buildTop === BUILD_TARGET && buildDen === BUILD_DEN) {
      award(`Matched! ${BUILD_DEN} pieces in all, ${BUILD_TARGET} red — your square matches the target: ${BUILD_TARGET}/${BUILD_DEN}.`, null, [BUILD_TARGET, BUILD_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: (buildTop != null && buildDen != null && buildTop > buildDen)
        ? `The top can't be more than the bottom — you can't shade more pieces than there are.`
        : `Count the target: ${BUILD_DEN} pieces in all (bottom), ${BUILD_TARGET} red (top). Set both to match — ${BUILD_TARGET}/${BUILD_DEN}.` });
      reportAttempt({ correct: false, answerValue: [buildTop || 0, buildDen || 0], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 7 (Numbers) — reason from the bare symbols ----------------------
  // Stage 7 (Numbers) — drag the < = > symbol between the two same-bottom fractions.
  function placeNumbersSym(s) { if (!solvedRef.current) setNumbersSym(s); }
  function checkNumbers() {
    if (solved) { nextStage(); return; }
    const [a, b] = NUMBERS_PAIR;                         // a/DEN vs b/DEN (same bottom)
    const want = a > b ? ">" : a < b ? "<" : "=";
    const bigger = Math.max(...NUMBERS_PAIR);
    if (numbersSym === want) {
      award(`Right — same bottom (${NUMBERS_DEN}ths), so more on top is bigger. ${a}/${NUMBERS_DEN} ${want} ${b}/${NUMBERS_DEN}.`, null, [bigger, NUMBERS_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Same-size pieces — the one with MORE on top is bigger. Is ${a}/${NUMBERS_DEN} <, =, or > ${b}/${NUMBERS_DEN}?` });
      reportAttempt({ correct: false, answerValue: [bigger, NUMBERS_DEN], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 1 (Paint) — paint exactly K of N cells red ----------------------
  // One colour only (red). Tap a piece to fill it; tap a filled piece again to
  // clear it (toggle). There is no eraser swatch — un-paint by tapping.
  function toggleCell(i) {
    if (solvedRef.current) return;
    setPainted((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }
  // Drag a knife onto the strip to cut it into N (replaces the ÷N buttons).
  function cutPaint(d) {
    if (solvedRef.current) return;
    setPaintDiv(d);
    setPaintCut(true);
    setPainted([]);
    setStatus({ tone: "normal", text: d === PAINT_DEN
      ? `Cut into ${d}! Now paint ${PAINT_TOP} of the ${d} pieces red.`
      : `Cut into ${d}. For ${PAINT_TOP}/${PAINT_DEN} you need ${PAINT_DEN} pieces — drag the ×${PAINT_DEN} knife to re-cut the strip.` });
  }
  function checkPaint() {
    if (solved) { nextStage(); return; }
    if (!paintCut || paintDiv !== PAINT_DEN) {
      flashBad();
      setStatus({ tone: "warn", text: `First cut the strip into ${PAINT_DEN} — drag the ×${PAINT_DEN} knife onto it. Then paint ${PAINT_TOP} pieces.` });
      return;
    }
    if (painted.length === PAINT_TOP) {
      award(`Painted! ${PAINT_TOP} pieces out of ${PAINT_DEN} red — that's exactly ${PAINT_TOP}/${PAINT_DEN}.`, null, [PAINT_TOP, PAINT_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `${PAINT_TOP}/${PAINT_DEN} means ${PAINT_TOP} pieces — you have ${painted.length}. The top number is ${PAINT_TOP}.` });
    }
  }

  // ---- Stage 8 (Story) — the child BUILT the fraction on the bar; check it ----
  function checkBuilt(vals, expected) {
    if (solved) { nextStage(); return; }
    const t = vals.num ?? 0, d = vals.den ?? 0;
    if (t === expected[0] && d === expected[1]) {
      award(`Yes — ${expected[0]} filled out of ${expected[1]}: ${expected[0]}/${expected[1]}. The top is what's filled, the bottom is the total.`, null, expected);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Build it on the bar: ${expected[1]} pieces in all (bottom), ${expected[0]} filled (top).` });
      reportAttempt({ correct: false, answerValue: [t, d], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stages 8/9 (Story / Words) — write the fraction -----------------------
  function checkFraction(vals, expected, setter) {
    if (solved) { nextStage(); return; }
    const t = parseInt(vals.top, 10), d = parseInt(vals.bot, 10);
    if (t === expected[0] && d === expected[1]) {
      award(`Yes — ${expected[0]} filled out of ${expected[1]} in all: ${expected[0]}/${expected[1]}. Top is what's filled, bottom is the total.`, null, expected);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Find both numbers: how many filled (top) over how many in all (bottom).` });
      reportAttempt({ correct: false, answerValue: [t || 0, d || 0], errorSignature: "other", stars: 0, modality: "write" });
    }
  }

  // ---- Practice — local re-rolling "name the shaded fraction" game ------------
  function checkPractice() {
    if (solvedRef.current) return;
    const t = parseInt(pracVal.top, 10), d = parseInt(pracVal.bot, 10);
    if (t === prac.k && d === prac.d) {
      // Bank the win and show success; the child taps "New problem ▸" to re-roll —
      // no automatic redirect on the correct path.
      award(`Correct — ${prac.k} red of ${prac.d}: ${prac.k}/${prac.d}. Tap for another.`, null, [prac.k, prac.d], { stars: 3 });
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Count the pieces (bottom) and the red ones (top), then write the fraction.` });
      reportAttempt({ correct: false, answerValue: [t || 0, d || 0], errorSignature: "other", stars: 0, modality: "write" });
    }
  }

  // A fraction Slate (top editable, bottom either editable or locked).
  function FracSlate({ vals, setVals, lockedBottom, autoKey = "top", onSubmit }) {
    const slots = [
      { key: "top", label: "top" },
      lockedBottom != null ? { key: "bot", label: "bottom", locked: true, digit: lockedBottom } : { key: "bot", label: "bottom" },
    ];
    return (
      <Slate
        layout="fraction"
        slots={slots}
        values={vals}
        autoFocusKey={autoKey}
        onChange={(key, v) => setVals((o) => ({ ...o, [key]: v }))}
        onSubmit={onSubmit}
      />
    );
  }

  // ---- shared pieces ---------------------------------------------------------
  // Corrective-only tutor: the Cook stays mounted every stage but his ribbon is
  // hidden unless the status is a warn/feedback beat (Wave-F shell decision B).
  const Tutor = <TutorRibbon cook={sc.cook} status={status} />;

  // Read-aloud now lives in the rail (Wave-F shell decision A) and replays the
  // CURRENT phase's narration via the scaffold's sayPhase() — the same line
  // auto-spoken on phase open (introFor). No per-stage voice key is needed.

  // ---- per-stage body --------------------------------------------------------
  let body = null;

  if (stage === 1) {
    // STAGE 1 · PAINT — cut the strip with a divide button, then paint K of N pieces red.
    const divOptions = [2, 3, 4, 6];
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="sq-game sq-paint">
              <div className="eq-col" style={{ gap: 14 }}>
                <span className="sq-side-lab">paint {PAINT_TOP}/{PAINT_DEN} red</span>
                <div className="den-ruler-wrap" style={{ gap: 6 }}>
                  <div
                    ref={cutTargetRef}
                    className={"eq-cut-target" + (knife.hotTarget ? " is-hot" : "") + (paintCut ? " is-cut" : "")}
                  >
                    <UndoSplitButton show={paintCut && !solved} onUndo={undoCut} />
                    <div
                      className="den-ruler is-paint"
                      style={{ "--den-ruler-w": "460px" }}
                      aria-label={paintCut ? `ruler of ${paintDiv} pieces` : "uncut strip — drag a knife to cut it"}
                    >
                      {paintCut
                        ? Array.from({ length: paintDiv }, (_, i) => (
                            <div
                              key={i}
                              className={"den-seg" + (painted.includes(i) ? " is-unit" : "")}
                              onClick={!solved ? () => toggleCell(i) : undefined}
                            />
                          ))
                        : <div className="den-seg den-seg-uncut" />}
                    </div>
                  </div>
                  <div className="den-ends" style={{ "--den-ruler-w": "460px" }}><span>0</span><span>1</span></div>
                </div>
              </div>
              <div className="sq-tool">
                <div className="sq-tool-h">Fill</div>
                <div className="sq-swatches">
                  <span className="sq-swatch is-red is-on" />
                </div>
                <button type="button" className="sq-reset" onClick={() => setPainted([])} disabled={solved}>Reset</button>
              </div>
            </div>
          </div>
        }
        rail={
          <>
            <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Cut, Then Paint">
              <b>Paint {PAINT_TOP}/{PAINT_DEN} of the strip red.</b> First, <b>cut the strip</b> — drag the <b>×{PAINT_DEN}</b> knife from here onto it so the bottom number is <b>{PAINT_DEN}</b> (four equal pieces). Then <b>paint {PAINT_TOP}</b> of those pieces red — the top number says how many. Tap pieces with the <b>red</b> fill to paint; pick the <b>ink</b> fill to erase a piece, or <b>Reset</b> to start over.
            </RailInstruction>
            <div className="panel den-knife-panel">
              <KnifeRack
                options={divOptions}
                onGrab={knife.grabKnife}
                onTap={knife.tapKnife}
                disabled={solved}
                label="drag a knife onto the strip to cut it"
              />
            </div>
          </>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">cut into <b>{PAINT_DEN}</b>, then paint</span><span className="sq-frac"><Frac top={PAINT_TOP} d={PAINT_DEN} size={30} /></span><span className="den-ans-amt">— <b>{PAINT_TOP}</b> pieces of <b>{PAINT_DEN}</b></span></>}
            solved={solved}
            ready={painted.length === PAINT_TOP && paintDiv === PAINT_DEN && !solved}
            stars={stars}
            onCheck={checkPaint}
            checkLabel={solved ? "Next stage ▸" : "Got it"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 2) {
    // STAGE 2 · SHADE — pick a top number; that many pieces shade red (den=8).
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-play">
              <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} />
              <div className="den-pick-frac">
                <Frac top={shadeTop} d={SHADE_DEN} topSlot={
                  <DigitSlot armed={numArmed} onPlace={placeTop(pickShade)} aria-label="top number — drop a number here">
                    <span className="n" style={{ color: "var(--red)" }}>{shadeTop ?? "?"}</span>
                  </DigitSlot>
                } />
              </div>
              <Ruler parts={SHADE_DEN} on={shadeTop ?? 0} />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Set the Top Number">
            The ruler is split into <b>{SHADE_DEN}</b> equal pieces and the bottom is <b>{SHADE_DEN}</b>. Tap a number and <b>drop it on the top</b> of the fraction — that many pieces turn <b>red</b>. Set the top to <b>{SHADE_TOP}</b> to make <b>{SHADE_TOP}/{SHADE_DEN}</b>.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-pick-frac"><Frac top={shadeTop ?? "?"} d={SHADE_DEN} size={34} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt"><b>{shadeTop ?? "?"}</b> of the <b>{SHADE_DEN}</b> equal pieces are shaded</span></>}
            solved={solved}
            ready={solved || shadeTop != null}
            stars={stars}
            onCheck={checkShade}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · COUNT — the ruler is shaded; write the top number (bottom locked).
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-play">
              <div className="den-pick-frac"><Frac top="?" d={COUNT_DEN} /></div>
              <Ruler parts={COUNT_DEN} on={COUNT_TOP} />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="How Many Are Shaded?">
            The bottom number is <b>{COUNT_DEN}</b>. <b>Count the red pieces</b> — that count is the <b>top number</b>. Write it in.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">red pieces counted →</span><span className="num-slate-wrap"><FracSlate vals={countVal} setVals={setCountVal} lockedBottom={COUNT_DEN} onSubmit={checkCount} /></span></>}
            solved={solved}
            ready={!solved && !!countVal.top}
            stars={stars}
            onCheck={checkCount}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 4) {
    // STAGE 4 · WHOLE — pick the top number that fills every piece (n/n = 1).
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-play">
              <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={solved} />
              <div className="den-pick-frac">
                <Frac top={wholeTop} d={WHOLE_DEN} topSlot={
                  <DigitSlot armed={numArmed && !solved} onPlace={placeTop(pickWhole)} aria-label="top number — drop a number here">
                    <span className="n" style={{ color: "var(--red)" }}>{wholeTop ?? "?"}</span>
                  </DigitSlot>
                } />
              </div>
              <Ruler parts={WHOLE_DEN} on={Math.min(wholeTop ?? 0, WHOLE_DEN)} />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Make It Whole">
            Pick a top number and <b>drag it onto the top of the fraction</b> to shade <b>every</b> piece. When the <b>top number equals the bottom</b> — here <b>{WHOLE_DEN}/{WHOLE_DEN}</b> — all pieces are red: that is <b>one whole</b>.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-pick-frac"><Frac top={wholeTop ?? "?"} d={WHOLE_DEN} size={34} /></span><span className="den-ans-eq">→</span><span className="den-ans-amt">{solved ? <><b>{WHOLE_DEN}/{WHOLE_DEN}</b> = <b>1</b> whole</> : <>fill every piece — make it <b>{WHOLE_DEN}/{WHOLE_DEN}</b></>}</span></>}
            solved={solved}
            ready={solved || wholeTop != null}
            stars={stars}
            onCheck={checkWhole}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · BUILD — pick the top number so YOUR square matches (bottom = 6).
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="sq-game">
              <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={solved} />
              <div className="sq-frac-pick">
                <div className="bignum" style={{ fontSize: 48 }}>
                  {solved ? (
                    <span className="n" style={{ color: "var(--red)" }}>{buildTop}</span>
                  ) : (
                    <DigitSlot armed={numArmed} onPlace={placeTop((k) => pickBuild(k, "top"))} aria-label="top number — drop a number here">
                      <span className="n" style={{ color: "var(--red)" }}>{buildTop ?? "?"}</span>
                    </DigitSlot>
                  )}
                  <span className="bar" style={{ background: "var(--ink)" }} />
                  {solved ? (
                    <span className="d">{buildDen}</span>
                  ) : (
                    <DigitSlot armed={denArmed} onPlace={placeTop((k) => pickBuild(k, "den"))} aria-label="bottom number — drop a number here">
                      <span className="d">{buildDen ?? "?"}</span>
                    </DigitSlot>
                  )}
                </div>
                <div className="sq-frac-hint">drag a number onto the top and the bottom</div>
              </div>
              <div className="sq-side">
                <span className="sq-side-lab">your square</span>
                <CellBox n={buildDen ?? 1} k={buildDen ? Math.min(buildTop ?? 0, buildDen) : 0} />
              </div>
              <div className="sq-match">match&nbsp;→</div>
              <div className="sq-side">
                <span className="sq-side-lab">target</span>
                <CellBox n={BUILD_DEN} k={BUILD_TARGET} className="is-target" />
              </div>
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Match the Target">
            Nothing is fixed. Count <b>all</b> the target pieces to set the <b>bottom</b>, then the <b>red</b> ones to set the <b>top</b> — build <b>{BUILD_TARGET}/{BUILD_DEN}</b> so <b>your</b> square matches the <b>target</b>.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="sq-frac"><Frac top={buildTop ?? "?"} d={buildDen ?? "?"} size={32} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">{solved ? <><b>{BUILD_TARGET}</b> red of <b>{BUILD_DEN}</b> — squares match</> : "set the top and bottom to match the target"}</span></>}
            solved={solved}
            ready={solved || (buildTop != null && buildDen != null)}
            stars={stars}
            onCheck={checkBuild}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 7) {
    // STAGE 7 · NUMBERS — bare symbols; more on top is bigger (same bottom).
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-cmp">
              <CompareInput
                left={{ num: NUMBERS_PAIR[0], den: NUMBERS_DEN }}
                right={{ num: NUMBERS_PAIR[1], den: NUMBERS_DEN }}
                value={numbersSym}
                onChange={placeNumbersSym}
                disabled={solved}
                big={48}
              />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Just the Numbers">
            No picture. The <b>bottoms are the same</b> ({NUMBERS_DEN}ths), so the pieces are the same size — the fraction with <b>more on top</b> is <b>bigger</b>. <b>Drag the right symbol</b> ( &lt; , = , or &gt; ) into the slot between them.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">{solved ? `${NUMBERS_PAIR[0]}/${NUMBERS_DEN} ${numbersSym} ${NUMBERS_PAIR[1]}/${NUMBERS_DEN}` : "drag <, =, or > between the fractions"}</span></>}
            solved={solved}
            ready={numbersSym !== "" && !solved}
            stars={stars}
            onCheck={checkNumbers}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={numbersSym === "" && !solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 8) {
    // STAGE 8 · STORY — word problem with the numbers in it. The child BUILDS the
    // fraction on the shared <FractionBuilder> bar (tap to shade / ± the two-colour
    // numerator & denominator) — the rectangle redraws live — then checks it.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-play">
              <FractionBuilder
                num={storyVal.num ?? 1}
                den={storyVal.den ?? 1}
                onChange={setStoryVal}
                disabled={solved}
                maxDen={12}
              />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Babushka's Tray">
            Babushka's tray is cut into <b>{STORY_ANS[1]}</b> equal slices. She fills <b>{STORY_ANS[0]}</b> with jam. The <b>bottom</b> is the total slices; the <b>top</b> is how many are filled. <b>Build the fraction that is filled.</b>
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">fraction filled →</span><BigFrac num={storyVal.num ?? 1} den={storyVal.den ?? 1} /></>}
            solved={solved}
            ready={!solved && (storyVal.num ?? 0) > 0}
            stars={stars}
            onCheck={() => checkBuilt(storyVal, STORY_ANS)}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 9) {
    // STAGE 9 · WORDS — plain story problem; write the fraction.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <ScratchSurface
            slateKey="num-words-scratch"
            hint="optional — draw the loaf and shade the jam pieces ✎"
          />
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Babushka's Loaf">
            Babushka cuts a loaf into <b>six equal pieces</b> and spreads jam on <b>four</b> of them. Find the two numbers in the story, then write the fraction of the loaf that has jam.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">fraction with jam →</span><span className="num-slate-wrap"><FracSlate vals={wordsVal} setVals={setWordsVal} onSubmit={() => checkFraction(wordsVal, WORDS_ANS, setWordsVal)} /></span></>}
            solved={solved}
            ready={!solved && !!wordsVal.top && !!wordsVal.bot}
            stars={stars}
            onCheck={() => checkFraction(wordsVal, WORDS_ANS, setWordsVal)}
            checkLabel={solved ? "Finish ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else {
    // ★ PRACTICE — local re-rolling "name the shaded fraction" game.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-play">
              <Ruler key={pracSeed} parts={prac.d} on={prac.k} />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Your Turn">
            Read the ruler. How many equal pieces in all (<b>bottom</b>), and how many are <b>red</b> (<b>top</b>)? Write the fraction.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">shaded fraction →</span><span className="num-slate-wrap"><FracSlate key={pracSeed} vals={pracVal} setVals={setPracVal} onSubmit={checkPractice} /></span></>}
            solved={solved}
            ready={!solved && !!pracVal.top && !!pracVal.bot}
            stars={stars}
            onCheck={solved ? () => { setPracSeed((s) => s + 1); setPracVal({}); } : checkPractice}
            checkLabel={solved ? "New problem ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag={L.tag.replace(/^Lesson \d+ · /, "")}
      title={title}
      onBack={onBack}
      onRewatchIntro={onRewatchIntro}
      onReset={reset}
      tabs={{
        stages: STAGES.map((s) => ({ key: s.key, badge: s.badge, title: s.tab, sub: s.sub })),
        current: curKey,
        onSelect: (key) => goStage(toStageVal(key)),
      }}
      extra={knife.KnifeGhostPortal}
    >
      {body}
    </LessonShell>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  switch (n) {
    case 1: return "Three over four means three pieces out of four. Paint three of the four pieces red.";
    case 2: return "Set the top number to two. Drop a two on top of the fraction so two of the eight pieces turn red — that makes two eighths.";
    case 3: return "Count the red pieces in the ruler. That count is the top number — write it in.";
    case 4: return "Pick a top number that shades EVERY piece. When the top equals the bottom, the fraction is one whole.";
    case 5: return "Build four sixths. Set the bottom to six for all the pieces, then the top to four for the red, so your square matches the target.";
    case 7: return "No picture. Same bottom number, so more on top is bigger. Which fraction is bigger?";
    case 8: return "Eight slices, five filled. The top is what's filled, the bottom is the total — write the fraction.";
    case 9: return "Read the story: six pieces in all, jam on four. Find both numbers and write the fraction.";
    case "practice": return "Fresh ones. Count the pieces, count the red, and name the shaded fraction.";
    default: return "";
  }
}
