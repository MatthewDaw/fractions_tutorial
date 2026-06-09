// harness/oracle/latentTruth.js — U5: per-tape oracle labels (Open Q1 / review A6).
//
// The oracle compares the ENGINE's signal (gate, escalation, transfer credit,
// fluency) against the persona's LATENT TRUTH (its true P_known and its known
// generative law). It is the harness's ground-truth channel: a tape is "wrong"
// when the engine's verdict disagrees with what the persona actually knows.
//
// ─────────────────────────────────────────────────────────────────────────────
// τ_latent — the latent-mastery threshold (Open Q1).
//
// τ_latent is DELIBERATELY DISJOINT from the engine's gateThreshold (0.95). The
// engine gate asks "is the BKT posterior ≥ 0.95?"; the oracle asks a DIFFERENT
// question: "did the child REALLY know it?", judged on the persona's own latent
// truePKnown. We set τ_latent = 0.8: a child with true P_known ≥ 0.8 plausibly
// "knows" the skill, so a gate that opens below that is a FALSE POSITIVE and a
// gate that should open but escalates is a FALSE ESCALATION.
//
// Why 0.8 and not 0.95? Pinning τ_latent to the engine's own threshold would make
// the oracle a tautology (it would only ever catch BKT arithmetic disagreements,
// not modeling defects). A lower, INDEPENDENT bar lets the oracle catch the
// engine crediting mastery the latent child does not possess. The exact value is
// a JUDGEMENT CALL, not a fact — so EVERYTHING here is parameterized by tauLatent
// and callers are expected to REPORT RESULTS AS A CURVE over τ_latent (e.g. sweep
// 0.7…0.9), never as a single point estimate (review A6). DEFAULT_TAU_LATENT is
// the reporting centroid, not a magic constant.
// ─────────────────────────────────────────────────────────────────────────────

/** The named, configurable latent-mastery threshold (Open Q1). */
export const DEFAULT_TAU_LATENT = 0.8;

/**
 * The "not improving" tolerance for the latently-stuck check: a latent trajectory
 * whose net rise across the session is ≤ this is treated as flat (no learning).
 */
const LATENT_FLAT_EPS = 0.05;

/** The label vocabulary the oracle can attach to a tape. */
export const LABEL_KINDS = Object.freeze([
  'falsePositiveMastery',
  'missedEscalation',
  'falseEscalation',
  'falseTransfer',
]);

// ---------------------------------------------------------------------------
// Per-step latent feature extraction
// ---------------------------------------------------------------------------

/** Per-step view used by the labelers (engine signal vs latent truth). */
function perStepView(tape) {
  return tape.steps.map((s, i) => ({
    i,
    gate: s.gate === true,
    latent: typeof s.latent === 'number' ? s.latent : null,
    pknown: typeof s.pknown === 'number' ? s.pknown : null,
    decisionKind: s.decision ? s.decision.kind : null,
    correct: s.observation ? !!s.observation.correct : false,
    scaffold: s.observation ? s.observation.scaffold_level : null,
    hintRung: s.observation ? s.observation.hint_max_rung : null,
    latency: s.observation ? s.observation.latency : null,
    answerValue: s.observation ? s.observation.answer_value : null,
    tooFast: s.observation ? !!s.observation.too_fast_correct : false,
    surfaceForm: s.observation ? (s.observation.surface_form ?? null) : null,
  }));
}

/** Latent at the END of the session (best available estimate of true knowledge). */
function finalLatent(view) {
  for (let i = view.length - 1; i >= 0; i--) {
    if (view[i].latent !== null) return view[i].latent;
  }
  return null;
}

/**
 * Latently stuck = latent stays LOW (below τ) and NOT improving across the session
 * (net rise ≤ LATENT_FLAT_EPS). This is the oracle's "the child genuinely was not
 * getting it" condition for the missed-escalation label.
 */
function isLatentlyStuck(view, tauLatent) {
  const latents = view.map((v) => v.latent).filter((x) => x !== null);
  if (latents.length === 0) return false;
  const first = latents[0];
  const last = latents[latents.length - 1];
  const max = Math.max(...latents);
  const lowThroughout = max < tauLatent;
  const notImproving = last - first <= LATENT_FLAT_EPS;
  return lowThroughout && notImproving;
}

/**
 * Did the engine-side STUCK escalation CONDITIONS hold at any step? The STUCK
 * trigger (policy.ts checkEscalationTriggers) needs: floor scaffold (L0) +
 * heavy hints at floor ≥ nStuck + flat P_known over nStuck. We can't read
 * PolicyState off the tape, so we PROXY the reachable surface: a run of attempts
 * at scaffold L0 with heavy hints (rung ≥ 3) and a near-flat engine P_known.
 *
 * This proxy targets the STUCK path (the reachable one). The disengaged trigger
 * is UNREACHABLE by construction (the runner mirrors the empty recentBehavior
 * channel — see sessionRunner header), so "off-task never escalates" is treated
 * as the disengaged-path defect in expectedFindings, NOT here.
 */
