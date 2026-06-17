// conceptTree.js — builds the Concept Mastery Map hierarchy by composing the
// engine skill graph (engine/graph.ts) with the room metadata (rooms.js) and the
// Common Core alignment tags (ccssStandards.js, used only as a small reference
// label — NEVER as an organizing level).
//
// THE MENTAL MODEL (largest → smallest):
//   High-level concept   (e.g. "Adding & Subtracting")
//     → Skill node        (graph.ts, e.g. ADD_SAME_DEN)
//       → Atomic card     (each scaffold_ladder form + each transfer_form)
//
// There is NO grade level anywhere in this model. The app is pace-agnostic — a
// learner moves through whatever concept they like, in whatever order. Concepts
// are ordered by how they build on each other (the prereq graph), not by grade.
//
// Atomic cards are the ONLY place mastery is *measured*; every level above shows
// a ROLLED-UP average of the atomic cards beneath it.
//
// MASTERY SEAM (read this if you are the content-measurement agent):
//   getMastery(key) -> number in [0,1]   is the single seam this UI reads.
//   `key` is an atomic-card id: either a scaffold-ladder form id (e.g.
//   "same_den_bare") or a transfer-form id (e.g. "same_den_transfer").
//   Today it returns LIVE values when an engine log exists (rolled up from the
//   per-node MasteryEstimate.P_known), otherwise a DETERMINISTIC PLACEHOLDER so
//   the viz is fully populated. To make this fully live at the atomic-card grain,
//   write a per-form belief and have getMastery read it — nothing else in this
//   file or ConceptMap.jsx needs to change.

import { allNodes } from "./engine/graph.js";
import { NODE_STANDARDS } from "./ccssStandards.js";
import { ROOMS } from "./rooms.js";
import { loadLog } from "./engine/index.js";
import { measurementReduce } from "./engine/measurementReduce.js";

// ---------------------------------------------------------------------------
// THE CONCEPTS — the high-level math ideas that drive the top navigation.
// Each lists the skill-node ids it owns, in teaching order. Grade-free by design;
// ordered so each concept builds on the ones before it. Any node not named here
// falls into a "More" bucket so nothing is ever silently dropped.
// ---------------------------------------------------------------------------
export const CONCEPTS = [
  {
    id: "multiplication",
    title: "Multiplication",
    blurb: "Equal groups, arrays, and times facts — the groundwork the fraction work leans on.",
    nodes: ["MULT_EQUAL_GROUPS", "MULT_FACTS"],
  },
  {
    id: "fraction-as-number",
    title: "Fractions as Numbers",
    blurb: "A fraction is a single number — one point on the line, found by counting equal parts from 0.",
    nodes: ["FRACTION_ON_LINE"],
  },
  {
    id: "add-subtract",
    title: "Adding & Subtracting",
    blurb: "Join and take apart fractions — first with the same bottom, then by renaming to a common one.",
    nodes: ["ADD_SAME_DEN", "SUB_SAME_DEN", "ADD_UNLIKE_NESTED", "ADD_UNLIKE_COPRIME"],
  },
  {
    id: "compare-estimate",
    title: "Comparing & Estimating",
    blurb: "Which fraction is bigger, and is an answer reasonable? Reason against 0, ½, and 1.",
    nodes: ["COMPARE_BENCHMARK"],
  },
  {
    id: "equivalence",
    title: "Equivalence & Simplifying",
    blurb: "The same amount wears many names — find equivalents, and the simplest name.",
    nodes: ["SIMPLIFY"],
  },
  {
    id: "mixed-numbers",
    title: "Mixed Numbers",
    blurb: "An improper fraction is a whole number and a leftover part.",
    nodes: ["IMPROPER_TO_MIXED"],
  },
];

// ---------------------------------------------------------------------------
// MASTERY SEAM
// ---------------------------------------------------------------------------

// Cache the live per-node mastery map once per build of the tree (a pure fold
// over the persisted engine log). null when there is no log yet.
let _liveNodeMastery = null; // Record<nodeId, MasteryEstimate> | null
let _isLive = false;

function loadLiveNodeMastery() {
  try {
    const log = loadLog();
    if (!log || log.length === 0) return null;
    const { mastery } = measurementReduce(log, Date.now(), {});
    return mastery || null;
  } catch (_) {
    return null;
  }
}

// Deterministic placeholder so the viz is always fully populated. We hash the
// atomic-card id to a stable pseudo-random value in [0,1]. Deterministic =>
// the same card always shows the same placeholder, and the rollups are stable.
function placeholderFor(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0.08, 0.97] so we get a spread of empty / partial / strong cards.
  const u = ((h >>> 0) % 1000) / 1000;
  return 0.08 + u * 0.89;
}

/**
 * getMastery(key) — THE SEAM. Returns mastery in [0,1] for an atomic card id.
 *
 * `key` is a scaffold-ladder form id or a transfer-form id (the atomic grain).
 * The optional second arg `nodeId` lets the live path roll the node's P_known
 * down to its cards when there is no per-card belief yet.
 *
 * LIVE path: when an engine log exists, the card inherits its node's BKT
 * P_known (the finest live signal we have today). The content-measurement
 * agent can replace this with a true per-form belief lookup with no other change.
 *
 * PLACEHOLDER path: a deterministic hash of the card id.
 */
