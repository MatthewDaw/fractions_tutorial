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
  // Display order (the `no` field), Compare & Check removed:
  //   m1=1 m3=2 · den=3 num=4 nl=5 s1=6 · r4=7 simp=8 r3=9 r2=10 r5=11.
  // nl/s1 have hand-animated intro videos (public/intros/{nl,s1}-*.html)
  // + cue sheets (src/intro{NL,S1}.js), mirroring their lesson manipulatives.
  { id: "m1", nodeId: "MULT_EQUAL_GROUPS",  no: 1,  title: "Equal Groups",      concept: "Same count on every plate — add the group again and again, or multiply.",   built: true,  pos: { x: 180, y: 180 }, intro: "/intros/m1-equal-groups.html",   introDurationMs: 32000, verb: "Multiplying", example: "3 × 4" },
  { id: "m3", nodeId: "MULT_FACTS",         no: 2,  title: "Times Facts",       concept: "Skip-count the jar to the answer, then know it by heart.",                  built: true,  pos: { x: 1100, y: 180 }, intro: "/intros/m3-times-facts.html",    introDurationMs: 38000, verb: "Multiplying", example: "7 × 8" },
  // den + num: "The Bottom/Top Number" — foundational ruler lessons, now renumbered
  // to their final curriculum slots (3 and 4) following the wireframe's shelf-build
  // spec (shelf · Lessons 3–7). Previously provisional at 11 and 12.
  { id: "den", nodeId: "FRACTION_ON_LINE",  no: 3,  title: "The Bottom Number",  concept: "Split a ruler into equal pieces — and discover that a bigger bottom number makes each piece smaller.", built: true, pos: { x: 960, y: 80 }, intro: "/intros/den-bottom-number.html", introDurationMs: 26000, verb: "Denominator", example: "1/8 < 1/3" },
  { id: "num", nodeId: "FRACTION_ON_LINE",  no: 4,  title: "The Top Number",     concept: "Shade pieces on the ruler — the top number counts how many are filled — then read and write the fraction.", built: true, pos: { x: 1180, y: 80 }, intro: "/intros/num-top-number.html", introDurationMs: 26000, verb: "Numerator", example: "5/8" },  { id: "nl", nodeId: "FRACTION_ON_LINE",   no: 5,  title: "Same Denominators", concept: "Place a fraction on the number line by growing it from unit pieces — then add fractions that share a bottom.", built: true, pos: { x: 1100, y: 80 }, intro: "/intros/nl-number-line.html", introDurationMs: 45000, verb: "Line → Add", example: "2/7 + 3/7" },
  { id: "s1", nodeId: "SUB_SAME_DEN",       no: 6,  title: "Taking Away",       concept: "Same-size pieces — break the stack, take some off, keep the bottom.",     built: true,  pos: { x: 1100, y: 760 }, intro: "/intros/s1-taking-away.html", introDurationMs: 25000, verb: "Subtracting", example: "5/8 − 2/8" },
  { id: "r4", nodeId: "SIMPLIFY",           no: 7,  title: "Equivalent Fractions", concept: "The same amount has many names. Cut each cell in two (1/3 = 2/6) or three (1/3 = 3/9) and hunt for every equivalent.", built: true, pos: { x: 180, y: 650 }, intro: "/intros/r4-simplify.html", introDurationMs: 31000, verb: "Equivalents", example: "1/3 = 2/6 = 3/9" },
  // r3/r2/r5 — combine shelf (Compare & Check removed): r4=7, simp=8,
  // r3=9, r2=10, r5=11.
  { id: "r3", nodeId: "ADD_UNLIKE_NESTED",  no: 9, title: "Scale One",         concept: "One bottom already fits the other — rename one fraction, add, then simplify the answer.", built: true,  pos: { x: 1100, y: 650 }, intro: "/intros/r3-scale-one.html", introDurationMs: 31000, verb: "Adding",      example: "1/6 + 1/3 → 1/2" },
  { id: "r2", nodeId: "ADD_UNLIKE_COPRIME", no: 10, title: "Cross-Multiply",    concept: "Neither bottom fits — rename both over a common bottom, add, then simplify the answer.", built: true,  pos: { x: 640, y: 650 }, intro: "/intros/r2-same-size-pieces-v2.html", introDurationMs: 24000, verb: "Adding",      example: "3/10 + 1/6 → 7/15" },
  { id: "r5", nodeId: "IMPROPER_TO_MIXED",  no: 11, title: "Mixed Numbers",     concept: "Turn an improper fraction into a whole number and a leftover.",           built: true,  pos: { x: 180, y: 420 }, intro: "/intros/r5-mixed-numbers.html", introDurationMs: 25000, verb: "Converting",  example: "9/7 → 1 2/7" },
  // r1 — "Same Denominators" (adding): still accessible as a direct route but kept
  // out of the top-level shelf strands; its content is merged into the nl lesson
  // per the wireframe's shelf-build design (nl lesson 6 covers both number-line
  // placement and same-denominator addition in a combined step strip).
  { id: "r1", nodeId: "ADD_SAME_DEN",       no: null, title: "Same Denominators", concept: "The bottoms already match — just add the tops.",                       built: true,  pos: { x: 1100, y: 420 }, intro: "/intros/r1-same-denominators.html", introDurationMs: 26000, verb: "Adding",      example: "2/7 + 3/7" },
  // simp — "Simplify" (NEW lesson, AppSimp.jsx, route #/simp). The child bundles
  // cells back together (÷) to reach the simplest name — the inverse of Equivalent
  // Fractions. Rides the same engine node as r4 (SIMPLIFY) with its own lesson id
  // "simp" so scaffold events are keyed separately. Position is provisional.
  { id: "simp", nodeId: "SIMPLIFY",          no: 8,    title: "Simplify",           concept: "Run equivalence backwards — bundle cells together to write the same amount with the fewest pieces.", built: true, pos: { x: 340, y: 650 }, intro: "/intros/simp-simplify.html", introDurationMs: 35000, verb: "Simplest", example: "8/12 → 2/3" },
];

// ---------------------------------------------------------------------------
// STRANDS — the map's top level (added when ten lessons outgrew the single ring).
// ---------------------------------------------------------------------------
// The lesson map is now two-level. The TOP level shows these three "shelf" nodes
// arranged around the kitchen; tapping one opens that strand's lessons (WorldMap
// computes the submenu card row, so the per-room `pos` above is no longer used
// for the top level — it is kept only because a flow test asserts r1.pos).
//
// Grouping is CONTIGUOUS in curriculum order (1–2 · 3–6 · 7–10) so the recipe
// trail still reads as one 1→10 sequence as the child moves shelf to shelf.
// `lessons` lists room ids in teaching order; `pos` is the shelf-node centre in
// the 1280×800 stage space. The three shelves form a triangle around the kitchen
// (640,420): two up top (clearing the title), one centred below.
export const STRANDS = [
  { id: "found",   title: "Counting & Times",     blurb: "Whole-number groups — the floor every fraction stands on.",                              lessons: ["m1", "m3"],                       pos: { x: 326, y: 250 } },
  { id: "build",   title: "Building Fractions",   blurb: "What the two numbers in a fraction mean, then adding or taking away same-size pieces.", lessons: ["den", "num", "nl", "s1"],         pos: { x: 954, y: 250 } },
  { id: "combine", title: "Combining & Renaming", blurb: "Unlike pieces, equivalent names, and whole-and-a-bit.",                                  lessons: ["r4", "simp", "r3", "r2", "r5"], pos: { x: 640, y: 648 } },
];
