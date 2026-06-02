// hints.js — a short hint LADDER per skill for the generated practice stage.
//
// These are real hints (a strategy reminder, then a concrete first step) — NOT the
// answer. Using a hint is recorded as hint_max_rung on the attempt, so the engine's
// independence gate and hint_dependence dimension get real signal: a hinted correct
// is not hint-free, so it does NOT count toward the clean-correct fade streak or
// toward scaffold-independence. That is the point — leaning on hints should slow the
// climb and keep the gate honest (the false-positive guard the brief demands).
//
// Rung 1 = the method; rung 2 = a concrete first move. Kept generic across a skill's
// variations so they never leak the specific numbers.
const HINTS = {
  ADD_SAME_DEN: [
    "The bottoms already match. Keep the bottom number and add only the tops.",
    "Write the same bottom; the new top is the two tops added together.",
  ],
  ADD_UNLIKE_COPRIME: [
    "Different bottoms — give them the same bottom first, then add only the tops.",
    "Multiply the two bottoms to get a shared bottom; rename each top to match.",
  ],
  ADD_UNLIKE_NESTED: [
    "One bottom fits into the other. Scale the smaller fraction up to the bigger bottom.",
    "Multiply the smaller fraction's top and bottom by the same number, then add the tops.",
  ],
  SIMPLIFY: [
    "Find a number that divides BOTH the top and the bottom.",
    "Divide the top and the bottom by that shared number; repeat until nothing divides both.",
  ],
  IMPROPER_TO_MIXED: [
    "How many whole groups of the bottom fit inside the top?",
    "That count is the whole number; whatever is left over is the new top.",
  ],
  SUB_SAME_DEN: [
    "The bottoms match. Keep the bottom and subtract only the tops.",
    "Write the same bottom; the new top is the first top minus the second.",
  ],
  FRACTION_ON_LINE: [
    "Split each whole into the bottom-number of equal steps.",
    "Count that many steps up from zero — the top tells you how many steps.",
  ],
  MULT_EQUAL_GROUPS: [
    "It's that many equal groups. Count up by the group size.",
    "Skip-count by the second number, once for each group.",
  ],
  MULT_FACTS: [
    "Think of it as that many equal groups, or skip-count.",
    "If one factor is 0 the answer is 0; if it's 1 the answer is the other factor.",
  ],
  COMPARE_BENCHMARK: [
    "Compare each fraction to a half first.",
    "More than half the bottom on top → bigger than ½; less → smaller.",
  ],
};

/** The hint rungs for a skill (possibly empty). */
export function hintsFor(skill) {
  return HINTS[skill] || [];
}
