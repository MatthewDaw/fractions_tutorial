/* manip.js — shared kitchen-style manipulative tokens (jars, plums, trays).

   Used by BOTH Babushka's Kitchen helper tools (answer.js) and the matching
   lesson rooms (e.g. room-m1), so the same little game looks identical wherever
   it appears. Styling lives in css/app/manip.css (un-scoped, so it applies in the
   kitchen and in the lesson board alike). */

export const plum = () => `<span class="kq-plum"></span>`;
export const tray = (items) => `<div class="kq-tray">${items}</div>`;
export const rep = (n, fn) => Array.from({ length: n }, fn).join("");

/* a pickle — flat green capsule with a slight downward bend (a gentle U), no
   texture. Used by the kitchen Times-Facts tool. */
export const pickle = () => `<svg viewBox="0 0 48 26" class="kq-pickle" aria-hidden="true"><path d="M8 6 Q24 12 40 6 Q47 11 40 17 Q24 23 8 17 Q1 11 8 6 Z" fill="#6f7f3a" stroke="#4f5a26" stroke-width="2" stroke-linejoin="round" /></svg>`;

/* a pebble — small filled circle used in the m3 lesson jar clusters. */
export const pebble = () => `<svg viewBox="0 0 32 32" class="kq-pebble" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#d1495b" stroke="#a33040" stroke-width="2"/></svg>`;

/* a jar holding k plums (clustered positions) */
const JARPLUMS = {
  0: [], 1: [[28, 52]], 2: [[20, 52], [36, 52]],
  3: [[28, 38], [20, 55], [36, 55]], 4: [[20, 40], [36, 40], [20, 56], [36, 56]],
};
export const jar = (k = 0) => `<svg viewBox="0 0 56 76" class="kq-jar" aria-hidden="true">
  <rect x="9" y="13" width="38" height="9" rx="2" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" />
  <path d="M11 22 H45 V66 a8 8 0 0 1 -8 8 H19 a8 8 0 0 1 -8 -8 Z" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
  ${(JARPLUMS[k] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.6" />`).join("")}
</svg>`;
