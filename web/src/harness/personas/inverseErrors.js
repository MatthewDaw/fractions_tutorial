// harness/personas/inverseErrors.js — U2: the inverse-error map.
//
// WHAT THIS IS:
//   Given a generated problem (the envelope from generators/index.generateFor:
//   { skill, level, surfaceForm, operands, answer, prompt, ... }) and a named
//   misconception, return the answer_value ([num,den] or null) that a learner
//   holding that misconception would actually SUBMIT — computed from the REAL
//   operands the generator chose (constrained generation in reverse), so the
//   engine's classifyErrorSignature (engine/observation.ts) fingerprints the
//   wrong answer as the INTENDED error_signature.
//
// WHY ARITHMETIC, NOT LOOKUP:
//   The engine recognises a misconception structurally — e.g. add_denominators is
//   "answer = (na+nb)/(da+db)". To make the engine emit that signature we must
//   plant exactly that value, derived from the SAME operands. We therefore
//   re-implement the misconception's (buggy) arithmetic here.
//
// HONESTY CAVEAT (review A1): for the named-signature misconceptions, this map and
//   the engine's classifier share the same arithmetic identity by construction.
//   The round-trip test (planted → classify → intended) is therefore a COVERAGE
//   check that the wiring lines up, NOT independent evidence that the engine's
//   fingerprinting is *correct*. It only proves our planted answers land where we
//   mean them to.
//
// PURITY: no import of the engine's params module, no wall-clock, deterministic
// (math only) — the personas lint forbids that import path as a literal substring.

// ---------------------------------------------------------------------------
// Operand normalisation — each generator names its operands differently.
// We extract a small canonical view so the misconception math can be uniform.
// ---------------------------------------------------------------------------

/**
 * Normalise a generated problem's `operands` into a canonical shape:
 *   { a:{num,den}, b:{num,den} }  for two-operand arithmetic skills, and/or
 *   { single:{num,den} }          for one-operand skills (simplify / improper).
 * Returns whatever it can derive; callers check for the fields they need.
 */
function view(problem) {
  const op = (problem && problem.operands) || {};
  const out = {};

  // Two-operand add/sub skills: a/b each carry {num,den}. ADD_UNLIKE_NESTED uses
  // a:{num,den}, b:{num,den}; SUB_SAME_DEN uses start/take; others use a/b.
  if (op.a && op.b && typeof op.a.num === 'number') {
    out.a = { num: op.a.num, den: op.a.den };
    out.b = { num: op.b.num, den: op.b.den };
  } else if (op.start && op.take) {
    out.a = { num: op.start.num, den: op.start.den };
    out.b = { num: op.take.num, den: op.take.den };
  }

  // One-operand skills: SIMPLIFY / IMPROPER_TO_MIXED present a single num/den.
  if (typeof op.num === 'number' && typeof op.den === 'number') {
    out.single = { num: op.num, den: op.den };
  }

  return out;
}

