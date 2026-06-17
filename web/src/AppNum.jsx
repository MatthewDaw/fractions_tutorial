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
import React, { useState } from "react";
import Slate from "./components/Slate.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson";
import QuestionBand from "./components/QuestionBand.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";
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
  "1": { n: 1, key: "1-paint" },
  "2": { n: 2, key: "2-shade" },
  "3": { n: 3, key: "3-count" },
  "4": { n: 4, key: "4-whole" },
  "5": { n: 5, key: "5-build" },
  "6": { n: 6, key: "6-make" },
  "7": { n: 7, key: "7-numbers" },
  "8": { n: 8, key: "8-story" },
  "9": { n: 9, key: "9-words" },
  "★": { n: "practice", key: "practice" },
};
const STAGES = L.tabs.map((t) => {
  const m = STAGE_BY_BADGE[t.n];
  return { n: m.n, key: m.key, badge: t.n, tab: t.name, sub: t.sub };
});

// Fixed worked examples per teaching stage (mirror the wireframe snapshots).
const PAINT_DEN = 4;           // stage 1 — paint 3/4
const PAINT_TOP = 3;
const SHADE_DEN = 8;           // stage 2 — ruler split into 8; pick the top
const COUNT_DEN = 8;           // stage 3 — read the picture
const COUNT_TOP = 6;           //           6 of 8 shaded → top number 6
const WHOLE_DEN = 7;           // stage 4 — pick top = 7 to fill all → 7/7 = 1
const BUILD_DEN = 6;           // stage 5 — bottom fixed at 6
const BUILD_TARGET = 4;        //           target top = 4 → 4/6
const MAKE_TARGET = [5, 8];    // stage 6 — target [top, bottom] = 5/8
const NUMBERS_PAIR = [3, 1];   // stage 7 — 3/5 vs 1/5 (bigger top wins → 3/5)
const NUMBERS_DEN = 5;
const STORY_ANS = [5, 8];      // stage 8 — Babushka's tray: 5/8
const WORDS_ANS = [4, 6];      // stage 9 — six pieces, jam on four: 4/6

// The bare k/d fraction glyph (ink bar, red top), reused across stages.
function Frac({ top, d, size, topColor = "var(--red)" }) {
  return (
    <div className="bignum" style={size ? { fontSize: size } : undefined}>
      <span className="n" style={{ color: topColor }}>{top}</span>
      <span className="bar" style={{ background: "var(--ink)" }} />
      <span className="d">{d}</span>
    </div>
  );
}

// A 0→1 ruler of N equal pieces with the first K shaded red.
function Ruler({ n, k, sm = false, cap }) {
  return (
    <div className="den-ruler-wrap">
      <div className={"den-ruler" + (sm ? " is-sm" : "")} aria-label={`ruler of ${n} pieces, ${k} shaded`}>
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className={"den-seg" + (i < k ? " is-unit" : "")} />
        ))}
      </div>
      <div className="den-ends"><span>0</span><span>1</span></div>
      {cap && <div className="den-cap">{cap}</div>}
    </div>
  );
}

// Grid columns that keep an N-cell box looking square-ish (matches wireframe cols()).
const sqCols = (n) => (n <= 3 ? n : n === 4 ? 2 : 3);
function SquareBox({ n, fill = 0, target = false, paint = false, onCell, painted }) {
  const isFilled = (i) => (painted ? painted.includes(i) : i < fill);
  return (
    <div
      className={"sq-box" + (target ? " is-target" : "") + (paint ? " is-paint" : "")}
      style={{ gridTemplateColumns: `repeat(${sqCols(n)},1fr)` }}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className={"sq-cell" + (isFilled(i) ? " is-fill" : "")}
          onClick={paint && onCell ? () => onCell(i) : undefined}
        />
      ))}
    </div>
  );
}

// A varied "name the shaded fraction" problem for the practice coda. Two DIFFERENT
// counts: a denominator 3..9 and a numerator 1..den.
function makePractice(seed) {
  const D = [3, 4, 5, 6, 8][seed % 5];
  const k = 1 + ((seed * 3 + 1) % (D - 1)); // 1..D-1
  return { d: D, k };
}