export function getMastery(key, nodeId) {
  if (_isLive && _liveNodeMastery && nodeId) {
    const est = _liveNodeMastery[nodeId];
    if (est && typeof est.P_known === "number") return est.P_known;
  }
  return placeholderFor(key);
}

/** Whether the current tree is backed by live engine data or placeholders. */
export function isLiveMastery() {
  return _isLive;
}

// ---------------------------------------------------------------------------
// Rollup helpers
// ---------------------------------------------------------------------------

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Collect every atomic-card mastery value beneath a subtree (leaves only).
function collectLeafMastery(node) {
  if (node.cards) return node.cards.map((c) => c.mastery);
  const out = [];
  for (const child of node.children || []) out.push(...collectLeafMastery(child));
  return out;
}

function rollup(node) {
  node.mastery = avg(collectLeafMastery(node));
  node.leafCount = node.cards ? node.cards.length : collectLeafMastery(node).length;
  return node;
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

function roomForNode(nodeId) {
  return ROOMS.find((r) => r.nodeId === nodeId) || null;
}

// Build the atomic cards for one skill node: each scaffold-ladder rung's form(s)
// plus the transfer forms. transfer_forms that already appear in the ladder are
// tagged as transfer (they double as the L3/L4 rungs in this app's graph).
function buildNodeCards(skillNode) {
  const transferSet = new Set(skillNode.transfer_forms || []);
  const seen = new Set();
  const cards = [];

  (skillNode.scaffold_ladder || []).forEach((rung, level) => {
    for (const formId of rung) {
      if (seen.has(formId)) continue;
      seen.add(formId);
      cards.push({
        kind: "card",
        id: formId,
        formId,
        level, // design scaffold level 0..4
        isTransfer: transferSet.has(formId),
        mastery: getMastery(formId, skillNode.id),
      });
    }
  });

  // Any transfer form not already represented in the ladder gets its own card.
  for (const formId of transferSet) {
    if (seen.has(formId)) continue;
    seen.add(formId);
    cards.push({
      kind: "card",
      id: formId,
      formId,
      level: 4,
      isTransfer: true,
      mastery: getMastery(formId, skillNode.id),
    });
  }

  return cards;
}

const LEVEL_NAMES = ["Visual", "Guided", "Partial", "Bare", "Transfer"];
export function levelName(level) {
  return LEVEL_NAMES[level] || `L${level}`;
}

// Turn one engine skill node into a display node entry (with its atomic cards).
function makeNodeEntry(skillNode) {
  const std = NODE_STANDARDS[skillNode.id];
  const codes = (std && std.codes) || [];
  const room = roomForNode(skillNode.id);
  return {
    kind: "node",
    id: skillNode.id,
    roomId: skillNode.roomId,
    title: room ? room.title : skillNode.id,
    no: room ? room.no : null,
    concept: room ? room.concept : "",
    example: room ? room.example : null,
    verb: room ? room.verb : null,
    prereqs: [...(skillNode.prereqs || [])],
    codes: [...codes], // CCSS alignment tags only — never used to group or gate.
    cards: buildNodeCards(skillNode),
  };
}

/**
 * buildConceptTree() — composes the Concept → Skill node → Atomic card hierarchy.
 * Pure given the current engine log + static data; re-call to refresh.
 *
 * Returns: { concepts: [...], live: boolean, titleById }
 *   concept = { kind:'concept', id, title, blurb, mastery, children:[node] }
 *   node    = { kind:'node', id, roomId, title, concept, prereqs, codes, mastery, cards:[card] }
 *   card    = { kind:'card', id, formId, level, isTransfer, mastery }
 */
export function buildConceptTree() {
  // Refresh the live seam cache.
  _liveNodeMastery = loadLiveNodeMastery();
  _isLive = _liveNodeMastery != null;

  const nodeById = {};
  for (const sn of allNodes()) nodeById[sn.id] = sn;

  const titleById = {};
  const used = new Set();

  const concepts = CONCEPTS.map((c) => {
    const children = c.nodes
      .map((id) => nodeById[id])
      .filter(Boolean)
      .map((sn) => {
        used.add(sn.id);
        const entry = makeNodeEntry(sn);
        titleById[entry.id] = entry.title;
        return entry;
      });
    const obj = { kind: "concept", id: c.id, title: c.title, blurb: c.blurb, children };
    children.forEach(rollup);
    rollup(obj);
    return obj;
  }).filter((c) => c.children.length > 0);

  // Any skill node not claimed by a concept lands in a "More" bucket so the map
  // can never silently hide a node the engine knows about.
  const leftovers = allNodes()
    .filter((sn) => !used.has(sn.id))
    .map((sn) => {
      const entry = makeNodeEntry(sn);
      titleById[entry.id] = entry.title;
      return entry;
    });
  if (leftovers.length) {
    const obj = { kind: "concept", id: "more", title: "More", blurb: "", children: leftovers };
    leftovers.forEach(rollup);
    rollup(obj);
    concepts.push(obj);
  }

  return { concepts, live: _isLive, titleById };
}
