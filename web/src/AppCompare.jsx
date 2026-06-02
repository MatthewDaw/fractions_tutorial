// AppCompare.jsx — Lesson No.7 "Compare & Check" (room cmp, COMPARE_BENCHMARK).
// CCSS 3.NF.A.3d (compare two fractions) · 4.NF.A.2 (compare with benchmarks) ·
// 5.NF.A.2 (estimate a sum for reasonableness, WITHOUT computing).
//
// The throughline is the antidote to "added the denominators": you can SEE which
// fraction is bigger, and you can REASON about a sum's size from how each part
// sits relative to 1/2 — long before you ever find a common denominator.
//
// THE ARC — three focused stages, reachable one-click from the stage selector and
// advanced one-by-one on a correct answer. Every stage answers with plain CHOICE
// BUTTONS (no Slate); the visual is the shared <NumberLine>.
//
//   1 · Compare   — two stacked 0→1 number lines, one fraction marked on each.
//       The child picks  <  =  or  > . Two items: same-denominator (3/8 vs 5/8),
//       then same-numerator (1/3 vs 1/4 — the bigger bottom makes smaller pieces).
//   2 · Benchmark — one fraction marked on a 0→1 line with the 1/2 tick called
//       out; the child picks the NEAREST of {0, 1/2, 1}.
//   3 · Reason    — a SUM (1/2 + 2/3) shown as words/symbols; the child decides
//       "less than 1 / about 1 / more than 1" WITHOUT computing. Anchor answer:
//       more than 1 (both addends are at least 1/2, so the total clears one whole).
//
// LAYOUT comes from the shared lesson library (LessonShell + LessonBoard +
// TutorRibbon + LessonGoal); the controller backbone (engine wiring, stage nav,
// outcome state) comes from useLessonScaffold. Room CSS lives in styles/cmp.css,
// namespaced .cmp-… . NumberLine is imported read-only for the visuals.
import React, { useState } from "react";
import Rosette from "./components/Rosette.jsx";
import BigFrac from "./components/BigFrac.jsx";
import NumberLine from "./components/NumberLine.jsx";
import QuestionBand from "./components/QuestionBand.jsx";
import { LessonShell, LessonBoard, TutorRibbon, LessonGoal } from "./components/lesson";
import GenPracticeBoard from "./components/GenPracticeBoard.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";

import "./styles/cmp.css";

// ── the three stages of the arc ──────────────────────────────────────────────
const STAGES = [
  { id: "1-compare",   n: 1, tag: "Compare",   blurb: "Which is bigger? Pick < = or >" },
  { id: "2-benchmark", n: 2, tag: "Benchmark", blurb: "Nearest of 0, one-half, or 1?" },
  { id: "3-reason",    n: 3, tag: "Reason",    blurb: "Is the sum less, about, or more than 1?" },
  // Auto-generated, estimator-paced practice: the engine mints fresh
  // COMPARE_BENCHMARK variations, re-rolls on a correct answer, fades to harder
  // problems on a clean streak, and probes transfer. Purely additive.
  { id: "practice",    n: "★", tag: "Practice",  blurb: "Fresh problems — paced to your mastery" },
];

// ── Stage-1 comparison items (in-grade denominators only) ────────────────────
// item 1: SAME DENOMINATOR — more pieces of the SAME size is more (3/8 < 5/8).
// item 2: SAME NUMERATOR   — the same count of SMALLER pieces is less (1/3 > 1/4).
const COMPARE_ITEMS = [
  {
    a: { num: 3, den: 8 }, b: { num: 5, den: 8 }, rel: "<",
    why: "Same size pieces — eighths on both. Five of them is more than three, so 3/8 is LESS than 5/8.",
    teach: "When the bottoms match, the pieces are the same size — just count them.",
  },
  {
    a: { num: 1, den: 3 }, b: { num: 1, den: 4 }, rel: ">",
    why: "One piece each, but thirds are BIGGER pieces than fourths. So 1/3 is MORE than 1/4 — a bigger bottom makes smaller pieces.",
    teach: "Same number of pieces, but a bigger bottom number cuts the whole into smaller pieces.",
  },
];

// ── Stage-2 benchmark item: 5/8 is just past 1/2, so its nearest landmark is 1/2.
const BENCH_ITEM = {
  num: 5, den: 8,
  choices: [
    { key: "0",   label: "0",   value: 0 },
    { key: "1/2", label: "½",   value: 0.5 },
    { key: "1",   label: "1",   value: 1 },
  ],
  answer: "1/2",
  why: "5/8 sits just past the half-way mark — closer to 1/2 than to 0 or to a whole 1.",
};

