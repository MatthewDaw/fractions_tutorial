// conceptTree.js — builds the Concept Mastery Map hierarchy by composing the
// engine skill graph (engine/graph.ts) with the Common Core standards table
// (ccssStandards.js) and the room metadata (rooms.js).
//
// THE MENTAL MODEL (largest → smallest):
//   CCSS Grade (3/4/5)
//     → Domain/Cluster   (e.g. 4.NF.B)
//       → Standard       (e.g. 4.NF.B.3a)
//         → Skill Node   (graph.ts, e.g. ADD_SAME_DEN)
//           → Atomic card (each scaffold_ladder form + each transfer_form)
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
// CCSS code parsing  (e.g. "4.NF.B.3a")
// ---------------------------------------------------------------------------
//   grade   = "4"
//   domain  = "NF"            (the letters after the grade)
//   cluster = "4.NF.B"        (grade.domain.clusterLetter)
//   standard= "4.NF.B.3a"     (the full code)
//
// Some codes have no cluster letter (e.g. "3.OA.A.1" → cluster "3.OA.A").
// We handle the common CCSS shapes: GRADE.DOMAIN.CLUSTER.NUMBER[letter].

export function parseCode(code) {
  const parts = String(code).split(".");
  const grade = parts[0] || "?";
  const domain = parts[1] || "?";
  // The cluster letter is the 3rd segment when it is a single uppercase letter.
  const maybeClusterLetter = parts[2];
  const hasClusterLetter = /^[A-Z]$/.test(maybeClusterLetter || "");
  const clusterLetter = hasClusterLetter ? maybeClusterLetter : null;
  const cluster = clusterLetter ? `${grade}.${domain}.${clusterLetter}` : `${grade}.${domain}`;
  return { code, grade, domain, clusterLetter, cluster };
}

// Friendly domain names for the CCSS domains that appear in this app.
const DOMAIN_NAMES = {
  OA: "Operations & Algebraic Thinking",
  NF: "Number & Operations — Fractions",
  NBT: "Number & Operations in Base Ten",
  MD: "Measurement & Data",
  G: "Geometry",
};

function domainName(domain) {
  return DOMAIN_NAMES[domain] || domain;
}

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

/**
 * buildConceptTree() — composes the full Grade→Domain/Cluster→Standard→Node→Card
 * hierarchy. Pure given the current engine log + static data; re-call to refresh.
 *
 * Returns: { grades: [...], live: boolean }
 *   grade   = { kind:'grade',   id, title, mastery, children:[cluster] }
 *   cluster = { kind:'cluster', id, code, domain, title, mastery, children:[standard] }
 *   standard= { kind:'standard',id, code, mastery, children:[node] }
 *   node    = { kind:'node',    id, roomId, title, concept, prereqs, mastery, cards:[card] }
 *   card    = { kind:'card',    id, formId, level, isTransfer, mastery }
 */
export function buildConceptTree() {
  // Refresh the live seam cache.
  _liveNodeMastery = loadLiveNodeMastery();
  _isLive = _liveNodeMastery != null;

  // Index: grade -> cluster -> standard -> [nodeEntry]
  // We place each node under its FIRST CCSS code (its primary standard). The
  // node lists all of its codes for display.
  const grades = new Map(); // gradeId -> gradeObj

  function ensureGrade(gradeId) {
    if (!grades.has(gradeId)) {
      grades.set(gradeId, {
        kind: "grade",
        id: gradeId,
        title: `Grade ${gradeId}`,
        clusters: new Map(),
        children: [],
      });
    }
    return grades.get(gradeId);
  }
  function ensureCluster(gradeObj, parsed) {
    if (!gradeObj.clusters.has(parsed.cluster)) {
      const obj = {
        kind: "cluster",
        id: parsed.cluster,
        code: parsed.cluster,
        domain: parsed.domain,
        title: domainName(parsed.domain),
        clusterLetter: parsed.clusterLetter,
        standards: new Map(),
        children: [],
      };
      gradeObj.clusters.set(parsed.cluster, obj);
    }
    return gradeObj.clusters.get(parsed.cluster);
  }
  function ensureStandard(clusterObj, parsed) {
    if (!clusterObj.standards.has(parsed.code)) {
      const obj = {
        kind: "standard",
        id: parsed.code,
        code: parsed.code,
        children: [],
      };
      clusterObj.standards.set(parsed.code, obj);
    }
    return clusterObj.standards.get(parsed.code);
  }

  for (const skillNode of allNodes()) {
    const std = NODE_STANDARDS[skillNode.id];
    const codes = (std && std.codes) || [];
    // Primary code = the one whose grade matches the node's CCSS grade band,
    // else the first listed. This keeps each node under the right grade.
    const grade = (std && std.grade) || (codes[0] ? parseCode(codes[0]).grade : "?");
    const primaryCode =
      codes.find((c) => parseCode(c).grade === grade) || codes[0] || `${grade}.?`;
    const parsed = parseCode(primaryCode);

    const room = roomForNode(skillNode.id);
    const nodeEntry = {
      kind: "node",
      id: skillNode.id,
      roomId: skillNode.roomId,
      title: room ? room.title : skillNode.id,
      no: room ? room.no : null,
      concept: room ? room.concept : "",
      example: room ? room.example : null,
      verb: room ? room.verb : null,
      prereqs: [...(skillNode.prereqs || [])],
      codes: [...codes],
      grade,
      cards: buildNodeCards(skillNode),
    };

    const gradeObj = ensureGrade(grade);
    const clusterObj = ensureCluster(gradeObj, parsed);
    const standardObj = ensureStandard(clusterObj, parsed);
    standardObj.children.push(nodeEntry);
  }

  // Flatten the Maps into ordered children arrays, sorted by code/grade, and
  // roll mastery up from the atomic cards.
  const gradeList = [...grades.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const g of gradeList) {
    g.children = [...g.clusters.values()].sort((a, b) => a.code.localeCompare(b.code));
    delete g.clusters;
    for (const c of g.children) {
      c.children = [...c.standards.values()].sort((a, b) => a.code.localeCompare(b.code));
      delete c.standards;
      for (const s of c.children) {
        // Sort nodes within a standard by teaching order (room `no`).
        s.children.sort((a, b) => (a.no || 99) - (b.no || 99));
        s.children.forEach(rollup);
        rollup(s);
      }
      rollup(c);
    }
    rollup(g);
  }

  // Build a node-id -> title map for prereq edge labels.
  const titleById = {};
  for (const g of gradeList)
    for (const c of g.children)
      for (const s of c.children)
        for (const n of s.children) titleById[n.id] = n.title;

  return { grades: gradeList, live: _isLive, titleById };
}

// Convenience: the ordered prereq spine (teaching order) for the dependency view.
export function prereqSpine() {
  return allNodes().map((n) => {
    const room = roomForNode(n.id);
    return {
      id: n.id,
      title: room ? room.title : n.id,
      roomId: n.roomId,
      no: room ? room.no : null,
      prereqs: [...(n.prereqs || [])],
    };
  });
}
