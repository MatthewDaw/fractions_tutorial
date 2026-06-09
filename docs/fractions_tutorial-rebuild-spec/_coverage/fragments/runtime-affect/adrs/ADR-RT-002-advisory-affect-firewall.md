# ADR-RT-002 — Advisory-only affect firewall (runtime side)

Status: Accepted (reflects what IS). Slice: `runtime-affect`.
Note: the SPANNING "advisory affect firewall" ADR (covering engine `mastery.ts`/
`gate.ts` too) is synthesis-owned. This ADR documents the firewall as realized in
`runtime/affect/**` and the runtime emission stub. Referenced by pointer from the
spanning ADR; not a duplicate of it.

## Context
The product wants behavior-aware help (nudges, transfer probes, "are you stuck?")
WITHOUT letting a noisy behavioral read silently change what the child has
"mastered." Affect signals are low-precision and easy to over-trust; conflating
them with the knowledge estimate would let a fidgety-but-capable child be marked
unmastered, or a calm guesser be waved through.

## Decision
The affect layer is structurally ADVISORY and quarantined from the mastery gate:
- `runtime/affect/**` reads behavioral `Signal`s and emits an advisory tier
  (`recommendedTier` none/T2/T3) + an `AffectState` `{engagement, attention,
  confidence, valence}`. It NEVER produces or mutates a `MasteryEstimate`.
- `valence` is ALWAYS `'neutral'` in Phase 2 — no emotion inference from behavior
  (it becomes non-neutral only from a consented self-report or presence camera).
- The affect modules import NOTHING from `engine/`; there is NO code path from
  affect into `gate.ts`.
- The ONLY affect field in the engine log is `affect_window` on the `judged`
  Observation, and it is emitted as an EMPTY array `[]` by
  `useLessonEngine.judgeAndAdvance`. Neither `mastery.ts` nor `gate.ts` reads it.
- `composeAffect`'s result fills only the `recentBehavior.isDisengaged` slot the
  policy consults to throttle/route — never the estimate.

Guardrails reinforce trustworthiness: corroboration-as-arithmetic (ADR-RT-004) so
no single channel intervenes; a nudge-fatigue governor so the watcher can't
pester a child into the disengagement it then "detects"; and a precision LEDGER
(cost-weighted) so the layer must measurably earn its place.

## Rationale
Mastery is the high-stakes signal and must be derived only from the folded log of
judged outcomes (constitution §5.2/§5.4). Affect is an interaction-quality aid;
keeping it on a separate rail means a bad affect read degrades, at worst, the
helpfulness of nudges — never the correctness of the knowledge estimate.

## Consequences
- Tests assert `valence==='neutral'` under any signal load, observe-only signals
  never score, and the budget can suppress without manufacturing precision.
- Anyone tempted to "use affect to open the gate faster" must instead route it
  through the advisory `recommendedTier` / `isDisengaged` channels only.
