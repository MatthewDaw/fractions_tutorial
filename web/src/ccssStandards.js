// CCSS standard codes per engine node id. Pure data/util — no React.
// Covers ALL node ids (existing + the 3 new ones). See .ccss-contract.md.
import { ROOMS } from "./rooms.js";

// Map every node id -> { grade: '3'|'4'|'5', codes: string[] }.
export const NODE_STANDARDS = {
  // Multiplication foundations (grade 3).
  MULT_EQUAL_GROUPS: { grade: "3", codes: ["3.OA.A.1"] },
  MULT_ARRAYS: { grade: "3", codes: ["3.OA.A.1"] },
  MULT_FACTS: { grade: "3", codes: ["3.OA.A.1", "3.OA.C.7"] },

  // Fraction strand.
  ADD_SAME_DEN: { grade: "4", codes: ["4.NF.B.3a"] },
  FRACTION_ON_LINE: { grade: "3", codes: ["3.NF.A.2"] },
  SUB_SAME_DEN: { grade: "4", codes: ["4.NF.B.3a", "4.NF.B.3b"] },
  COMPARE_BENCHMARK: { grade: "4", codes: ["3.NF.A.3d", "4.NF.A.2", "5.NF.A.2"] },
  ADD_UNLIKE_NESTED: { grade: "5", codes: ["5.NF.A.1"] },
  ADD_UNLIKE_COPRIME: { grade: "5", codes: ["5.NF.A.1"] },
  SIMPLIFY: { grade: "4", codes: ["4.NF.A.1"] },
  IMPROPER_TO_MIXED: { grade: "4", codes: ["4.NF.B.3b", "4.NF.B.4"] },
};

// Look up the standards for a room by its rooms.js nodeId. Returns
// the { grade, codes } entry, or undefined if the room/node is unknown.
export function standardsForRoom(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return undefined;
  return NODE_STANDARDS[room.nodeId];
}
