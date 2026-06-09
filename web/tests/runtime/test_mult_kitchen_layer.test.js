// test_mult_kitchen_layer.test.js — plan 006 O6: the mult kitchen transfer layer.
//
// Acceptance (docs/improvements/2026-06-08-mult-kitchen-layer.md):
//   1. A kitchen recipe using a mult skill grades via the new `multiply` op and
//      routes a wall to the correct mult room (m1/m2/m3).
//   2. ROOM_SKILL / CURRICULUM numbering stays in sync with the merged room
//      renumber (rooms.js ROOMS[].no).

import { describe, it, expect } from 'vitest';
import {
  BANK, CURRICULUM, ROOM_SKILL,
  gradeAnswer, firstTask, enterStage, nextRoomOf,
} from '../../src/momsProblems.js';
import { ROOM_TO_NODE } from '../../src/MomsRoom.jsx';
import { ROOMS } from '../../src/rooms.js';

// ---------------------------------------------------------------------------
// multiply op — grading
// ---------------------------------------------------------------------------

describe('gradeAnswer · multiply op', () => {
  // The m1 mirror recipe "plates": 3 × 4 → 12, carried as [12, 1].
  const plates = BANK.m1.mirror[0];

  it('every mult mirror recipe uses op:"multiply" and carries [product, 1]', () => {
    for (const roomId of ['m1', 'm2', 'm3']) {
      for (const q of BANK[roomId].mirror) {
        expect(q.op).toBe('multiply');
        expect(q.answerType).toBe('product');
        expect(Array.isArray(q.factors) && q.factors.length === 2).toBe(true);
        const [a, b] = q.factors;
        expect(q.target).toEqual([a * b, 1]); // [product, 1] per plan R-B5
      }
    }
  });

  it('marks the correct product (over denominator 1) as correct (3★)', () => {
    const g = gradeAnswer(plates, { num: '12', den: '1' });
    expect(g.state).toBe('correct');
    expect(g.stars).toBe(3);
    expect(g.slip).toBeNull();
  });

  it('accepts the product with an empty denominator slot (implicit /1)', () => {
    const g = gradeAnswer(plates, { num: '12', den: '' });
    expect(g.state).toBe('correct');
  });

  it('reports incomplete (no slip routing) when the product is blank', () => {
    const g = gradeAnswer(plates, { num: '', den: '1' });
    expect(g.state).toBe('incomplete');
    expect(g.slip).toBe('fillProduct');
  });

  it('diagnoses the add-the-factors slip (3 + 4 = 7 for 3 × 4)', () => {
    const g = gradeAnswer(plates, { num: '7', den: '1' });
    expect(g.state).toBe('wrong');
    expect(g.slip).toBe('addFactors');
  });

  it('diagnoses copying one factor (wrote 4 for 3 × 4)', () => {
    const g = gradeAnswer(plates, { num: '4', den: '1' });
    expect(g.state).toBe('wrong');
    expect(g.slip).toBe('wroteFactor');
  });

  it('diagnoses skip-count drift (off by one group: 7 × 8 → 48 or 64)', () => {
    const jars = BANK.m3.mirror[0]; // 7 × 8 → 56
    expect(gradeAnswer(jars, { num: '48', den: '1' }).slip).toBe('skipDrift'); // 56 − 8
    expect(gradeAnswer(jars, { num: '64', den: '1' }).slip).toBe('skipDrift'); // 56 + 8
  });

  it('falls back to wrongValue for an unstructured wrong product', () => {
    const g = gradeAnswer(plates, { num: '99', den: '1' });
    expect(g.state).toBe('wrong');
    expect(g.slip).toBe('wrongValue');
  });
});

// ---------------------------------------------------------------------------
// routing — a mult recipe routes a wall to the correct mult room
// ---------------------------------------------------------------------------

describe('mult transfer layer · routing', () => {
  it('m1/m2/m3 each have a BANK entry whose recipes resolve via the adaptive flow', () => {
    for (const roomId of ['m1', 'm2', 'm3']) {
      expect(BANK[roomId]).toBeDefined();
      expect(BANK[roomId].mirror.length).toBeGreaterThan(0);
      const task = enterStage(roomId, 'mirror', 0, []);
      expect(task.roomId).toBe(roomId);
      expect(task.q.op).toBe('multiply');
    }
  });

  it('a fresh learner is first posed an m1 multiply recipe (mult leads the kitchen)', () => {
    const t = firstTask([]);
    expect(t.roomId).toBe('m1');
    expect(t.q.op).toBe('multiply');
  });

  it('each mult room id maps to its engine mult node (the wall target)', () => {
    expect(ROOM_TO_NODE.m1).toBe('MULT_EQUAL_GROUPS');
    expect(ROOM_TO_NODE.m2).toBe('MULT_ARRAYS');
    expect(ROOM_TO_NODE.m3).toBe('MULT_FACTS');
  });

  it('a wrong mult answer in m1 yields a slip the kitchen routes to m1 (the task room)', () => {
    // The kitchen's soft wall uses task.roomId; a wrong grade keeps the child in
    // the mult room they are working, whose node is the wall target.
    const task = firstTask([]); // m1 · plates
    const res = gradeAnswer(task.q, { num: '7', den: '1' }); // 3+4 add-factors slip
    expect(res.state).toBe('wrong');
    expect(ROOM_TO_NODE[task.roomId]).toBe('MULT_EQUAL_GROUPS');
  });

  it('the curriculum chains m1 → m2 → m3 → r1 (mult before fractions)', () => {
    expect(nextRoomOf('m1')).toBe('m2');
    expect(nextRoomOf('m2')).toBe('m3');
    expect(nextRoomOf('m3')).toBe('r1');
  });
});

// ---------------------------------------------------------------------------
// numbering — ROOM_SKILL / CURRICULUM in sync with the merged room renumber
// ---------------------------------------------------------------------------

describe('mult transfer layer · numbering stays in sync with rooms.js', () => {
  const roomNo = Object.fromEntries(ROOMS.map((r) => [r.id, r.no]));

  it('every CURRICULUM room has a ROOM_SKILL entry and a BANK entry', () => {
    for (const id of CURRICULUM) {
      expect(ROOM_SKILL[id]).toBeDefined();
      expect(BANK[id]).toBeDefined();
    }
  });

  it('ROOM_SKILL.no mirrors rooms.js ROOMS[].no for every kitchen room (plan O9)', () => {
    for (const id of Object.keys(ROOM_SKILL)) {
      expect(ROOM_SKILL[id].no).toBe(roomNo[id]);
    }
  });

  it('the three mult rooms are the renumbered lessons 1/2/3', () => {
    expect(ROOM_SKILL.m1.no).toBe(1);
    expect(ROOM_SKILL.m2.no).toBe(2);
    expect(ROOM_SKILL.m3.no).toBe(3);
  });

  it('CURRICULUM leads with m1/m2/m3 then the fraction rooms', () => {
    expect(CURRICULUM.slice(0, 3)).toEqual(['m1', 'm2', 'm3']);
    expect(CURRICULUM).toEqual(['m1', 'm2', 'm3', 'r1', 'r3', 'r2', 'r4', 'r5']);
  });
});