// ── Stage-3 reasonableness item: 1/2 + 2/3 (NO computing). Both addends are at
// least 1/2, so the total must clear one whole → "more than 1".
const REASON_ITEM = {
  a: { num: 1, den: 2 }, b: { num: 2, den: 3 },
  choices: [
    { key: "less",  label: "less than 1" },
    { key: "about", label: "about 1" },
    { key: "more",  label: "more than 1" },
  ],
  answer: "more",
  why: "1/2 is exactly a half, and 2/3 is MORE than a half. A half plus more-than-a-half must be MORE than one whole — no adding needed.",
};

// Canvas geometry. The shared .canvas is 720×346 with position:relative, so the
// NumberLine's absolute children (.nline/.ntick/.nlab + the point dot) lay out in
// stage-space px. Two stacked lines sit at LINE_TOP and LINE_TOP+LINE_GAP.
const ORIGIN = 80, SPAN = 560;
const LINE_TOP = 120, LINE_GAP = 120;

export default function AppCompare({ no, title, onBack, onRewatchIntro }) {
  // ── per-stage answer state ─────────────────────────────────────────────────
  const [itemIdx, setItemIdx] = useState(0); // Stage 1 cycles two comparison items
  const [pick, setPick] = useState(null);     // the choice the child committed

  // ── shared controller backbone ─────────────────────────────────────────────
  const sc = useLessonScaffold({
    nodeId: "COMPARE_BENCHMARK",
    lessonId: "cmp",
    initialStage: "1-compare",
    stagesOrder: STAGES.map((s) => s.id),
    // The final "practice" stage serves auto-generated COMPARE_BENCHMARK
    // variations, paced by the engine (re-roll on correct, fade on a clean
    // streak, transfer probe).
    generatedStages: ["practice"],
    generatorSkill: "COMPARE_BENCHMARK",
    introFor: (s) => initialStatus(s),
    resetStage: () => { setItemIdx(0); setPick(null); },
  });
  const {
    stage, goStage, nextStage,
    reportAttempt, applyEngineDecision,
    solved, setSolved, solvedRef, stars, setStars, cook, setCook, status, setStatus,
    say, speaking, stageRef,
  } = sc;

  function initialStatus(s) {
    switch (s) {
      case "1-compare":   return { tone: "normal", text: "Which fraction is bigger? Look at the two lines, then pick the sign that goes between them: less-than, equal, or greater-than." };
      case "2-benchmark": return { tone: "normal", text: "Where does this fraction land? Pick the nearest landmark: 0, one-half, or 1. The half-way mark is called out on the line." };
      case "3-reason":    return { tone: "normal", text: "Don't add it up — just reason about its size. Is the sum less than 1, about 1, or more than 1?" };
      default:            return { tone: "normal", text: "" };
    }
  }

  const item = COMPARE_ITEMS[itemIdx];

  // ── Stage 1: pick a comparison sign ────────────────────────────────────────
  function pickRel(rel) {
    if (solvedRef.current) return;
    setPick(rel);
    const correct = rel === item.rel;
    if (correct) {
      setCook("cheer");
      // If there's a second comparison item, advance to it; only the LAST item
      // solves the stage and reports to the engine.
      const lastItem = itemIdx >= COMPARE_ITEMS.length - 1;
      if (!lastItem) {
        setStatus({ tone: "ok", text: `${item.why} Now one more — same count of pieces, different sizes.` });
        say("cmpGoal");
        setTimeout(() => { setItemIdx((i) => i + 1); setPick(null); setCook("idle"); }, 1400);
      } else {
        setSolved(true); setStars(3);
        setStatus({ tone: "ok", text: `${item.why} You compared both — on to benchmarks!` });
        say("cmpWin");
        const dec = reportAttempt({ correct: true, answerValue: [item.a.num, item.a.den], errorSignature: null, stars: 3 });
        setTimeout(() => applyEngineDecision(dec, true), 1500);
      }
    } else {
      setCook("think");
      // "added the denominators" style slip: the most common wrong sign reasoning.
      const errSig = item.den === item.b?.den ? "compared_wrong_count" : "ignored_piece_size";
      setStatus({ tone: "warn", text: item.den != null ? item.why : `Not quite. ${item.teach} Look again at the two lines.` });
      say("cmpGoal");
      reportAttempt({ correct: false, answerValue: null, errorSignature: errSig, stars: 0 });
    }
  }

  // ── Stage 2: pick the nearest benchmark ────────────────────────────────────
  function pickBench(key) {
    if (solvedRef.current) return;
    setPick(key);
    if (key === BENCH_ITEM.answer) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: `${BENCH_ITEM.why} Nearest landmark: one-half. Next!` });
      say("cmpWin");
      const dec = reportAttempt({ correct: true, answerValue: [BENCH_ITEM.num, BENCH_ITEM.den], errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else {
      setCook("think");
      setStatus({ tone: "warn", text: `Not the closest. ${BENCH_ITEM.why}` });
      say("cmpBenchmark");
      reportAttempt({ correct: false, answerValue: [BENCH_ITEM.num, BENCH_ITEM.den], errorSignature: "wrong_benchmark", stars: 0 });
    }
  }

  // ── Stage 3: reason about the sum's size (no computing) ─────────────────────
  function pickReason(key) {
    if (solvedRef.current) return;
    setPick(key);
    if (key === REASON_ITEM.answer) {
      setSolved(true); setStars(3); setCook("cheer");
      setStatus({ tone: "ok", text: `${REASON_ITEM.why} More than 1 — and you never had to add!` });
      say("cmpWin");
      const dec = reportAttempt({ correct: true, answerValue: null, errorSignature: null, stars: 3 });
      setTimeout(() => applyEngineDecision(dec, true), 1500);
    } else {
      setCook("think");
      const errSig = key === "less" ? "summed_too_small" : "underestimated_sum";
      setStatus({ tone: "warn", text: `Reason it out: ${REASON_ITEM.why}` });
      say("cmpReason");
      reportAttempt({ correct: false, answerValue: null, errorSignature: errSig, stars: 0 });
    }
  }

  function reset() { goStage(stageRef.current); }

  // ── shared chrome ──────────────────────────────────────────────────────────
  const Goal = (
    <LessonGoal say={say} speaking={speaking} voiceKey="cmpGoal" voxSpeaker="mom">
      {stageGoal(stage, item)}
    </LessonGoal>
  );

  // The canonical question band: the comparison / benchmark / sum, with a red "?"
  // that resolves to the chosen answer once solved.
  const Band = (
    <QuestionBand
      lead="the question"
      expr={
        stage === "1-compare"
          ? <span className="cmp-band-cmp"><BigFrac num={item.a.num} den={item.a.den} /><span className="cmp-band-q">?</span><BigFrac num={item.b.num} den={item.b.den} /></span>
          : stage === "2-benchmark"
          ? <BigFrac num={BENCH_ITEM.num} den={BENCH_ITEM.den} />
          : <span className="cmp-band-sum"><BigFrac num={REASON_ITEM.a.num} den={REASON_ITEM.a.den} /><span className="cmp-band-op">+</span><BigFrac num={REASON_ITEM.b.num} den={REASON_ITEM.b.den} /></span>
      }
      answer={
        solved
          ? (stage === "1-compare" ? item.rel
            : stage === "2-benchmark" ? "½"
            : "more than 1")
          : "?"
      }
    />
  );

  const Tutor = <TutorRibbon cook={cook} status={status} />;

  // ── per-stage body ─────────────────────────────────────────────────────────
  let body = null;
  let canvas = null, railNode = null, answerNode = null;

  if (stage === "practice") {
    // PRACTICE — auto-generated COMPARE_BENCHMARK variations, paced by the mastery
    // engine. This skill answers with RELATION buttons, which GenPracticeBoard
    // renders automatically from the generated problem.
    body = <GenPracticeBoard skill="COMPARE_BENCHMARK" scaffold={sc} />;
  } else if (stage === "1-compare") {
    // Two stacked 0→1 lines, one fraction marked on each. The mark for the larger
    // value reaches farther — the comparison is visible before any sign is picked.
    // NumberLine renders ABSOLUTELY-positioned children inside .canvas, so each
    // line gets its own lineY band; the fraction tag is absolutely placed beside it.
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <span className="cmp-line-tag" style={{ left: 4, top: LINE_TOP - 14 }}><BigFrac num={item.a.num} den={item.a.den} /></span>
        <NumberLine den={item.a.den} origin={ORIGIN} span={SPAN} lineY={LINE_TOP} fillToPoint
          point={item.a.num / item.a.den}
          marks={[{ value: item.a.num / item.a.den, label: `${item.a.num}/${item.a.den}` }]} />

        <span className="cmp-line-tag" style={{ left: 4, top: LINE_TOP + LINE_GAP - 14 }}><BigFrac num={item.b.num} den={item.b.den} /></span>
        <NumberLine den={item.b.den} origin={ORIGIN} span={SPAN} lineY={LINE_TOP + LINE_GAP} fillToPoint
          point={item.b.num / item.b.den}
          marks={[{ value: item.b.num / item.b.den, label: `${item.b.num}/${item.b.den}` }]} />

        <div className="cmp-itemdots" aria-hidden="true">
          {COMPARE_ITEMS.map((_, i) => (
            <span key={i} className={"cmp-itemdot" + (i === itemIdx ? " on" : "") + (i < itemIdx ? " done" : "")} />
          ))}
        </div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Compare</h3>
        <div className="hint">{item.teach} The farther a mark sits to the RIGHT, the bigger the fraction. Pick the sign that goes between them.</div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={item.a.num} den={item.a.den} /> <span className="cmp-ans-q">?</span> <BigFrac num={item.b.num} den={item.b.den} /></>}
        choices={[
          { key: "<", label: "<", sub: "less than" },
          { key: "=", label: "=", sub: "equal" },
          { key: ">", label: ">", sub: "greater" },
        ]}
        pick={pick} answer={item.rel} solved={solved} stars={stars}
        onPick={pickRel} onNext={nextStage}
        cap={solved ? "both compared — next stage" : "pick the sign between the two fractions"}
      />
    );
  } else if (stage === "2-benchmark") {
    // One 0→1 line with the 1/2 reference tick called out; the fraction is marked.
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <span className="cmp-line-tag big" style={{ left: 4, top: 150 }}><BigFrac num={BENCH_ITEM.num} den={BENCH_ITEM.den} /></span>
        <NumberLine den={BENCH_ITEM.den} origin={ORIGIN} span={SPAN} lineY={170} fillToPoint
          benchmarkHalf
          point={BENCH_ITEM.num / BENCH_ITEM.den}
          marks={[{ value: BENCH_ITEM.num / BENCH_ITEM.den, label: `${BENCH_ITEM.num}/${BENCH_ITEM.den}` }]} />
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Benchmark</h3>
        <div className="hint">The three landmarks on a 0→1 line are <b>0</b>, <b>one-half</b>, and <b>1</b>. Which one is the marked fraction CLOSEST to? The half-way mark is highlighted.</div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<><BigFrac num={BENCH_ITEM.num} den={BENCH_ITEM.den} /> <span className="cmp-ans-q">is nearest</span></>}
        choices={BENCH_ITEM.choices.map((c) => ({ key: c.key, label: c.label, sub: "" }))}
        pick={pick} answer={BENCH_ITEM.answer} solved={solved} stars={stars}
        onPick={pickBench} onNext={nextStage}
        cap={solved ? "nearest landmark: one-half — next stage" : "pick the nearest of 0, one-half, or 1"}
      />
    );
  } else {
    // Stage 3 — reasonableness. Both addends shown on ONE 0→1 line so the child can
    // SEE each one sit relative to 1/2; the answer is a size category, not a value.
    canvas = (
      <div className="canvas cmp-canvas" id="cmpcanvas">
        <div className="cmp-reason-eq">
          <BigFrac num={REASON_ITEM.a.num} den={REASON_ITEM.a.den} />
          <span className="cmp-reason-op">+</span>
          <BigFrac num={REASON_ITEM.b.num} den={REASON_ITEM.b.den} />
          <span className="cmp-reason-op">=</span>
          <span className="cmp-reason-q">{solved ? "more than 1" : "?"}</span>
        </div>

        <span className="cmp-line-tag" style={{ left: 4, top: LINE_TOP - 14 }}><BigFrac num={REASON_ITEM.a.num} den={REASON_ITEM.a.den} /></span>
        <NumberLine den={REASON_ITEM.a.den} origin={ORIGIN} span={SPAN} lineY={LINE_TOP} fillToPoint
          benchmarkHalf point={REASON_ITEM.a.num / REASON_ITEM.a.den}
          marks={[{ value: REASON_ITEM.a.num / REASON_ITEM.a.den, label: `${REASON_ITEM.a.num}/${REASON_ITEM.a.den}` }]} />

        <span className="cmp-line-tag" style={{ left: 4, top: LINE_TOP + LINE_GAP - 14 }}><BigFrac num={REASON_ITEM.b.num} den={REASON_ITEM.b.den} /></span>
        <NumberLine den={REASON_ITEM.b.den} origin={ORIGIN} span={SPAN} lineY={LINE_TOP + LINE_GAP} fillToPoint
          benchmarkHalf point={REASON_ITEM.b.num / REASON_ITEM.b.den}
          marks={[{ value: REASON_ITEM.b.num / REASON_ITEM.b.den, label: `${REASON_ITEM.b.num}/${REASON_ITEM.b.den}` }]} />

        <div className="cmp-reason-note">Each part sits at or past the half-way mark — so the total clears one whole.</div>
      </div>
    );
    railNode = (
      <div className="panel">
        <h3 className="pick-title">Reason — don't compute</h3>
        <div className="hint">No common bottom, no adding. Look at where each part sits: <b>1/2</b> is exactly a half; <b>2/3</b> is past the half. A half plus more-than-a-half is MORE than one whole.</div>
      </div>
    );
    answerNode = (
      <ChoiceAnswer
        prompt={<>the sum is</>}
        choices={REASON_ITEM.choices.map((c) => ({ key: c.key, label: c.label, sub: "" }))}
        pick={pick} answer={REASON_ITEM.answer} solved={solved} stars={stars}
        wide
        onPick={pickReason} onNext={nextStage}
        lastStage
        cap={solved ? "more than 1 — you reasoned without adding" : "pick the size of the sum — without computing"}
      />
    );
  }

  if (stage !== "practice") {
    body = (
      <LessonBoard
        variant="split"
        footHeight={196}
        railWidth={396}
        stage={canvas}
        rail={railNode}
        answer={answerNode}
        tutor={Tutor}
      />
    );
  }

  return (
    <LessonShell
      no={no}
      tag="Compare & Check"
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
      band={stage !== "practice" ? Band : null}
      goal={Goal}
    >
      {body}
    </LessonShell>
  );
}

