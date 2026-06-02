// useGeneratedPractice.js — the estimator-driven practice loop as a hook.
//
// This is the mechanism behind the "auto-generate variations + let the mastery
// estimator keep things moving" model. A lesson that adopts it does NOT walk fixed
// stages with frozen numbers. Instead:
//
//   1. The hook generates a VALIDATED problem for the current (skill, level,
//      surfaceForm) from the generator library — unlimited fresh variations.
//   2. The lesson renders that problem and grades the learner's answer.
//   3. On submit, the hook folds the attempt through the REAL engine
//      (useLessonEngine → measurementReduce + nextDecision) and maps the returned
//      Decision to the NEXT problem via practiceFlow:
//        continue → new variation, same level
//        fade     → harder (level+1, less scaffold)
//        raise    → easier (level-1, more support)
//        transfer → same level, a DIFFERENT surface form
//        return/route → exit (mastered / routed upstream)
//
// So the engine decides WHEN to advance, fade, re-support, or probe transfer, and
// the generator supplies the content for whatever it decides. Mastery is gated by
// the engine's multi-dimensional gate, not by "finished the stages".
//
// CONTRACT (per lesson):
//   useGeneratedPractice({
//     skill,            engine skill node id (e.g. 'SIMPLIFY')
//     lessonId,         room id for scaffoldMap (e.g. 'r4')
//     initialLevel,     starting scaffold level 0..4 (default 0)
//     gradeAnswer,      (problem, answer) => { correct, errorSignature?, stars? }
//   })
//   → { problem, level, surfaceForm, decision, rationale, exit, submit, masteryFor }
//
// The lesson reads `problem` (the generated operands/answer/prompt), renders it,
// and calls `submit(answer, meta)` when the learner responds. `exit` becomes
// non-null when the engine says the learner is done here (mastered → 'return', or
// routed upstream → 'route'); the lesson reacts (celebrate / navigate).
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useLessonEngine } from './useLessonEngine.js';
import { generateFor } from '../generators/index.js';
import { nextPractice } from './practiceFlow.js';

export function useGeneratedPractice({
  skill,
  lessonId = null,
  initialLevel = 0,
  gradeAnswer,
  maxLevel = 4,
} = {}) {
  const { emit, judgeAndAdvance, decision, rationale, masteryFor } = useLessonEngine({
    nodeId: skill,
    lessonConfig: { lessonId, initialBeat: initialLevel },
  });

  // The practice cursor: which variation to show next.
  const [practice, setPractice] = useState({
    level: initialLevel,
    index: 0,
    surfaceForm: undefined, // undefined → generator rotates by index
  });

  // Non-null once the engine says this skill is done here.
  const [exit, setExit] = useState(null);

  // The current generated problem (pure + deterministic for this cursor).
  const problem = useMemo(
    () =>
      generateFor(skill, {
        level: practice.level,
        index: practice.index,
        surfaceForm: practice.surfaceForm,
      }),
    [skill, practice.level, practice.index, practice.surfaceForm]
  );

  // Emit problem_present exactly once per distinct problem (drives latency timing,
  // the Tier-2 window reset, and the engine's scaffold sync).
  const presentedKeyRef = useRef(null);
  useEffect(() => {
    const key = `${practice.level}:${practice.index}:${problem.surfaceForm}`;
    if (presentedKeyRef.current === key) return;
    presentedKeyRef.current = key;
    emit({
      type: 'problem_present',
      payload: {
        node_id: skill,
        scaffold_level: practice.level,
        problem_id: problem.problem_id,
        surface_form: problem.surfaceForm,
      },
    });
  }, [emit, skill, practice.level, practice.index, problem.surfaceForm]);

  /**
   * Submit the learner's answer for the current problem.
   *
   * @param {*} answer  whatever the lesson's gradeAnswer expects
   * @param {object} [meta]  { value?, modality?, hintMaxRung?, selfCorrections?, recognizerConfidence? }
   * @returns {{ grade, decision, next }}
   */
  const submit = useCallback(
    (answer, meta = {}) => {
      const grade = gradeAnswer(problem, answer) || {};
      const correct = !!grade.correct;

      const dec = judgeAndAdvance(
        {
          value: meta.value ?? null,
          modality: meta.modality ?? 'tap',
          recognizerConfidence: meta.recognizerConfidence ?? null,
        },
        {
          correct,
          errorSignature: grade.errorSignature ?? null,
          stars: grade.stars ?? (correct ? 3 : 0),
          hintMaxRung: meta.hintMaxRung ?? 0,
          selfCorrections: meta.selfCorrections ?? 0,
          surfaceForm: problem.surfaceForm,
          problemId: problem.problem_id,
        }
      );

      const move = nextPractice(
        dec,
        {
          skill,
          level: practice.level,
          index: practice.index,
          surfaceForm: problem.surfaceForm,
        },
        { maxLevel }
      );

      if (move.action === 'present') {
        setPractice({
          level: move.spec.level,
          index: move.spec.index,
          surfaceForm: move.spec.surfaceForm,
        });
      } else {
        setExit({ kind: move.action, decision: move.decision });
      }

      return { grade, decision: dec, next: move };
    },
    [gradeAnswer, problem, judgeAndAdvance, skill, practice, maxLevel]
  );

  return {
    problem,
    level: practice.level,
    surfaceForm: problem.surfaceForm,
    decision,
    rationale,
    exit,
    submit,
    masteryFor,
  };
}
