// affect/affectState.js — Phase 2 (plan 005, S5): AffectState from behavior.
//
// Derives {engagement, attention, confidence, valence} from the corroboration
// composite. VALENCE IS ALWAYS 'neutral' in Phase 2 — there is NO emotion/valence
// inference anywhere in this layer (the firewall taken into the affect model
// itself). Valence only becomes non-neutral when a CONSENTED self-report (Phase 3)
// or the presence camera (Phase 4) supplies it — never inferred from behavior.
//
// Dimensions are channel-derived (interpretable), clamped to [0,1], and EWMA-
// smoothed across attempts so a single spike doesn't swing the state.
//
// PURE: no React, no wall-clock.

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function neutralAffect() {
  return { engagement: 1, attention: 1, confidence: 0.5, valence: 'neutral' };
}

/**
 * Derive a RAW (unsmoothed) AffectState from a composite result.
 *
 * @param {{byChannel: Record<string,number>}} composite  computeComposite(...) result
 * @param {Array} _signals  reserved (self-report/presence in later phases)
 */
export function deriveAffect(composite, _signals = []) {
  const ch = composite.byChannel || {};
  const idle = ch.idle || 0;
  const orphaned = ch.orphaned_interaction || 0;
  const stall = ch.latency_stall || 0;
  const rapid = ch.rapid_submit || 0;
  const hint = ch.hint_spend || 0;

  const engagement = clamp01(1 - 0.2 * idle - 0.2 * orphaned - 0.15 * rapid);
  const attention = clamp01(1 - 0.25 * idle - 0.25 * stall);
  const confidence = clamp01(0.5 - 0.12 * hint - 0.12 * stall - 0.12 * rapid);

  return { engagement, attention, confidence, valence: 'neutral' };
}

/**
 * EWMA-blend a new raw AffectState onto the previous one (the ~1–2 Hz smoothing,
 * windowed per attempt). alpha weights the newest reading.
 */
export function smoothAffect(prev, raw, alpha = 0.4) {
  const a = clamp01(alpha);
  const lerp = (p, r) => (1 - a) * p + a * r;
  return {
    engagement: lerp(prev.engagement, raw.engagement),
    attention: lerp(prev.attention, raw.attention),
    confidence: lerp(prev.confidence, raw.confidence),
    valence: 'neutral', // never inferred from behavior
  };
}
