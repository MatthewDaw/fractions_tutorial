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
  // The three-room mult strand is m1 Equal Groups → m2 Baking Trays (arrays /
  // area model) → m3 Times Facts; m2 is the bridge that makes commutativity and
  // distributivity visible (plan 006 §"Level 2"). WorldMap lays out by the
  // per-strand submenu rows now, so per-room `pos` is only retained because a flow
  // test asserts r1.pos; m2 takes the plan-006 `pos:{x:360,y:150}`.
  // Display order (the `no` field) follows the CCSS curriculum:
  //   m1=1 m2=2 m3=3 · nl=4 · r1=5 · s1=6 · cmp=7 · r3=8 · r2=9 · r4=10 · r5=11.
  { id: "m1", nodeId: "MULT_EQUAL_GROUPS",  no: 1,  title: "Equal Groups",      concept: "Same count on every plate — add the group again and again, or multiply.",   built: true,  pos: { x: 180, y: 180 }, intro: "/intros/m1-equal-groups.html",   introDurationMs: 22000, verb: "Multiplying", example: "3 × 4" },
  { id: "m2", nodeId: "MULT_ARRAYS",        no: 2,  title: "Baking Trays",      concept: "Rows and columns make a rectangle — rows times columns, the same either way.", built: true, pos: { x: 360, y: 150 }, intro: "/intros/m2-baking-trays.html",   introDurationMs: 24000, verb: "Multiplying", example: "4 × 6" },
  { id: "m3", nodeId: "MULT_FACTS",         no: 3,  title: "Times Facts",       concept: "Skip-count the jar to the answer, then know it by heart.",                  built: true,  pos: { x: 1100, y: 180 }, intro: "/intros/m3-times-facts.html",    introDurationMs: 24000, verb: "Multiplying", example: "7 × 8" },
  { id: "nl", nodeId: "FRACTION_ON_LINE",   no: 4,  title: "On the Number Line", concept: "A fraction is a NUMBER — one point on the line, found by cutting 0 to 1 into equal parts.", built: true, pos: { x: 1100, y: 80 }, intro: "/intros/nl-number-line.html", introDurationMs: 20000, verb: "Placing",     example: "3/4 on 0→1" },
  { id: "r1", nodeId: "ADD_SAME_DEN",       no: 5,  title: "Same Denominators", concept: "The bottoms already match — just add the tops.",                         built: true,  pos: { x: 1100, y: 420 }, intro: "/intros/r1-same-denominators.html", introDurationMs: 24000, verb: "Adding",      example: "2/7 + 3/7" },
  { id: "s1", nodeId: "SUB_SAME_DEN",       no: 6,  title: "Taking Away",       concept: "Same-size pieces — break the stack, take some off, keep the bottom.",     built: true,  pos: { x: 1100, y: 760 }, intro: "/intros/s1-taking-away.html", introDurationMs: 21000, verb: "Subtracting", example: "5/8 − 2/8" },
  { id: "cmp", nodeId: "COMPARE_BENCHMARK", no: 7,  title: "Compare & Check",   concept: "See which fraction is bigger, and reason about a sum's size from benchmarks.", built: true, pos: { x: 640, y: 760 }, intro: "/intros/cmp-compare-check.html", introDurationMs: 21000, verb: "Comparing",   example: "3/8 < 5/8" },
  { id: "r3", nodeId: "ADD_UNLIKE_NESTED",  no: 8,  title: "Scale One",         concept: "One bottom already fits the other — rename just one fraction, then add.", built: true,  pos: { x: 1100, y: 650 }, intro: "/intros/r3-scale-one.html", introDurationMs: 25000, verb: "Adding",      example: "3/8 + 1/4" },
  { id: "r2", nodeId: "ADD_UNLIKE_COPRIME", no: 9,  title: "Cross-Multiply",    concept: "Neither bottom fits — rename both to equivalent fractions over a common bottom, then add.", built: true,  pos: { x: 640, y: 650 }, intro: "/intros/r2-same-size-pieces-v2.html", introDurationMs: 23000, verb: "Adding",      example: "1/2 + 1/3" },
  { id: "r4", nodeId: "SIMPLIFY",           no: 10, title: "Simplify",          concept: "8/12 and 2/3 are the same amount — divide top and bottom by the same number (that's dividing by 1) to reach its simplest name.",                    built: true,  pos: { x: 180, y: 650 }, intro: "/intros/r4-simplify.html", introDurationMs: 28000, verb: "Simplifying", example: "8/12 → 2/3" },
  { id: "r5", nodeId: "IMPROPER_TO_MIXED",  no: 11, title: "Mixed Numbers",     concept: "Turn an improper fraction into a whole number and a leftover.",           built: true,  pos: { x: 180, y: 420 }, intro: "/intros/r5-mixed-numbers.html", introDurationMs: 22000, verb: "Converting",  example: "9/7 → 1 2/7" },
];

// ---------------------------------------------------------------------------
// STRANDS — the map's top level (added when ten lessons outgrew the single ring).
// ---------------------------------------------------------------------------
// The lesson map is now two-level. The TOP level shows these three "shelf" nodes
// arranged around the kitchen; tapping one opens that strand's lessons (WorldMap
// computes the submenu card row, so the per-room `pos` above is no longer used
// for the top level — it is kept only because a flow test asserts r1.pos).
//
// Grouping is CONTIGUOUS in curriculum order (1–3 · 4–7 · 8–11) so the recipe
// trail still reads as one 1→11 sequence as the child moves shelf to shelf.
// `lessons` lists room ids in teaching order; `pos` is the shelf-node centre in
// the 1280×800 stage space. The three shelves form a triangle around the kitchen
// (640,420): two up top (clearing the title), one centred below.
export const STRANDS = [
  { id: "found",   title: "Counting & Times",     blurb: "Whole-number groups, arrays, and times facts — the floor every fraction stands on.", lessons: ["m1", "m2", "m3"],        pos: { x: 326, y: 250 } },
  { id: "build",   title: "Building Fractions",   blurb: "What a fraction is, and adding or taking away same-size pieces.",    lessons: ["nl", "r1", "s1", "cmp"], pos: { x: 954, y: 250 } },
  { id: "combine", title: "Combining & Renaming", blurb: "Unlike pieces, simplest names, and whole-and-a-bit.",               lessons: ["r3", "r2", "r4", "r5"],  pos: { x: 640, y: 648 } },
];
