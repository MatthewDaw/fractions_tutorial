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
// LESSONS COVERED (arc = …Fade, Ghost, Numbers, Simplify, Applied, Words):
//   LessonUnlikeDen  (lessonId "r2" and "r3")  — beats L0, L2, L4, L5, L6, SMP, LA, L7
//   AppR1            (lessonId "r1")            — stages 1..7 (4=Workbench, 6=Applied)
//   AppR4            (lessonId "r4")            — manipulate/bind/fade/numbers/applied/words (no Workbench)
//   AppR5            (lessonId "r5")            — 1-identify/2-fill/3-read/4-wholes/5-back/6-numbers/practice
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

  // ---- NEW: the mandatory free-form "show your work" step ------------------
  // An ADDITIVE step that sits BETWEEN Applied (L3) and Words (L4) in every
  // lesson that adopts it. The surface is a 100% blank slate (no slots, no
  // recognizer, no grading), so there is no answer to score. We treat it as the
  // same independence level as Applied (L3): the support is gone but the child
  // is still on a posed problem, not free transfer. Recognized for ALL lessons
  // by a string key so adopting it never renumbers a lesson's numeric stages.
  // Lessons that have NOT adopted it (e.g. M1) simply never pass this key, so
  // their existing mapping is untouched and nothing crashes.
  if (beat === 'showwork' || beat === 'show-work' || beat === 'show_work') return 3;

  // ---- LessonUnlikeDen (r2 = Scale One, r3 = Cross-Multiply) ---------------
  // Both use the same beat keys from NEXT_BEAT in LessonUnlikeDen.jsx.
  //
  //   L0  — "blocks lead": drag knife, slice strips (max manipulative support)
  //   L2  — "pick the size": blocks faded to outlines, picker + join by hand
  //   L4  — "new dress": equation leads, blocks are only a check (auto-join)
  //   L5  — "bare + ghost backdrop": just equation, bars linger dimmed
  //   L6  — "bare slate": equation + inputs only, no manipulatives
  //   SMP — "simplify": static demo of GCF reduction (3/10 + 1/6 = 14/30 → 7/15)
  //   LA  — "applied": worded question, numerals shown
  //   L7  — "word problem": prose only, stylus answer
  //
  // L1 is not a discrete beat in the UI; L0 is the entry point.
  if (id === 'r2' || id === 'r3') {
    switch (beat) {
      case 'L0':  return 0; // blocks are the problem, knife drag
      case 'L2':  return 1; // blocks faded to outlines, picker picks
      case 'L4':  return 2; // numbers lead, blocks check only
      case 'L5':  return 3; // bare equation with ghost backdrop
      case 'L6':  return 3; // bare slate — numbers only (=L3)
      case 'SMP': return 3; // simplify demo — GCF reduction, near-independent
      case 'LA':  return 3; // Applied — worded, numerals shown (numbers handed in)
      case 'L7':  return 4; // word problem — fully independent
      default:    return 0;
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
    // Normalize: accept numeric stages "1"–"7" or stage-key strings.
    // 7-stage arc: 1 Manipulate, 2 Bind, 3 Fade, 4 Workbench, 5 Numbers,
    // 6 Applied, 7 Words.
    const n = parseStageN(beat);
    switch (n) {
      case 1: return 0;
      case 2: return 1;
      case 3: return 2;
      case 4: return 1; // Workbench — block sandbox (manipulative support)
      case 5: return 3; // Numbers — bare equation
      case 6: return 3; // Applied — worded, numerals shown (numbers handed in)
      case 7: return 4; // Words — fully independent
      default: return 0;
    }
  }

  // ---- AppM1/M2/M3 (multiplication foundations) ----------------------------
  // r1-style numeric-prefixed keys "1-manipulate" … "7-words". 7-stage arc:
  // 1 Manipulate, 2 Bind, 3 Fade, 4 Workbench, 5 Numbers, 6 Applied, 7 Words.
  // scaffold_ladder arc = 0,1,2,1,3,3,4 (Workbench=L1, Applied=L3). m2 (Baking
  // Trays / Arrays) shares the IDENTICAL shape (R-M1/R-M2).
  if (id === 'm1' || id === 'm2' || id === 'm3') {
    const n = parseStageN(beat);
    switch (n) {
      case 1: return 0;
      case 2: return 1;
      case 3: return 2;
      case 4: return 1; // Workbench — manipulative-backed build (support)
      case 5: return 3; // Numbers — bare expression
      case 6: return 3; // Applied — worded, numerals shown (setup gate)
      case 7: return 4; // Words — fully independent
      default: return 0;
    }
  }

  // ---- AppR4 (r4 — SIMPLIFY) -----------------------------------------------
  // Stage ids: "manipulate" | "bind" | "fade" | "numbers" | "words" (or 1–5)
  if (id === 'r4') {
    // 6-stage arc: manipulate, bind, fade, numbers, applied, words.
    const n = parseStageN(beat);
    if (n !== null) {
      switch (n) {
        case 1: return 0;
        case 2: return 1;
        case 3: return 2;
        case 4: return 3; // numbers
        case 5: return 3; // applied — worded, fraction shown
        case 6: return 4; // words
        default: return 0;
      }
    }
    // String id form
    switch (beat) {
      case 'manipulate': return 0;
      case 'bind':       return 1;
      case 'fade':       return 2;
      case 'numbers':    return 3;
      case 'applied':    return 3; // worded, the fraction is shown (numbers handed in)
      case 'words':      return 4;
      default:           return 0;
    }
  }

  // ---- AppR5 (r5 — IMPROPER_TO_MIXED) --------------------------------------
  // Stage ids: "1-identify" | "2-fill" | "3-read" | "4-wholes" | "5-back" |
  // "6-numbers" | "practice"
  // 7-stage arc: Identify(L0), Fill a Whole(L0), Read(L1), How Many Wholes(L2),
  // The Other Way(L3), Numbers(L3), Practice(L4).
  if (id === 'r5') {
    switch (beat) {
      case '1-identify': return 0;  // count strip, fill fraction
      case '2-fill':     return 0;  // see d/d = 1 whole
      case '3-read':     return 1;  // read mixed number off strip
      case '4-wholes':   return 2;  // 11/4 strip, count wholes
      case '5-back':     return 3;  // reverse: mixed → improper
      case '6-numbers':  return 3;  // no picture, both directions
      case 'practice':   return 4;  // auto-generated
      default:           return 0;
    }
  }

  // ---- AppSimp (simp — SIMPLIFY, new lesson) ---------------------------------
  // Stage ids: identify | bundle | lowest | bigbundle | pick | numbers | practice
  // 7-stage arc: Identify(L0), Bundle(L0), Lowest Terms(L1), Big Bundle(L2),
  // Pick(L3), Numbers(L3), Practice(L4).
  if (id === 'simp') {
    switch (beat) {
      case 'identify':   return 0; // MC naming — max support
      case 'bundle':     return 0; // drag ÷2 one step
      case 'lowest':     return 1; // drag to lowest terms
      case 'bigbundle':  return 2; // pick GCF, one move
      case 'pick':       return 3; // MC pick simplest pair
      case 'numbers':    return 3; // bare slate, no picture
      case 'practice':   return 4; // auto-generated
      default:           return 0;
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
    // L0..L4 → Manipulate(1)/Bind(2)/Fade(3)/Numbers(5)/Words(7) in the 7-stage arc
    const map = ['1', '2', '3', '5', '7'];
    return map[level] ?? '1';
  }

  if (id === 'm1' || id === 'm2' || id === 'm3') {
    // L0..L4 → Manipulate/Bind/Fade/Numbers/Words; Workbench(L1) and Applied(L3)
    // are reachable only by sequential play or the header selector (R-M2).
    const map = ['1-manipulate', '2-bind', '3-fade', '5-numbers', '7-words'];
    return map[level] ?? '1-manipulate';
  }

  if (id === 'r4') {
    const map = ['manipulate', 'bind', 'fade', 'numbers', 'words'];
    return map[level] ?? 'manipulate';
  }

  if (id === 'r5') {
    // L0→Identify, L1→Read, L2→How Many Wholes, L3→Numbers, L4→Practice
    const map = ['1-identify', '3-read', '4-wholes', '6-numbers', 'practice'];
    return map[level] ?? '1-identify';
  }

  if (id === 'simp') {
    // L0→identify, L1→lowest, L2→bigbundle, L3→numbers, L4→practice
    const map = ['identify', 'lowest', 'bigbundle', 'numbers', 'practice'];
    return map[level] ?? 'identify';
  }

  return '1';
}
