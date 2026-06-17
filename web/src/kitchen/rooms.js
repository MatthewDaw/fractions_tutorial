/* kitchen/rooms.js — the DATA source of truth for Babushka's Kitchen.
 *
 * Ported VERBATIM from the wireframe's per-question data files
 * (docs/wireframe/src/screens/kitchen-<id>.js). Each room is pure data — all
 * chrome (topbar, tabs, cook portrait, Babushka, Check, the "Learn it" wall) is
 * rendered by the shared kitchen screen, exactly as in the wireframe.
 *
 * A room object is:
 *   {
 *     id,         // a KITCHEN_ORDER id — supplies № / skill / "Learn it" room
 *     cook,       // "kid" | "grandpa" | "cat" — who brought the problem
 *     story,      // the word problem (HTML ok) — the primary question
 *     recipe,     // the skill blurb for the side panel (HTML ok)
 *     answer,     // { type, … } — see components/kitchen/KitchenAnswer.jsx
 *     tutorLine,  // Babushka's ribbon line
 *     readVox,    // data-vox id for read-aloud
 *   }
 *
 * answer.type ∈ { integer, fraction, mixed, compare, choice }.
 *
 * This module is PURELY ADDITIVE — the existing MomsRoom flow is untouched and
 * does not import this yet. A later pass decides how MomsRoom adopts it.
 */

export const m1 = {
  kind: "kitchen",
  id: "m1",
  cook: "kid",
  story: `The Kid lined up <b>4 jars</b> and dropped <b>3 plums</b> into each one — every jar got the same amount. <b>How many plums went into the jars in all?</b>`,
  recipe: `This recipe uses <b>Lesson 1 · Equal Groups</b> — equal groups of the same size, so multiply the groups by the size.`,
  answer: { type: "integer", lead: "Write the total" },
  tutorLine: `Read it, count the equal groups and how many in each, and write the total.`,
  readVox: "mr_kitchen_m1",
};

export const m3 = {
  kind: "kitchen",
  id: "m3",
  cook: "grandpa",
  story: `Grandpa lines up <b>six jars</b> of pickles on the pantry shelf, and packs <b>four cucumbers</b> into every jar. "All sealed for winter," he says. How many cucumbers did he pack in all?`,
  recipe: `This recipe uses <b>Lesson 2 · Times Facts</b> — equal bundles, so multiply the groups by the size of each.`,
  answer: { type: "integer", lead: "Write the total" },
  tutorLine: `Read it, find the groups and the size of each, and write the total.`,
  readVox: "mr_kitchen_m3",
};

export const den = {
  kind: "kitchen",
  id: "den",
  cook: "grandpa",
  story: `Grandpa cut one pie into <b>fifths</b> and an identical pie into <b>eighths</b>. He wants the bigger slice. <b>Which single piece is smaller — 1/5 or 1/8?</b>`,
  recipe: `This recipe uses <b>Lesson 3 · The Bottom Number</b> — the bigger the bottom number, the more pieces, so each piece is smaller.`,
  answer: { type: "compare", left: "1/5", right: "1/8" },
  tutorLine: `More pieces means smaller pieces — look at the bottom number.`,
  readVox: "mr_kitchen_den",
};

export const num = {
  kind: "kitchen",
  id: "num",
  cook: "kid",
  story: `The Kid cut a cake into <b>seven equal slices</b> and frosted <b>four</b> of them with cherries. <b>What fraction of the cake has cherries?</b>`,
  recipe: `This recipe uses <b>Lesson 4 · The Top Number</b> — the bottom is how many equal slices, the top counts how many are frosted.`,
  answer: { type: "fraction", lead: "Write the fraction" },
  tutorLine: `The bottom is how many slices in all; the top counts the ones with cherries.`,
  readVox: "mr_kitchen_num",
};

export const nl = {
  kind: "kitchen",
  id: "nl",
  cook: "kid",
  story: `The Kid scooped <b>two sixths</b> of the berry basket into the bowl, then tipped in <b>three sixths</b> more. The scoops are the same size — sixths. <b>How much of the basket is in the bowl now?</b>`,
  recipe: `This recipe uses <b>Lesson 5 · Same Denominators</b> — the bottoms already match, so add the tops and keep the bottom.`,
  answer: { type: "fraction", lead: "Write how much in all" },
  tutorLine: `Read it, find the two fractions, and write how much in all.`,
  readVox: "mr_kitchen_nl",
};

