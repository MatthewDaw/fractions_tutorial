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

const normStatus = (s) => (typeof s === "string" ? { tone: "normal", text: s } : s);

export function useLessonScaffold({
  nodeId,
  lessonId,
  initialStage,
  advance,
  back,
  stagesOrder,
  scaffoldKeyFor = (k) => k,
  introFor,
  resetStage,
  surfaceFormFor,
  onEnd,
  advanceMode = "immediate",
  deferredDelayMs = 1500,
  initialStatus,
  lesson,
  // Partial adopters (LessonUnlikeDen) keep their own beat navigation, which
  // emits problem_present itself — set false so the hook does not double-fire it.
  emitMountPresent = true,
}) {
  const resolvedNodeId = typeof nodeId === "function" ? nodeId(lesson) : nodeId;
  const resolvedLessonId = typeof lessonId === "function" ? lessonId(lesson) : lessonId;

  // advance / back: explicit callbacks win; otherwise derive from stagesOrder.
  const advanceFn = advance || ((cur) => {
    if (!stagesOrder) return cur;
    const i = stagesOrder.indexOf(cur);
    return i >= 0 && i < stagesOrder.length - 1 ? stagesOrder[i + 1] : cur;
  });
  const backFn = back || ((cur) => {
    if (!stagesOrder) return cur;
    const i = stagesOrder.indexOf(cur);
    return i > 0 ? stagesOrder[i - 1] : cur;
  });

  const { emit, judgeAndAdvance } = useLessonEngine({
    nodeId: resolvedNodeId,
    lessonConfig: { lessonId: resolvedLessonId, initialBeat: scaffoldKeyFor(initialStage) },
  });
  const { speaking, say, stopVoice } = useVoice();

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
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  // Latest callbacks in a ref so the memoized helpers never go stale without
  // forcing every consumer to re-memoize.
  const cb = useRef({});
  cb.current = { advanceFn, backFn, scaffoldKeyFor, introFor, resetStage, surfaceFormFor, onEnd };

  // ---- mount: emit the first problem_present (guarded); unmount: stop voice --
  useEffect(() => {
    if (emitMountPresent && !presentEmittedRef.current) {
      presentEmittedRef.current = true;
      emit({
        type: "problem_present",
        payload: {
          node_id: resolvedNodeId,
          scaffold_level: toScaffoldLevel(resolvedLessonId, scaffoldKeyFor(initialStage)),
        },
      });
    }
    return () => stopVoice();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- enter a stage cleanly (selector click OR auto-advance) ---------------
  const goStage = useCallback((key) => {
    stopVoice();
    setStage(key); stageRef.current = key;
    setSolved(false); solvedRef.current = false;
    setStars(0); setBadInput(false); setCook("idle");
    cb.current.resetStage?.(key);
    if (cb.current.introFor) setStatus(normStatus(cb.current.introFor(key)));
    selfCorrectionsRef.current = 0;
    presentEmittedRef.current = true;
    emit({
      type: "problem_present",
      payload: {
        node_id: resolvedNodeId,
        scaffold_level: toScaffoldLevel(resolvedLessonId, cb.current.scaffoldKeyFor(key)),
      },
    });
  }, [emit, resolvedNodeId, resolvedLessonId, stopVoice]);

  // ---- linear advance (no-op at the end) ------------------------------------
  const nextStage = useCallback(() => {
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
  }) => {
    const surfaceForm = cb.current.surfaceFormFor
      ? cb.current.surfaceFormFor(stageRef.current)
      : "stage-" + stageRef.current;
    const dec = judgeAndAdvance(
      { value: answerValue, modality, recognizerConfidence },
      {
        correct,
        errorSignature: errorSignature ?? null,
        stars: starCount ?? 0,
        hintMaxRung: 0,
        selfCorrections: selfCorrectionsRef.current,
        surfaceForm,
      }
    );
    selfCorrectionsRef.current = 0;
    return dec;
  }, [judgeAndAdvance]);

  // ---- FadeScaffold -> advance; RaiseScaffold -> back; else advance-on-correct
  const applyEngineDecision = useCallback((dec, isCorrect) => {
    if (!dec) return;
    if (dec.kind === "FadeScaffold") {
      nextStage();
    } else if (dec.kind === "RaiseScaffold") {
      const prev = cb.current.backFn(stageRef.current);
      if (prev != null && prev !== stageRef.current) goStage(prev);
    } else if (isCorrect) {
      nextStage();
    }
  }, [nextStage, goStage]);

  // ---- award + advance on a correct answer ----------------------------------
  // Positional (line, voice, answerValue, opts) so existing callsites are unchanged.
  // opts: { stars=3, modality, recognizerConfidence }. advanceMode "deferred"
  // delays the engine decision (R5 lingers on the celebration first).
  const award = useCallback((line, voice, answerValue, opts = {}) => {
    const st = opts.stars ?? 3;
    setSolved(true); solvedRef.current = true; setStars(st); setCook("cheer");
    if (line != null) setStatus({ tone: "ok", text: line });
    if (voice) say(voice);
    const dec = reportAttempt({
      correct: true,
      answerValue: answerValue ?? null,
      errorSignature: null,
      stars: st,
      modality: opts.modality,
      recognizerConfidence: opts.recognizerConfidence,
    });
    if (advanceMode === "deferred") {
      setTimeout(() => applyEngineDecision(dec, true), deferredDelayMs);
    } else {
      applyEngineDecision(dec, true);
    }
    return dec;
  }, [reportAttempt, applyEngineDecision, say, advanceMode, deferredDelayMs]);

  // ---- flash a bad input (red shake + thinking cook for 460ms) --------------
  const flashBad = useCallback(() => {
    setBadInput(true); setCook("think");
    setTimeout(() => setBadInput(false), 460);
  }, []);

  return {
    // stage
    stage, setStage, goStage, nextStage,
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
