// MomsRoom.jsx — Babushka's Kitchen as an ENGINE-DRIVEN adaptive assessor.
//
// Per skill (in curriculum order), the kitchen runs beats matched to the engine's
// mastery signal rather than a fixed binary look-ahead:
//
//   mirror    — bare real-world check of that room's skill.
//               • Correct → emit observation → engine decides PresentProblem / Fade /
//                 ReturnToKitchen (marks skill mastered via gate).
//               • Wrong   → emit observation → engine decides:
//                   RouteToRoom{node} → "go learn this" invite (most-upstream unmastered)
//                   PresentProblem / RaiseScaffold → keep trying
//
//   combine   — recipe chaining this room's skill with earlier ones.
//               Same engine-driven flow.
//
//   look-ahead (engine-gate replaces binary probe) — a correct look-ahead answer
//               updates the engine's mastery estimate for the target skill. We then
//               check masteryFor(nodeId).P_known: if it looks confident, skip the room.
//
// The "stumping recipe" that fired a RouteToRoom is stored in component state so
// ReturnToKitchen can re-pose the exact question on return.
//
// Mastery display (the pip row) still uses the `mastered` localStorage list so
// progress UI and navigation logic (firstTask, enterStage) work correctly.
//
// ENGINE CONTRACT (via useLessonEngine hook — no direct engine imports):
//   emit(event)                       — stamp t + actor + append to log
//   judgeAndAdvance(answer, meta)     — judge, emit burst, update estimates, nextDecision
//   masteryFor(nodeId)                — current MasteryEstimate for a node
//   decision.kind === 'RouteToRoom'   — wall fires: route to decision.node
//   decision.kind === 'ReturnToKitchen' — mastery confirmed: re-pose stumping recipe
//
// LAYOUT (updated to match wireframe KitchenScreen.jsx):
//   • No top goal band — the question (q.caption) lives in the right rail's
//     question panel, under "[Cook]'s Order" heading + read-aloud button.
//   • StageTabs strip below topbar — one tab per CURRICULUM room, tappable.
//   • kq two-column layout: kq-main (scratch pad + answer card) left,
//     kq-rail (question panel + cook portrait + tutor) right.

import { useState, useEffect, useRef, useMemo } from "react";
import Mom from "./components/Mom.jsx";
import Rosette from "./components/Rosette.jsx";
import Slate from "./components/Slate.jsx";
import { CAST } from "./components/momsroom/cast.jsx";
import { PROPS } from "./components/momsroom/props.jsx";
import ScratchCanvas from "./components/momsroom/ScratchCanvas.jsx";
import StageTabs from "./components/StageTabs.jsx";
import SettingsButton from "./SettingsButton.jsx";
import { useVoice } from "./voice.js";
import { LINES, speakerOf, MEOW_SFX } from "./voiceLines.js";
import {
  BANK, CURRICULUM, ROOM_SKILL, CHARACTERS,
  gradeAnswer, targetLabel, firstTask, enterStage,
} from "./momsProblems.js";
import { loadMastered, saveMastered, resetProgress } from "./kitchenProgress.js";
import { useLessonEngine } from "./runtime/useLessonEngine.js";
import { LESSONS } from "./lessons/index.js";
import "./styles/momsroom.css";

// ---------------------------------------------------------------------------
// Identity + engine-graph bindings come from the central lesson registry
// (web/src/lessons/mom.js). The room→node maps are DATA (config), so they live
// in the registry; the adaptive flow logic that consumes them stays here.
// ---------------------------------------------------------------------------

const MOM = LESSONS.mom;

/** Map from rooms.js roomId → engine SkillNode id (re-exported for back-compat). */
export const ROOM_TO_NODE = MOM.roomToNode;

/** Map from engine SkillNode id → rooms.js roomId. */
export const NODE_TO_ROOM = MOM.nodeToRoom;

