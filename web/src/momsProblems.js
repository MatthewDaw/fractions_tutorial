// momsProblems.js — Babushka's Kitchen question bank for the ADAPTIVE flow.
//
// The kitchen is the assessor / transfer layer over the five rooms. Questions are
// organized BY ROOM SKILL (not a flat list), each room having:
//   mirror[]  — bare real-world checks of THAT room's skill (scratch space, no tools)
//   combine[] — recipes that chain skills from this room + earlier ones
// The look-ahead probe reuses the NEXT room's mirror[0] (see MomsRoom flow).
//
// CURRICULUM is the teaching order (must match the room order in rooms.js):
//   r1 Same Denominators → r3 Scale One → r2 Cross-Multiply → r4 Simplify → r5 Mixed Numbers
// (the room `id`s are historical; the labels here are the source of truth for the
// kitchen's on-screen skill names.)

export const CURRICULUM = ["r1", "r3", "r2", "r4", "r5"];

export const ROOM_SKILL = {
  r1: { no: 1, label: "Same Denominators", blurb: "add the tops, keep the bottom" },
  r3: { no: 2, label: "Scale One",         blurb: "rename one fraction so the bottoms match" },
  r2: { no: 3, label: "Cross-Multiply",    blurb: "rename both to a shared bottom" },
  r4: { no: 4, label: "Simplify",          blurb: "reduce to the fewest, biggest pieces" },
  r5: { no: 5, label: "Mixed Numbers",     blurb: "whole units plus a leftover" },
};

export const CHARACTERS = {
  mom: { label: "Babushka" }, kid: { label: "the Kid" },
  grandpa: { label: "Grandpa" }, cat: { label: "the Cat" },
};

