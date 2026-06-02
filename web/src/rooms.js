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
  // Multiplication foundations (plan 006) — displayed lessons 1–2, strictly
  // upstream of the fraction strand. Whole-number objects (no denomTone).
  //
  // LAYOUT (8 rooms, 3-2-3 ring around the centred kitchen at 640,420; cards are
  // 250px wide and CENTRE-anchored, so `pos` is the card centre):
  //   top row    (y 180): m1 left(180) · m3 right(1100)
  //   middle row (y 420): r5 left(180) · [kitchen] · r1 right(1100)
  //   bottom row (y 650): r4 left(180) · r2 centre(640) · r3 right(1100)
  // The two foundations sit across the top; the fraction strand wraps down the
  // right, across the bottom, and up the left. The title (top-centre) clears the
  // top row and the kitchen label clears the middle. (Layout is pending the hub
  // redesign — positions below are interim.)
  // Display order (the `no` field) follows the CCSS curriculum:
  //   m1=1 m3=2 · nl=3 · r1=4 · s1=5 · cmp=6 · r3=7 · r2=8 · r4=9 · r5=10.
  // The three new rooms (nl/s1/cmp) have NO intro video — `intro` is omitted, so
  // Shell opens the lesson directly. Their `pos` are picked to not overlap the
  // existing 3-2-3 ring (250px-wide, centre-anchored cards).
  { id: "m1", nodeId: "MULT_EQUAL_GROUPS",  no: 1,  title: "Equal Groups",      concept: "Same count on every plate — add the group again and again, or multiply.",   built: true,  pos: { x: 180, y: 180 }, intro: "/intros/m1-equal-groups.html",   introDurationMs: 22000, verb: "Multiplying", example: "3 × 4" },
  { id: "m3", nodeId: "MULT_FACTS",         no: 2,  title: "Times Facts",       concept: "Skip-count the jar to the answer, then know it by heart.",                  built: true,  pos: { x: 1100, y: 180 }, intro: "/intros/m3-times-facts.html",    introDurationMs: 24000, verb: "Multiplying", example: "7 × 8" },
  { id: "nl", nodeId: "FRACTION_ON_LINE",   no: 3,  title: "On the Number Line", concept: "A fraction is a NUMBER — one point on the line, found by cutting 0 to 1 into equal parts.", built: true, pos: { x: 1100, y: 80 },  verb: "Placing",     example: "3/4 on 0→1" },
  { id: "r1", nodeId: "ADD_SAME_DEN",       no: 4,  title: "Same Denominators", concept: "The bottoms already match — just add the tops.",                         built: true,  pos: { x: 1100, y: 420 }, intro: "/intros/r1-same-denominators.html", introDurationMs: 24000, verb: "Adding",      example: "2/7 + 3/7" },
  { id: "s1", nodeId: "SUB_SAME_DEN",       no: 5,  title: "Taking Away",       concept: "Same-size pieces — break the stack, take some off, keep the bottom.",     built: true,  pos: { x: 1100, y: 760 }, verb: "Subtracting", example: "5/8 − 2/8" },
  { id: "cmp", nodeId: "COMPARE_BENCHMARK", no: 6,  title: "Compare & Check",   concept: "See which fraction is bigger, and reason about a sum's size from benchmarks.", built: true, pos: { x: 640, y: 760 },  verb: "Comparing",   example: "3/8 < 5/8" },
  { id: "r3", nodeId: "ADD_UNLIKE_NESTED",  no: 7,  title: "Scale One",         concept: "One bottom already fits the other — rename just one fraction, then add.", built: true,  pos: { x: 1100, y: 650 }, intro: "/intros/r3-scale-one.html", introDurationMs: 25000, verb: "Adding",      example: "3/8 + 1/4" },
  { id: "r2", nodeId: "ADD_UNLIKE_COPRIME", no: 8,  title: "Cross-Multiply",    concept: "Neither bottom fits — rename both to equivalent fractions over a common bottom, then add.", built: true,  pos: { x: 640, y: 650 }, intro: "/intros/r2-same-size-pieces-v2.html", introDurationMs: 23000, verb: "Adding",      example: "1/2 + 1/3" },
  { id: "r4", nodeId: "SIMPLIFY",           no: 9,  title: "Simplify",          concept: "8/12 and 2/3 are the same amount — divide top and bottom by the same number (that's dividing by 1) to reach its simplest name.",                    built: true,  pos: { x: 180, y: 650 }, intro: "/intros/r4-simplify.html", introDurationMs: 28000, verb: "Simplifying", example: "8/12 → 2/3" },
  { id: "r5", nodeId: "IMPROPER_TO_MIXED",  no: 10, title: "Mixed Numbers",     concept: "Turn an improper fraction into a whole number and a leftover.",           built: true,  pos: { x: 180, y: 420 }, intro: "/intros/r5-mixed-numbers.html", introDurationMs: 22000, verb: "Converting",  example: "9/7 → 1 2/7" },
];
