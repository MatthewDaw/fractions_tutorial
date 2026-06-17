/* kitchen/grade.js — LOCAL grading for Babushka's Kitchen (pure wireframe).
 *
 * No engine, no mastery, no kitchenProgress, no attempt reporting. Given a room
 * (from kitchen/rooms.js) and the child's KitchenAnswer value, decide right/wrong.
 *
 * The room declares the question DATA but not the answer — the correct answer is
 * DERIVED here from the story's numbers (the same numbers the prose states), so
 * the grader and the rooms stay a single source of truth:
 *
 *   integer  → the product / total stated in the story.
 *   fraction → the resulting fraction (added / subtracted / renamed), compared by
 *              value (cross-multiply), so an equivalent unreduced form still counts.
 *   mixed    → an improper fraction (top/bottom) re-expressed as whole + leftover.
 *   compare  → the symbol relating answer.left vs answer.right ("<" | "=" | ">").
 *   choice   → the index of the option whose value equals the target.
 *
 * Value shapes (match KitchenAnswer):
 *   integer  → { int }
 *   fraction → { num, den }
 *   mixed    → { whole, num, den }
 *   compare  → { sym }
 *   choice   → { choiceIdx }
 */

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const intOf = (s) => (s === "" || s == null ? NaN : parseInt(s, 10));
/** value-equal fractions: a/b == c/d (cross-multiply). */
const frEq = (a, b, c, d) => b !== 0 && d !== 0 && a * d === b * c;

/** Parse a "n/d" (or "n") string into a [num, den] pair (den defaults to 1). */
function parseFrac(label) {
  const [n, d] = String(label ?? "").split("/").map((s) => parseInt(s.trim(), 10));
  return [n, Number.isNaN(d) ? 1 : d];
}

/** The comparison symbol relating two "n/d" labels. */
function cmpSymbol(leftLabel, rightLabel) {
  const [ln, ld] = parseFrac(leftLabel);
  const [rn, rd] = parseFrac(rightLabel);
  if (!ld || !rd) return null;
  const a = ln * rd, b = rn * ld;
  return a < b ? "<" : a > b ? ">" : "=";
}

/* ── per-room CORRECT TARGET, derived from the story's numbers ───────────────
 * Keyed by room id. The shape depends on answer.type:
 *   integer  → { int: <number> }
 *   fraction → { num, den }   (compared by VALUE)
 *   mixed    → { num, den }   (the IMPROPER form; any equal whole+leftover passes)
 *   compare/choice are derived from room.answer (left/right/options), not here.
 */
const TARGETS = {
  m1:  { int: 4 * 3 },                 // 4 jars × 3 plums
  m3:  { int: 6 * 4 },                 // 6 jars × 4 cucumbers
  num: { num: 4, den: 7 },             // 4 of 7 slices frosted
  nl:  { num: 5, den: 6 },             // 2/6 + 3/6
  s1:  { num: 4, den: 7 },             // 6/7 − 2/7
  r3:  { num: 3, den: 4 },             // 1/2 + 1/4
  r2:  { num: 5, den: 6 },             // 1/2 + 1/3
  r5:  { num: 7, den: 4 },             // 7/4 → 1 and 3/4 (improper form)
};

/** The grading verdict for a room + child value.
 *  Returns { state: "correct" | "wrong" | "incomplete" }. */
export function gradeRoom(room, value = {}) {
  const answer = (room && room.answer) || {};
  const type = answer.type || "fraction";

  if (type === "integer") {
    const v = intOf(value.int);
    if (Number.isNaN(v)) return { state: "incomplete" };
    const want = TARGETS[room.id]?.int;
    return v === want ? { state: "correct" } : { state: "wrong" };
  }

  if (type === "compare") {
    if (!value.sym) return { state: "incomplete" };
    const want = cmpSymbol(answer.left, answer.right);
    return value.sym === want ? { state: "correct" } : { state: "wrong" };
  }

  if (type === "choice") {
    if (typeof value.choiceIdx !== "number" || value.choiceIdx < 0) return { state: "incomplete" };
    const opts = answer.options || [];
    // The target is the simplest-correct option for this room; derive the index as
    // the option equal-by-value to the room's canonical target fraction.
    const want = TARGETS[room.id] || choiceTargetOf(room);
    const [tn, td] = want.num != null ? [want.num, want.den] : parseFrac(want.label);
    const wantIdx = opts.findIndex((o) => { const [n, d] = parseFrac(o); return frEq(n, d, tn, td); });
    return value.choiceIdx === wantIdx ? { state: "correct" } : { state: "wrong" };
  }

  if (type === "mixed") {
    const w = intOf(value.whole), n = intOf(value.num), d = intOf(value.den);
    if (Number.isNaN(w) || Number.isNaN(n) || Number.isNaN(d) || d <= 0) return { state: "incomplete" };
    const t = TARGETS[room.id];
    if (!t) return { state: "wrong" };
    // child total = w + n/d, expressed over d as (w*d + n)/d; compare by value.
    return frEq(w * d + n, d, t.num, t.den) ? { state: "correct" } : { state: "wrong" };
  }

  // default: fraction — compared by value so an equivalent form still counts.
  const n = intOf(value.num), d = intOf(value.den);
  if (Number.isNaN(n) || Number.isNaN(d) || d <= 0) return { state: "incomplete" };
  const t = TARGETS[room.id];
  if (!t) return { state: "wrong" };
  return frEq(n, d, t.num, t.den) ? { state: "correct" } : { state: "wrong" };
}

/* For the two "tap the equal/simplest fraction" rooms (r4, simp) the correct
 * choice is fixed by the story, not by a numeric add. r4: 2/3 ⇒ 4/6. simp:
 * 6/9 ⇒ 2/3. We return the canonical target fraction; gradeRoom matches the
 * option equal to it by value. */
function choiceTargetOf(room) {
  if (room.id === "r4") return { num: 4, den: 6 };    // 2/3 = 4/6
  if (room.id === "simp") return { num: 2, den: 3 };  // 6/9 = 2/3
  // generic fallback: first option.
  return { label: (room.answer.options || ["0/1"])[0] };
}

// merge the choice targets into TARGETS so both the lookup above and external
// callers see one table.
TARGETS.r4 = { num: 4, den: 6 };
TARGETS.simp = { num: 2, den: 3 };

export { TARGETS };
export default gradeRoom;
