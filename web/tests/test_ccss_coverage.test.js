// Guard against the NODE_STANDARDS coverage blind spot (T02 pedagogy nit):
// every built room must resolve to a real CCSS standard, and every mult node
// (incl. the new MULT_ARRAYS) must be mapped. No prior test covered this map,
// which is how m2 shipped without a standard while 934 tests stayed green.
import { describe, it, expect } from "vitest";
import { ROOMS } from "../src/rooms.js";
import { NODE_STANDARDS, standardsForRoom } from "../src/ccssStandards.js";

describe("CCSS standards coverage", () => {
  it("maps the full multiplication chain incl. MULT_ARRAYS", () => {
    for (const node of ["MULT_EQUAL_GROUPS", "MULT_ARRAYS", "MULT_FACTS"]) {
      expect(NODE_STANDARDS[node], `${node} missing from NODE_STANDARDS`).toBeTruthy();
      expect(NODE_STANDARDS[node].codes.length).toBeGreaterThan(0);
    }
  });

  it("resolves a non-empty standard for every built room", () => {
    const built = ROOMS.filter((r) => r.built);
    expect(built.length).toBeGreaterThan(0);
    for (const room of built) {
      const std = standardsForRoom(room.id);
      expect(std, `room '${room.id}' (node ${room.nodeId}) has no CCSS standard`).toBeTruthy();
      expect(std.codes.length, `room '${room.id}' has empty codes`).toBeGreaterThan(0);
    }
  });
});
