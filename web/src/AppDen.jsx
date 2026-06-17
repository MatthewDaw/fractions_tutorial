// AppDen.jsx — №3 "The Bottom Number" (Denominator). A NEW lesson, built on the
// shared shell (LessonShell + LessonBoard) from day one, with identity + tab strip
// pulled from the central registry (web/src/lessons/den.js). Taught on the 0→1
// RULER: pick a bottom number → the ruler splits into that many EQUAL pieces →
// discover that a BIGGER bottom number makes each piece SMALLER → reason from the
// number alone → practice.
//
// THE 7-STAGE ARC (mirrors docs/wireframe/src/screens/room-den-*.js):
//   1 · Paint    — paint exactly one of N cells red (build 1/N by hand).
//   2 · Split    — pick a bottom number 1..9; the ruler splits into N equal
//                   pieces, one unit piece (1/N) inked red. Free play; "Keep
//                   playing" then advances. Discover smaller-with-bigger-N.
//   3 · Match    — the ruler is already split; COUNT the pieces and pick the
//                   bottom number that made it (image → number).
//   4 · Build    — make YOUR square match the TARGET by picking the bottom number
//                   (top fixed at 1, a unit fraction 1/N).
//   (display 4) Numbers [internal stage 5] — no picture; reason from the number
//                   alone — which is smaller? (the < = > compare)
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
import React, { useState, useRef } from "react";
import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, RailInstruction, UndoSplitButton } from "./components/lesson";
import CompareInput from "./components/lesson/CompareInput.jsx";
import { DigitGrid, DigitSlot, CellBox, Ruler } from "./components/assets";
import { KnifeRack, useKnifeCut } from "./components/lesson/KnifeRack.jsx";
import { useLessonScaffold } from "./runtime/useLessonScaffold.js";
import { LESSONS } from "./lessons/index.js";
import "./styles/den.css";

// Identity + tab strip are DATA — sourced from the central registry, not inlined.
const L = LESSONS.den;

// The render/scaffold stage MODEL (logic, not chrome). Pairs each registry tab
// (keyed by its badge `t.n`) with a stable scaffold key. We keep these HERE (they
// are interactive wiring) and pull the TAB LABELS / SUBS / order from L.tabs.
const STAGE_BY_BADGE = {
  "1": { n: 1, key: "1-paint" },
  "2": { n: 2, key: "2-match" },
  "3": { n: 3, key: "3-build" },
  // The "Smaller" stage (old numeric 4) was removed; the displayed badge 4 now maps
  // to Numbers. The internal stage number (5) stays so its render branch + grader
  // never have to renumber.
  "4": { n: 5, key: "5-numbers" },
  "★": { n: "practice", key: "practice" },
};
const STAGES = L.tabs.map((t) => {
  const m = STAGE_BY_BADGE[t.n];
  return { n: m.n, key: m.key, badge: t.n, tab: t.name, sub: t.sub };
});

// Real engine node we ride for the scaffold backbone (see ENGINE NOTE above).
const NODE = "FRACTION_ON_LINE";

// Fixed worked examples per teaching stage (mirror the wireframe snapshots).
const MATCH_DEN = 6;            // stage 3 — the ruler is split into 6
const BUILD_TARGET = 6;         // stage 4 — target square is 1/6
const NUMBERS_PAIR = [4, 9];    // Numbers stage — 1/4 vs 1/9 (smaller = 9)
const PAINT_DIV_OPTIONS = [2, 3, 4, 6]; // stage 1 — knife rack: cut the strip into N
const PAINT_TARGET = 4;         // stage 1 — the FIXED question: paint 1/4 (cut into 4, paint 1)
const SPLIT_KNIVES = [2, 3, 4, 5, 6, 8]; // stage 2 — knife rack: split the 0→1 ruler into N
const BUILD_KNIVES = [2, 3, 4, 6, 8];    // stage 4 — knife rack: cut YOUR square into N cells

