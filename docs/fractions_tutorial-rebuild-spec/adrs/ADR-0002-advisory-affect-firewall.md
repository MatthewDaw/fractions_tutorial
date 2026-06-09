# ADR-0002 — Advisory affect firewall (spanning)

## Status
Accepted (reflects what IS in the codebase).

## Context
The product wants behavior-aware help — Tier-2/3 nudges, "are you stuck?", transfer
probes — WITHOUT letting a noisy behavioral read change what the child has
"mastered." Behavioral signals (idle, latency stall, oscillation, rapid submit,
hint spend) are low-precision and easy to over-trust. Conflating them with the
knowledge estimate would let a fidgety-but-capable child be marked unmastered, or a
calm guesser be waved through. This spans two subsystems: the engine
(`mastery.ts` / `gate.ts`) and the runtime affect layer (`runtime/affect/**`).

## Decision
The affect layer is STRUCTURALLY advisory and quarantined from the mastery gate —
not by convention, but by construction:
- `runtime/affect/**` reads behavioral `Signal`s and emits only an advisory tier
  (`recommendedTier` none/T2/T3) and an `AffectState`
  `{engagement, attention, confidence, valence}`. It NEVER produces or mutates a
  `MasteryEstimate`, and it imports NOTHING from `engine/` — there is no code path
  from affect into `gate.ts`.
- `valence` is ALWAYS `'neutral'` in this phase: no emotion is inferred from
  behavior (it becomes non-neutral only from a consented self-report or a presence
  camera, neither of which feeds mastery).
- The only affect field in the engine log is `affect_window` on the `judged`
  `Observation`, and `useLessonEngine.judgeAndAdvance` emits it as an EMPTY array
  `[]`. Neither `mastery.ts` nor `gate.ts` reads it. Mastery is derived solely from
  the folded log of judged outcomes (constitution §5.2/§5.4).
- Affect's result fills only the `recentBehavior.isDisengaged` slot the policy
  consults to throttle/route — it changes WHEN the system helps, never WHAT the
  child is inferred to know or feel.
- Trustworthiness guardrails: corroboration-as-arithmetic so no single channel
  intervenes (ADR-RT-004), a nudge-fatigue governor so the watcher cannot pester a
  child into the disengagement it then "detects," and a cost-weighted precision
  ledger so the layer must measurably earn its place.

## Consequences
- A bad affect read degrades, at worst, the helpfulness of nudges — never the
  correctness of the knowledge estimate.
- Anyone tempted to "use affect to open the gate faster" must instead route it
  through the advisory `recommendedTier` / `isDisengaged` channels.
- The runtime-side realization is documented in ADR-RT-002; the engine-side
  invariant (gate reads only the folded log) is owned here and in ADR-0001.
