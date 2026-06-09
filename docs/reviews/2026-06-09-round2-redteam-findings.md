# Round-2 Red-Team Findings — engine-gate over-credits (T22–T28)

Source: a fresh synthetic-learner harness pass on the post-gap-build app (main 35743a4), reports in
docs/harness/ (baseline-report, verdict-cards, improvement-backlog). Round 1 (T01–T21) fixed
*measurement* (oracle de-dup, τ-curve, joint metrics, new personas) + two dead levers (fluency,
disengaged escalation). **Round 2 targets the gate's DECISION LOGIC itself**, which still over-credits.

Headline: population false_mastery_rate **0.34**, rising to **0.60 at τ=0.90**, spread across 9 personas ×
9 skills (82 cards) — NOT concentrated in the known fluency-spoofer. Highest cluster is misconception-stable.

## Build approach (all reversible; no suite breakage; evidence-gated)
Each gate change ships behind its OWN PARAMS flag **default-off** + a NEW test proving that WITH the flag on
its target false-mastery cell is now caught. The existing suite stays green (live gate unchanged at default).
Then **T28** re-runs the harness with the flags ON to certify the aggregate false_mastery drop AND confirm no
new false-escalation (over-stricting). Recommended default flips are documented for user review, not flipped silently.
ENGINE INVARIANTS apply to every change (purity, determinism, TS-strict, advisory-only affect firewall).

## GATE-HARDENING bundle (one worker — all touch isMastered/params.ts; build together to avoid conflicts)
### T22 [P1] Misconception-persistence guard
Gate credits misconception-stable across all 9 skills though latent stays <τ and the misconception survives ~50
steps (verdict-cards #1–9, rank 2.589 highest). FIX: a flag `requireMisconceptionFree` — when on, isMastered also
requires the last N recent attempts carry NO error_signature (misconception-free), so a stable misconception blocks
the gate until cleared. DEFAULT PEDAGOGY CHOICE (documented): N=2 consecutive misconception-free attempts. Tie to U5
reteach (the detected stable signature already drives reteach). pedagogy-curriculum-reviewer to sanity-check "cleared".

### T23 [P2] Pre-acquisition debounce
47/83 cards are "credited-too-early": the gate opens several steps before latent crosses τ (e.g. anxious-low-energy
credited step 28, confident-guesser step 15). FIX: flag `requireStableEstimate` — require N consecutive in-band
attempts (or a non-decreasing estimate trend) AND raise the evidence_count_at_gate_open floor above 7 before banking
Mastered. DEFAULT: N=2, evidence floor=10.

### T24 [P2] τ-band calibration
false_mastery is τ-sensitive (0.34→0.60 across τ .80→.90; steepest at .85→.90). The gate constant isn't tied to a
committed τ. FIX: flag `strictGateThreshold` raising the P_known/evidence bar so false_mastery is bounded (target
≤0.20) across a committed τ-band. DEFAULT PEDAGOGY CHOICE (documented, for user review): commit to τ=0.85, set the
gate constant so false_mastery ≤0.20 at τ=0.85. Record chosen band + resulting curve in decision-log.

### T25 [P2] Per-skill transfer-probe requirement
8 skills require ZERO transfer evidence at the gate (false-transfer 0.00); FRACTION_ON_LINE risk 0.804 highest. FIX:
flag `requireTransferProbe` — isMastered requires ≥1 correct attempt at a VARIED surface_form/structural form before
Mastered (builds on T13's now-independent transfer signal). Roll out per-skill starting FRACTION_ON_LINE.
lesson-room-author authors the varied-form probe items; plan-implementer wires the gate conjunct.

## Separable (parallel workers)
### T26 [P2] Tier-2 nudge wiring
The Tier-2 in-the-moment nudge (idle/oscillation/too-fast-correct) records ZERO firings on the run path —
recentBehavior is empty on every tape, so avoidance is never redirected before the gate. FIX: route the
idle/oscillation/too-fast behavior signals into recentBehavior on the engine/run path so Tier-2 fires (confirm the
wire-disengagedCount writer truly does not reach this channel — limitations-memo says it doesn't). route: harness-triage (confirm dead channel) → plan-implementer (wire).

### T27 [P3] Escalation competence-guard
over-hinter on MULT_EQUAL_GROUPS is escalated to a human at genuine mastery (latent 0.9314) — the lone over-strict
error (verdict-card #74, highest novelty 1.0). FIX: gate the human-escalation trigger on LOW recent accuracy / low
P_known, so a heavy-hint-but-succeeding learner is nudged (Tier-2, pairs with T26), not escalated. Small reversible conditional.

## Certification (after T22–T27 merge)
### T28 [P1] Certify the gate-hardening helps (harness REAL verdict)
With all gate flags ON, re-run `npm run harness -- loop` before=flags-off after=flags-on on TRAIN + the SEALED
held-out family. Assert: population/held-out false_mastery_rate drops materially (target ≤0.20 at the committed τ),
NO new false-escalation (over-stricting), novel-form transfer guardrail holds, no persona regresses. Emit a REAL
verdict to decision-log.md (engine_sha/params_hash, before/after) and refresh baseline-report.md. If the combined
flip over-stricts (false-escalation rises) or can't hit the target without cheating, STOP and report honestly — do
not fake REAL. This is the brief's "show evidence it helps." route: harness-triage. dependsOn: [T22,T23,T24,T25,T26,T27].

## Harness blind spots (documented, not yet addressed)
- Affect/social channels unmodeled — socially-motivated gaming asserted, not detected (T19 was doc-only).
- Cross-session retention invisible — overnight forgetting reads as durable mastery (retention_probe path dead on the run).
These are candidates for a round 3, not in this batch.