// The bare 1/N fraction glyph (ink bar), reused across stages. Pass `denSlot` to
// replace the denominator with a custom node (e.g. a <DigitSlot> drop target).
function UnitFrac({ d, size, denSlot }) {
  return (
    <div className="bignum" style={size ? { fontSize: size } : undefined}>
      <span className="n">1</span>
      <span className="bar" style={{ background: "var(--ink)" }} />
      {denSlot ?? <span className="d">{d}</span>}
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

// The correct comparison symbol relating LEFT 1/a to RIGHT 1/b: a bigger bottom
// number makes a SMALLER piece, so 1/a < 1/b exactly when a > b.
function unitCmpSym(a, b) {
  if (a === b) return "=";
  return a > b ? "<" : ">";
}
function symWord(s) {
  return s === "<" ? "less than" : s === ">" ? "greater than" : "equal to";
}

export default function AppDen({ onBack, onRewatchIntro }) {
  const no = L.num.replace("№", "");
  const title = L.title;

  // ---- Drag-to-place: the digit the child has SELECTED in the picker (or null).
  // The board only changes when this digit is dropped onto (or its armed slot is
  // tapped) the denominator slot — never on the bare number tap. ----
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));
  // A denominator slot is a legal target only for a real bottom number (≥ 1) —
  // you can't cut a whole into zero pieces, so 0 can never land in it.
  const denArmed = picked != null && picked >= 1;
  // route a drop (k) or an armed-slot tap (no arg → use `picked`) to a handler.
  const placeDen = (handler) => (k) => {
    const d = k == null ? picked : k;
    if (d == null || d < 1) return;
    handler(d);
    setPicked(null);
  };

  // ---- Stage 1 (Paint): once the strip is cut with the knife, painting unlocks.
  // Until then there is no valid cut to paint into. ----
  const [paintCut, setPaintCut] = useState(false);

  // ---- Stage 2 (Match) — the child's guess at the bottom number ----
  const [matchPick, setMatchPick] = useState(null);

  // ---- Stage 3 (Build) — chosen bottom number for YOUR square. Starts `null`
  // (unset): the fraction loads as 1/? and the square is uncut/empty until the
  // child cuts it with a knife. ----
  const [buildDen, setBuildDen] = useState(null);


  // ---- Stage 5 (Numbers) — the < = > symbol dragged between the two fractions ----
  const [numbersSym, setNumbersSym] = useState("");

  // ---- Stage 1 (Paint) — divide count (0 = not yet cut by the knife) + painted ----
  const [paintDiv, setPaintDiv] = useState(0);
  const [painted, setPainted] = useState([]);

  // ---- Practice — local re-rolling comparison game (placeholder, see note) ----
  const [pracSeed, setPracSeed] = useState(0);
  const [pracSym, setPracSym] = useState("");
  // True once the current practice comparison is answered correctly — shows the
  // "got it right" state and swaps Check for a "Next →" button (no auto-reroll).
  const [pracDone, setPracDone] = useState(false);
  const prac = makeCompare(pracSeed);

  // ---- shared controller backbone (engine wiring + stage nav + outcome state) --
  const SCAFFOLD_KEY = (key) => STAGES.find((s) => s.n === key || s.key === key)?.key ?? "1-paint";
  const sc = useLessonScaffold({
    nodeId: NODE,
    lessonId: "den",
    initialStage: 1,
    // Numeric stage 4 (Smaller) was removed, so Build (3) jumps straight to Numbers
    // (5), and Numbers (5) ends in the local practice coda.
    advance: (cur) => (cur === "practice" ? "practice" : cur === 3 ? 5 : cur === 5 ? "practice" : (typeof cur === "number" ? cur + 1 : "practice")),
    back: (cur) => (cur === "practice" ? 5 : cur === 5 ? 3 : Math.max(1, (typeof cur === "number" ? cur : 5) - 1)),
    scaffoldKeyFor: SCAFFOLD_KEY,
    introFor: (n) => ({ tone: "normal", text: STAGE_INTRO(n) }),
    resetStage: () => {
      setPaintDiv(0);
      setPaintCut(false);
      setPainted([]);
      setMatchPick(null);
      setNumbersSym("");
      setPracSym(""); setPracDone(false);
      setPicked(null);
      setBuildDen(null);
    },
    onEnd: () => setStatus({ tone: "ok", text: "That's the whole idea — a bigger bottom number cuts the whole into more pieces, so each piece is smaller. Brilliant!" }),
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

  // ── Dragging-knife cut input ────────────────────────────────────────────────
  // One drop target + one drag mechanic, shared across the cut stages (only one
  // stage renders at a time). The cut is routed to the active stage's handler.
  const cutTargetRef = useRef(null);
  function onKnifeCut(n) {
    if (solvedRef.current) return;
    if (stage === 1) cutPaint(n);
    else if (stage === 3) pickBuild(n);
  }
  const knife = useKnifeCut(cutTargetRef, onKnifeCut, solved);

  // Undo the active stage's split — put the strip / square back together so the
  // child can re-cut. Mirrors the per-stage reset, scoped to just the cut.
  function undoCut() {
    if (solvedRef.current) return;
    if (stage === 1) { setPaintDiv(0); setPaintCut(false); setPainted([]); }
    else if (stage === 3) setBuildDen(null);
  }

  function reset() { goStage(1); }

  // The pick handlers only SET the selection — grading waits for the explicit
  // Check click in the answer bar (no auto-finish on entering the right answer).

  // ---- Stage 2 (Match) — pick the bottom number; Check grades it. ------------
  function pickMatch(d) { if (!solvedRef.current) setMatchPick(d); }
  function checkMatch() {
    if (solved) { nextStage(); return; }
    if (matchPick === MATCH_DEN) {
      award(`Yes — ${MATCH_DEN} equal pieces, so one piece is 1 over ${MATCH_DEN}. The bottom number is just how many pieces.`, null, [1, MATCH_DEN]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Count again — how many equal pieces are in the ruler? Each one is the same width.` });
      reportAttempt({ correct: false, answerValue: [1, matchPick ?? 0], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 3 (Build) — cut YOUR square; Check grades the match. ------------
  function pickBuild(d) { if (!solvedRef.current) setBuildDen(d); }
  function checkBuild() {
    if (solved) { nextStage(); return; }
    if (buildDen == null) {
      flashBad();
      setStatus({ tone: "warn", text: `Cut your square first — drag a knife onto it to choose the bottom number.` });
      return;
    }
    if (buildDen === BUILD_TARGET) {
      award(`Matched! Both squares are cut into ${BUILD_TARGET} equal pieces with one red — that's 1 over ${BUILD_TARGET}.`, null, [1, BUILD_TARGET]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Your square has ${buildDen} pieces; the target has ${BUILD_TARGET}. ${buildDen < BUILD_TARGET ? "Cut it into more." : "That's too many — fewer pieces."}` });
      reportAttempt({ correct: false, answerValue: [1, buildDen], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 5 (Numbers) — drag the < = > symbol; Check grades it. -----------
  // LEFT 1/NUMBERS_PAIR[0]  [sym]  RIGHT 1/NUMBERS_PAIR[1].
  function placeNumbersSym(s) { if (!solvedRef.current) setNumbersSym(s); }
  function checkNumbers() {
    if (solved) { nextStage(); return; }
    const [a, b] = NUMBERS_PAIR;
    const want = unitCmpSym(a, b); // 1/a vs 1/b
    const bigDen = Math.max(a, b);
    if (numbersSym === want) {
      award(`Yes — no picture needed. ${bigDen} is the bigger bottom number, so 1 over ${bigDen} is the smaller piece. 1/${a} ${want} 1/${b}.`, null, [1, bigDen]);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Bigger bottom number means a smaller piece. Is 1/${a} ${symWord("<")}, ${symWord("=")}, or ${symWord(">")} 1/${b}?` });
      reportAttempt({ correct: false, answerValue: [1, bigDen], errorSignature: "other", stars: 0 });
    }
  }

  // ---- Stage 1 (Paint) — cut strip + paint exactly one segment red ----------
  function toggleSeg(i) {
    if (solvedRef.current) return;
    setPainted((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }
  // Drag a knife onto the strip to cut it into N (replaces the ÷N buttons).
  function cutPaint(d) {
    if (solvedRef.current) return;
    setPaintDiv(d);
    setPaintCut(true);
    setPainted([]);
    setStatus({ tone: "normal", text: d === PAINT_TARGET
      ? `Cut into ${d}! Now paint exactly one of the ${d} pieces red.`
      : `Cut into ${d}. For 1/${PAINT_TARGET} you need ${PAINT_TARGET} pieces — drag the ×${PAINT_TARGET} knife to re-cut the strip.` });
  }
  function checkPaint() {
    if (solved) { nextStage(); return; }
    // The QUESTION is fixed: paint 1/PAINT_TARGET. The child must cut into the
    // right bottom number AND paint exactly one piece — the prompt never changes
    // to match their current cut; it waits for their cut+paint to match it.
    if (paintDiv === PAINT_TARGET && painted.length === 1) {
      award(`Painted! One piece out of ${PAINT_TARGET} — that's exactly 1 over ${PAINT_TARGET}.`, null, [1, PAINT_TARGET]);
    } else if (!paintCut) {
      flashBad();
      setStatus({ tone: "warn", text: `Drag a knife onto the strip first — the ×${PAINT_TARGET} knife cuts it into ${PAINT_TARGET} pieces.` });
    } else if (painted.length !== 1) {
      flashBad();
      setStatus({ tone: "warn", text: painted.length === 0 ? `Tap one piece to paint it red — the top number is 1.` : `1/${PAINT_TARGET} is just ONE piece — reset and paint exactly one.` });
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Cut the strip into ${PAINT_TARGET} first — drag the ×${PAINT_TARGET} knife so the bottom number is ${PAINT_TARGET}.` });
    }
  }

  // ---- Practice — local game (placeholder). Drag the symbol; Check grades. ----
  // LEFT 1/prac.a  [sym]  RIGHT 1/prac.b.
  function placePracSym(s) { if (!solvedRef.current) setPracSym(s); }
  function checkPractice() {
    if (pracDone) return; // already correct — the button is "Next →" now (see nextPractice)
    const want = unitCmpSym(prac.a, prac.b);
    const smaller = Math.max(prac.a, prac.b);
    if (pracSym === want) {
      // Practice is an endless coda — report the win and show the SOLVED state, but
      // DON'T re-roll automatically. The child sees they got it right, then taps
      // "Next →" (nextPractice) when ready for a fresh comparison.
      setStatus({ tone: "ok", text: `Correct — 1 over ${smaller} is the smaller piece. Press Next for another.` });
      reportAttempt({ correct: true, answerValue: [1, smaller], errorSignature: null, stars: 3 });
      setPracDone(true);
    } else {
      flashBad();
      setStatus({ tone: "warn", text: `Remember: bigger bottom number, smaller piece. Is 1/${prac.a} ${symWord("<")}, ${symWord("=")}, or ${symWord(">")} 1/${prac.b}?` });
      reportAttempt({ correct: false, answerValue: [1, smaller], errorSignature: "other", stars: 0 });
    }
  }
  // The child taps "Next →" after a correct practice answer — roll a fresh one.
  function nextPractice() {
    setPracSeed((s) => s + 1); setPracSym(""); setPracDone(false);
    setStatus({ tone: "normal", text: "" });
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
    // STAGE 1 · PAINT — cut a strip with a divide button, then paint one segment.
    // Mirrors wireframe room-den-paint.js: ruler strip + ÷N buttons + Fill tool.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="sq-game sq-paint">
              <div className="den-eq-col" style={{ gap: 14 }}>
                <span className="sq-side-lab">paint 1/{PAINT_TARGET} red</span>
                <div className="den-ruler-wrap" style={{ gap: 6 }}>
                  <div
                    ref={cutTargetRef}
                    className={"eq-cut-target" + (knife.hotTarget ? " is-hot" : "") + (paintCut ? " is-cut" : "")}
                  >
                    <UndoSplitButton show={paintCut && !solved} onUndo={undoCut} />
                    <div className="den-ruler is-paint" aria-label={paintCut ? `strip cut into ${paintDiv} pieces` : "uncut strip — drag a knife to cut it"}>
                      {paintCut
                        ? Array.from({ length: paintDiv }, (_, i) => (
                            <div
                              key={i}
                              className={"den-seg" + (painted.includes(i) ? " is-unit" : "")}
                              onClick={!solved ? () => toggleSeg(i) : undefined}
                              style={{ cursor: solved ? "default" : "pointer" }}
                            />
                          ))
                        : <div className="den-seg den-seg-uncut" />}
                    </div>
                  </div>
                  <div className="den-ends"><span>0</span><span>1</span></div>
                </div>
              </div>
              <div className="sq-tool">
                <div className="sq-tool-h">Fill</div>
                <div className="sq-swatches">
                  <span className="sq-swatch is-red is-on" />
                </div>
                <button type="button" className="sq-reset" onClick={() => { if (!solved) setPainted([]); }} disabled={solved}>Reset</button>
              </div>
            </div>
          </div>
        }
        rail={
          <>
            <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Cut, Then Paint">
              <b>Paint 1/{PAINT_TARGET} of the strip red.</b> First, <b>cut the strip</b> — drag the <b>×{PAINT_TARGET}</b> knife onto it so the bottom number is <b>{PAINT_TARGET}</b> ({PAINT_TARGET} equal pieces). Then <b>paint 1</b> of those pieces red. Tap a piece to fill it; <b>Reset</b> to start over.
            </RailInstruction>
            <div className="panel den-knife-panel">
              <KnifeRack
                options={PAINT_DIV_OPTIONS}
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
            eq={<><span className="den-ans-amt">cut into <b>{PAINT_TARGET}</b>, then paint</span><span className="sq-frac"><UnitFrac d={PAINT_TARGET} size={30} /></span><span className="den-ans-amt">— <b>1</b> piece of <b>{PAINT_TARGET}</b></span></>}
            cap="drag the knife to cut first, then paint one piece"
            solved={solved}
            ready={paintDiv === PAINT_TARGET && painted.length === 1 && !solved}
            stars={stars}
            onCheck={checkPaint}
            checkLabel={solved ? "Next stage ▸" : "Got it"}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 2) {
    // STAGE 3 · MATCH — the ruler is already split; pick the bottom number.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-play">
              <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={solved} />
              <div className="den-pick-frac">
                <UnitFrac d={matchPick ?? "?"} denSlot={
                  <DigitSlot armed={denArmed && !solved} onPlace={placeDen(pickMatch)} aria-label="bottom number — drop a number here">
                    <span className="d">{matchPick ?? "?"}</span>
                  </DigitSlot>
                } />
              </div>
              <Ruler parts={MATCH_DEN} on={solved ? [0] : []} segLabel={solved ? (i) => (i === 0 ? `1/${MATCH_DEN}` : null) : undefined} />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Match the Number">
            This ruler is already split. <b>Count the equal pieces</b>, then pick that number and <b>drag it onto the bottom of the fraction</b>.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">{solved ? `${MATCH_DEN} equal pieces, so one piece is` : "count the pieces, then tap the bottom number"}</span>{solved && <><span className="den-ans-eq">→</span><UnitFrac d={MATCH_DEN} size={34} /></>}</>}
            solved={solved}
            ready={matchPick != null && !solved}
            stars={stars}
            onCheck={checkMatch}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={matchPick == null && !solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 3) {
    // STAGE 4 · BUILD — pick the bottom number so YOUR square matches the target.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="sq-game">
              <div className="sq-frac-pick">
                <div className="bignum" style={{ fontSize: 48 }}>
                  <span className="n sq-slot-locked">1</span>
                  <span className="bar" style={{ background: "var(--ink)" }} />
                  <span className="d">{buildDen ?? "?"}</span>
                </div>
                <div className="sq-frac-hint">top stays 1 — cut your square with a knife</div>
              </div>
              <div className="sq-side">
                <span className="sq-side-lab">your square</span>
                <div
                  ref={cutTargetRef}
                  className={"eq-cut-target" + (buildDen != null ? " is-cut" : "") + (knife.hotTarget ? " is-hot" : "")}
                >
                  <UndoSplitButton show={buildDen != null && !solved} onUndo={undoCut} />
                  <CellBox n={buildDen ?? 1} k={buildDen == null ? 0 : 1} />
                </div>
              </div>
              <div className="sq-match">match&nbsp;→</div>
              <div className="sq-side">
                <span className="sq-side-lab">target</span>
                <CellBox n={BUILD_TARGET} k={1} className="is-target" />
              </div>
            </div>
          </div>
        }
        rail={
          <>
            <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Make Two Identical Squares">
              The top number stays <b>1</b> — one red cell. <b>Drag a knife onto your square</b> to cut it into the <b>same number of equal cells</b> as the <b>target</b>. More cells means each cell is smaller — try different knives until the two squares look the same.
            </RailInstruction>
            <div className="panel den-knife-panel">
              <KnifeRack
                options={BUILD_KNIVES}
                onGrab={knife.grabKnife}
                onTap={knife.tapKnife}
                disabled={solved}
                label="drag a knife onto your square to cut it"
              />
            </div>
          </>
        }
        answer={
          <AnswerBar
            eq={<><span className="sq-frac"><UnitFrac d={buildDen ?? "?"} size={32} /></span><span className="den-ans-eq">=</span><span className="den-ans-amt">{solved ? <><b>1</b> red cell out of <b>{BUILD_TARGET}</b> equal cells — squares match</> : (buildDen == null ? "cut your square to choose the bottom number" : `your square has ${buildDen} pieces`)}</span></>}
            solved={solved}
            ready={buildDen != null && !solved}
            stars={stars}
            onCheck={checkBuild}
            checkLabel={solved ? "Next stage ▸" : "Check"}
            checkDisabled={buildDen == null && !solved}
          />
        }
        tutor={Tutor}
      />
    );
  } else if (stage === 5) {
    // STAGE 6 · NUMBERS — no picture; reason from the number alone.
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-cmp">
              <CompareInput
                left={{ num: 1, den: NUMBERS_PAIR[0] }}
                right={{ num: 1, den: NUMBERS_PAIR[1] }}
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
            No picture this time. Both are <b>one piece</b> — so the only thing that matters is <b>how many pieces the whole was cut into</b>. The <b>bigger</b> bottom number makes the <b>smaller</b> piece. <b>Drag the right symbol</b> ( &lt; , = , or &gt; ) into the slot: is <b>1/{NUMBERS_PAIR[0]}</b> bigger or smaller than <b>1/{NUMBERS_PAIR[1]}</b>?
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">{solved ? `1/${NUMBERS_PAIR[0]} ${numbersSym} 1/${NUMBERS_PAIR[1]}` : "drag <, =, or > between the fractions"}</span></>}
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
  } else {
    // ★ PRACTICE — local re-rolling comparison game (placeholder; see ENGINE NOTE).
    body = (
      <LessonBoard
        footHeight={196}
        railWidth={396}
        stage={
          <div className="canvas">
            <div className="den-cmp">
              <CompareInput
                key={pracSeed}
                left={{ num: 1, den: prac.a }}
                right={{ num: 1, den: prac.b }}
                value={pracSym}
                onChange={placePracSym}
                disabled={pracDone}
                big={48}
              />
            </div>
          </div>
        }
        rail={
          <RailInstruction say={sayPhase} speaking={speaking} voxSpeaker="cook" heading="Your Turn">
            <b>Drag the right symbol</b> ( &lt; , = , or &gt; ) into the slot between the two fractions. Remember: the <b>bigger</b> the bottom number, the <b>smaller</b> the piece. No picture — reason from the numbers.
          </RailInstruction>
        }
        answer={
          <AnswerBar
            eq={<><span className="den-ans-amt">{pracDone ? `1/${prac.a} ${pracSym} 1/${prac.b} — nicely done` : <>drag a symbol: 1/{prac.a} &nbsp;?&nbsp; 1/{prac.b}</>}</span></>}
            solved={pracDone}
            ready={!pracDone && pracSym !== ""}
            stars={pracDone ? 3 : stars}
            onCheck={pracDone ? nextPractice : checkPractice}
            checkLabel={pracDone ? "Next →" : "Check"}
            checkDisabled={!pracDone && pracSym === ""}
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
    case 1: return "First cut the strip into four — that's the bottom number. Then paint one of the four pieces red. One over four.";
    case 2: return "This ruler is already split. Count the equal pieces, then pick that number and drag it onto the bottom of the fraction.";
    case 3: return "The top number is always 1 here — one red cell. Pick the bottom number so your square has the same number of cells as the target.";
    case 5: return "No picture needed now. The bigger the bottom number, the smaller the piece — so 1/9 is smaller than 1/4.";
    case "practice": return "Fresh ones. Bigger bottom number, smaller piece — pick the smaller fraction.";
    default: return "";
  }
}