export const s1 = {
  kind: "kitchen",
  id: "s1",
  cook: "cat",
  story: `Babushka set out <b>six sevenths</b> of a honey cake on the table. The Cat batted <b>two sevenths</b> of the cake onto the floor. The slices are the same size — sevenths. <b>How much of the cake is left?</b>`,
  recipe: `This recipe uses <b>Lesson 6 · Taking Away</b> — same-size pieces, so subtract the tops and keep the bottom.`,
  answer: { type: "fraction", lead: "Write how much is left" },
  tutorLine: `Read it, find the two fractions, and write how much is left.`,
  readVox: "mr_kitchen_s1",
};

export const r4 = {
  kind: "kitchen",
  id: "r4",
  cook: "cat",
  story: `The Cat's recipe needs <b>two thirds</b> of a jar of honey, but the only spoon left measures in sixths. Babushka asks: which scoop pours out the same amount as <b>2/3</b>?`,
  recipe: `This recipe uses <b>Lesson 7 · Equivalent Fractions</b> — multiply (or divide) the top and bottom by the same number.`,
  answer: { type: "choice", lead: "Tap the equal fraction", options: ["4/6", "3/6", "2/6"] },
  tutorLine: `Multiply the top and bottom of 2/3 by the same number — which scoop matches?`,
  readVox: "mr_kitchen_r4",
};

export const simp = {
  kind: "kitchen",
  id: "simp",
  cook: "kid",
  story: `The Kid filled <b>six ninths</b> of the dumpling tray. Babushka wants the same amount written its simplest way. <b>What is the simplest name for that part of the tray?</b>`,
  recipe: `This recipe uses <b>Lesson 8 · Simplify</b> — divide the top and bottom by their greatest common factor.`,
  answer: { type: "choice", lead: "Tap the simplest name", options: ["2/3", "6/9", "4/6"] },
  tutorLine: `The biggest number that divides both 6 and 9 is 3 — so tap the simplest name.`,
  readVox: "mr_kitchen_simp",
};

export const r3 = {
  kind: "kitchen",
  id: "r3",
  cook: "grandpa",
  story: `Grandpa has <b>half</b> a strip of dough and <b>one fourth</b> of a strip of bacon. Laid end to end on the ruler, how much is that altogether? One bottom already fits — rename the half into fourths first. <b>How much is that altogether?</b>`,
  recipe: `This recipe uses <b>Lesson 9 · Scale One</b> — rename one fraction so the bottoms match, then add the tops.`,
  answer: { type: "fraction", lead: "Write how much in all" },
  tutorLine: `Read it, scale one fraction up so the bottoms match, and write how much in all.`,
  readVox: "mr_kitchen_r3",
};

export const r2 = {
  kind: "kitchen",
  id: "r2",
  cook: "kid",
  story: `You cut your tray into halves and Ben cut his into thirds. Babushka needs <b>one half</b> plus <b>one third</b>. The trays are different sizes — halves and thirds — so rename both over a shared bottom. <b>How much is that altogether?</b>`,
  recipe: `This recipe uses <b>Lesson 10 · Cross-Multiply</b> — rename both fractions over a shared bottom, then add.`,
  answer: { type: "fraction", lead: "Write how much in all" },
  tutorLine: `Read it, find the two fractions, and write how much in all.`,
  readVox: "mr_kitchen_r2",
};

export const r5 = {
  kind: "kitchen",
  id: "r5",
  cook: "grandpa",
  story: `Seven quarter-slices of pie are cooling on the rack — that's <b>7/4</b>, more than one whole pie. Four quarters make one whole pie. Grandpa wants to write it the tidy way. <b>How many whole pies, and how many quarters left over?</b>`,
  recipe: `This recipe uses <b>Lesson 11 · Mixed Numbers</b> — divide the top by the bottom; the answer is the whole and the remainder is the new top.`,
  answer: { type: "mixed", lead: "Write it as a mixed number" },
  tutorLine: `Divide seven by four — how many wholes fit, and how many quarters are left over?`,
  readVox: "mr_kitchen_r5",
};

/* All rooms keyed by id, for O(1) lookup by the dispatcher / screen. */
export const ROOMS = { m1, m3, den, num, nl, s1, r4, simp, r3, r2, r5 };

/* The curriculum order (by lesson number) — drives the step strip and the
 * mastery queue. Landing is the first entry (m1, Equal Groups). */
export const KITCHEN_ORDER = [
  "m1", "m3", "den", "num", "nl", "s1", "r4", "simp", "r3", "r2", "r5",
];

/* The landing pointer — the FIRST skill the kitchen poses (Equal Groups). */
export const LANDING_ID = "m1";
export const landing = m1;

/** Look up a room object by its id (returns undefined if unknown). */
export function roomById(id) {
  return ROOMS[id];
}

export default ROOMS;
