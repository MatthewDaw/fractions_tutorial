# ADR-RT-004 — Corroboration as arithmetic (no single channel intervenes)

Status: Accepted (reflects what IS). Slice: `runtime-affect`.

## Context
Each behavioral channel (idle, latency stall, orphaned interaction, rapid submit,
hint spend) is individually noisy and easy to false-positive on. A naive
"if idle → nudge" design would let one twitchy channel trigger interventions,
which both annoys the child and (combined with a fatigue loop) risks the system
manufacturing the disengagement it claims to detect.

## Decision
Affect escalation is decided by a NEWS2-style additive composite
(`affect/composite.js`). Each channel contributes a small, CAPPED number of
points (`maxChannelPoints = 2`); points sum into a band by thresholds
(`t2 = 3`, `t3 = 5`). Because the per-channel cap (2) is strictly below the T2
threshold (3), ANY single channel — even maxed, even firing repeatedly — stays in
band T1 and cannot cross alone. At least TWO distinct channels must agree before
adaptation escalates to T2, three for T3. `hint_spend` is its own channel and can
be the corroborating second. Cold-start `observeOnly` signals are logged but
excluded from the actionable score so they can't manufacture an escalation.

## Rationale
- **Structural guarantee, not a tuning knob**: "no single channel intervenes" is
  enforced by the inequality `maxChannelPoints < t2`, not by hoping thresholds
  are set well. The invariant is the load-bearing test.
- **Interpretable & deterministic**: integer points per channel, a pure function,
  identical input → identical output — fits the determinism posture and the
  precision ledger that scores it.
- Pairs with the governor (budget/backoff) and ledger (cost-weighted precision)
  so the layer stays quiet by default and must measurably earn its place.

## Consequences
- Adding a new channel raises corroboration power but can never, by itself,
  cross a band — preserving the guarantee as the signal set grows.
- `AffectState` dimensions are derived from the same `byChannel` points, and
  `valence` is held neutral (ADR-RT-002) — corroboration changes WHEN to help,
  never WHAT the child is inferred to feel.
