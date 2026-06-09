// multArrays.js — MULT_ARRAYS (m2): a baking tray of r rows × c columns = r*c.
//
// Surface forms: 'upright' (rows <= cols, the natural "r rows of c") vs 'rotated'
// (rows > cols — the SAME tray spun 90°, the commutativity check). Solving both
// proves the child reads rows × columns either way (the area-model takeaway) rather
// than memorizing one orientation.
import { rngFor, randInt, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'MULT_ARRAYS';
export const SURFACE_FORMS = ['upright', 'rotated'];

const RANGE = [
  [2, 5],  // tier 0 — friendly trays
  [2, 7],  // tier 1
  [2, 9],  // tier 2 — the hard-fact cluster (e.g. 7×9)
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const [lo, hi] = RANGE[tier];

  let rows = randInt(rng, lo, hi);
  let cols = randInt(rng, lo, hi);
  // Break ties so 'rotated' (rows > cols) can be strict and 'upright' (rows <= cols) holds.
  if (rows === cols) cols = cols > lo ? cols - 1 : cols + 1;
  if (form === 'upright' && rows > cols) [rows, cols] = [cols, rows]; // ensure rows <= cols
  if (form === 'rotated' && rows < cols) [rows, cols] = [cols, rows]; // ensure rows > cols

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { rows, cols },
    answer: { product: rows * cols },
    prompt: `${rows} × ${cols}`,
  };
}