// ── question objects (same shape the renderer/grader already use) ────────────
const Q = {
  // R1 · Same Denominators -----------------------------------------------------
  choc: {
    id: "choc", owner: "kid", prop: "ChocolateBar", initState: "full", solvedState: "squares_snapped",
    caption: "You snapped off three eighths of the chocolate bar, and your brother snapped off two eighths. How much of the bar is gone?",
    ask: "How much is gone?", answerType: "fraction", op: "add", operands: [[3, 8], [2, 8]], target: [5, 8],
    nudgeKey: "mr_mom_nudge_samebottom", banter: ["mr_kid_choc_1", "mr_mom_choc_2", "mr_kid_choc_3"],
  },
  cracker: {
    id: "cracker", owner: "kid", prop: "CrackerSheet", initState: "snap_lines", solvedState: "piece_highlight",
    caption: "The graham sheet snaps into four. You have one fourth, but s'mores need three fourths. How much MORE do you need?",
    ask: "How much more?", answerType: "fraction", op: "add", operands: [[1, 4], [null, 4]], target: [2, 4],
    nudgeKey: "mr_mom_nudge_count", banter: ["mr_kid_cracker_1", "mr_mom_cracker_2", "mr_kid_cracker_3"],
  },
  sausage: {
    id: "sausage", owner: "grandpa", prop: "SausageChain", initState: "counting", solvedState: "wrapped_into_units",
    caption: "Grandpa grilled four ninths of the sausage chain, then added three ninths more. How much is on the plate now?",
    ask: "The total", answerType: "fraction", op: "add", operands: [[4, 9], [3, 9]], target: [7, 9],
    nudgeKey: "mr_mom_nudge_samebottom", banter: ["mr_gp_sausage_1", "mr_mom_sausage_2", "mr_gp_sausage_3"],
  },
  eggs: {
    id: "eggs", owner: "cat", prop: "EggCarton", initState: "cells_full", solvedState: "cell_lifting",
    caption: "Babushka set out a full carton — twelve twelfths of eggs. She used eight twelfths for baking. How many twelfths are left?",
    ask: "How much is left?", answerType: "fraction", op: "sub", operands: [[12, 12], [8, 12]], target: [4, 12],
    nudgeKey: "mr_mom_nudge_op", banter: ["mr_cat_eggs_1", "mr_mom_eggs_2", "mr_cat_eggs_3"],
  },

  // R3 · Scale One (one bottom divides the other) ------------------------------
  doughbacon: {
    id: "doughbacon", owner: "grandpa", prop: "DoughBacon", initState: "sliced", solvedState: "joined",
    caption: "Grandpa has half a strip of dough and one fourth of a strip of bacon. Laid end to end on the ruler, how much is that altogether?",
    ask: "The total", answerType: "fraction", op: "add", operands: [[1, 2], [1, 4]], target: [3, 4],
    nudgeKey: "mr_mom_nudge_scaleone", banter: ["mr_gp_doughbacon_1", "mr_mom_doughbacon_2", "mr_gp_doughbacon_3"],
  },

  // R2 · Cross-Multiply (neither bottom divides the other) ---------------------
  trays: {
    id: "trays", owner: "kid", prop: "SheetCake", propProps: { cuts: 6 }, initState: "cut_n", solvedState: "merging",
    caption: "You cut your tray into halves and Ben cut his into thirds. Babushka needs one half plus one third. How much is that altogether?",
    ask: "The total", answerType: "fraction", op: "add", operands: [[1, 2], [1, 3]], target: [5, 6],
    nudgeKey: "mr_mom_nudge_cross", banter: ["mr_kid_trays_1", "mr_mom_trays_2", "mr_kid_trays_3"],
  },
  candy: {
    id: "candy", owner: "kid", prop: "CandyBars", initState: "recut", solvedState: "matched",
    caption: "One candy bar splits into four, the other into six. You have one fourth and one sixth. How much candy is that in all?",
    ask: "The total", answerType: "fraction", op: "add", operands: [[1, 4], [1, 6]], target: [5, 12],
    nudgeKey: "mr_mom_nudge_cross", banter: ["mr_kid_candy_1", "mr_mom_candy_2", "mr_kid_candy_3"],
  },

  // R4 · Simplify --------------------------------------------------------------
  lunchbox: {
    id: "lunchbox", owner: "kid", prop: "Lunchbox", initState: "pieces_in", solvedState: "lid_closed",
    caption: "Six eighths of a sandwich sits in little pieces. Pack it as the FEWEST, biggest pieces so the lid will close. Write the tidy fraction.",
    ask: "Tidy it down", answerType: "fraction", op: "simplify", target: [3, 4], requireSimplified: true,
    nudgeKey: "mr_mom_nudge_tidy", banter: ["mr_kid_lunchbox_1", "mr_mom_lunchbox_2", "mr_kid_lunchbox_3"],
  },
  carrots: {
    id: "carrots", owner: "grandpa", prop: "Bundles", propProps: { kind: "carrots" }, initState: "bundling", solvedState: "bundled",
    caption: "Six ninths of the carrots are loose. Tie them into the biggest equal bundles. Write the tidy fraction.",
    ask: "Tidy it down", answerType: "fraction", op: "simplify", target: [2, 3], requireSimplified: true,
    nudgeKey: "mr_mom_nudge_tidy", banter: ["mr_gp_carrots_1", "mr_mom_carrots_2", "mr_gp_carrots_3"],
  },
  cookietin: {
    id: "cookietin", owner: "cat", prop: "Bundles", propProps: { kind: "cookies" }, initState: "loose", solvedState: "bundled",
    caption: "Four twelfths of the cookies rattle around loose. Group them into the fewest, biggest equal bundles. Write the tidy fraction.",
    ask: "Tidy it down", answerType: "fraction", op: "simplify", target: [1, 3], requireSimplified: true,
    nudgeKey: "mr_mom_nudge_tidy", banter: ["mr_cat_cookietin_1", "mr_mom_cookietin_2", "mr_cat_cookietin_3"],
  },
  addtidy: {
    id: "addtidy", owner: "kid", prop: "ChocolateBar", initState: "squares_snapped", solvedState: "needed_outline_ghost",
    caption: "First add one eighth plus three eighths. THEN tidy your answer to the fewest, biggest pieces. Two steps!",
    ask: "Add, then tidy", answerType: "fraction", op: "add-then-simplify", operands: [[1, 8], [3, 8]], target: [1, 2], requireSimplified: true,
    nudgeKey: "mr_mom_nudge_tidy", banter: ["mr_kid_addtidy_1", "mr_mom_addtidy_2", "mr_kid_addtidy_3"],
  },

  // R5 · Mixed Numbers ---------------------------------------------------------
  cupcakebox: {
    id: "cupcakebox", owner: "kid", prop: "Boxes", initState: "filling", solvedState: "leftover",
    caption: "You baked fourteen cupcakes and each box holds four. How many full boxes, and how many cupcakes left over?",
    ask: "Boxes + leftover", answerType: "mixed", op: "improper", target: [14, 4],
    nudgeKey: "mr_mom_nudge_mixed", banter: ["mr_kid_cupcakebox_1", "mr_mom_cupcakebox_2", "mr_kid_cupcakebox_3"],
  },
  coolpie: {
    id: "coolpie", owner: "grandpa", prop: "CoolingRack", initState: "empty", solvedState: "holding_wholes",
    caption: "Seven quarter-slices of pie are cooling. Four quarters make one whole pie. How many whole pies, and the leftover?",
    ask: "Wholes + leftover", answerType: "mixed", op: "improper", target: [7, 4],
    nudgeKey: "mr_mom_nudge_mixed", banter: ["mr_gp_coolpie_1", "mr_mom_coolpie_2", "mr_gp_coolpie_3"],
  },
  muffin: {
    id: "muffin", owner: "cat", prop: "EggCarton", initState: "cells_full", solvedState: "fresh_tin_spawned",
    caption: "Nine sixths of muffins came out — a tin holds six. How many whole tins, and how many sixths left over?",
    ask: "Wholes + leftover", answerType: "mixed", op: "improper", target: [9, 6],
    nudgeKey: "mr_mom_nudge_mixed", banter: ["mr_cat_muffin_1", "mr_mom_muffin_2", "mr_cat_muffin_3"],
  },
  halfpie: {
    id: "halfpie", owner: "cat", prop: "Pie", initState: "slices_present", solvedState: "target_shaded",
    caption: "Add three fourths of a pie plus three fourths of a pie. THEN say it as whole pies and a leftover. Two steps!",
    ask: "Add, then mix", answerType: "mixed", op: "add-then-mixed", operands: [[3, 4], [3, 4]], target: [6, 4],
    nudgeKey: "mr_mom_nudge_mixed", banter: ["mr_cat_halfpie_1", "mr_mom_halfpie_2", "mr_cat_halfpie_3"],
  },
};

