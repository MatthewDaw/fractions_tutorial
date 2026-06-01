// The lesson map: Babushka's kitchen at the centre, each lesson a neighbour node.
// `built` flags which rooms have a real screen; the rest show an empty room.
// Positions are in the 1280x800 stage coordinate space (node centres).
// `nodeId` connects each room to its engine skill-graph node (KTD11).
export const CENTER = { x: 640, y: 420 };

export const KITCHEN = {
  title: "Babushka's Kitchen",
  sub: "Every recipe leads to a lesson. When a sum gets tricky, the kitchen sends you to the room that teaches it.",
};

// Order = teaching sequence (same → one-already-fits → neither-fits → the
// cross-multiply method → simplify → whole units). `no` is the displayed lesson
// number; the array order is the display order; `pos` lays them clockwise around
// the kitchen in that same order. The room `id` (and its component/intro) is
// stable — only the number/order/position reflect the curriculum.
// `nodeId` is the engine skill-graph node id (graph.ts). It is additive — all
// existing fields (built/intro/pos/no) are preserved unchanged.
export const ROOMS = [
  { id: "r1", nodeId: "ADD_SAME_DEN",       no: 1, title: "Same Denominators", concept: "The bottoms already match — just add the tops.",                         built: true,  pos: { x: 300, y: 220 }, intro: "/intros/r1-same-denominators.html", introDurationMs: 24000, verb: "Adding",      example: "2/7 + 3/7" },
  { id: "r3", nodeId: "ADD_UNLIKE_NESTED",  no: 2, title: "Scale One",         concept: "One bottom already fits the other — rename just one fraction, then add.", built: true,  pos: { x: 980, y: 220 }, intro: "/intros/r3-scale-one.html", introDurationMs: 25000, verb: "Adding",      example: "3/8 + 1/4" },
  { id: "r2", nodeId: "ADD_UNLIKE_COPRIME", no: 3, title: "Cross-Multiply",    concept: "Neither bottom fits — cross-multiply to rename both, then add.",          built: true,  pos: { x: 980, y: 600 }, intro: "/intros/r2-same-size-pieces-v2.html", introDurationMs: 23000, verb: "Adding",      example: "1/2 + 1/3" },
  { id: "r4", nodeId: "SIMPLIFY",           no: 4, title: "Simplify",          concept: "Reduce to the fewest, biggest pieces — lowest terms.",                    built: true,  pos: { x: 640, y: 660 }, intro: "/intros/r4-simplify.html", introDurationMs: 28000, verb: "Simplifying", example: "8/12 → 2/3" },
  { id: "r5", nodeId: "IMPROPER_TO_MIXED",  no: 5, title: "Mixed Numbers",     concept: "Turn an improper fraction into a whole number and a leftover.",           built: true,  pos: { x: 300, y: 600 }, intro: "/intros/r5-mixed-numbers.html", introDurationMs: 22000, verb: "Converting",  example: "9/7 → 1 2/7" },
];
