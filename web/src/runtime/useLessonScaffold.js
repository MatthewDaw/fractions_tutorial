// useLessonScaffold.js — the ONE controller backbone every lesson shares.
//
// Each AppM*/AppR* used to hand-roll ~95 lines of byte-identical controller glue:
// the useLessonEngine setup, the outcome state (solved/stars/badInput/cook/status),
// the refs (selfCorrections/presentEmitted/solvedRef/stageRef) and their sync
// effects, the guarded mount problem_present, the unmount stopVoice, and the
// helpers goStage / nextStage / reportAttempt / applyEngineDecision / award /
// flashBad. Only the STAGE MODEL and the per-stage state RESET differed. This hook
// owns everything identical and takes the varying parts as small callbacks.
//
// CONTRACT (config in):
//   nodeId        engine node id, or (lesson)=>id  (LessonUnlikeDen derives it)
//   lessonId      scaffoldMap room id ("m1".."r5","r2","r3"), or (lesson)=>id
//   initialStage  the starting stage key (number OR string — kept OPAQUE)
//   advance(cur)  -> next stage key (or same/null at the end). OR pass stagesOrder.
//   back(cur)     -> previous stage key (RaiseScaffold target). OR pass stagesOrder.
//   stagesOrder   optional ordered key array; the hook derives advance/back by index.
//   scaffoldKeyFor(key)  -> the key handed to toScaffoldLevel ("sw"->"showwork"). Default identity.
//   introFor(key) -> {tone,text} | string for the ribbon on stage entry.
//   resetStage(key)      REQUIRED: the lesson-specific state zeroing / problem swap.
//   surfaceFormFor(key)  optional; default "stage-"+key.
//   advanceMode   "immediate" (default) | "deferred"  (R5 waits before advancing).
//   deferredDelayMs       defer delay (default 1500).
//   initialStatus / lesson   optional.
//
// STAGE KEYS ARE OPAQUE. M1/M3 mix numeric stages with the string "showwork"; the
// hook never coerces a key, so the lessons' `stage === 1` branches keep matching.
//
// LessonUnlikeDen is a partial adopter: it uses the SAFE primitives (state, refs,
// flashBad, reportAttempt, stopVoice) but keeps its own beat navigation and does
// NOT call goStage/nextStage — those simply go unused for it.
import { useState, useRef, useEffect, useCallback } from "react";
import { useLessonEngine } from "./useLessonEngine.js";
import { toScaffoldLevel } from "./scaffoldMap.js";
import { useVoice } from "../voice.js";
import { makeTier2Window, checkLongPause, checkOscillation } from "./tier2.js";
import { publishNudge } from "./engineStore.js";
import { generateFor, hasGenerator } from "../generators/index.js";
import { otherSurfaceForm } from "./practiceFlow.js";
import { toBeatForLevel } from "./scaffoldMap.js";

// Friendly learner-facing copy for each Tier-2 nudge type. Nudges are gentle and
// never restructure the workspace (state-model §6/§7) — they only prompt.
const NUDGE_TEXT = {
  HINT_OFFER: "Take a look at the picture — drag a piece to try it out.",
  TAKE_YOUR_TIME: "No rush — take your time and look closely.",
};

/** How often the idle watcher checks for a long pause (ms). */
const TIER2_TICK_MS = 1500;

const normStatus = (s) => (typeof s === "string" ? { tone: "normal", text: s } : s);

