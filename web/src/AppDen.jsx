// AppDen.jsx — №3 "The Bottom Number" (Denominator). A NEW lesson, built on the
// shared shell (LessonShell + LessonBoard) from day one, with identity + tab strip
// pulled from the central registry (web/src/lessons/den.js). Taught on the 0→1
// RULER: pick a bottom number → the ruler splits into that many EQUAL pieces →
// discover that a BIGGER bottom number makes each piece SMALLER → reason from the
// number alone → practice.
//
// THE 7-STAGE ARC (mirrors docs/wireframe/src/screens/room-den-*.js):
//   1 · Split    — pick a bottom number 1..9; the ruler splits into N equal
//                   pieces, one unit piece (1/N) inked red. Free play; "Keep
//                   playing" then advances. Discover smaller-with-bigger-N.
//   2 · Match    — the ruler is already split; COUNT the pieces and pick the
//                   bottom number that made it (image → number).
//   3 · Build    — make YOUR square match the TARGET by picking the bottom number
//                   (top fixed at 1, a unit fraction 1/N).
//   4 · Smaller  — two rulers side by side; tap the SMALLER red piece.
//   5 · Numbers  — no picture; reason from the number alone — which is smaller?
//   6 · Paint    — paint exactly one of N cells red (build 1/N by hand).
//   ★ · Practice — fresh "which is smaller" comparisons, paced locally.
//
// MECHANICS live HERE as React state/handlers (picks, taps, paint, compare). Only
// identity/copy/tab DATA comes from the registry. NumberLine is reused for the
// rulers; Slate is available for number entry; the practice coda is a local,
// self-contained re-rolling comparison game (see ENGINE note).
//
// ENGINE NOTE (contention/placeholder): there is NO denominator / unit-fraction
// skill node in web/src/engine/graph.ts and NO matching generator in
// web/src/generators/ (the closest, COMPARE_BENCHMARK, compares tops at the SAME
// denominator — a different concept). Per the work order, since no node fits and
// graph.ts/generators are NOT in this page's edit ownership, practice uses a SAFE
// PLACEHOLDER: a locally-generated, locally-graded "which unit fraction is
// smaller" game. We still wire useLessonScaffold to a REAL existing node
// (FRACTION_ON_LINE — the ruler/unit-fraction lesson, the nearest pedagogical
// neighbor) so the engine/scaffold backbone, voice, Tier-2 nudges, and stage nav
// run exactly like every other lesson and nothing throws. Attempts report against
// FRACTION_ON_LINE; flagged as contention (a real DENOMINATOR node should be added
// to the graph + a generator authored in a future pass).
import React, { useState } from "react";
import { NumberLine } from "./components/NumberLine.jsx";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson";
import QuestionBand from "./components/QuestionBand.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";
import "./styles/den.css";

// Identity + tab strip are DATA — sourced from the central registry, not inlined.
const L = LESSONS.den;

// The render/scaffold stage MODEL (logic, not chrome). Pairs each registry tab
// (keyed by its badge `t.n`) with a stable scaffold key. We keep these HERE (they
// are interactive wiring) and pull the TAB LABELS / SUBS / order from L.tabs.
const STAGE_BY_BADGE = {
  "1": { n: 1, key: "1-split" },
  "2": { n: 2, key: "2-match" },
  "3": { n: 3, key: "3-build" },
  "4": { n: 4, key: "4-smaller" },
  "5": { n: 5, key: "5-numbers" },
  "6": { n: 6, key: "6-paint" },
  "★": { n: "practice", key: "practice" },
};
const STAGES = L.tabs.map((t) => {
  const m = STAGE_BY_BADGE[t.n];
  return { n: m.n, key: m.key, badge: t.n, tab: t.name, sub: t.sub };
});

// Real engine node we ride for the scaffold backbone (see ENGINE NOTE above).
const NODE = "FRACTION_ON_LINE";

// Fixed worked examples per teaching stage (mirror the wireframe snapshots).
const MATCH_DEN = 6;            // stage 2 — the ruler is split into 6
const BUILD_TARGET = 6;         // stage 3 — target square is 1/6
const SMALLER_PAIR = [3, 8];    // stage 4 — 1/3 vs 1/8 (smaller = 8)
const NUMBERS_PAIR = [4, 9];    // stage 5 — 1/4 vs 1/9 (smaller = 9)
const PAINT_DEN = 4;            // stage 6 — paint 1/4