// The bank, keyed by room id. mirror = mastery checks for that room's skill;
// combine = recipes that chain this room's skill with earlier-mastered ones.
export const BANK = {
  r1: { mirror: [Q.choc, Q.cracker, Q.sausage, Q.eggs], combine: [] },
  r3: { mirror: [Q.doughbacon], combine: [] },
  r2: { mirror: [Q.trays, Q.candy], combine: [] },
  r4: { mirror: [Q.lunchbox, Q.carrots, Q.cookietin], combine: [Q.addtidy] },
  r5: { mirror: [Q.cupcakebox, Q.coolpie, Q.muffin], combine: [Q.halfpie] },
};

// the room taught AFTER `roomId` in the curriculum (the look-ahead target), or null.
export function nextRoomOf(roomId) {
  const i = CURRICULUM.indexOf(roomId);
  return i >= 0 && i + 1 < CURRICULUM.length ? CURRICULUM[i + 1] : null;
}

// ── adaptive flow helpers ────────────────────────────────────────────────────
// A "task" is the concrete question on screen: { roomId, stage, i, q, lookaheadRoom? }.
// enterStage resolves a (roomId, stage, i) into a task, skipping empty stages and
// rolling forward (mirror → combine → look-ahead → next room).
export function enterStage(roomId, stage, i, mastered) {
  if (stage === "mirror") {
    const list = BANK[roomId].mirror;
    if (i < list.length) return { roomId, stage, i, q: list[i] };
    return enterStage(roomId, "combine", 0, mastered);
  }
  if (stage === "combine") {
    const list = BANK[roomId].combine || [];
    if (i < list.length) return { roomId, stage, i, q: list[i] };
    return enterStage(roomId, "lookahead", 0, mastered);
  }
  // look-ahead: probe the NEXT room's first mirror, if that room isn't mastered yet
  const next = nextRoomOf(roomId);
  if (next && !mastered.includes(next)) {
    return { roomId, stage: "lookahead", lookaheadRoom: next, i: 0, q: BANK[next].mirror[0] };
  }
  return firstTask(mastered); // nothing to peek at → move to the next unmastered room
}

// The first task for a given mastery set: the first unmastered room's mirror, or
// null when every room is mastered (the kitchen is finished).
export function firstTask(mastered) {
  const roomId = CURRICULUM.find((r) => !mastered.includes(r));
  return roomId ? enterStage(roomId, "mirror", 0, mastered) : null;
}

// ── grading (unchanged) ──────────────────────────────────────────────────────
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const intOf = (s) => (s === "" || s == null ? NaN : parseInt(s, 10));
const frEq = (a, b, c, d) => b !== 0 && d !== 0 && a * d === b * c;

// Returns { state: 'correct'|'wrong'|'incomplete', stars, slip }.
export function gradeAnswer(p, input) {
  const [tn, td] = p.target;
  if (p.answerType === "mixed") {
    const w = intOf(input.whole), n = intOf(input.num), d = intOf(input.den);
    if (Number.isNaN(w) || Number.isNaN(n) || Number.isNaN(d) || d <= 0) return { state: "incomplete", stars: 0, slip: "fillAll" };
    const value = frEq(w * d + n, d, tn, td);
    if (!value) {
      const wroteImproper = w === 0 && frEq(n, d, tn, td);
      return { state: "wrong", stars: 0, slip: wroteImproper ? "leftoverOnly" : "wrongValue" };
    }
    if (n >= d || w < 1) return { state: "correct", stars: 2, slip: "notMixed" };
    return { state: "correct", stars: 3, slip: null };
  }
  const n = intOf(input.num), d = intOf(input.den);
  if (Number.isNaN(n) || Number.isNaN(d) || n <= 0 || d <= 0) return { state: "incomplete", stars: 0, slip: "fillBoth" };
  if (!frEq(n, d, tn, td)) {
    let slip = "wrongValue";
    if (p.operands && p.operands.length === 2) {
      const [[na, da], [nb, db]] = p.operands;
      if (da && db && d === da + db) slip = "sameBottom";
      if (na != null && nb != null && n === na + nb && d === da + db) slip = "sameBottom";
    }
    return { state: "wrong", stars: 0, slip };
  }
  if (p.requireSimplified && gcd(n, d) !== 1) return { state: "correct", stars: 2, slip: "notSimplified" };
  return { state: "correct", stars: 3, slip: null };
}

export function targetLabel(p) {
  const [tn, td] = p.target;
  if (p.answerType === "mixed") {
    const w = Math.floor(tn / td), r = tn % td;
    return r === 0 ? `${w}` : `${w} ${r}/${td}`;
  }
  const g = gcd(tn, td);
  return `${tn / g}/${td / g}`;
}
