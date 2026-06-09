---
title: "Build the missing m2 Baking Trays / Arrays room (MULT_ARRAYS) and restore the 3-node mult DAG"
status: open
priority: P1
category: implementation-gap
source_uid: "006/m2 (MULT_ARRAYS), R-B1, R-B2, R-B4"
source_finding: Missing + Divergent
plan: docs/plans/2026-06-01-006-feat-multiplication-foundations-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Build the second multiplication room, **m2 Baking Trays** (arrays / area model,
`MULT_ARRAYS`), which plan 006 specifies as the pedagogical bridge between m1 Equal Groups
and m3 Times Facts (it makes commutativity and distributivity visible). Restore the
canonical three-node DAG edge it sits on.

## Why
Plan 006 specifies a **three-room** strand m1→m2→m3 with m2 as the middle rung. Only m1 and
m3 shipped. The DAG was collapsed to two nodes, and the in-code comment even hardcodes the
wrong "canonical" set:
- `web/src/engine/graph.ts:54-57`: `MULT_FACTS.prereqs = ['MULT_EQUAL_GROUPS']` (should be
  `['MULT_ARRAYS']` per plan 006 §"Level 3" and R-B1).
- `web/src/engine/graph.ts:23`: comment claims "canonical ids are EXACTLY: MULT_EQUAL_GROUPS,
  MULT_FACTS" — contradicts plan 006's "MULT_EQUAL_GROUPS, MULT_ARRAYS, MULT_FACTS."
Without m2, the strand teaches "what multiplication means" then jumps straight to fluency,
skipping the arrays/area model the plan calls the takeaway for distributivity.

## Evidence
Verified absent in the working tree:
- `web/src/AppM2.jsx` ✗, `web/src/components/BakingTray.jsx` ✗, `web/src/styles/m2.css` ✗
- `web/public/intros/m2-baking-trays.html` ✗, `web/src/introM2.js` ✗
- No `m2` entry in `web/src/rooms.js`; no `MULT_ARRAYS` const in `web/src/engine/graph.ts`;
  no `m2`/`AppM2` branch in `web/src/Shell.jsx`; no `multArrays` generator in
  `web/src/generators/`.
(m1 and m3 are present: `AppM1.jsx`, `AppM3.jsx`, `multEqualGroups.js`, `multFacts.js`,
`introM1.js`, `introM3.js`, `m1-equal-groups.html`, `m3-times-facts.html`.)

## Suggested approach
Follow plan 006 §"Level 2 — m2 Baking Trays" and its file-by-file checklist verbatim:
1. **Engine** (`graph.ts`): add `MULT_ARRAYS` const (`roomId:'m2'`,
   `prereqs:['MULT_EQUAL_GROUPS']`, the `arrays_*` scaffold_ladder + transfer_forms) at index 1
   of `ALL_NODES`; change `MULT_FACTS.prereqs` to `['MULT_ARRAYS']`; update the canonical-ids
   comment. Keep `ADD_UNLIKE_COPRIME`/`SIMPLIFY` prereq **prepend** ordering intact (R-B2) so
   `credit.ts:97` `prereqs[last]` still resolves the fraction prereq — no credit.ts edit.
2. **Generator**: add `multArrays.js` (rows × cols products), register in
   `generators/index.js` + `generatorSkills`.
3. **Component**: `AppM2.jsx` (consume `initialBeat`; engine wiring via `useLessonEngine`;
   the 7-stage arc 1-manipulate…7-words; 4-zone layout) + the new `BakingTray.jsx` manipulative
   (R×C grid, interior-only tappable, rotate, score/cut) + `styles/m2.css`.
4. **Routing/map**: `rooms.js` m2 entry (`built:true`, `pos:{x:360,y:150}`) + renumber the
   five fraction rooms to `no:4..8` (R-B4, confirm against current rooms.js first — see report
   open question 1); `runtime/scaffoldMap.js` m2 branch (identical r1-style shape, R-M1/R-M2);
   `Shell.jsx` `else if (room.id==='m2')` branch.
5. **Intro**: `public/intros/m2-baking-trays.html` + `introM2.js` + `RoomIntro.jsx INTROS{}` m2.
6. **Voice**: `m2i_*` + `mr_*` keys in `voiceLines.js`.

## Acceptance criteria
- `getNode('MULT_FACTS').prereqs` resolves to `['MULT_ARRAYS']`; `prereqsOf('MULT_ARRAYS')`
  returns `[MULT_EQUAL_GROUPS]` without throwing (plan 006 Validation: "DAG loads").
- `credit.ts` unchanged: an `add_across_unlike` error on r2 still docks `ADD_UNLIKE_NESTED`,
  not a mult node (assert).
- `#/m2` opens `AppM2` (not `EmptyRoom`); WorldMap renders all nodes non-overlapping.
- scaffoldMap inverse consistency holds for m2: `toScaffoldLevel('m2', toBeatForLevel('m2',L)) <= L`
  for L in 0..4.
- Manual `/browse`: walk m2 1-manipulate→7-words; interior-only fill, rotate (commutativity),
  score/cut (distributivity) all work; intro fires in sync.
