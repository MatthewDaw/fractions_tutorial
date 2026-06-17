// r3-nonunit.js — Lesson 2 · SCALE ONE (non-unit-numerator, one-already-fits
// unlike denominators). At least one addend n/d with n>1; anchor 3/8 + 1/4 = 5/8,
// where 4 already divides 8, so ONE fraction is renamed and the other stays put.
// Some bank sums exceed 1 (kept improper on purpose — they seed the later
// improper->mixed room). This lesson drives LessonUnlikeDen with the Scale-One
// framing (rename JUST one); its sibling r2-unit.js carries Cross-Multiply.

export default {
  // The whole arc writes on the stylus Slate from Stage 2 (Bind) onward.
  handwriting: true,

  // Skip "Bind" (L2) and "Fade" (L4) — r3 goes straight from Manipulate to Ghost.
  skipBeats: ["L2", "L4"],

  // Framing knobs read by LessonUnlikeDen so the two lessons stay distinct.
  // Scale One renames ONE fraction (the smaller-block one already fits the
  // bigger), so there is NO crossing-arrows visual — just a single ×N rename.
  framing: {
    kind: "scaleOne",
    crossMultiply: false,
    goalVerb: "rename just one",
    pickTitle: "Match the Sizes",
    pickHint: "One strip already fits the other — pick the size both can be (you only have to rename one).",
  },

  anchor: { aNum: 3, aDen: 8, bNum: 1, bDen: 4 },
  bank: [
    { aNum: 2, aDen: 3, bNum: 3, bDen: 4 },
    { aNum: 5, aDen: 6, bNum: 1, bDen: 3 },
    { aNum: 1, aDen: 2, bNum: 3, bDen: 8 },
    { aNum: 3, aDen: 4, bNum: 4, bDen: 5 },
    { aNum: 2, aDen: 3, bNum: 5, bDen: 6 },
    { aNum: 2, aDen: 5, bNum: 3, bDen: 10 },
    { aNum: 3, aDen: 4, bNum: 5, bDen: 8 },
  ],
  // surface_forms: structurally distinct problem shapes for transfer tracking.
  // "scale_one_eights" — anchor shape (denominator 8, one addend quarters)
  // "scale_one_thirds" — non-eights shape (thirds/sixths, fifths/tenths, etc.)
  // Both are additive (rename-one), structurally distinct (different denominator family).
  surface_forms: ["scale_one_eights", "scale_one_thirds"],
  voice: { goal: "r3Goal", fullMarks: "r3FullMarks", sameAs: "r3SameAs" },

  // Final transfer rung (Stage 5 · WORD PROBLEM): no strips, no equation — the
  // child reads the recipe, finds the two fractions, and writes the total on the
  // Slate. Graded by the same exact verifier (the `problem` carries the math).
  // Scale-One stories: ONE bottom already divides the other (no cross-multiply).
  wordProblems: [
    { caption: "Babushka rolls out three eighths of the dough, then one fourth more. How much of the dough is rolled out now?", problem: { aNum: 3, aDen: 8, bNum: 1, bDen: 4 } },
    { caption: "You sweep half the kitchen floor before dinner and three eighths of it after. How much of the floor is swept in all?", problem: { aNum: 1, aDen: 2, bNum: 3, bDen: 8 } },
    { caption: "Grandpa fills five sixths of the jar with jam, then one third of a jar more into a second jar. How much jam, in jars, did he pour?", problem: { aNum: 5, aDen: 6, bNum: 1, bDen: 3 } },
    { caption: "The dog eats two fifths of its bowl in the morning and three tenths of it at noon. How much of the bowl is eaten?", problem: { aNum: 2, aDen: 5, bNum: 3, bDen: 10 } },
    { caption: "You frost three fourths of the cake, then your sister adds five eighths of a cake's worth onto the cupcakes. How much frosting, in cakes, did you both use?", problem: { aNum: 3, aDen: 4, bNum: 5, bDen: 8 } },
  ],
};