// Two-column 0–9 digit grid (matches wireframe digitGrid helper).
function DigitGrid({ on, onPick, disabled }) {
  const col = (s, e) =>
    Array.from({ length: e - s + 1 }, (_, i) => s + i).map((k) => (
      <button
        key={k}
        type="button"
        className={"den-num" + (k === on ? " is-on" : "")}
        aria-pressed={k === on}
        disabled={disabled}
        onClick={() => onPick(k)}
      >
        {k}
      </button>
    ));
  return (
    <div className="eq-numgrid">
      <div className="den-numcol">{col(0, 4)}</div>
      <div className="den-numcol">{col(5, 9)}</div>
    </div>
  );
}

export default function AppNum({ onBack, onRewatchIntro }) {
  const no = L.num.replace("№", "");
  const title = L.title;

  // ---- Stage 1 (Paint) — divide button chosen + painted segment indices ----
  const [paintDiv, setPaintDiv] = useState(PAINT_DEN); // which ÷N button is active
  const [paintColor, setPaintColor] = useState("red"); // "red" | "ink"
  const [painted, setPainted] = useState([]);

  // ---- Stage 2 (Shade) — chosen top number (free play) ----
  const [shadeTop, setShadeTop] = useState(3);

  // ---- Stage 3 (Count) — slate value for the top number ----
  const [countVal, setCountVal] = useState({});

  // ---- Stage 4 (Whole) — chosen top number for the 7-piece ruler ----
  const [wholeTop, setWholeTop] = useState(3);

  // ---- Stage 5 (Build) — chosen top number (bottom fixed at 6) ----
  const [buildTop, setBuildTop] = useState(2);

  // ---- Stage 6 (Make) — chosen top + bottom, plus which slot is being set ----
  const [makeTop, setMakeTop] = useState(2);
  const [makeDen, setMakeDen] = useState(2);
  const [makeSlot, setMakeSlot] = useState("top"); // which slot a number-tap fills

  // ---- Stage 7 (Numbers) — which bare fraction is bigger ----
  const [numbersPick, setNumbersPick] = useState(null);

  // ---- Stages 8/9/★ (Story / Words / Practice) — slate fraction values ----
  const [storyVal, setStoryVal] = useState({});
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
    advance: (cur) => (cur === "practice" ? "practice" : cur === 9 ? "practice" : (typeof cur === "number" ? cur + 1 : "practice")),
    back: (cur) => (cur === "practice" ? 9 : Math.max(1, (typeof cur === "number" ? cur : 9) - 1)),
    scaffoldKeyFor: SCAFFOLD_KEY,
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setCountVal({});
      setNumbersPick(null);
      setPaintDiv(PAINT_DEN);
      setPaintColor("red");
      setPainted([]);
      setStoryVal({});
      setWordsVal({});
      setPracVal({});
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the top number — it counts how many of the equal pieces are filled. When it matches the bottom, you have one whole. Brilliant work!" }),
  });
  const {
    stage, goStage, nextStage,
    reportAttempt, award, flashBad,
    solved, solvedRef, stars, status, setStatus,
    say, speaking,
  } = sc;

  const toStageVal = (key) => {
    const d = STAGES.find((s) => s.n === key || s.key === key);
    return d ? (d.key === "practice" ? "practice" : d.n) : key;
  };
  const curKey = STAGES.find((s) => s.n === stage || s.key === stage)?.key;

  function reset() { goStage(1); }

  // ---- Stage 2 (Shade) — free play; pick a top number ------------------------
  function pickShade(k) {
    if (solvedRef.current) return;
    setShadeTop(k);
    setStatus({
      tone: "normal",
      text: `${k} over ${SHADE_DEN} — ${k} of the ${SHADE_DEN} pieces are shaded. ${k >= SHADE_DEN ? "Every piece is red now!" : "Try a bigger top number and watch the red grow."}`,
    });
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
  function pickWhole(k) {
    if (solvedRef.current) return;
    setWholeTop(k);
    if (k === WHOLE_DEN) {
      award(`Whole! ${WHOLE_DEN} out of ${WHOLE_DEN} pieces — every one is red. When the top equals the bottom, the fraction is 1.`, null, [WHOLE_DEN, WHOLE_DEN]);
    } else {
      setStatus({ tone: "normal", text: `${k} of ${WHOLE_DEN} are filled. ${k < WHOLE_DEN ? "Pick a bigger top number to shade every piece." : "That's more than the whole — pick exactly the bottom number."}` });
    }
  }

  // ---- Stage 5 (Build) — pick top so YOUR square matches the target ----------
  function pickBuild(k) {
    if (solvedRef.current) return;
    setBuildTop(k);
    if (k === BUILD_TARGET) {
      award(`Matched! ${BUILD_TARGET} red pieces out of ${BUILD_DEN} on both — that's ${BUILD_TARGET}/${BUILD_DEN}. The top number counts the red.`, null, [BUILD_TARGET, BUILD_DEN]);
    } else {
      setStatus({ tone: "normal", text: `Your square has ${k} red; the target has ${BUILD_TARGET}. ${k < BUILD_TARGET ? "Shade more." : "That's too many — fewer."}` });
    }
  }

  // ---- Stage 6 (Make) — set BOTH numbers to rebuild the target ----------------
  function pickMake(k) {
    if (solvedRef.current) return;
    if (makeSlot === "top") setMakeTop(k); else setMakeDen(k);
    // After setting, check if both match the target.
    const top = makeSlot === "top" ? k : makeTop;
    const den = makeSlot === "den" ? k : makeDen;
    if (top === MAKE_TARGET[0] && den === MAKE_TARGET[1]) {
      award(`Rebuilt! ${MAKE_TARGET[1]} pieces in all, ${MAKE_TARGET[0]} red — your square matches the target exactly: ${MAKE_TARGET[0]}/${MAKE_TARGET[1]}.`, null, MAKE_TARGET);
    } else if (top > den) {
      setStatus({ tone: "warn", text: `The top can't be more than the bottom here — you can't shade more pieces than there are.` });
    } else {
      setStatus({ tone: "normal", text: `Count the target: ${MAKE_TARGET[1]} pieces in all (bottom), ${MAKE_TARGET[0]} red (top). Set both to match.` });
    }
  }

  // ---- Stage 7 (Numbers) — reason from the bare symbols ----------------------
  function pickNumbers(top) {
    if (solvedRef.current) return;
    setNumbersPick(top);
    const bigger = Math.max(...NUMBERS_PAIR);
    if (top === bigger) {
      award(`Right — same bottom (${NUMBERS_DEN}ths), so more on top is bigger. ${bigger}/${NUMBERS_DEN} > ${Math.min(...NUMBERS_PAIR)}/${NUMBERS_DEN}.`, null, [bigger, NUMBERS_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Same-size pieces — the one with MORE on top has more shaded. Which top number is bigger?` });
      reportAttempt({ correct: false, answerValue: [top, NUMBERS_DEN], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 1 (Paint) — paint exactly K of N cells red ----------------------
  function toggleCell(i) {
    if (solvedRef.current) return;
    setPainted((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }
  function checkPaint() {
    if (solved) { nextStage(); return; }
    if (paintDiv !== PAINT_DEN) {
      flashBad();
      setStatus({ tone: "warn", text: `First cut the strip into ${PAINT_DEN} — click the ÷${PAINT_DEN} button. Then paint ${PAINT_TOP} pieces.` });
      return;
    }
    if (painted.length === PAINT_TOP) {
      award(`Painted! ${PAINT_TOP} pieces out of ${PAINT_DEN} red — that's exactly ${PAINT_TOP}/${PAINT_DEN}.`, null, [PAINT_TOP, PAINT_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `${PAINT_TOP}/${PAINT_DEN} means ${PAINT_TOP} pieces — you have ${painted.length}. The top number is ${PAINT_TOP}.` });
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
      award(`Correct — ${prac.k} red of ${prac.d}: ${prac.k}/${prac.d}. Here's another.`, null, [prac.k, prac.d], { stars: 3 });
      setTimeout(() => { setPracSeed((s) => s + 1); setPracVal({}); }, 700);
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
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="The top number counts how many of the equal pieces are shaded. When the top number matches the bottom, the fraction is one whole." voxSpeaker="cook">
      The <b>top number</b> counts how many of the <b>equal pieces</b> are <b>shaded</b> — and when it <b>matches the bottom</b>, the fraction is <b>one whole</b>.
    </LessonGoal>
  );
  const Tutor = <TutorRibbon cook={sc.cook} status={status} />;

  // QuestionBand: shown on most stages; HIDDEN on Words (the prose IS the prompt,
  // showing the digits would give it away) and on Numbers/Practice.
  const showBand = stage === 1 || stage === 2 || stage === 3 || stage === 4 || stage === 5 || stage === 6 || stage === 8;
  const Band = (() => {
    let lead = "the top number", expr = null, answer = null;
    if (stage === 1) { lead = "paint this fraction"; expr = <Frac top={PAINT_TOP} d={PAINT_DEN} />; answer = solved ? "painted" : "?"; }
    else if (stage === 2) { lead = "shade the pieces"; expr = <Frac top={shadeTop} d={SHADE_DEN} />; answer = `${shadeTop} of ${SHADE_DEN} shaded`; }
    else if (stage === 3) { lead = "count the red"; expr = <Frac top="?" d={COUNT_DEN} />; answer = solved ? COUNT_TOP : "?"; }
    else if (stage === 4) { lead = "make it whole"; expr = <Frac top={wholeTop} d={WHOLE_DEN} />; answer = solved ? "1 whole" : "?"; }
    else if (stage === 5) { lead = "match the target"; expr = <Frac top={BUILD_TARGET} d={BUILD_DEN} />; answer = solved ? "matched" : "?"; }
    else if (stage === 6) { lead = "rebuild both"; expr = <Frac top={MAKE_TARGET[0]} d={MAKE_TARGET[1]} />; answer = solved ? "matched" : "?"; }
    else if (stage === 8) { lead = "what fraction is filled?"; expr = <span style={{ fontStyle: "italic", fontSize: 22 }}>5 of 8 slices</span>; answer = solved ? `${STORY_ANS[0]}/${STORY_ANS[1]}` : "?"; }
    return <QuestionBand lead={lead} expr={expr} answer={answer} />;
  })();

  // ---- per-stage body --------------------------------------------------------
  let body = null;

  if (stage === 1) {
    // STAGE 1 · PAINT — cut the strip with a divide button, then paint K of N pieces red.
    const divOptions = [2, 3, 4, 6];
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="sq-game sq-paint">
              <div className="eq-col" style={{ gap: 14 }}>
                <span className="sq-side-lab">paint {PAINT_TOP}/{PAINT_DEN} red</span>
                <div className="den-ruler-wrap" style={{ gap: 6 }}>
                  <div
                    className="den-ruler is-paint"
                    style={{ "--den-ruler-w": "460px" }}
                    aria-label={`ruler of ${paintDiv} pieces`}
                  >
                    {Array.from({ length: paintDiv }, (_, i) => (
                      <div
                        key={i}
                        className={"den-seg" + (painted.includes(i) ? " is-unit" : "")}
                        onClick={!solved ? () => toggleCell(i) : undefined}
                      />
                    ))}
                  </div>
                  <div className="den-ends" style={{ "--den-ruler-w": "460px" }}><span>0</span><span>1</span></div>
                </div>
                <div className="sq-divide">
                  <span className="sq-divide-lab">cut the strip into:</span>
                  {divOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={"sq-divbtn" + (d === paintDiv ? " is-on" : "")}
                      disabled={solved}
                      onClick={() => { setPaintDiv(d); setPainted([]); }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sq-tool">
                <div className="sq-tool-h">Fill</div>
                <div className="sq-swatches">
                  <span
                    className={"sq-swatch is-red" + (paintColor === "red" ? " is-on" : "")}
                    onClick={() => setPaintColor("red")}
                  />
                  <span
                    className={"sq-swatch is-ink" + (paintColor === "ink" ? " is-on" : "")}
                    onClick={() => setPaintColor("ink")}
                  />
                </div>
                <button type="button" className="sq-reset" onClick={() => setPainted([])} disabled={solved}>Reset</button>
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Cut, Then Paint" hint={<><b>Paint {PAINT_TOP}/{PAINT_DEN} of the strip red.</b> First, <b>cut the strip</b> — click the <b>÷{PAINT_DEN}</b> button so the bottom number is <b>{PAINT_DEN}</b> (four equal pieces). Then <b>paint {PAINT_TOP}</b> of those pieces red — the top number says how many. Tap pieces to fill them; <b>Reset</b> to start over.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">cut into <b>{PAINT_DEN}</b>, then paint</span><span className="sq-frac"><Frac top={PAINT_TOP} d={PAINT_DEN} size={30} /></span><span className="den-ans-amt">— <b>{PAINT_TOP}</b> pieces of <b>{PAINT_DEN}</b></span></>}
            cap={solved ? `${PAINT_TOP} pieces of ${PAINT_DEN} — that's ${PAINT_TOP}/${PAINT_DEN}` : "divide into the bottom number first, then paint the top"}
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
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <DigitGrid on={shadeTop} onPick={pickShade} />
              <div className="den-pick-frac"><Frac top={shadeTop} d={SHADE_DEN} /></div>
              <Ruler n={SHADE_DEN} k={shadeTop} cap={`Bottom number is ${SHADE_DEN} — eight equal pieces. The top number says how many to shade.`} />
            </div>
          </div>
        }
        rail={<HintRail heading="Shade the Pieces" hint={<>The ruler is split into <b>{SHADE_DEN}</b> equal pieces. Tap a <b>top number</b> — that many pieces turn <b>red</b>. A <b>bigger</b> top number shades <b>more</b>.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-pick-frac"><Frac top={shadeTop} d={SHADE_DEN} size={34} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt"><b>{shadeTop}</b> of the <b>{SHADE_DEN}</b> equal pieces are shaded</span></>}
            cap="change the top number and watch the red grow — then move on"
            solved={false}
            ready
            stars={stars}
            onCheck={() => nextStage()}
            checkLabel="Keep playing ▸"
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 3 · COUNT — the ruler is shaded; write the top number (bottom locked).
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <div className="den-pick-frac"><Frac top="?" d={COUNT_DEN} /></div>
              <Ruler n={COUNT_DEN} k={COUNT_TOP} cap="Count the red pieces — that count is the top number." />
            </div>
          </div>
        }
        rail={<HintRail heading="How Many Are Shaded?" hint={<>The bottom number is <b>{COUNT_DEN}</b>. <b>Count the red pieces</b> — that count is the <b>top number</b>. Write it in.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">red pieces counted →</span><span className="num-slate-wrap"><FracSlate vals={countVal} setVals={setCountVal} lockedBottom={COUNT_DEN} onSubmit={checkCount} /></span></>}
            cap={solved ? `${COUNT_TOP} of ${COUNT_DEN} — that's ${COUNT_TOP}/${COUNT_DEN}` : "write the top number — how many of the 8 pieces are red"}
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
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <DigitGrid on={wholeTop} onPick={pickWhole} disabled={solved} />
              <div className="den-pick-frac"><Frac top={wholeTop} d={WHOLE_DEN} /></div>
              <Ruler n={WHOLE_DEN} k={Math.min(wholeTop, WHOLE_DEN)} cap={solved ? `Every one of the ${WHOLE_DEN} pieces is red — the whole ruler is filled.` : "Pick a top number that shades every piece."} />
            </div>
          </div>
        }
        rail={<HintRail heading="Make It Whole" hint={<>Pick a top number that shades <b>every</b> piece. When the <b>top number equals the bottom</b> — here <b>{WHOLE_DEN}/{WHOLE_DEN}</b> — all pieces are red: that is <b>one whole</b>.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-pick-frac"><Frac top={wholeTop} d={WHOLE_DEN} size={34} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">{solved ? <><b>1</b> whole — top equals bottom</> : "fill every piece"}</span></>}
            cap={solved ? "when the top matches the bottom, the fraction is 1" : "pick the top number that shades all of them"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { if (solved) nextStage(); }}
            checkLabel={solved ? "Next stage ▸" : "Pick a number"}
            checkDisabled={!solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · BUILD — pick the top number so YOUR square matches (bottom = 6).
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="sq-game">
              <DigitGrid on={buildTop} onPick={pickBuild} disabled={solved} />
              <div className="sq-frac-pick">
                <div className="bignum" style={{ fontSize: 48 }}><span className="n sq-slot-active" style={{ color: "var(--red)" }}>{buildTop}</span><span className="bar" style={{ background: "var(--ink)" }} /><span className="d sq-slot-locked">{BUILD_DEN}</span></div>
                <div className="sq-frac-hint">bottom is fixed — pick the top number</div>
              </div>
              <div className="sq-side">
                <span className="sq-side-lab">your square</span>
                <SquareBox n={BUILD_DEN} fill={Math.min(buildTop, BUILD_DEN)} />
              </div>
              <div className="sq-match">match&nbsp;→</div>
              <div className="sq-side">
                <span className="sq-side-lab">target</span>
                <SquareBox n={BUILD_DEN} fill={BUILD_TARGET} target />
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Match the Shaded Pieces" hint={<>The bottom number is fixed at <b>{BUILD_DEN}</b>. Pick the <b>top number</b> so <b>your</b> square has the <b>same number of red pieces</b> as the <b>target</b>.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="sq-frac"><Frac top={buildTop} d={BUILD_DEN} size={32} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">{solved ? <><b>{BUILD_TARGET}</b> red of <b>{BUILD_DEN}</b> — squares match</> : `${buildTop} red so far`}</span></>}
            cap={solved ? "matched the target" : "bottom is fixed — pick the top number that matches the target"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { if (solved) nextStage(); }}
            checkLabel={solved ? "Next stage ▸" : "Match it"}
            checkDisabled={!solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 6) {
    // STAGE 6 · MAKE — set BOTH numbers to rebuild the target square.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="sq-game">
              <DigitGrid on={makeSlot === "top" ? makeTop : makeDen} onPick={pickMake} disabled={solved} />
              <div className="sq-frac-pick">
                <div className="bignum" style={{ fontSize: 48 }}>
                  <button type="button" className={"n num-slot-btn" + (makeSlot === "top" ? " sq-slot-active" : "")} style={{ color: "var(--red)" }} onClick={() => setMakeSlot("top")}>{makeTop}</button>
                  <span className="bar" style={{ background: "var(--ink)" }} />
                  <button type="button" className={"d num-slot-btn" + (makeSlot === "den" ? " sq-slot-active" : "")} onClick={() => setMakeSlot("den")}>{makeDen}</button>
                </div>
                <div className="sq-frac-hint">tap top or bottom, then tap a number</div>
              </div>
              <div className="sq-side">
                <span className="sq-side-lab">your square</span>
                <SquareBox n={makeDen} fill={Math.min(makeTop, makeDen)} />
              </div>
              <div className="sq-match">match&nbsp;→</div>
              <div className="sq-side">
                <span className="sq-side-lab">target</span>
                <SquareBox n={MAKE_TARGET[1]} fill={MAKE_TARGET[0]} target />
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Rebuild Both Numbers" hint={<>Nothing is fixed. Count <b>all</b> the target pieces to set the <b>bottom</b>, then the <b>red</b> ones to set the <b>top</b>. Get both right and your square matches.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="sq-frac"><Frac top={makeTop} d={makeDen} size={32} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">{solved ? <><b>{MAKE_TARGET[1]}</b> pieces, <b>{MAKE_TARGET[0]}</b> red — match</> : "set both numbers"}</span></>}
            cap={solved ? "rebuilt the target" : "set the bottom (all pieces) and the top (red pieces)"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { if (solved) nextStage(); }}
            checkLabel={solved ? "Next stage ▸" : "Match both"}
            checkDisabled={!solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 7) {
    // STAGE 7 · NUMBERS — bare symbols; more on top is bigger (same bottom).
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-bare">
              {NUMBERS_PAIR.map((top, i) => (
                <React.Fragment key={top}>
                  {i === 1 && <span className="den-bare-vs">vs</span>}
                  <button type="button" className={"den-bare-card" + (top === numbersPick ? " is-on" : "")} aria-pressed={top === numbersPick} disabled={solved} onClick={() => pickNumbers(top)}>
                    <Frac top={top} d={NUMBERS_DEN} />
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        }
        rail={<HintRail heading="Just the Numbers" hint={<>No picture. The <b>bottoms are the same</b> ({NUMBERS_DEN}ths), so the pieces are the same size — the fraction with <b>more on top</b> is <b>bigger</b>. Tap the bigger one.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">bigger fraction:</span><span className="den-choices">{NUMBERS_PAIR.map((top) => (<span key={top} className={"den-choice" + (top === numbersPick ? " is-on" : "")}>{top}/{NUMBERS_DEN}</span>))}</span></>}
            cap={solved ? `same bottom, so more on top wins — ${Math.max(...NUMBERS_PAIR)}/${NUMBERS_DEN} > ${Math.min(...NUMBERS_PAIR)}/${NUMBERS_DEN}` : "no picture — reason from the numbers"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { if (solved) nextStage(); }}
            checkLabel={solved ? "Next stage ▸" : "Tap a fraction"}
            checkDisabled={!solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 8) {
    // STAGE 8 · STORY — word problem with the numbers in it; write the fraction.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <Ruler n={STORY_ANS[1]} k={solved ? STORY_ANS[0] : 0} cap={`The tray has ${STORY_ANS[1]} equal slices${solved ? ` — ${STORY_ANS[0]} filled with jam.` : "."}`} />
            </div>
          </div>
        }
        rail={<HintRail heading="Babushka's Tray" hint={<>Babushka's tray is cut into <b>{STORY_ANS[1]}</b> equal slices. She fills <b>{STORY_ANS[0]}</b> with jam. The <b>bottom</b> is the total slices; the <b>top</b> is how many are filled. <b>What fraction is filled?</b></>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">fraction filled →</span><span className="num-slate-wrap"><FracSlate vals={storyVal} setVals={setStoryVal} onSubmit={() => checkFraction(storyVal, STORY_ANS, setStoryVal)} /></span></>}
            cap={solved ? `${STORY_ANS[0]} filled of ${STORY_ANS[1]} — ${STORY_ANS[0]}/${STORY_ANS[1]}` : "write how many filled over how many in all, then Check"}
            solved={solved}
            ready={!solved && !!storyVal.top && !!storyVal.bot}
            stars={stars}
            onCheck={() => checkFraction(storyVal, STORY_ANS, setStoryVal)}
            checkLabel={solved ? "Next stage ▸" : "Check"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 9) {
    // STAGE 9 · WORDS — plain story problem (QuestionBand hidden); write the fraction.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <div className="num-scratch">scratch space — draw the loaf and shade the jam pieces if it helps</div>
            </div>
          </div>
        }
        rail={<HintRail heading="Babushka's Loaf" hint={<>Babushka cuts a loaf into <b>six equal pieces</b> and spreads jam on <b>four</b> of them. Find the two numbers in the story, then write the fraction of the loaf that has jam.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">fraction with jam →</span><span className="num-slate-wrap"><FracSlate vals={wordsVal} setVals={setWordsVal} onSubmit={() => checkFraction(wordsVal, WORDS_ANS, setWordsVal)} /></span></>}
            cap={solved ? `four of six — ${WORDS_ANS[0]}/${WORDS_ANS[1]}` : "read the story, find both numbers, write the fraction"}
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
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <Ruler key={pracSeed} n={prac.d} k={prac.k} cap="What fraction of the ruler is shaded?" />
            </div>
          </div>
        }
        rail={<HintRail heading="Your Turn" hint={<>Read the ruler. How many equal pieces in all (<b>bottom</b>), and how many are <b>red</b> (<b>top</b>)? Write the fraction.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">shaded fraction →</span><span className="num-slate-wrap"><FracSlate key={pracSeed} vals={pracVal} setVals={setPracVal} onSubmit={checkPractice} /></span></>}
            cap={solved ? "correct — a fresh one is on the way" : "count the pieces, count the red, write the fraction"}
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
      band={showBand ? Band : null}
      goal={Goal}
    >
      {body}
    </LessonShell>
  );
}

// Intro line per stage (also the ribbon's initial text).
function STAGE_INTRO(n) {
  switch (n) {
    case 1: return "Three over four means three pieces out of four. Paint three of the four pieces red.";
    case 2: return "Pick a top number and watch the pieces shade red. The top number counts how many of the equal pieces are filled.";
    case 3: return "Count the red pieces in the ruler. That count is the top number — write it in.";
    case 4: return "Pick a top number that shades EVERY piece. When the top equals the bottom, the fraction is one whole.";
    case 5: return "The bottom is fixed. Pick the top number so your square has as many red pieces as the target.";
    case 6: return "Nothing is fixed now. Set the bottom (all pieces) and the top (red pieces) to rebuild the target.";
    case 7: return "No picture. Same bottom number, so more on top is bigger. Which fraction is bigger?";
    case 8: return "Eight slices, five filled. The top is what's filled, the bottom is the total — write the fraction.";
    case 9: return "Read the story: six pieces in all, jam on four. Find both numbers and write the fraction.";
    case "practice": return "Fresh ones. Count the pieces, count the red, and name the shaded fraction.";
    default: return "";
  }
}
