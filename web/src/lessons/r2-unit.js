// r2-unit.js — unit-fraction unlike-denominator lesson; every addend is 1/d;
// anchor 1/2 + 1/3; reuses the existing pre-baked voice clips.

export default {
  // Stylus pivot (proving ground): the child WRITES the answer digits with a
  // stylus instead of typing them. Only enabled here in R2 for now. The fraction
  // bar / + / = stay UI-printed — the child draws numerals only.
  handwriting: true,

  // Skip "Bind" (L2), "Fade" (L4), and "Simplify" (SMP) — r2 goes Manipulate → Ghost → Numbers → Applied.
  skipBeats: ["L2", "L4", "SMP"],

  // Framing knobs read by LessonUnlikeDen so the two lessons stay distinct.
  // Cross-Multiply renames BOTH fractions (the bottoms share nothing), so the
  // numbers-lead beats fold in the ×N/×N CROSSING-ARROWS visual (each fraction
  // multiplied by the OTHER's bottom; the common bottom is the product).
  framing: {
    kind: "crossMultiply",
    crossMultiply: true,
    goalVerb: "rename both",
    pickTitle: "Cut Both",
    pickHint: "Neither bottom fits the other — pick the size both reach (you rename both).",
  },

  anchor: { aNum: 1, aDen: 2, bNum: 1, bDen: 3 },
  bank: [
    { aNum: 1, aDen: 3, bNum: 1, bDen: 4 },
    { aNum: 1, aDen: 2, bNum: 1, bDen: 5 },
    { aNum: 1, aDen: 4, bNum: 1, bDen: 5 },
    { aNum: 1, aDen: 2, bNum: 1, bDen: 4 },
    { aNum: 1, aDen: 2, bNum: 1, bDen: 6 },
    { aNum: 1, aDen: 3, bNum: 1, bDen: 6 },
    { aNum: 1, aDen: 4, bNum: 1, bDen: 8 },
  ],
  // surface_forms: structurally distinct problem shapes for transfer tracking.
  // "unit_halves"   — one addend is 1/2 (the anchor shape)
  // "unit_thirds"   — neither addend is 1/2 (both thirds/quarters/etc.)
  // Both are additive (same operation), structurally distinct (different rename path).
  surface_forms: ["unit_halves", "unit_thirds"],
  voice: { goal: "goal", fullMarks: "fullMarks", sameAs: "sameAs" },

  // Final transfer rung (L7): the bare equation becomes a bare WORD PROBLEM — no
  // strips, no equation, no visuals. The child reads the recipe, works out which
  // two fractions to add, and writes the total with the stylus. Graded by the
  // same exact verifier (the `problem` gives the underlying math). Kitchen-themed
  // unit-fraction unlike-denominator sums, matched to this lesson's bank.
  wordProblems: [
    { caption: "Babushka pours half a cup of milk into the batter, then adds a third of a cup more. How much milk is in the batter now?", problem: { aNum: 1, aDen: 2, bNum: 1, bDen: 3 } },
    { caption: "You frost one fourth of the cake before lunch and one third of it after. How much of the cake is frosted in all?", problem: { aNum: 1, aDen: 4, bNum: 1, bDen: 3 } },
    { caption: "Grandpa grills half of the bratwursts, then one fourth more. How much of the whole batch is grilled?", problem: { aNum: 1, aDen: 2, bNum: 1, bDen: 4 } },
    { caption: "The cat laps up a third of the cream, then sneaks back for one sixth more. How much of the cream is gone?", problem: { aNum: 1, aDen: 3, bNum: 1, bDen: 6 } },
    { caption: "You drink half a glass of lemonade and your friend drinks one fifth of a glass. How much lemonade did you two drink together?", problem: { aNum: 1, aDen: 2, bNum: 1, bDen: 5 } },
  ],
};