// ---------------------------------------------------------------------------
// Error signature: map momsProblems slip codes → engine ErrorSignature type
// ---------------------------------------------------------------------------

/**
 * Map a gradeAnswer slip code and question context to an engine error_signature.
 * Mirrors the taxonomy in engine/types.ts.
 */
export function slipToErrorSignature(slip, q) {
  if (!slip) return null;
  // sameBottom: child added the denominators (pattern: na+nb / da+db)
  if (slip === "sameBottom") return "add_denominators";
  // leftoverOnly: child wrote whole=0 for a mixed-number answer
  if (slip === "leftoverOnly") return "forced_leftover";
  // notMixed: answered as improper fraction when mixed was expected
  if (slip === "notMixed") return "forced_leftover";
  // notSimplified: correct value but not reduced
  if (slip === "notSimplified") return "not_simplified";
  // wrongValue with cross-multiply context → add_across_unlike if operands are coprime
  if (slip === "wrongValue" && q?.operands?.length === 2) {
    const [[, da], [, db]] = q.operands;
    if (da && db && da !== db && da % db !== 0 && db % da !== 0) {
      return "add_across_unlike";
    }
  }
  if (slip === "wrongValue") return "other";
  return "other";
}

// ---------------------------------------------------------------------------
// Portrait sub-component
// ---------------------------------------------------------------------------

function Portrait({ who, mood, width = 116 }) {
  if (who === "mom" || !CAST[who]) {
    return <Mom expr={mood === "happy" ? "cheer" : mood === "think" ? "think" : "idle"} width={width} />;
  }
  const Comp = CAST[who];
  return <Comp expr={mood === "happy" ? "happy" : mood === "think" ? "asking" : "idle"} width={width} />;
}

const lineDelay = (text) => Math.min(5200, Math.max(2200, (text || "").length * 46 + 1100));

// ---------------------------------------------------------------------------
// Build CURRICULUM stage-tabs — one tab per CURRICULUM room, showing the
// skill number and label. Used for navigating between kitchen questions.
// ---------------------------------------------------------------------------
const KITCHEN_STAGES = CURRICULUM.map((roomId) => {
  const sk = ROOM_SKILL[roomId];
  return {
    key: roomId,
    badge: String(sk.no),
    title: sk.label,
    sub: "story problem",
  };
});

// ---------------------------------------------------------------------------
// MomsRoom — main component
// ---------------------------------------------------------------------------

