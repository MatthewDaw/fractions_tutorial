# Gotchas — `runtime-affect` slice

Non-obvious behavior, ordering constraints, and traps. Each is load-bearing —
a "cleanup" that ignores it breaks the design.

## G1 — `nextDecision` is called EXACTLY ONCE, ONLY at the boundary (R16)
The single most load-bearing rule of this slice. `nextDecision` (and the whole
engine consult) runs ONLY inside `useLessonEngine.judgeAndAdvance`, never on
mount, re-render, state change, or timer (constitution §5.3; ADR-RT-001). The
tests assert: not called on mount, not called by `emit` alone (even
`problem_present`/`place_block`/`remove_block`), called exactly N times after N
submits. Do NOT move the consult into a `useEffect` "to keep it fresh" — that is
the exact bug the rule forbids.

## G2 — Tier-2 nudges NEVER mutate game state and are NOT Decisions
A Tier-2 nudge has a `type` (`HINT_OFFER`/`TAKE_YOUR_TIME`/
`TRANSFER_PROBE_QUEUED`), never a `kind`. It must not be confused with an engine
`Decision`. `TRANSFER_PROBE_QUEUED` only sets a FLAG; the actual probe waits for
the next boundary, where `useLessonEngine` sets `pendingTransferProbe` on the
policy state. Firing a probe mid-attempt would restructure the workspace and
violate the boundary rule.

## G3 — `consecutiveErrors` is NOT reset on a scaffold change
In `emit`, a `problem_present` syncs `policyState.currentScaffold` to the
lesson's actual stage but DELIBERATELY does not reset `consecutiveErrors`. In
these lessons the stages ARE the scaffold ladder; the engine's cross-stage
signals (a clean streak that fades, an error run that raises) must SPAN stages.
Resetting per-stage would defeat both. The counters reset only in
`_updatePolicyState` (errors on a correct; clean streak on an error or
out-of-band correct). Verified: one wrong submit increments errors exactly once.

## G4 — too-fast guard must run AFTER `_updatePolicyState`
`_updatePolicyState` clears `pendingTransferProbe` on any correct. The too-fast
guard (`checkTooFastCorrect` → set `pendingTransferProbe=true`) is sequenced
AFTER it, so a suspiciously-fast correct queues a probe instead of being faded
through on a possible fluke. Reversing the order silently drops the probe.
The single `PARAMS.latencyFloorMs` constant is shared by too-fast detection,
transfer in-band, and clean-correct in-band (U1) — no `[800,1200)` dead zone
where a correct counts toward neither.

## G5 — `PresentProblem` holds the level (no collapse to L0)
In `practiceFlow.nextPractice`, a routine `PresentProblem` keeps the current
`level` and only advances `index`. It must NOT pull the level back to the
policy's entry scaffold (L0), or difficulty collapses between reps. Level moves
ONLY on Fade (+1) / Raise (−1). Mirrors `useLessonScaffold`'s generated mode.

## G6 — generated stage spans levels 0..4 in place; certified terminator FIRST
In `useLessonScaffold.applyEngineDecision`, a generated stage is otherwise
ENDLESS for a direct-entry lesson (Return/Route are illegal with no stumping
recipe), so it would re-roll forever. The U2 `isCertified()` check is evaluated
FIRST — at full mastery the engine may still return `FadeScaffold` on a clean
streak, and certification must win over the re-roll, ending the stage with
`onEnd({kind:'LessonComplete', certified:true})`. `goStage(cur)` re-rolls WITHOUT
resetting the live level; entering a DIFFERENT stage resets `genLevel` to
`generatedStartLevel` (default 2, post-teaching).

## G7 — `LessonUnlikeDen` is a PARTIAL adopter of useLessonScaffold
It uses the safe primitives (state/refs/flashBad/reportAttempt/stopVoice) but
keeps its OWN beat navigation and does not call `goStage`/`nextStage`. It must be
constructed with `emitMountPresent:false` so the controller does not double-fire
`problem_present` (the lesson emits it itself). Forgetting this double-counts
attempts and corrupts latency timing.

## G8 — the advisory-affect FIREWALL is STRUCTURAL (constitution §5.2)
The affect layer (`runtime/affect/**`) reads behavioral `Signal`s and emits an
advisory tier + `AffectState`. It NEVER produces or mutates a `MasteryEstimate`,
valence stays `'neutral'` (no emotion inference), and it has NO import of and NO
path into `gate.ts`. The ONLY affect data in the engine log is the
`affect_window: []` stub on the `judged` Observation — always an EMPTY array
today; neither `mastery.ts` nor `gate.ts` reads it. Mastery cannot be raised or
lowered by affect. Do not "wire affect into the gate" — the firewall is the
design (ADR-RT-002). `composeAffect`'s output fills only
`recentBehavior.isDisengaged`, which the policy may use to throttle/route but
which can never change the mastery estimate.

## G9 — `.jsx` hook tests rely on the vite `.js→.ts` resolution
The runtime hooks import the engine via explicit `.js` specifiers that resolve to
`.ts` on disk through the `resolveTsFromJs` Vite plugin / vitest config
(constitution §2; leftovers-owned). Several `.jsx` runtime tests therefore MOCK
the engine modules instead of importing them (e.g. `test_useLessonEngine`,
`test_stage_lessons_emission`). Do NOT "fix" the `.js` import extensions in the
runtime source — they are the contract.

## G10 — `engineStore` is a module singleton; reset between tests/sessions
`engineStore` holds module-level mutable `state`. Tests must call
`resetEngineStore()` in `beforeEach` (and a new session resets it) or stale
decisions/uiChurn leak across cases. `getSnapshot` returns a stable identity
until a publish — required by `useSyncExternalStore` to avoid render loops.
