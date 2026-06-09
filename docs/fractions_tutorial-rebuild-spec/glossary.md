# Glossary

The shared domain vocabulary for `fractions_tutorial`. One canonical definition per
term; subsystem docs use these without redefining.

- **BKT** — Bayesian Knowledge Tracing. The per-node belief update (`engine/bkt.ts`)
  that maintains `P_known`, the posterior probability the child knows a skill, from
  the stream of correct/incorrect judged outcomes.

- **scaffold L0–L4** — the five support levels for a problem presentation, **L0 =
  maximum support (manipulatives/guided) → L4 = fully independent**. A room's native
  beats map to these canonical levels via `runtime/scaffoldMap.js`.

- **mastery gate** — the read-only predicate `gate.isMastered(estimate)`: a node is
  mastered iff `P_known ≥ threshold` ∧ `max_scaffold_passed ≥ L3` ∧ `transfer_passed`
  (fluency is a soft sub-gate). Mastery is never an emitted decision or a stored flag
  (R9) — it is always derived from the folded log.

- **transfer probe** — a `TransferProbe` decision / `transfer_passed` dimension: a
  problem in a structurally novel surface form, used to confirm the child generalizes
  the skill rather than memorizing one presentation (≥2 correct on ≥2 distinct forms,
  hint-free, low scaffold).

- **surface form** — a structurally distinct presentation of the same skill (e.g.
  pictorial vs symbolic, or two visual framings). Tracked per attempt; distinct forms
  are what make transfer measurable.

- **error signature** — a named, typed classification of a wrong answer
  (`ErrorSignature`, e.g. `add_denominators`, `add_across_unlike`, `not_simplified`,
  `forced_leftover`, `scaled_bottom_only`). Drives credit assignment and routing.

- **retention / decay probe** — a spaced-repetition check (`engine/decay.ts`): after a
  delay (`PROBE_DELAYS_MS`) a previously-mastered node is re-probed; passing keeps it,
  failing demotes it (while `mastered_at` persists so it still reads "was mastered /
  needs review").

- **KTD / R / U numbering** — provenance tags in source/spec: **KTD#** = a key
  technical decision, **R#** (and `R-RT-*`/`R-AF-*`/`R-LR-*`) = a requirement, **U#** =
  a plan implementation unit. They cross-reference design docs and requirements.

- **Tier-1 / Tier-2 / Tier-3** — escalating intervention tiers. **T1** = ambient (no
  intervention); **T2** = within-attempt nudges (hint offer, "take your time"); **T3**
  = stronger structural support / escalation. The affect layer recommends a tier;
  corroboration arithmetic guarantees no single behavioral channel crosses from T1
  alone.

- **strand** — a contiguous grouping of lesson rooms on the world map (`rooms.js`
  `STRANDS`, 3 of them) — the curriculum's top-level shelves.

- **room** — a single lesson screen / skill node (`AppR1`, `AppM1`, `LessonUnlikeDen`,
  …). Each maps 1:1 to an engine `SkillNode` via `SkillNode.roomId` (stable ids
  `m1 m3 nl r1 s1 cmp r3 r2 r4 r5`).

- **recipe** — a word-problem in Babushka's Kitchen (`momsProblems.js`) with a known
  required-skills shape; the unit the kitchen presents, grades, and can be "stumped" on.

- **champion** — in the harness, a distilled high-value adversarial case
  (`recursiveLoop.distillChampions`): a `{latent, seed}` configuration that reliably
  exposes an engine weakness, retained for replay.

- **oracle** — the harness's ground-truth side (`harness/oracle/**`): the latent truth
  labels, expected-findings probes, positive control, and metamorphic invariants that
  say what the engine SHOULD conclude, independent of what it does.

- **tape** — the canonical, signed replay record of one synthetic session
  (`harness/tape.js`). Serialized canonically (sorted keys, 1e-9 float rounding) so a
  `(persona, seed, flags)` run is byte-identical; the single source of truth that all
  harness reports are pure projections of.

- **advisory affect** — the `runtime/affect/**` layer: it reads behavioral signals and
  emits an advisory `recommendedTier` + `AffectState` to influence WHEN to help. It is
  firewalled from mastery — never produces or mutates a `MasteryEstimate`, valence
  stays neutral (ADR-0002).

- **wire-DTO** — a plain data-transfer object exported from `engine/index.ts`
  (`Event`/`Action`/`Signal`, `Observation`, `MasteryEstimate`, the `Decision` union,
  `SkillNode`). Treated as a stable, network-shaped interface so the engine could
  relocate behind a backend with no contract churn (ADR-0001).

- **Cook / Babushka cast** — the in-fiction characters of "Babushka's Fractions": the
  Russian-grandmother **Babushka** (voiced prompts, the kitchen / word-problem hub) and
  the **Cook**/**Mom** scene characters. The single source of spoken text is
  `voiceLines.js`; every on-screen string is readable aloud in-character.
