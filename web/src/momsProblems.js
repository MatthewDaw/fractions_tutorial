// momsProblems.js — LEGACY SHIM.
//
// Babushka's Kitchen used to be an ADAPTIVE assessor driven by this module's
// per-room question BANK + mirror/combine/look-ahead flow + the mastery engine.
// That whole machinery was removed when the kitchen became a pure wireframe
// screen: the question DATA now lives in kitchen/rooms.js and grading lives in
// kitchen/grade.js (local only, no engine).
//
// No LIVE app code imports this file anymore. It is kept as a THIN SHIM only so a
// few older runtime tests that still `import { … } from './momsProblems.js'`
// continue to resolve at module load. The exports are intentionally empty /
// minimal — there is no adaptive flow left to back them. Delete this file once
// those tests are removed or rewritten against kitchen/rooms.js + kitchen/grade.js.

/** @deprecated The kitchen no longer has a curriculum queue. */
export const CURRICULUM = [];

/** @deprecated Skill labels now come from the lesson registry (lessons/index.js). */
export const ROOM_SKILL = {};

/** @deprecated Cook labels now live inline in MomsRoom. */
export const CHARACTERS = {
  mom: { label: "Babushka" }, kid: { label: "the Kid" },
  grandpa: { label: "Grandpa" }, cat: { label: "the Cat" },
};

/** @deprecated The adaptive question bank is gone; rooms live in kitchen/rooms.js. */
export const BANK = {};

/** @deprecated No curriculum chain remains. */
export function nextRoomOf() { return null; }

/** @deprecated The mirror/combine/look-ahead flow is gone. */
export function enterStage() { return null; }

/** @deprecated The first-task resolver is gone (kitchen lands on KITCHEN_ORDER[0]). */
export function firstTask() { return null; }

/** @deprecated Grading moved to kitchen/grade.js (gradeRoom). */
export function gradeAnswer() { return { state: "incomplete", stars: 0, slip: null }; }

/** @deprecated Target labels are no longer surfaced by the pure wireframe kitchen. */
export function targetLabel() { return ""; }