export default function MomsRoom({ onBack, onOpenRoom }) {
  const init = useMemo(() => { const m = loadMastered(); return { m, t: firstTask(m) }; }, []);
  const [mastered, setMastered] = useState(init.m);
  const [task, setTask] = useState(init.t);
  const [done, setDone] = useState(!init.t);

  const [stars, setStars] = useState(0);
  const [numStr, setNumStr] = useState("");
  const [denStr, setDenStr] = useState("");
  const [wholeStr, setWholeStr] = useState("");
  const [bad, setBad] = useState(false);
  const [solved, setSolved] = useState(false);
  // wall: true when engine RouteToRoom fired; cleared on goLearn or restart.
  const [wall, setWall] = useState(false);
  // wallNodeId: the engine-chosen node id from the latest RouteToRoom decision.
  const [wallNodeId, setWallNodeId] = useState(null);
  const [lookResult, setLookResult] = useState(null);   // 'skip' | 'notyet' | null
  const [banterStep, setBanterStep] = useState(-1);
  const [bubble, setBubble] = useState({ who: "mom", mood: "idle", tone: "normal", text: "", meow: false });

  // stumpingRecipeId: the id of the question that triggered the last RouteToRoom,
  // stored so ReturnToKitchen can re-pose the exact stumping recipe.
  const [stumpingRecipeId, setStumpingRecipeId] = useState(null);

  const { speaking, say, stopVoice } = useVoice();
  const banterTimer = useRef(null);

  // ---- useLessonEngine: kitchen context (inKitchen = true) -----------------
  // The hook drives the adaptive flow. We use the current task's node.
  // When task is null (done state), fall back to the first node.
  const currentNodeId = task?.roomId ? ROOM_TO_NODE[task.roomId] : "ADD_SAME_DEN";
  const { emit, judgeAndAdvance, masteryFor } = useLessonEngine({
    nodeId: currentNodeId,
    lessonConfig: {
      lessonId: task?.roomId ?? "r1",
      inKitchen: true,
      stumpingRecipe: stumpingRecipeId,
    },
  });

  const q = task?.q;
  const isMixed = q?.answerType === "mixed";
  const isLook = task?.stage === "lookahead";
  const denBar = parseInt(denStr, 10) || (q?.target ? q.target[1] : undefined);

  // Track whether we've emitted problem_present for the current task.
  const problemPresentedRef = useRef(false);

  function addMastered(roomId) {
    if (!roomId || mastered.includes(roomId)) return mastered;
    const m = [...mastered, roomId];
    setMastered(m); saveMastered(m);
    return m;
  }

  // ---- new question appears: reset UI, narrate the goal ----
  useEffect(() => {
    if (!task) return;
    setSolved(false); setWall(false); setWallNodeId(null); setLookResult(null);
    setNumStr(""); setDenStr(""); setWholeStr(""); setBad(false); setBanterStep(-1); setStars(0);
    setBubble({ who: "mom", mood: "idle", tone: "normal", text: q.caption, meow: false });
    problemPresentedRef.current = false;
    const tm = setTimeout(() => say(`mr_mom_goal_${q.id}`), 280);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  // Emit problem_present once the question is visible (after task effect fires).
  useEffect(() => {
    if (!task || !q || problemPresentedRef.current) return;
    problemPresentedRef.current = true;
    emit({
      type: "problem_present",
      payload: {
        node_id: currentNodeId,
        scaffold_level: 0,   // kitchen questions are always unscaffolded (bare)
        recipe_id: q.id,
        stage: task.stage,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, q, currentNodeId]);

  // ---- banter volley after a correct mirror/combine (not look-ahead) ----
  useEffect(() => {
    if (!solved || isLook || banterStep < 0 || !q || banterStep >= q.banter.length) return;
    const key = q.banter[banterStep];
    const who = speakerOf(key);
    const text = LINES[key] || "";
    const meow = !!MEOW_SFX[key];
    setBubble({ who, mood: meow ? "think" : "happy", tone: "normal", text, meow });
    say(key);
    banterTimer.current = setTimeout(() => setBanterStep((s) => s + 1), lineDelay(text));
    return () => clearTimeout(banterTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, banterStep]);

  // ---- check: grade the answer, emit to engine, apply Decision -------------
  function check() {
    if (done || !task) return;
    if (solved) { advance(); return; }
    const res = gradeAnswer(q, { num: numStr, den: denStr, whole: wholeStr });
    if (res.state === "incomplete") {
      setBad(true); setTimeout(() => setBad(false), 460);
      setBubble({ who: "mom", mood: "think", tone: "warn", text: LINES.mr_mom_nudge_fillboth });
      say("mr_mom_nudge_fillboth");
      return;
    }

    // Derive error_signature from slip code.
    const errorSignature = res.state === "wrong" ? slipToErrorSignature(res.slip, q) : null;

    // Derive answer_value from the user input as [numerator, denominator].
    let answerValue = null;
    if (isMixed) {
      const w = parseInt(wholeStr, 10), n = parseInt(numStr, 10), d = parseInt(denStr, 10);
      if (!isNaN(w) && !isNaN(n) && !isNaN(d) && d > 0) answerValue = [w * d + n, d];
    } else {
      const n = parseInt(numStr, 10), d = parseInt(denStr, 10);
      if (!isNaN(n) && !isNaN(d) && d > 0) answerValue = [n, d];
    }

    // surface_form: use the question id to provide structurally distinct transfer data.
    const surfaceForm = q.id;

    // JUDGED BOUNDARY — emit to the engine and get the Decision.
    const dec = judgeAndAdvance(
      { value: answerValue, modality: "type" },
      {
        correct: res.state === "correct",
        errorSignature,
        stars: res.stars ?? 0,
        hintMaxRung: 0,     // kitchen has no hint ladder
        selfCorrections: 0, // no manipulative in kitchen (scratch canvas only)
        surfaceForm,
        nodeIdOverride: currentNodeId,
      }
    );

    // Apply the engine Decision to the kitchen's UX flow.
    _applyDecision(dec, res);
  }

  // ---- _applyDecision: translate engine Decision → kitchen UX --------------
  function _applyDecision(dec, res) {
    // ---- Correct path --------------------------------------------------------
    if (res.state === "correct") {
      setStars(res.stars); setSolved(true); setWall(false); setWallNodeId(null);

      if (isLook) {
        // Look-ahead: a correct answer updates the engine's estimate for this skill.
        // We ask the engine whether it's confident enough to skip the room.
        // Engine: masteryFor gives the current P_known post-update.
        const lookNodeId = task.lookaheadRoom ? ROOM_TO_NODE[task.lookaheadRoom] : null;
        if (lookNodeId) {
          const est = masteryFor(lookNodeId);
          // If P_known rose to a reasonable level after this correct look-ahead,
          // treat as skip (engine-estimated confidence).
          const engineConfident = est ? est.P_known >= 0.6 : false;
          if (engineConfident) {
            setLookResult("skip");
            setBubble({ who: "mom", mood: "happy", tone: "ok", text: LINES.mr_mom_skip });
            say("mr_mom_skip");
          } else {
            setLookResult("notyet");
            setBubble({ who: "mom", mood: "think", tone: "normal", text: LINES.mr_mom_notyet });
            say("mr_mom_notyet");
          }
        } else {
          setLookResult("notyet");
          setBubble({ who: "mom", mood: "think", tone: "normal", text: LINES.mr_mom_notyet });
          say("mr_mom_notyet");
        }
        return;
      }

      // Engine says ReturnToKitchen: the child mastered the skill after returning
      // from a room visit. Banter plays, then advance marks mastery.
      if (dec.kind === "ReturnToKitchen") {
        setBanterStep(0);
        return;
      }

      // Normal correct on mirror/combine: banter + advance.
      setBanterStep(0);
      return;
    }

    // ---- Wrong path ----------------------------------------------------------
    setBad(true); setTimeout(() => setBad(false), 460);

    const slipKey = {
      sameBottom: "mr_mom_nudge_samebottom",
      leftoverOnly: "mr_mom_nudge_mixed",
      notMixed: "mr_mom_nudge_mixed",
    }[res.slip];
    const nudgeKey = slipKey || q.nudgeKey;
    setBubble({ who: "mom", mood: "think", tone: "warn", text: LINES[nudgeKey] });
    say(nudgeKey);

    // Engine-driven wall: RouteToRoom fires when the engine detects a skill gap
    // (predicted_success < theta or actual failure in kitchen context).
    if (dec.kind === "RouteToRoom") {
      setStumpingRecipeId(q.id);
      setWallNodeId(dec.node);
      setWall(true);
      return;
    }

    // Fallback: if the engine didn't fire RouteToRoom but we're on a mirror stage
    // (the traditional wall trigger), still show a soft wall for the current room.
    // This preserves the original behaviour for profiles with no prior engine state.
    if (task.stage === "mirror") {
      setStumpingRecipeId(q.id);
      setWallNodeId(currentNodeId);
      setWall(true);
    }
  }

  // ---- advance: move to the next task (unchanged logic, keep mastery flow) --
  function advance() {
    clearTimeout(banterTimer.current); stopVoice();
    const t = task; let m = mastered; let nt;
    if (t.stage === "lookahead") {
      if (lookResult === "skip") m = addMastered(t.lookaheadRoom);
      nt = firstTask(m);
    } else if (t.stage === "mirror") {
      const list = BANK[t.roomId].mirror;
      if (t.i + 1 < list.length) nt = enterStage(t.roomId, "mirror", t.i + 1, m);
      else { m = addMastered(t.roomId); nt = enterStage(t.roomId, "combine", 0, m); }
    } else {
      const list = BANK[t.roomId].combine;
      if (t.i + 1 < list.length) nt = enterStage(t.roomId, "combine", t.i + 1, m);
      else nt = enterStage(t.roomId, "lookahead", 0, m);
    }
    if (!nt) {
      setDone(true); setTask(null);
      setBubble({ who: "mom", mood: "happy", tone: "ok", text: LINES.mr_mom_finale });
      setTimeout(() => say("mr_mom_finale"), 120);
    } else {
      setTask(nt);
    }
  }

  // ---- goLearn: route to the engine-chosen room (most-upstream unmastered) --
  function goLearn() {
    if (!task) return;
    stopVoice();
    // wallNodeId is the engine-chosen binding node from the RouteToRoom decision.
    // Fall back to the current task's room if no engine choice was recorded.
    const targetNodeId = wallNodeId ?? currentNodeId;
    let targetRoomId = NODE_TO_ROOM[targetNodeId] ?? task.roomId;
    // simp questions share the SIMPLIFY engine node with r4 but belong to the simp
    // lesson room. When the stumping recipe lives in BANK.simp, route to "simp".
    if (targetRoomId === "r4" && stumpingRecipeId && BANK.simp) {
      const simpMirror = BANK.simp.mirror ?? [];
      const simpCombine = BANK.simp.combine ?? [];
      const inSimp = [...simpMirror, ...simpCombine].some((q) => q.id === stumpingRecipeId);
      if (inSimp) targetRoomId = "simp";
    }
    // U3: stash the stumping recipe id across the (stateless) hash route so the
    // routed lesson can make ReturnToKitchen legal — Shell reads it once on entry.
    try { sessionStorage.setItem("stumpingRecipeId", String(stumpingRecipeId ?? "")); } catch { /* no sessionStorage */ }
    onOpenRoom && onOpenRoom(targetRoomId);
  }

  // ---- jumpToSkill: navigate to a specific CURRICULUM room via the step strip --
  function jumpToSkill(roomId) {
    if (!roomId || !BANK[roomId]) return;
    clearTimeout(banterTimer.current); stopVoice();
    const m = mastered;
    const nt = enterStage(roomId, "mirror", 0, m);
    if (nt) setTask(nt);
  }

  function restart() {
    clearTimeout(banterTimer.current); stopVoice();
    resetProgress(); setMastered([]); setDone(false);
    setStumpingRecipeId(null); setWallNodeId(null);
    setTask(firstTask([]));
  }

  // ---- derived view bits ----
  const Prop = q ? PROPS[q.prop] : null;
  const propState = q ? (solved ? q.solvedState : q.initState) : null;
  const owner = q?.owner || "mom";
  const ownerLabel = (CHARACTERS[owner] || CHARACTERS.mom).label;
  const skillRoom = isLook ? task?.lookaheadRoom : task?.roomId;
  const skill = skillRoom ? ROOM_SKILL[skillRoom] : null;
  const masteredCount = mastered.length;
  const stageTag = isLook ? "sneak peek" : task?.stage === "combine" ? "combo recipe" : (skill ? skill.label : "");

  // Wall button label: use the engine-chosen node's skill label when available.
  const wallRoomId = wallNodeId ? (NODE_TO_ROOM[wallNodeId] ?? task?.roomId) : task?.roomId;
  const wallSkill = wallRoomId ? ROOM_SKILL[wallRoomId] : null;

  // "Ready to check": the child has committed the handwritten answer this recipe
  // needs (and hasn't solved it yet), so the Check button lights up to invite the
  // tap. A mixed answer needs all three slots; a plain fraction needs both.
  const answerReady = !done && !!task && !solved && (
    isMixed
      ? (wholeStr !== "" && numStr !== "" && denStr !== "")
      : (numStr !== "" && denStr !== "")
  );

  // Current CURRICULUM tab key — the active room (or first room if done).
  const activeTab = task?.roomId ?? CURRICULUM[0];

  return (
    <div className="page kitchen momsroom" data-vox-speaker="mom">
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark mr-heart">{MOM.badge}</span>
          <div>
            <div className="puzzle-tag">{MOM.tag}</div>
            <div className="puzzle-title">{MOM.title}</div>
          </div>
        </div>
        <div className="mr-progress" aria-label={`${masteredCount} of ${CURRICULUM.length} skills mastered`}>
          {CURRICULUM.map((rid) => (
            <span key={rid}
              className={"mr-pip" + (mastered.includes(rid) ? " done" : (skillRoom === rid ? " on" : ""))}
              title={ROOM_SKILL[rid].label} />
          ))}
        </div>
        <div className="controls">
          {onBack && <button className="ctrl-btn" title="Back to the kitchen map" onClick={() => { stopVoice(); onBack(); }}>←</button>}
          <SettingsButton />
          <button className="ctrl-btn" title="Start over (clears progress)" onClick={restart}>⟲</button>
        </div>
      </div>

      {/* ── STEP STRIP — one tab per CURRICULUM skill, same nav as every lesson ── */}
      <StageTabs
        stages={KITCHEN_STAGES}
        current={activeTab}
        onSelect={jumpToSkill}
        label="Kitchen skills"
      />

      {/* ── TWO-COLUMN PLAY AREA ─────────────────────────────────────────────
          kq-main (left): scratch pad + answer card pinned to bottom.
          kq-rail (right): question panel + cook portrait + tutor.
          ──────────────────────────────────────────────────────────────────── */}
      <div className="kq">

        {/* ── LEFT: PROP / SCRATCH + ANSWER CARD ── */}
        <div className="kq-main">

          {/* play area: prop visual + scratch canvas, or the finale card */}
          <div className="kq-play">
            {done ? (
              <div className="mr-finale">
                <div className="mr-finale-art"><Mom expr="cheer" width={150} /></div>
                <div className="mr-finale-text">{LINES.mr_mom_finale}</div>
                <button className="check" onClick={restart}>▸ Play again</button>
              </div>
            ) : (
              <>
                {/* quiet stage tag (top-right of the prop zone) */}
                {q && (
                  <div className={"mr-stage-tag" + (isLook ? " mr-peek" : "")}>
                    <span className="g">{stageTag}</span>
                  </div>
                )}
                {/* prop / story visual */}
                {q && (
                  <div className="mr-stage">
                    {Prop ? <Prop state={propState} {...(q.propProps || {})} /> : null}
                  </div>
                )}
                {/* scratch space */}
                {q && <ScratchCanvas key={`${task.stage}:${q.id}`} />}
              </>
            )}
          </div>

          {/* answer card — write area + marks + Check button */}
          {!done && (
            <div className="kq-answer">
              <div className="kq-write">
                <div className="mr-final-label">Write your answer</div>
                <div className={"kq-slate mr-s-slate" + (bad ? " mr-bad" : "") + (isMixed ? " is-mixed" : "")}>
                  {isMixed ? (
                    <>
                      <span className="frinput mr-whole">
                        <Slate
                          slots={[{ key: "whole", label: "wholes" }]}
                          values={{ whole: wholeStr }}
                          onChange={(k, v) => setWholeStr(v)}
                          onSubmit={check}
                          layout="row"
                          den={denBar}
                          disabled={solved}
                          autoFocusKey={wholeStr === "" ? "whole" : undefined}
                          ariaLabel="how many wholes"
                        />
                      </span>
                      <span className="mr-and">and</span>
                      <span className="frinput">
                        <Slate
                          slots={[{ key: "num", label: "leftover" }, { key: "den", label: "size" }]}
                          values={{ num: numStr, den: denStr }}
                          onChange={(k, v) => (k === "num" ? setNumStr(v) : setDenStr(v))}
                          onSubmit={check}
                          layout="fraction"
                          den={denBar}
                          disabled={solved}
                          autoFocusKey={wholeStr !== "" && numStr === "" ? "num" : undefined}
                          ariaLabel="leftover fraction"
                        />
                      </span>
                    </>
                  ) : (
                    <span className="frinput">
                      <Slate
                        slots={[{ key: "num", label: "top" }, { key: "den", label: "bottom" }]}
                        values={{ num: numStr, den: denStr }}
                        onChange={(k, v) => (k === "num" ? setNumStr(v) : setDenStr(v))}
                        onSubmit={check}
                        layout="fraction"
                        den={denBar}
                        disabled={solved}
                        autoFocusKey={!numStr ? "num" : (!denStr ? "den" : undefined)}
                        ariaLabel="your fraction answer"
                      />
                    </span>
                  )}
                </div>
                <div className="mr-s-cap">{q && solved ? `that's ${targetLabel(q)}` : ""}</div>
              </div>

              <div className="kq-answer-marks">
                {solved && stars > 0 && <Rosette count={stars} />}
                {wall && !solved && wallSkill && (
                  <button className="mr-wallbtn" onClick={goLearn} title={`Open Lesson ${wallSkill.no}`}>
                    ▸ Learn it: {wallSkill.label}
                  </button>
                )}
                <button className={"check" + (solved ? " done" : answerReady ? " ready" : "")} onClick={check}>
                  {solved ? (isLook ? "Continue ▸" : "Next recipe ▸") : "Check"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT RAIL: question panel + cook portrait + tutor ── */}
        <div className="kq-rail">

          {/* question panel: "[Cook]'s Order" heading + read-aloud + story text */}
          <div className="panel kq-question">
            <div className="kq-question-head">
              <h3>{ownerLabel}'s Order</h3>
              <button
                className={"speaker" + (speaking ? " speaking" : "")}
                onClick={() => q && say(`mr_mom_goal_${q.id}`)}
                disabled={!q}
              >
                <svg width="16" height="14" viewBox="0 0 16 14">
                  <path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" />
                  <path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" />
                </svg>
                Read aloud
              </button>
            </div>
            <div
              className="kq-story"
              data-vox={q ? `mr_mom_goal_${q.id}` : "mr_mom_finale"}
              data-vox-speaker="mom"
            >
              {q ? q.caption : "Every recipe, solved! You are the smartest cook in this whole kitchen."}
            </div>
            {/* skill blurb below the story */}
            {skill && (
              <div className="kq-recipe hint">
                {isLook
                  ? <><b>Sneak peek:</b> this is from the next lesson — <b>{skill.label}</b>. Nail it and you can skip that room!</>
                  : <span dangerouslySetInnerHTML={{ __html: `This recipe uses <b>Lesson ${skill.no} · ${skill.label}</b> — ${skill.blurb}.` }} />
                }
              </div>
            )}
          </div>

          {/* cook portrait — only the art, no caption text */}
          <div className="panel mr-asker">
            <div className="mr-asker-art">
              <Portrait who={owner} mood={solved ? "happy" : "think"} width={120} />
            </div>
          </div>

          {/* tutor: Babushka + ribbon */}
          <div className="kq-tutor">
            <div className="cook-stage">
              <Portrait who={bubble.who} mood={bubble.mood} width={110} />
            </div>
            <div
              className={"ribbon" + (bubble.tone === "warn" ? " warn" : "") + (bubble.meow ? " mr-meow" : "")}
              data-vox-speaker={bubble.who}
            >
              {bubble.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