export function useLessonScaffold({
  nodeId,
  lessonId,
  initialStage,
  advance: advanceProp,
  back,
  stagesOrder,
  scaffoldKeyFor = (k) => k,
  introFor,
  // Optional: the narration line (baked clip key OR text) spoken when a phase
  // OPENS. Defaults to introFor(key)'s text — the on-screen question itself. This
  // is the ONE auto-play trigger in a lesson; see sayPhaseLine/goStage.
  voiceForStage,
  resetStage,
  surfaceFormFor,
  onEnd,
  // U3: wall→room→return loop. When this lesson was opened from a stumping
  // kitchen recipe, these make ReturnToKitchen legal in policy (forwarded to
  // useLessonEngine). Default null/false preserves direct-entry behavior.
  stumpingRecipe = null,
  inKitchen = false,
  advanceMode = "immediate",
  deferredDelayMs = 1500,
  initialStatus,
  lesson,
  // Partial adopters (LessonUnlikeDen) keep their own beat navigation, which
  // emits problem_present itself — set false so the hook does not double-fire it.
  emitMountPresent = true,
  // ---- Generated-practice mode (opt-in; backward compatible) ----------------
  // generatedStages: which stages serve AUTO-GENERATED variations instead of a
  //   fixed example — `true` (all), an array of stage keys, or a predicate.
  //   On a generated stage the hook supplies `prob` (a GeneratedProblem) and the
  //   engine PACES it: a clean correct re-rolls a NEW variation at this level
  //   (more practice), FadeScaffold advances, RaiseScaffold steps back, a
  //   TransferProbe re-rolls with the OTHER surface form, and mastery ends it.
  // generatorSkill: the generator skill id (defaults to the engine node id).
  // surfaceFormForStage(key): optional — pin a stage's surface form.
  generatedStages = false,
  generatorSkill,
  surfaceFormForStage,
  // A generated practice stage SPANS scaffold levels 0..4 within the one stage:
  // it starts here and the engine fades/raises the level in place (post-teaching,
  // so the default start is mid-ladder, not L0).
  generatedStartLevel = 2,
  // ---- UI1: engine-paced TEACHING stages (reversible) -----------------------
  // A WRONG answer on a teaching stage always HOLDS the current step (the child
  // stays put and retries — see reportAttempt). When this flag is on, the only
  // engine pacing on a teaching stage is on the CORRECT path: a strong run
  // (FadeScaffold) SKIPS AHEAD to the stage matching the faded design level
  // instead of a single step (applyEngineDecision). Default ON; pass
  // `adaptiveTeaching: false` to restore plain single-step advance-on-correct.
  adaptiveTeaching = true,
}) {
  const resolvedNodeId = typeof nodeId === "function" ? nodeId(lesson) : nodeId;
  const resolvedLessonId = typeof lessonId === "function" ? lessonId(lesson) : lessonId;

  // Which stages are generated, and for which skill.
  const genSkill = generatorSkill || resolvedNodeId;
  const isGenStage = useCallback((key) => {
    if (!genSkill || !hasGenerator(genSkill)) return false;
    if (generatedStages === true) return true;
    if (Array.isArray(generatedStages)) return generatedStages.includes(key);
    if (typeof generatedStages === "function") return !!generatedStages(key);
    return false;
  }, [genSkill, generatedStages]);

  // advance / back: explicit callbacks win; otherwise derive from stagesOrder.
  const advanceFn = advanceProp || ((cur) => {
    if (!stagesOrder) return cur;
    const i = stagesOrder.indexOf(cur);
    return i >= 0 && i < stagesOrder.length - 1 ? stagesOrder[i + 1] : cur;
  });
  const backFn = back || ((cur) => {
    if (!stagesOrder) return cur;
    const i = stagesOrder.indexOf(cur);
    return i > 0 ? stagesOrder[i - 1] : cur;
  });

  // UI1: where should a FadeScaffold on TEACHING stage `cur` skip ahead to?
  // Maps cur's design level → one level up → the lesson's native beat for that
  // level (toBeatForLevel) → the matching stage in this lesson's order. Returns
  // that key ONLY if it is STRICTLY FORWARD of `cur` (so a skip never goes
  // backwards or off the end); otherwise null → the caller does a single advance.
  // Requires stagesOrder to locate/compare positions; without it we can't safely
  // skip, so we return null (single advance) — the conservative default.
  const fadeSkipTarget = useCallback((cur) => {
    const lid = typeof lessonId === "function" ? lessonId(lesson) : lessonId;
    if (lid == null || !stagesOrder) return null;
    const curIdx = stagesOrder.indexOf(cur);
    if (curIdx < 0) return null;
    const curLevel = toScaffoldLevel(lid, scaffoldKeyFor(cur));
    const targetLevel = Math.min(4, curLevel + 1);
    // The native beat for the faded level; normalize to whatever this lesson
    // actually uses as a stage key (a few lessons' beat ids differ from their
    // toBeatForLevel form — only accept it if it's truly one of OUR stages).
    const targetBeat = toBeatForLevel(lid, targetLevel);
    let targetIdx = stagesOrder.indexOf(targetBeat);
    // Fallback: if toBeatForLevel's key isn't a literal stage key in this lesson,
    // find the FIRST forward stage whose design level reaches targetLevel.
    if (targetIdx < 0) {
      for (let i = curIdx + 1; i < stagesOrder.length; i++) {
        const lvl = toScaffoldLevel(lid, scaffoldKeyFor(stagesOrder[i]));
        if (lvl >= targetLevel) { targetIdx = i; break; }
      }
    }
    if (targetIdx > curIdx) return stagesOrder[targetIdx];
    return null;
  }, [lessonId, lesson, stagesOrder, scaffoldKeyFor]);

  const { emit: emitRaw, judgeAndAdvance, isCertified } = useLessonEngine({
    nodeId: resolvedNodeId,
    lessonConfig: { lessonId: resolvedLessonId, initialBeat: scaffoldKeyFor(initialStage), stumpingRecipe, inKitchen },
  });
  const { speaking, say, stopVoice } = useVoice();

  // ---- Tier-2 within-attempt nudges (idle pause + oscillation) --------------
  // The engine consults the policy only at boundaries; these gentle nudges are
  // the Tier-2 layer that helps DURING an attempt (state-model §6). We own them
  // here in the shared controller so every lesson gets them once.
  const tier2WinRef = useRef(makeTier2Window());
  const lastInteractionTRef = useRef(Date.now());

  // emit is wrapped so any logged interaction (place/remove/present) also bumps
  // the idle clock — a learner who is dragging pieces is not "stuck".
  const emit = useCallback((eventFields) => {
    lastInteractionTRef.current = Date.now();
    if (eventFields?.type === "problem_present") {
      tier2WinRef.current = makeTier2Window();
    }
    return emitRaw(eventFields);
  }, [emitRaw]);

  // ---- outcome state (identical shape in every lesson) ----------------------
  const [stage, setStage] = useState(initialStage);
  const [solved, setSolved] = useState(false);
  const [stars, setStars] = useState(0);
  const [badInput, setBadInput] = useState(false);
  const [cook, setCook] = useState("idle");
  const [status, setStatus] = useState(
    initialStatus !== undefined
      ? normStatus(initialStatus)
      : introFor
        ? normStatus(introFor(initialStage))
        : { tone: "normal", text: "" }
  );

  // ---- refs (single owned instances — handlers + reportAttempt share these) -
  const solvedRef = useRef(solved);
  const stageRef = useRef(stage);
  const selfCorrectionsRef = useRef(0);
  const presentEmittedRef = useRef(false);
  // UX: a correct answer NEVER auto-advances. The engine Decision earned on a
  // correct attempt is BANKED here and applied only when the child explicitly
  // advances (the "Next →" button → nextStage / advance). This guarantees the
  // child always gets a beat to SEE the success (rosette + cheer) before moving
  // on — no immediate redirect to a fresh problem/stage. Wrong-answer routing is
  // unaffected (it never banks; see reportAttempt).
  const pendingDecisionRef = useRef(null);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  // ---- generated-practice state ---------------------------------------------
  // `prob` is the current auto-generated problem (null on fixed-example stages).
  // probRef mirrors it for synchronous reads inside reportAttempt; genIndexRef is
  // the monotonic variation counter; genFormOverrideRef pins the next surface form
  // for a TransferProbe.
  const [prob, setProb] = useState(null);
  const probRef = useRef(null);
  const genIndexRef = useRef(0);
  const genFormOverrideRef = useRef(null);
  // The LIVE scaffold level of the generated practice stage (engine-driven; spans
  // 0..4 within the one stage). genLevel mirrors it for display.
  const genLevelRef = useRef(generatedStartLevel);
  const [genLevel, setGenLevel] = useState(generatedStartLevel);
  useEffect(() => { probRef.current = prob; }, [prob]);

  // Generate (and install) a fresh problem for a generated stage at the stage's
  // CURRENT live level (genLevelRef — not the stage's fixed scaffoldMap level, so
  // a FadeScaffold actually sticks and the problems get harder). Returns the
  // GeneratedProblem (or null for a fixed stage).
  const makeProbFor = useCallback((key) => {
    if (!isGenStage(key)) { setProb(null); probRef.current = null; return null; }
    const level = genLevelRef.current;
    const form = genFormOverrideRef.current
      ?? (surfaceFormForStage ? surfaceFormForStage(key) : undefined);
    genFormOverrideRef.current = null;
    const p = generateFor(genSkill, { level, index: genIndexRef.current, surfaceForm: form });
    genIndexRef.current += 1;
    setProb(p); probRef.current = p;
    return p;
  }, [isGenStage, genSkill, surfaceFormForStage]);

  // Latest callbacks in a ref so the memoized helpers never go stale without
  // forcing every consumer to re-memoize.
  const cb = useRef({});
  cb.current = { advanceFn, backFn, scaffoldKeyFor, introFor, voiceForStage, resetStage, surfaceFormFor, onEnd, isGenStage, makeProbFor, isCertified };

  // ── THE phase-narration channel (the ONLY in-lesson auto-play) ──────────────
  // Resolve a phase's question line — a baked clip key (voiceForStage) or, by
  // default, the on-screen instruction text (introFor) — and speak it. Called in
  // exactly two places: when a phase OPENS (goStage / initial mount) and by the
  // read-aloud button (sayPhase). NOTHING else in a lesson may call say(): no
  // correct/wrong/interaction narration. One trigger, one source of truth.
  const sayPhaseLine = useCallback((key) => {
    const vf = cb.current.voiceForStage;
    let line = vf ? vf(key) : "";
    if (!line) {
      const intro = cb.current.introFor?.(key);
      line = intro ? (typeof intro === "string" ? intro : intro.text || "") : "";
    }
    if (line) say(line, { source: "phase" });
  }, [say]);
  // The read-aloud button replays the CURRENT phase's question (same line/id as
  // the auto-play, so a second press toggles it off — the child can shut it off).
  const sayPhase = useCallback(() => sayPhaseLine(stageRef.current), [sayPhaseLine]);

  // UI1: a stable handle to applyEngineDecision (defined below) so the earlier
  // reportAttempt can route a wrong-answer Decision through it without a forward
  // reference. Assigned right after applyEngineDecision is created.
  const applyRef = useRef(null);

  // ---- mount: emit the first problem_present (guarded); unmount: stop voice --
  useEffect(() => {
    if (emitMountPresent && !presentEmittedRef.current) {
      presentEmittedRef.current = true;
      // On a generated initial stage, mint the first variation before presenting.
      cb.current.makeProbFor(initialStage);
      emit({
        type: "problem_present",
        payload: {
          node_id: resolvedNodeId,
          scaffold_level: cb.current.isGenStage(initialStage)
            ? genLevelRef.current
            : toScaffoldLevel(resolvedLessonId, scaffoldKeyFor(initialStage)),
        },
      });
      // Opening the first phase → auto-narrate its question (the one auto-play).
      sayPhaseLine(initialStage);
    }
    return () => stopVoice();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Tier-2 idle/oscillation watcher --------------------------------------
  // While a stage is unsolved, tick gently and fire AT MOST ONE nudge of each
  // kind per attempt (the window enforces idempotence). Oscillation (lots of
  // place/remove wiggling) → "take your time"; a long idle pause → a soft prompt
  // to engage with the picture. Both preserve the learner's work (nudge-only).
  useEffect(() => {
    if (solved) return undefined;
    const id = setInterval(() => {
      const now = Date.now();
      const recent = { observations: [{ self_corrections: selfCorrectionsRef.current }] };
      const osc = checkOscillation(recent, tier2WinRef.current);
      if (osc) {
        publishNudge({ type: osc.type, text: NUDGE_TEXT[osc.type] }, now);
        return;
      }
      const pause = checkLongPause(lastInteractionTRef.current, now, tier2WinRef.current);
      if (pause) {
        publishNudge({ type: pause.type, text: NUDGE_TEXT[pause.type] }, now);
      }
    }, TIER2_TICK_MS);
    return () => clearInterval(id);
  }, [stage, solved]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- enter a stage cleanly (selector click OR auto-advance) ---------------
  const goStage = useCallback((key) => {
    stopVoice();
    const prevStage = stageRef.current;
    const onGen = cb.current.isGenStage(key);
    // Entering a generated stage FRESH (from a different stage) resets its live
    // level to the start; a re-roll (goStage(currentStage)) keeps the faded level.
    if (onGen && prevStage !== key) {
      genLevelRef.current = generatedStartLevel;
      setGenLevel(generatedStartLevel);
    }
    setStage(key); stageRef.current = key;
    pendingDecisionRef.current = null; // entering a stage clears any banked decision
    setSolved(false); solvedRef.current = false;
    setStars(0); setBadInput(false); setCook("idle");
    cb.current.resetStage?.(key);
    // Generated stage → mint a fresh variation at the live level + surface form.
    cb.current.makeProbFor(key);
    if (cb.current.introFor) setStatus(normStatus(cb.current.introFor(key)));
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    emit({
      type: "problem_present",
      payload: {
        node_id: resolvedNodeId,
        scaffold_level: onGen
          ? genLevelRef.current
          : toScaffoldLevel(resolvedLessonId, cb.current.scaffoldKeyFor(key)),
      },
    });
    // Auto-narrate the phase question — ONLY on a real phase change, never on a
    // same-stage re-roll (a generated practice variation isn't "opening a phase").
    if (prevStage !== key) sayPhaseLine(key);
  }, [emit, resolvedNodeId, resolvedLessonId, stopVoice, generatedStartLevel, sayPhaseLine]);

  // ---- linear advance to the NEXT step (the child's "Next →" command) --------
  // Deterministic: always the next stage in order. It NEVER consults the engine
  // Decision (that path can step backward / skip / restart — "some random place").
  // The engine's adaptive pacing on a generated practice stage is applied through
  // `advance()` instead, which re-rolls in place; teaching stages are pure linear.
  const nextStage = useCallback(() => {
    pendingDecisionRef.current = null; // moving on; drop any banked decision
    const cur = stageRef.current;
    const n = cb.current.advanceFn(cur);
    if (n == null || n === cur) { cb.current.onEnd?.(); return { atEnd: true }; }
    goStage(n);
    return { atEnd: false, next: n };
  }, [goStage]);

  // ---- emit a judged attempt; reset the self-correction counter -------------
  const reportAttempt = useCallback(({
    correct,
    answerValue = null,
    errorSignature = null,
    stars: starCount = 0,
    modality = "tap",
    recognizerConfidence = null,
    hintMaxRung = 0,
  }) => {
    // On a generated stage the surface form IS the generated problem's form (so
    // the engine's transfer dimension tracks the real structural variants).
    const surfaceForm = (cb.current.isGenStage(stageRef.current) && probRef.current)
      ? probRef.current.surfaceForm
      : cb.current.surfaceFormFor
        ? cb.current.surfaceFormFor(stageRef.current)
        : "stage-" + stageRef.current;
    const dec = judgeAndAdvance(
      { value: answerValue, modality, recognizerConfidence },
      {
        correct,
        errorSignature: errorSignature ?? null,
        stars: starCount ?? 0,
        // A used hint is recorded so the engine's independence gate + hint_dependence
        // dimension get real signal: a hinted correct is NOT hint-free, so it does
        // not count toward the clean-correct fade streak or scaffold-independence.
        hintMaxRung: hintMaxRung ?? 0,
        selfCorrections: selfCorrectionsRef.current,
        surfaceForm,
      }
    );
    selfCorrectionsRef.current = 0;

    // A WRONG answer on a TEACHING stage HOLDS the current step. The child stays
    // exactly where they are (their work intact) and simply tries again — pressing
    // Check on a wrong answer must never move the lesson. The engine attempt was
    // still recorded above (judgeAndAdvance), so mastery/telemetry see the error;
    // we just never apply the returned Decision as a STAGE MOVE.
    //
    // This used to route the wrong-answer Decision through applyEngineDecision, so
    // the 2nd consecutive error returned RaiseScaffold and stepped the stage
    // BACKWARD (backFn → goStage, which also resetStage'd — wiping the child's work
    // despite the "preserveWork" rationale). Repeated Check presses on a wrong
    // answer then walked backward through the arc, reading as a jump to a "random"
    // step. The engine still paces the GENERATED practice stage, but only on the
    // CORRECT path (award → advance → applyEngineDecision), never on a wrong answer.
    return dec;
  }, [judgeAndAdvance]);

  // ---- apply the engine Decision ---------------------------------------------
  // GENERATED stage: the estimator paces practice in place. A clean correct
  // re-rolls a NEW variation at THIS level (more practice, not auto-advance);
  // FadeScaffold advances a stage; RaiseScaffold steps back; a TransferProbe
  // re-rolls with the OTHER surface form; mastery (Return/Route) ends the lesson.
  // FIXED stage: the original behavior (advance on correct / fade / raise).
  const applyEngineDecision = useCallback((dec, isCorrect) => {
    if (!dec) return;
    const cur = stageRef.current;

    if (cb.current.isGenStage(cur)) {
      // The generated practice stage SPANS levels 0..4 in place: fade/raise move
      // the live level and re-roll a fresh variation; a clean correct re-rolls at
      // the same level (more practice); transfer flips the surface form; mastery
      // ends the stage. goStage(cur) re-rolls without resetting the live level.
      //
      // U2: certified-completion terminator. The generated stage is otherwise
      // endless for a direct-entry lesson (ReturnToKitchen/RouteToRoom are illegal
      // with no stumping recipe), so without this it re-rolls forever. Checked
      // FIRST because at full mastery the engine may still return FadeScaffold on a
      // clean streak — certification must win over the re-roll. U3 layers
      // ReturnToKitchen on top: when a stumping recipe is set the engine returns
      // ReturnToKitchen and the existing branch below fires onEnd(dec) instead.
      if (cb.current.isCertified?.()) {
        cb.current.onEnd?.({ kind: "LessonComplete", certified: true });
        return;
      }
      if (dec.kind === "FadeScaffold") {
        genLevelRef.current = Math.min(4, genLevelRef.current + 1);
        setGenLevel(genLevelRef.current);
        goStage(cur);
      } else if (dec.kind === "RaiseScaffold") {
        genLevelRef.current = Math.max(0, genLevelRef.current - 1);
        setGenLevel(genLevelRef.current);
        goStage(cur);
      } else if (dec.kind === "TransferProbe") {
        genFormOverrideRef.current = otherSurfaceForm(genSkill, probRef.current?.surfaceForm);
        goStage(cur);
      } else if (dec.kind === "ReturnToKitchen" || dec.kind === "RouteToRoom") {
        cb.current.onEnd?.(dec);
      } else if (isCorrect) {
        goStage(cur); // re-roll: another variation at this level
      }
      return;
    }

    // U3: a fixed stage can also reach mastery → honor the same Return/Route exit
    // the generated branch fires, so the wall→room→return loop closes from any
    // terminal stage, not only the generated practice stage.
    if (dec.kind === "ReturnToKitchen" || dec.kind === "RouteToRoom") {
      cb.current.onEnd?.(dec);
      return;
    }
    if (dec.kind === "FadeScaffold") {
      // UI1: a strong run (the engine's clean-correct streak) on a TEACHING stage
      // SKIPS AHEAD to the stage that matches the next faded design level, not just
      // a single step — so a confident child doesn't have to re-walk every beat.
      // We read the CURRENT stage's design level, target one level up, translate
      // that to the lesson's native stage key (toBeatForLevel) and jump to it if
      // it is a LATER stage in this lesson's order. If that target isn't a real
      // forward stage (e.g. already at the top of the arc, or the map can't place
      // it), we fall back to the original single advance — so the arc always stays
      // reachable and coherent (no skipped-past-the-end, no choice paralysis).
      const skipTo = adaptiveTeaching ? fadeSkipTarget(cur) : null;
      if (skipTo != null && skipTo !== cur) {
        goStage(skipTo);
      } else {
        nextStage();
      }
    } else if (dec.kind === "RaiseScaffold") {
      const prev = cb.current.backFn(cur);
      if (prev != null && prev !== cur) goStage(prev);
    } else if (isCorrect) {
      nextStage();
    }
  }, [nextStage, goStage, genSkill, adaptiveTeaching]);

  // UI1: keep applyRef pointed at the latest applyEngineDecision so the earlier
  // reportAttempt can route a wrong-answer Decision through it (no forward ref).
  applyRef.current = applyEngineDecision;

  // ---- award + advance on a correct answer ----------------------------------
  // Positional (line, voice, answerValue, opts) so existing callsites are unchanged.
  // opts: { stars=3, modality, recognizerConfidence, hintMaxRung }. advanceMode
  // "deferred" delays the engine decision (R5 lingers on the celebration first).
  const award = useCallback((line, voice, answerValue, opts = {}) => {
    const st = opts.stars ?? 3;
    setSolved(true); solvedRef.current = true; setStars(st); setCook("cheer");
    if (line != null) setStatus({ tone: "ok", text: line });
    // NOTE: award no longer speaks the `voice` line. Narration auto-plays ONLY when
    // a phase opens (sayPhaseLine) or the child taps the read-aloud button. The
    // `voice` parameter is retained for call-site compatibility but is inert.
    const dec = reportAttempt({
      correct: true,
      answerValue: answerValue ?? null,
      errorSignature: null,
      stars: st,
      modality: opts.modality,
      recognizerConfidence: opts.recognizerConfidence,
      hintMaxRung: opts.hintMaxRung ?? 0,
    });
    // BANK the decision; never auto-advance. The child sees the success first, then
    // taps "Next →" — nextStage() (linear, teaching) or advance() (practice re-roll)
    // is what actually moves on. (advanceMode/deferredDelayMs are now vestigial — no
    // correct answer redirects on a timer.)
    pendingDecisionRef.current = dec;
    return dec;
  }, [reportAttempt, say]);

  // ---- the child taps Next on a GENERATED practice stage --------------------
  // Practice's "next step" is a fresh variation (or fade/raise/end) — that lives in
  // the engine Decision banked by award(). advance() applies it now. With no banked
  // decision (or on a fixed stage) it falls back to a plain linear nextStage().
  const advance = useCallback(() => {
    const dec = pendingDecisionRef.current;
    pendingDecisionRef.current = null;
    if (dec && cb.current.isGenStage(stageRef.current)) {
      applyRef.current?.(dec, true);
      return;
    }
    nextStage();
  }, [nextStage]);

  // ---- flash a bad input (red shake + thinking cook for 460ms) --------------
  const flashBad = useCallback(() => {
    setBadInput(true); setCook("think");
    setTimeout(() => setBadInput(false), 460);
  }, []);

  return {
    // stage
    stage, setStage, goStage, nextStage, advance,
    // phase narration: the read-aloud button calls sayPhase() to replay the
    // current phase's question (same line the phase auto-played on open).
    sayPhase,
    // generated practice (null on fixed-example stages); genLevel = live 0..4
    prob, genLevel,
    // engine
    emit, judgeAndAdvance, reportAttempt, applyEngineDecision, award, flashBad,
    // outcome state
    solved, setSolved, stars, setStars, badInput, setBadInput,
    cook, setCook, status, setStatus,
    // voice
    say, speaking, stopVoice,
    // refs (handlers increment selfCorrectionsRef; others read solvedRef/stageRef)
    selfCorrectionsRef, presentEmittedRef, solvedRef, stageRef,
  };
}