// ── the shared choice-answer card (the < = > / benchmark / size buttons) ───────
// Plain choice buttons, not a Slate. A picked-but-wrong button flashes; the
// correct button locks in green on solve; then the card swaps to a Next button.
function ChoiceAnswer({ prompt, choices, pick, answer, solved, stars, onPick, onNext, cap, wide, lastStage }) {
  return (
    <div className="lbar cmp-answer">
      <div className="cmp-ans-row">
        <span className="cmp-ans-prompt">{prompt}</span>
        <div className={"cmp-choices" + (wide ? " is-wide" : "")}>
          {choices.map((c) => {
            const isPick = pick === c.key;
            const state = solved
              ? (c.key === answer ? " is-correct" : "")
              : (isPick ? " is-wrong" : "");
            return (
              <button
                key={c.key}
                className={"cmp-choice" + state}
                disabled={solved}
                aria-pressed={isPick}
                onClick={() => onPick(c.key)}
              >
                <span className="cmp-choice-lab">{c.label}</span>
                {c.sub && <span className="cmp-choice-sub">{c.sub}</span>}
              </button>
            );
          })}
        </div>
        <div className="cmp-ans-marks">
          {solved && <Rosette count={stars} />}
          <button
            className={"check" + (solved ? " done" : "")}
            onClick={solved ? onNext : undefined}
            disabled={!solved}
          >{solved ? (lastStage ? "Done" : "Next →") : "Pick one"}</button>
        </div>
      </div>
      <div className="cmp-ans-cap">{cap}</div>
    </div>
  );
}

// ── per-stage goal copy (captions, since the audience reads) ──────────────────
function stageGoal(stage, item) {
  switch (stage) {
    case "1-compare":
      return (<>Which fraction is bigger? Each one is marked on its own line. <b>Pick the sign</b> that belongs between them: <b>&lt;</b>, <b>=</b>, or <b>&gt;</b>. The mark farther to the right is the larger amount.</>);
    case "2-benchmark":
      return (<>Where does <b>5/8</b> land? Pick the <b>nearest landmark</b> — <b>0</b>, <b>one-half</b>, or <b>1</b>. The half-way mark is called out on the line to compare against.</>);
    case "3-reason":
      return (<>Don't add it up. Just decide whether <b>1/2 + 2/3</b> is <b>less than 1</b>, <b>about 1</b>, or <b>more than 1</b> — by reasoning about how big each part is.</>);
    default:
      return "";
  }
}