/** The correct answer as a flat [num,den], where the generator exposes one. */
function correctNumDen(problem) {
  const ans = (problem && problem.answer) || {};
  if (typeof ans.num === 'number' && typeof ans.den === 'number') {
    return [ans.num, ans.den];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Misconception catalogue per skill.
//
// Two TIERS of misconception:
//   (A) Engine-named signatures — planted to hit a specific ErrorSignature:
//         add_denominators, add_across_unlike, scaled_bottom_only,
//         forced_leftover, not_simplified.
//   (B) Cognitive misconceptions expressed through answer_value that the engine
//       has NO dedicated branch for, so they collapse to 'other' (or, where the
//       value happens to be a fraction, occasionally a named one). Documented as
//       'other' below. These are: whole_number_bias, gap_thinking,
//       denominator_neglect, unit_fraction_inversion.
// ---------------------------------------------------------------------------

const SAME_DEN_SKILLS = new Set(['ADD_SAME_DEN', 'SUB_SAME_DEN']);
const UNLIKE_SKILLS = new Set(['ADD_UNLIKE_COPRIME', 'ADD_UNLIKE_NESTED']);

/**
 * Per-skill misconception ids. Order is stable; every generator skill exposes
 * ≥2 misconceptions (asserted by the test).
 */
const CATALOGUE = {
  ADD_SAME_DEN: [
    'add_denominators',     // (a+b)/(da+db) — like dens → add_denominators
    'whole_number_bias',    // ignore denominators, add tops as wholes → 'other'
    'denominator_neglect',  // keep one denominator, drop structure → 'other'
  ],
  SUB_SAME_DEN: [
    'add_denominators',     // subtract tops but ALSO subtract bottoms → da-db
    'whole_number_bias',    // (s-t) as a whole number → 'other'
    'gap_thinking',         // count the gap wrong → 'other'
  ],
  ADD_UNLIKE_COPRIME: [
    'add_across_unlike',    // (na+nb)/(da+db) with da!=db → add_across_unlike
    'scaled_bottom_only',   // common den but numerator not scaled → scaled_bottom_only
    'unit_fraction_inversion', // flip a unit fraction → 'other'
  ],
  ADD_UNLIKE_NESTED: [
    'add_across_unlike',    // (na+nb)/(da+db) → add_across_unlike
    'scaled_bottom_only',   // scaled the bottom, left the top → scaled_bottom_only
    'denominator_neglect',  // keep larger den, add raw tops → 'other'
  ],
  SIMPLIFY: [
    'not_simplified',       // resubmit the unreduced (p*k)/(q*k) → not_simplified
    'scaled_bottom_only',   // halve the bottom only → 'other'/scaled
    'whole_number_bias',    // answer the numerator as a whole → 'other'
  ],
  IMPROPER_TO_MIXED: [
    'forced_leftover',      // force a leftover where there is none / wrong remainder
    'whole_number_bias',    // answer just the whole part → 'other'
    'gap_thinking',         // swap whole and remainder → 'other'
  ],
  MULT_EQUAL_GROUPS: [
    'gap_thinking',         // add instead of multiply → 'other'
    'whole_number_bias',    // off-by-one product → 'other'
  ],
  MULT_FACTS: [
    'gap_thinking',         // add the factors → 'other'
    'whole_number_bias',    // identity slip (a*1 vs a*0) → 'other'
  ],
  FRACTION_ON_LINE: [
    'denominator_neglect',  // place at num (ignore den) → 'other'
    'unit_fraction_inversion', // read den/num → 'other'
  ],
  COMPARE_BENCHMARK: [
    'whole_number_bias',    // "bigger bottom = bigger" → 'other'
    'gap_thinking',         // mis-order → 'other'
  ],
};

/** The misconception ids available for a skill (≥2 each). */
export function misconceptionsFor(skillId) {
  return (CATALOGUE[skillId] || []).slice();
}

// ---------------------------------------------------------------------------
// The inverse map.
// ---------------------------------------------------------------------------

/**
 * Compute the answer_value a learner with misconception `m` would submit on this
 * generated problem.
 *
 * @param {string} skillId    engine skill node id
 * @param {string} m          misconception id (see misconceptionsFor)
 * @param {object} problem    a GeneratedProblem from generateFor()
 * @returns {[number,number]|null}  [num,den], or null for a non-fraction / off-task slip
 */
export function inverseAnswer(skillId, m, problem) {
  if (!problem) return null;
  const v = view(problem);
  const a = v.a;
  const b = v.b;
  const single = v.single;

  switch (m) {
    // ---- add_denominators: like-denominator add/sub, both top AND bottom ----
    // Engine: answer = (na+nb)/(da+db) with da===db → add_denominators.
    case 'add_denominators': {
      if (!a || !b) return slip(problem);
      if (skillId === 'SUB_SAME_DEN') {
        // Subtract tops AND bottoms: (s-t)/(da-db). da===db so den becomes 0;
        // that is a malformed denominator, so fall back to the same-bottom add
        // shape the engine recognises: (s-t)/(da+db) keeps the (da+db) pattern.
        return [a.num - b.num, a.den + b.den];
      }
      return [a.num + b.num, a.den + b.den];
    }

    // ---- add_across_unlike: unlike dens, add straight across ----
    // Engine: answer = (na+nb)/(da+db) with da!==db → add_across_unlike.
    case 'add_across_unlike': {
      if (!a || !b) return slip(problem);
      return [a.num + b.num, a.den + b.den];
    }

    // ---- scaled_bottom_only: build the common denominator, forget to scale top ----
    // Engine: answerDen is a common multiple of both da and db, but answerNum is
    // NOT the correctly-scaled numerator → scaled_bottom_only.
    case 'scaled_bottom_only': {
      if (a && b) {
        const commonDen = a.den * b.den; // a valid common multiple of da and db
        // Child writes a "summed top" without scaling — e.g. na+nb over the big den.
        const wrongNum = a.num + b.num;
        // Guard: must NOT accidentally equal the correctly-scaled numerator.
        const scaled = a.num * b.den + b.num * a.den;
        return [wrongNum === scaled ? wrongNum + 1 : wrongNum, commonDen];
      }
      if (single) {
        // SIMPLIFY: scale the bottom down but leave the top — bottom halved.
        const den2 = single.den % 2 === 0 ? single.den / 2 : single.den;
        return [single.num, den2];
      }
      return slip(problem);
    }

    // ---- not_simplified: correct VALUE, but left in the presented unreduced form ----
    // Engine sees the value is right-but-not-lowest via the notSimplified slip.
    // For answer_value classification we resubmit the unreduced (p*k)/(q*k).
    case 'not_simplified': {
      if (single) return [single.num, single.den]; // the unreduced presented form
      if (a && b) {
        // For an add: submit a correct-VALUE but unreduced sum where one exists.
        const num = a.num * b.den + b.num * a.den;
        const den = a.den * b.den;
        return [num, den];
      }
      return slip(problem);
    }

    // ---- forced_leftover: improper→mixed conversion error ----
    // Collapses to 'other' in the engine for single-operand problems, but the
    // numeric answer is a plausible mis-conversion: force a leftover even when
    // the division is exact, or take the wrong whole.
    case 'forced_leftover': {
      if (single) {
        const w = Math.floor(single.num / single.den);
        const r = single.num % single.den;
        if (r === 0) {
          // exact whole (e.g. 14/7=2): child forces a bogus 1/den leftover.
          // Represent the submitted value as an improper fraction: (w*den - 1)/den + ... ;
          // simplest faithful answer_value is the off-by-one improper [num-1, den].
          return [single.num - 1, single.den];
        }
        // with remainder: child drops the whole and submits just r/den.
        return [r, single.den];
      }
      return slip(problem);
    }

    // ===== Tier B: cognitive misconceptions → 'other' (documented) =====

    // whole_number_bias: treat fractions as whole numbers / ignore the bottom.
    case 'whole_number_bias': {
      if (a && b) return [a.num + b.num, 1]; // tops added as wholes, /1
      if (single) {
        // SIMPLIFY/IMPROPER: answer just the numerator as a bare whole.
        if (skillId === 'IMPROPER_TO_MIXED') {
          return [Math.floor(single.num / single.den), 1];
        }
        return [single.num, 1];
      }
      // MULT_* / COMPARE have product/rel answers; submit an off-by-one whole.
      return productSlip(problem, +1);
    }

    // denominator_neglect: act on numerators, keep one denominator unchanged.
    case 'denominator_neglect': {
      if (a && b) return [a.num + b.num, a.den]; // keep first denominator
      if (single) return [single.num, single.den];
      return slip(problem);
    }

    // gap_thinking: count the gap / combine wrong (add where you should multiply, etc).
    case 'gap_thinking': {
      if (a && b) {
        // For sub: the |gap| but over a wrong (summed) denominator.
        return [Math.abs(a.num - b.num), a.den + b.den];
      }
      if (single && skillId === 'IMPROPER_TO_MIXED') {
        // swap whole and remainder: submit den-as-num style mix-up.
        const w = Math.floor(single.num / single.den);
        const r = single.num % single.den;
        return [w === 0 ? 1 : w, r === 0 ? single.den : r]; // scrambled
      }
      return productSlip(problem, -1); // mult: add instead of multiply ⇒ smaller
    }

    // unit_fraction_inversion: flip a fraction (read den/num).
    case 'unit_fraction_inversion': {
      if (a) return [a.den, a.num === 0 ? 1 : a.num]; // flip first operand
      if (single) return [single.den, single.num === 0 ? 1 : single.num];
      return slip(problem);
    }

    default:
      // Unknown (skill, misconception) combo → a plausible generic slip.
      return slip(problem);
  }
}

// ---------------------------------------------------------------------------
// Fallback slips — a plausible-but-wrong answer when a misconception does not
// apply structurally. Never returns the CORRECT value.
// ---------------------------------------------------------------------------

/** A generic near-miss fraction slip (off-by-one numerator). Never correct. */
function slip(problem) {
  const c = correctNumDen(problem);
  if (c) {
    const [n, d] = c;
    return [n + 1, d]; // off by one on top — wrong but plausible
  }
  // No flat fraction answer (MULT/COMPARE/etc): emit a tiny wrong fraction.
  return [1, 2];
}

/**
 * A slip for product-valued skills (MULT_*) expressed as a fraction [product,1]
 * so the runner always has a [num,den]. delta nudges off the true product.
 */
function productSlip(problem, delta) {
  const ans = (problem && problem.answer) || {};
  if (typeof ans.product === 'number') {
    const wrong = ans.product + (delta || 1);
    return [wrong, 1];
  }
  return slip(problem);
}

/**
 * Off-task "answer": the learner did not produce a usable answer at all.
 * Exported for the off-task / refuser persona. Always null.
 */
export function offTask() {
  return null;
}