function stuckConditionsHeld(view, nStuck) {
  let floorHeavy = 0;
  const floorPknown = [];
  for (const v of view) {
    if (v.scaffold === 0 && v.hintRung !== null && v.hintRung >= 3) {
      floorHeavy += 1;
      if (v.pknown !== null) floorPknown.push(v.pknown);
    }
  }
  if (floorHeavy < nStuck) return false;
  if (floorPknown.length < nStuck) return false;
  const recent = floorPknown.slice(-nStuck);
  const flat = Math.max(...recent) - Math.min(...recent) <= 0.05;
  return flat;
}

/**
 * Returns true when the tape shows zero structural surface-form variation:
 * the session never presented more than one distinct surface_form value.
 *
 * A gate that opens with only one surface form seen means the engine credited
 * transfer without the learner ever facing structurally varied problems.
 * This is INDEPENDENT of whether latent < τ (a child can be latently competent
 * yet still have been presented only one surface form — falseTransfer fires but
 * falsePositiveMastery does not, and vice-versa).
 *
 * Steps whose surfaceForm is null (not recorded) are excluded; if NO step
 * recorded a surface form we cannot make the claim and return false.
 */
function hasNoSurfaceVariation(view) {
  const forms = view.map((v) => v.surfaceForm).filter((f) => f !== null);
  if (forms.length === 0) return false; // no surface data — cannot claim absent
  const distinct = new Set(forms);
  return distinct.size <= 1;
}

// ---------------------------------------------------------------------------
// labelTape — the per-tape oracle.
// ---------------------------------------------------------------------------

/**
 * Label one tape against the persona's latent truth.
 *
 * @param {object} tape   a session tape (sessionRunner schema).
 * @param {object} [opts]
 *   @param {number} [opts.tauLatent=DEFAULT_TAU_LATENT]  latent-mastery threshold.
 *   @param {number} [opts.nStuck=6]  the engine's stuck window (PARAMS.escalation.nStuck).
 * @returns {{ labels: object, perStep: object[], tauLatent: number }}
 *   labels = { falsePositiveMastery, missedEscalation, falseEscalation, falseTransfer }
 *   (each boolean) plus `evidence` arrays per label.
 */
export function labelTape(tape, { tauLatent = DEFAULT_TAU_LATENT, nStuck = 6 } = {}) {
  const view = perStepView(tape);
  const terminalKind = tape.terminal ? tape.terminal.kind : null;
  const fLatent = finalLatent(view);

  // ---- falsePositiveMastery: any gate-open step while latent < τ ----
  const fpSteps = view.filter((v) => v.gate && v.latent !== null && v.latent < tauLatent);
  const falsePositiveMastery = fpSteps.length > 0;

  // ---- falseEscalation: escalated while the child was latently competent (≥ τ) ----
  const escalated = terminalKind === 'EscalateToHuman';
  const falseEscalation =
    escalated && fLatent !== null && fLatent >= tauLatent;

  // ---- missedEscalation: never escalated while latently stuck AND the (reachable)
  //      STUCK conditions held. Targets the STUCK trigger only. ----
  const latentlyStuck = isLatentlyStuck(view, tauLatent);
  const stuckHeld = stuckConditionsHeld(view, nStuck);
  const missedEscalation = !escalated && latentlyStuck && stuckHeld;

  // ---- falseTransfer: transfer credited while structural breadth was absent ----
  // "Engine credited transfer" ← any gate-open step (gate ⟹ transfer_passed).
  // "Latent transfer absent" ← the session never varied surface_form: only one
  //   distinct surface_form appeared across all attempts, so the engine never
  //   saw the structural diversity that transfer credit requires.
  //
  // This signal is INDEPENDENT of latent < τ:
  //   • falsePositiveMastery ∧ ¬falseTransfer: gate opened below τ but surface
  //     forms DID vary — mastery credit is false, but transfer signal was real.
  //   • ¬falsePositiveMastery ∧ falseTransfer: gate opened above τ (child
  //     genuinely knew it) but only one surface form appeared — latent mastery
  //     is real, but transfer evidence was structurally absent.
  //   • Both true: gate opened below τ AND no surface variation.
  const gateOpened = view.some((v) => v.gate);
  const noSurfaceVariation = hasNoSurfaceVariation(view);
  const falseTransfer = gateOpened && noSurfaceVariation;
  const ftSteps = falseTransfer ? view.filter((v) => v.gate) : [];

  return {
    tauLatent,
    labels: {
      falsePositiveMastery,
      missedEscalation,
      falseEscalation,
      falseTransfer,
      evidence: {
        falsePositiveMastery: fpSteps.map((v) => ({ step: v.i, latent: v.latent, pknown: v.pknown })),
        missedEscalation: missedEscalation
          ? [{ terminalKind, finalLatent: fLatent, latentlyStuck, stuckHeld }]
          : [],
        falseEscalation: falseEscalation
          ? [{ terminalKind, finalLatent: fLatent }]
          : [],
        falseTransfer: ftSteps.map((v) => ({
          step: v.i,
          latent: v.latent,
          pknown: v.pknown,
          noSurfaceVariation: true,
        })),
      },
    },
    perStep: view,
  };
}

/** True when the tape carries ANY oracle label (used by metrics/clustering). */
export function tapeHasAnyLabel(label) {
  return (
    label.labels.falsePositiveMastery ||
    label.labels.missedEscalation ||
    label.labels.falseEscalation ||
    label.labels.falseTransfer
  );
}
