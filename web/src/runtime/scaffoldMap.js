// scaffoldMap.js — Map each lesson's native beats/stages to design scaffold
// levels L0–L4 (ScaffoldLevel type in the engine).
//
// DESIGN SCALE:
//   L0 — max support (manipulatives, full guidance)
//   L1 — heavy support
//   L2 — moderate support (fading manipulatives)
//   L3 — numbers-lead / near-independent (bare equation, hint-free capable)
//   L4 — fully independent (word problem, no cues)
//
// LESSONS COVERED:
//   LessonUnlikeDen  (lessonId "r2" and "r3")  — beats L0, L2, L4, L5, L6, L7
//   AppR1            (lessonId "r1")            — stages 1..5
//   AppR4            (lessonId "r4")            — stages manipulate/bind/fade/numbers/words (1..5)
//   AppR5            (lessonId "r5")            — stages 1-manipulate/2-bind/3-fade/4-numbers/5-words
//
// The mapping is conservative: we assign the LOWEST design level that accurately
// describes the child's scaffold context for independence / transfer purposes.

/**
 * Map a lesson's native beat or stage key to the design scaffold level (0–4).
 *
 * @param {string} lessonId - The room id: "r1", "r2", "r3", "r4", or "r5".
 * @param {string|number} nativeBeat - The beat string (LessonUnlikeDen) or
 *   numeric/string stage (AppR1/R4/R5).
 * @returns {0|1|2|3|4} Design scaffold level.
 */
export function toScaffoldLevel(lessonId, nativeBeat) {
  const id = String(lessonId);
  const beat = String(nativeBeat);

  // ---- LessonUnlikeDen (r2 = Scale One, r3 = Cross-Multiply) ---------------
  // Both use the same beat keys from NEXT_BEAT in LessonUnlikeDen.jsx.
  //
  //   L0 — "blocks lead": drag knife, slice strips (max manipulative support)
  //   L2 — "pick the size": blocks faded to outlines, picker + join by hand
  //   L4 — "new dress": equation leads, blocks are only a check (auto-join)
  //   L5 — "bare + ghost backdrop": just equation, bars linger dimmed
  //   L6 — "bare slate": equation + inputs only, no manipulatives
  //   L7 — "word problem": prose only, stylus answer
  //
  // L1 is not a discrete beat in the UI; L0 is the entry point.
  if (id === 'r2' || id === 'r3') {
    switch (beat) {
      case 'L0': return 0; // blocks are the problem, knife drag
      case 'L2': return 1; // blocks faded to outlines, picker picks
      case 'L4': return 2; // numbers lead, blocks check only
      case 'L5': return 3; // bare equation with ghost backdrop
      case 'L6': return 3; // bare slate — numbers only (=L3)
      case 'L7': return 4; // word problem — fully independent
      default:   return 0;
    }
  }

  // ---- AppR1 (r1 — ADD_SAME_DEN) -------------------------------------------
  // Stages numbered 1–5 (numeric or stage key strings from STAGES array).
  //   1 / "1-manipulate" → L0: blocks are the problem, drag & count
  //   2 / "2-bind"       → L1: merged stack + write fraction
  //   3 / "3-fade"       → L2: blocks dim, equation leads, write changed line
  //   4 / "4-numbers"    → L3: bare equation, write whole fraction
  //   5 / "5-words"      → L4: word problem, no blocks, no equation
  if (id === 'r1') {
    // Normalize: accept numeric stages "1"–"5" or stage-key strings
    const n = parseStageN(beat);
    switch (n) {
      case 1: return 0;
      case 2: return 1;
      case 3: return 2;
      case 4: return 3;
      case 5: return 4;
      default: return 0;
    }
  }

  // ---- AppR4 (r4 — SIMPLIFY) -----------------------------------------------
  // Stage ids: "manipulate" | "bind" | "fade" | "numbers" | "words" (or 1–5)
  if (id === 'r4') {
    const n = parseStageN(beat);
    if (n !== null) {
      switch (n) {
        case 1: return 0;
        case 2: return 1;
        case 3: return 2;
        case 4: return 3;
        case 5: return 4;
        default: return 0;
      }
    }
    // String id form
    switch (beat) {
      case 'manipulate': return 0;
      case 'bind':       return 1;
      case 'fade':       return 2;
      case 'numbers':    return 3;
      case 'words':      return 4;
      default:           return 0;
    }
  }

  // ---- AppR5 (r5 — IMPROPER_TO_MIXED) --------------------------------------
  // Stage ids: "1-manipulate" | "2-bind" | "3-fade" | "4-numbers" | "5-words"
  // or numeric 1–5.
  if (id === 'r5') {
    const n = parseStageN(beat);
    switch (n) {
      case 1: return 0;
      case 2: return 1;
      case 3: return 2;
      case 4: return 3;
      case 5: return 4;
      default: return 0;
    }
  }

  // Unknown lesson — conservative default
  return 0;
}

// ---------------------------------------------------------------------------
// Helper: extract the stage number from a beat string.
// Handles:
//   "1", "2", "3", "4", "5"          → 1..5
//   "1-manipulate", "3-fade", etc.   → leading digit
//   "manipulate", "bind", "fade", etc → null (caller uses string switch)
// ---------------------------------------------------------------------------
function parseStageN(beat) {
  const m = beat.match(/^(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Inverse helper: given a lessonId + design ScaffoldLevel, return the closest
// native beat. Used by useLessonEngine when applying scaffold-entry decisions.
// Returns the beat closest to (but not above) the requested design level.
// ---------------------------------------------------------------------------

/**
 * Find the native beat/stage key for a lesson at (or just below) a target
 * design scaffold level.
 *
 * @param {string} lessonId
 * @param {0|1|2|3|4} designLevel
 * @returns {string} native beat key
 */
export function toBeatForLevel(lessonId, designLevel) {
  const id = String(lessonId);
  const level = Math.max(0, Math.min(4, designLevel));

  if (id === 'r2' || id === 'r3') {
    // Ordered: L0=0, L2=1, L4=2, L5=3, L6=3, L7=4
    if (level <= 0) return 'L0';
    if (level === 1) return 'L2';
    if (level === 2) return 'L4';
    if (level === 3) return 'L6';
    return 'L7';
  }

  if (id === 'r1') {
    return String(level + 1); // 0→"1", 1→"2", ..., 4→"5"
  }

  if (id === 'r4') {
    const map = ['manipulate', 'bind', 'fade', 'numbers', 'words'];
    return map[level] ?? 'manipulate';
  }

  if (id === 'r5') {
    const map = ['1-manipulate', '2-bind', '3-fade', '4-numbers', '5-words'];
    return map[level] ?? '1-manipulate';
  }

  return '1';
}