// The bare 1/N fraction glyph (ink bar), reused across stages.
function UnitFrac({ d, size }) {
  return (
    <div className="bignum" style={size ? { fontSize: size } : undefined}>
      <span className="n">1</span>
      <span className="bar" style={{ background: "var(--ink)" }} />
      <span className="d">{d}</span>
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

// A deterministic-ish but varied unit-fraction comparison for the practice coda.
// Two DIFFERENT denominators in 2..9; the smaller piece is the bigger denominator.
function makeCompare(seed) {
  const POOL = [2, 3, 4, 5, 6, 8, 9, 10, 12];
  const a = POOL[(seed * 7 + 1) % POOL.length];
  let b = POOL[(seed * 13 + 4) % POOL.length];
  if (b === a) b = POOL[(seed * 13 + 5) % POOL.length];
  return { a, b }; // smaller piece is 1 / max(a,b)
}

export default function AppDen({ onBack, onRewatchIntro }) {
  const no = L.num.replace("№", "");
  const title = L.title;

  // ---- Stage 1 (Split) — chosen bottom number (free play) ----
  const [splitDen, setSplitDen] = useState(4);

  // ---- Stage 2 (Match) — the child's guess at the bottom number ----
  const [matchPick, setMatchPick] = useState(null);

  // ---- Stage 3 (Build) — chosen bottom number for YOUR square ----
  const [buildDen, setBuildDen] = useState(2);

  // ---- Stage 4 (Smaller) — which ruler's red piece is smaller ----
  const [smallerPick, setSmallerPick] = useState(null);

  // ---- Stage 5 (Numbers) — which bare fraction is smaller ----
  const [numbersPick, setNumbersPick] = useState(null);

  // ---- Stage 6 (Paint) — which cells are painted red ----
  const [painted, setPainted] = useState([]);

  // ---- Practice — local re-rolling comparison game (placeholder, see note) ----
  const [pracSeed, setPracSeed] = useState(0);
  const [pracPick, setPracPick] = useState(null);
  const prac = makeCompare(pracSeed);

  // ---- shared controller backbone (engine wiring + stage nav + outcome state) --
  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-split";
  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "den",
    initialStage: 1,
    advance: (cur) => (cur === "practice" ? "practice" : cur === 6 ? "practice" : (typeof cur === "number" ? cur + 1 : "practice")),
    back: (cur) => (cur === "practice" ? 6 : Math.max(1, (typeof cur === "number" ? cur : 6) - 1)),
    scaffoldKeyFor: SCAFFOLD_KEY,
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setMatchPick(null);
      setSmallerPick(null);
      setNumbersPick(null);
      setPainted([]);
      setPracPick(null);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole idea — a bigger bottom number cuts the whole into more pieces, so each piece is smaller. Brilliant!" }),
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

  // ---- Stage 1 (Split) — free play; "Keep playing" just advances -------------
  function pickSplit(d) {
    if (solvedRef.current) return;
    setSplitDen(d);
    setStatus({
      tone: "normal",
      text: `1 over ${d} — the ruler is in ${d} equal pieces. ${d >= 6 ? "See how small each piece got?" : "Try a bigger number and watch the pieces shrink."}`,
    });
  }

  // ---- Stage 2 (Match) — count the pieces, pick the bottom number ------------
  function pickMatch(d) {
    if (solvedRef.current) return;
    setMatchPick(d);
    if (d === MATCH_DEN) {
      award(`Yes — ${MATCH_DEN} equal pieces, so one piece is 1 over ${MATCH_DEN}. The bottom number is just how many pieces.`, null, [1, MATCH_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Count again — how many equal pieces are in the ruler? Each one is the same width.` });
      reportAttempt({ correct: false, answerValue: [1, d], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 3 (Build) — pick the bottom number so YOUR square matches target -
  function pickBuild(d) {
    if (solvedRef.current) return;
    setBuildDen(d);
    if (d === BUILD_TARGET) {
      award(`Matched! Both squares are cut into ${BUILD_TARGET} equal pieces with one red — that's 1 over ${BUILD_TARGET}.`, null, [1, BUILD_TARGET]);
    } else {
      setStatus({ tone: "normal", text: `Your square has ${d} pieces; the target has ${BUILD_TARGET}. ${d < BUILD_TARGET ? "Cut it into more." : "That's too many — fewer pieces."}` });
    }
  }

  // ---- Stage 4 (Smaller) — tap the ruler with the smaller red piece ----------
  function pickSmaller(d) {
    if (solvedRef.current) return;
    setSmallerPick(d);
    const smaller = Math.max(...SMALLER_PAIR);
    if (d === smaller) {
      award(`Right — ${smaller} is bigger than ${Math.min(...SMALLER_PAIR)}, so 1 over ${smaller} is the SMALLER piece. More pieces, smaller each.`, null, [1, smaller]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Look at the red pieces — the ruler cut into MORE pieces has the smaller one.` });
      reportAttempt({ correct: false, answerValue: [1, d], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 5 (Numbers) — reason from the number alone ----------------------
  function pickNumbers(d) {
    if (solvedRef.current) return;
    setNumbersPick(d);
    const smaller = Math.max(...NUMBERS_PAIR);
    if (d === smaller) {
      award(`Yes — no picture needed. ${smaller} > ${Math.min(...NUMBERS_PAIR)}, so 1 over ${smaller} is the smaller fraction.`, null, [1, smaller]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Bigger bottom number means a smaller piece. Which number is bigger?` });
      reportAttempt({ correct: false, answerValue: [1, d], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 6 (Paint) — paint exactly one of N cells red --------------------
  function toggleCell(i) {
    if (solvedRef.current) return;
    setPainted((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }
  function checkPaint() {
    if (solved) { nextStage(); return; }
    if (painted.length === 1) {
      award(`Painted! One piece out of ${PAINT_DEN} — that's exactly 1 over ${PAINT_DEN}.`, null, [1, PAINT_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: painted.length === 0 ? `Tap one piece to paint it red — the top number is 1.` : `1 over ${PAINT_DEN} is just ONE piece — reset and paint exactly one.` });
    }
  }

  // ---- Practice — local game (placeholder) -----------------------------------
  function pickPractice(d) {
    if (solvedRef.current) return;
    setPracPick(d);
    const smaller = Math.max(prac.a, prac.b);
    if (d === smaller) {
      award(`Correct — 1 over ${smaller} is the smaller piece. Here's another.`, null, [1, smaller], { stars: 3 });
      // Re-roll a fresh comparison after a short beat (engine decision already
      // applied by award; the local game just swaps the problem).
      setTimeout(() => { setPracSeed((s) => s + 1); setPracPick(null); }, 650);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Remember: bigger bottom number, smaller piece. Try again.` });
      reportAttempt({ correct: false, answerValue: [1, d], errorSignature: "other", stars: 0 });
    }
  }

  // ---- shared pieces ---------------------------------------------------------
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="The bottom number tells how many equal pieces the whole is cut into. A bigger bottom number makes each piece smaller." voxSpeaker="cook">
      The <b>bottom number</b> tells how many <b>equal pieces</b> the whole is cut into — a <b>bigger</b> bottom number makes each piece <b>smaller</b>.
    </LessonGoal>
  );
  const Tutor = <TutorRibbon cook={sc.cook} status={status} />;

  // QuestionBand: shown on stages where the bare fraction doesn't give away the
  // answer. Suppressed on Numbers/Practice (the bare comparison IS the question).
  const showBand = stage === 1 || stage === 2 || stage === 3 || stage === 4 || stage === 6;
  const Band = (() => {
    let lead = "the bottom number", expr = null, answer = null;
    if (stage === 1) { lead = "split the ruler"; expr = <UnitFrac d={splitDen} />; answer = `${splitDen} equal pieces`; }
    else if (stage === 2) { lead = "count the pieces"; expr = <span style={{ fontStyle: "italic", fontSize: 22 }}>how many equal pieces?</span>; answer = solved ? MATCH_DEN : "?"; }
    else if (stage === 3) { lead = "match the target"; expr = <UnitFrac d={BUILD_TARGET} />; answer = solved ? "matched" : "?"; }
    else if (stage === 4) { lead = "which is smaller?"; expr = <span style={{ display: "inline-flex", gap: 18, alignItems: "center" }}><UnitFrac d={SMALLER_PAIR[0]} size={34} /><span className="qb-op">vs</span><UnitFrac d={SMALLER_PAIR[1]} size={34} /></span>; answer = solved ? `1/${Math.max(...SMALLER_PAIR)}` : "?"; }
    else if (stage === 6) { lead = "paint this fraction"; expr = <UnitFrac d={PAINT_DEN} />; answer = solved ? "painted" : "?"; }
    return <QuestionBand lead={lead} expr={expr} answer={answer} />;
  })();

  // ---- per-stage body --------------------------------------------------------
  let body = null;

  if (stage === 1) {
    // STAGE 1 · SPLIT — pick a bottom number; the ruler splits into N equal pieces.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <div className="den-numcol" role="group" aria-label="pick a bottom number">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((k) => (
                  <button key={k} type="button" className={"den-num" + (k === splitDen ? " is-on" : "")} aria-pressed={k === splitDen} onClick={() => pickSplit(k)}>{k}</button>
                ))}
              </div>
              <div className="den-pick-frac"><UnitFrac d={splitDen} /></div>
              <div className="den-ruler-wrap">
                <div className="den-ruler" aria-label={`ruler split into ${splitDen} equal pieces`}>
                  {Array.from({ length: splitDen }, (_, i) => (
                    <div key={i} className={"den-seg" + (i === 0 ? " is-unit" : "")}>
                      {i === 0 && <span className="den-seg-lab">1/{splitDen}</span>}
                    </div>
                  ))}
                </div>
                <div className="den-ends"><span>0</span><span>1</span></div>
                <div className="den-cap">Pick a bottom number — the ruler from 0 to 1 splits into that many equal pieces.</div>
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Split the Ruler" hint={<>Tap a number. The ruler from <b>0</b> to <b>1</b> breaks into that many <b>equal</b> pieces — one piece is <b>1 over that number</b>. Watch the pieces get <b>smaller</b> as the number gets <b>bigger</b>.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-pick-frac"><UnitFrac d={splitDen} size={34} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">one piece of a ruler split into <b>{splitDen}</b> equal parts</span></>}
            cap="change the bottom number and keep playing — then move on"
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
  } else if (stage === 2) {
    // STAGE 2 · MATCH — the ruler is already split; pick the bottom number.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-play">
              <div className="den-numcol" role="group" aria-label="pick the bottom number">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((k) => (
                  <button key={k} type="button" className={"den-num" + (k === matchPick ? " is-on" : "")} aria-pressed={k === matchPick} disabled={solved} onClick={() => pickMatch(k)}>{k}</button>
                ))}
              </div>
              <div className="den-pick-frac"><UnitFrac d={matchPick ?? "?"} /></div>
              <div className="den-ruler-wrap">
                <div className="den-ruler">
                  {Array.from({ length: MATCH_DEN }, (_, i) => (
                    <div key={i} className={"den-seg" + (i === 0 ? " is-unit" : "")}>
                      {i === 0 && solved && <span className="den-seg-lab">1/{MATCH_DEN}</span>}
                    </div>
                  ))}
                </div>
                <div className="den-ends"><span>0</span><span>1</span></div>
                <div className="den-cap">Count the equal pieces — that count is the bottom number.</div>
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Match the Number" hint={<>This ruler is already split. <b>Count the equal pieces</b>, then tap the number that made it. The bottom number is just <b>how many equal pieces</b> the whole was cut into.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">{solved ? `${MATCH_DEN} equal pieces, so one piece is` : "count the pieces, then tap the bottom number"}</span>{solved && <><span className="den-ans-eq">→</span><UnitFrac d={MATCH_DEN} size={34} /></>}</>}
            cap={solved ? "the bottom number IS the piece-count" : "tap the bottom number that matches the picture"}
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
  } else if (stage === 3) {
    // STAGE 3 · BUILD — pick the bottom number so YOUR square matches the target.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="sq-game">
              <div className="sq-pickcol">
                <span className="num-tag">numbers</span>
                <div className="den-numcol" role="group" aria-label="pick the bottom number">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((k) => (
                    <button key={k} type="button" className={"den-num" + (k === buildDen ? " is-on" : "")} aria-pressed={k === buildDen} disabled={solved} onClick={() => pickBuild(k)}>{k}</button>
                  ))}
                </div>
              </div>
              <div className="sq-frac-pick">
                <div className="bignum" style={{ fontSize: 48 }}><span className="n sq-slot-locked">1</span><span className="bar" style={{ background: "var(--ink)" }} /><span className="d sq-slot-active">{buildDen}</span></div>
                <div className="sq-frac-hint">top stays 1 — pick the bottom number</div>
              </div>
              <div className="sq-side">
                <span className="sq-side-lab">your square</span>
                <SquareBox n={buildDen} fill={1} />
              </div>
              <div className="sq-match">match&nbsp;→</div>
              <div className="sq-side">
                <span className="sq-side-lab">target</span>
                <SquareBox n={BUILD_TARGET} fill={1} target />
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Make Two Identical Squares" hint={<>The top number stays <b>1</b> — one red piece. Pick the <b>bottom number</b> so <b>your</b> square is cut into the <b>same number of equal pieces</b> as the <b>target</b>. More pieces means each piece is smaller.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="sq-frac"><UnitFrac d={buildDen} size={32} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">{solved ? <><b>1</b> red piece out of <b>{BUILD_TARGET}</b> — squares match</> : `your square has ${buildDen} pieces`}</span></>}
            cap={solved ? "matched the target" : "pick the bottom number that makes your square match the target"}
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
  } else if (stage === 4) {
    // STAGE 4 · SMALLER — two rulers; tap the smaller red piece.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-compare">
              {SMALLER_PAIR.map((n) => (
                <div key={n} className={"den-row is-pick" + (n === smallerPick ? " is-chosen" : "")} role="button" tabIndex={0} aria-label={`ruler split into ${n}`} onClick={() => pickSmaller(n)}>
                  <UnitFrac d={n} size={34} />
                  <div className="den-ruler is-sm">
                    {Array.from({ length: n }, (_, i) => (
                      <div key={i} className={"den-seg" + (i === 0 ? " is-unit" : "")}>
                        {i === 0 && <span className="den-seg-lab">1/{n}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="den-cap">Same ruler, two bottom numbers. Tap the ruler whose red piece is smaller.</div>
            </div>
          </div>
        }
        rail={<HintRail heading="Which Piece Is Smaller?" hint={<>Both rulers go from <b>0</b> to <b>1</b> — the same whole. Cut into more pieces, each piece is <b>smaller</b>. A <b>bigger bottom number</b> means a <b>smaller</b> piece. Tap the smaller one.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">smaller piece:</span><span className="den-choices">{SMALLER_PAIR.map((n) => (<span key={n} className={"den-choice" + (n === smallerPick ? " is-on" : "")}>1/{n}</span>))}</span></>}
            cap={solved ? `${Math.max(...SMALLER_PAIR)} is bigger than ${Math.min(...SMALLER_PAIR)}, so 1/${Math.max(...SMALLER_PAIR)} is smaller` : "tap the ruler with the smaller red piece"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { if (solved) nextStage(); }}
            checkLabel={solved ? "Next stage ▸" : "Tap a ruler"}
            checkDisabled={!solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 5 · NUMBERS — no picture; reason from the number alone.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-bare">
              {NUMBERS_PAIR.map((n, i) => (
                <React.Fragment key={n}>
                  {i === 1 && <span className="den-bare-vs">vs</span>}
                  <button type="button" className={"den-bare-card" + (n === numbersPick ? " is-on" : "")} aria-pressed={n === numbersPick} disabled={solved} onClick={() => pickNumbers(n)}>
                    <UnitFrac d={n} />
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        }
        rail={<HintRail heading="Just the Numbers" hint={<>No picture this time. Both are <b>one piece</b> — so the only thing that matters is <b>how many pieces the whole was cut into</b>. The <b>bigger</b> bottom number makes the <b>smaller</b> piece. Tap the smaller fraction.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">smaller fraction:</span><span className="den-choices">{NUMBERS_PAIR.map((n) => (<span key={n} className={"den-choice" + (n === numbersPick ? " is-on" : "")}>1/{n}</span>))}</span></>}
            cap={solved ? `${Math.max(...NUMBERS_PAIR)} > ${Math.min(...NUMBERS_PAIR)}, so 1/${Math.max(...NUMBERS_PAIR)} < 1/${Math.min(...NUMBERS_PAIR)}` : "no picture — reason from the numbers"}
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
  } else if (stage === 6) {
    // STAGE 6 · PAINT — paint exactly one of N cells red.
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="sq-game sq-paint">
              <div className="sq-side">
                <span className="sq-side-lab">paint 1/{PAINT_DEN} red</span>
                <SquareBox n={PAINT_DEN} paint onCell={toggleCell} painted={painted} />
              </div>
              <div className="sq-tool">
                <div className="sq-tool-h">Fill</div>
                <button type="button" className="sq-reset" onClick={() => setPainted([])} disabled={solved}>Reset</button>
              </div>
            </div>
          </div>
        }
        rail={<HintRail heading="Paint the Fraction" hint={<>This square is cut into <b>{PAINT_DEN}</b> equal pieces — that is the bottom number. <b>Paint 1/{PAINT_DEN} red</b>: the top number is <b>1</b>, so fill in exactly <b>one</b> piece. Tap a piece to fill it.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">Paint</span><span className="sq-frac"><UnitFrac d={PAINT_DEN} size={30} /></span><span className="den-ans-amt">of the square red — <b>1</b> piece of <b>{PAINT_DEN}</b></span></>}
            cap={solved ? `one piece of ${PAINT_DEN} — that's 1/${PAINT_DEN}` : "fill exactly one of the pieces, then check"}
            solved={solved}
            ready={painted.length === 1 && !solved}
            stars={stars}
            onCheck={checkPaint}
            checkLabel={solved ? "Next stage ▸" : "Got it"}
          />
        }
        tutor={Tutor}
      />
    );
  } else {
    // ★ PRACTICE — local re-rolling comparison game (placeholder; see ENGINE NOTE).
    const pair = [prac.a, prac.b];
    body = (
      <LessonBoard
        footHeight={150}
        railWidth={340}
        stage={
          <div className="canvas">
            <div className="den-bare">
              {pair.map((n, i) => (
                <React.Fragment key={`${pracSeed}-${n}`}>
                  {i === 1 && <span className="den-bare-vs">vs</span>}
                  <button type="button" className={"den-bare-card" + (n === pracPick ? " is-on" : "")} aria-pressed={n === pracPick} disabled={solved} onClick={() => pickPractice(n)}>
                    <UnitFrac d={n} />
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        }
        rail={<HintRail heading="Your Turn" hint={<>Which piece is <b>smaller</b>? Remember: the <b>bigger</b> the bottom number, the <b>smaller</b> the piece. No picture — reason from the numbers.</>} />}
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">tap the smaller fraction:</span><span className="den-choices">{pair.map((n) => (<span key={n} className={"den-choice" + (n === pracPick ? " is-on" : "")}>1/{n}</span>))}</span></>}
            cap={solved ? "correct — a fresh one is on the way" : "pick one, then it grades itself"}
            solved={solved}
            ready={false}
            stars={stars}
            onCheck={() => { setPracSeed((s) => s + 1); setPracPick(null); }}
            checkLabel="New problem ▸"
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
    case 1: return "Pick a number and watch the ruler split. The bottom number says how many equal pieces the whole is cut into.";
    case 2: return "Count the pieces in the ruler. That count is the bottom number — tap it.";
    case 3: return "The top number stays 1. Pick the bottom number so your square has the same pieces as the target.";
    case 4: return "Same whole, cut into more pieces — so each piece is smaller. Tap the ruler with the smaller red piece.";
    case 5: return "No picture now. The bigger the bottom number, the smaller the piece. Which is smaller?";
    case 6: return "One over four means one piece out of four. Paint just one of the pieces red.";
    case "practice": return "Fresh ones. Bigger bottom number, smaller piece — pick the smaller fraction.";
    default: return "";
  }
}
