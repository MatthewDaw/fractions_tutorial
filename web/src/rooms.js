// The lesson map: Babushka's kitchen at the centre, each lesson a neighbour node.
// `built` flags which rooms have a real screen; the rest show an empty room.
// Positions are in the 1280x800 stage coordinate space (node centres).
// `nodeId` connects each room to its engine skill-graph node (KTD11).
export const CENTER = { x: 640, y: 420 };

export const KITCHEN = {
  title: "Babushka's Kitchen",
};

// Order = teaching sequence (same → one-already-fits → neither-fits → the
// cross-multiply method → simplify → whole units). `no` is the displayed lesson
// number; the array order is the display order; `pos` lays them clockwise around
// the kitchen in that same order. The room `id` (and its component/intro) is
// stable — only the number/order/position reflect the curriculum.
// `nodeId` is the engine skill-graph node id (graph.ts). It is additive — all
// existing fields (built/intro/pos/no) are preserved unchanged.
export const ROOMS = [
  // Multiplication foundations (plan 006) — displayed lessons 1–3, strictly
  // upstream of the fraction strand. Whole-number objects (no denomTone).
  //
  // LAYOUT (8 rooms, 3-2-3 ring around the centred kitchen at 640,420; cards are
  // 250px wide and CENTRE-anchored, so `pos` is the card centre):
  //   top row    (y 180): m1 left(180) · m2 centre(640) · m3 right(1100)
  //   middle row (y 420): r5 left(180) · [kitchen] · r1 right(1100)
  //   bottom row (y 650): r4 left(180) · r2 centre(640) · r3 right(1100)
  // The three foundations sit across the top; the fraction strand wraps down the
  // right, across the bottom, and up the left — `no` runs 1–8 clockwise. The title
  // (top-centre) clears the top row and the kitchen label clears the middle.
  { id: "m1", nodeId: "MULT_EQUAL_GROUPS",  no: 1, title: "Equal Groups",      concept: "Same count on every plate — add the group again and again, or multiply.",   built: true,  pos: { x: 180, y: 180 }, intro: "/intros/m1-equal-groups.html",   introDurationMs: 22000, verb: "Multiplying", example: "3 × 4" },
  { id: "m2", nodeId: "MULT_ARRAYS",        no: 2, title: "Baking Trays",      concept: "A rectangle of rows and columns — same total either way.", built: true, pos: { x: 640, y: 180 }, intro: "/intros/m2-baking-trays.html",   introDurationMs: 24000, verb: "Multiplying", example: "4 × 6" },
  { id: "m3", nodeId: "MULT_FACTS",         no: 3, title: "Times Facts",       concept: "Skip-count the jar to the answer, then know it by heart.",                  built: true,  pos: { x: 1100, y: 180 }, intro: "/intros/m3-times-facts.html",    introDurationMs: 24000, verb: "Multiplying", example: "7 × 8" },
  { id: "r1", nodeId: "ADD_SAME_DEN",       no: 4, title: "Same Denominators", concept: "The bottoms already match — just add the tops.",                         built: true,  pos: { x: 1100, y: 420 }, intro: "/intros/r1-same-denominators.html", introDurationMs: 24000, verb: "Adding",      example: "2/7 + 3/7" },
  { id: "r3", nodeId: "ADD_UNLIKE_NESTED",  no: 5, title: "Scale One",         concept: "One bottom already fits the other — rename just one fraction, then add.", built: true,  pos: { x: 1100, y: 650 }, intro: "/intros/r3-scale-one.html", introDurationMs: 25000, verb: "Adding",      example: "3/8 + 1/4" },
  { id: "r2", nodeId: "ADD_UNLIKE_COPRIME", no: 6, title: "Cross-Multiply",    concept: "Neither bottom fits — cross-multiply to rename both, then add.",          built: true,  pos: { x: 640, y: 650 }, intro: "/intros/r2-same-size-pieces-v2.html", introDurationMs: 23000, verb: "Adding",      example: "1/2 + 1/3" },
  { id: "r4", nodeId: "SIMPLIFY",           no: 7, title: "Simplify",          concept: "8/12 and 2/3 are the same amount — divide top and bottom by the same number (that's dividing by 1) to reach its simplest name.",                    built: true,  pos: { x: 180, y: 650 }, intro: "/intros/r4-simplify.html", introDurationMs: 28000, verb: "Simplifying", example: "8/12 → 2/3" },
  { id: "r5", nodeId: "IMPROPER_TO_MIXED",  no: 8, title: "Mixed Numbers",     concept: "Turn an improper fraction into a whole number and a leftover.",           built: true,  pos: { x: 180, y: 420 }, intro: "/intros/r5-mixed-numbers.html", introDurationMs: 22000, verb: "Converting",  example: "9/7 → 1 2/7" },
];
