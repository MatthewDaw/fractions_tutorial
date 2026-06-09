# ADR-0005 — Prereq order is load-bearing: MULT_FACTS is PREPENDED for credit assignment (spanning)

(Also referenced in `data-model.md` as `0005-prereq-prepend-credit-constraint.md`;
this is the canonical file.)

## Status
Accepted (reflects what IS in the codebase).

## Context
When a child makes a structural fraction error — adding straight across unlike
denominators (`add_across_unlike`) — the engine must dock belief on the RIGHT
prerequisite skill so it routes the child to strengthen the actual gap. The credit
assigner does this by selecting a prerequisite from the binding node's `prereqs`
list. The selection rule and the list order are therefore coupled: get the order
wrong and the engine blames the wrong upstream skill.

## Decision
`credit.ts` `resolveImplicatedPrereq` docks `bindingNode.prereqs[length - 1]` — the
LAST prereq — on a straight-across error (`credit.ts:97`). That last slot must be
the relevant FRACTION prerequisite. Therefore, in `graph.ts`, **`MULT_FACTS` is
PREPENDED (never appended)** to the prereq lists of `ADD_UNLIKE_COPRIME` and
`SIMPLIFY`, so the original fraction prereq stays in the last position:
- `ADD_UNLIKE_COPRIME.prereqs = [MULT_FACTS, ADD_UNLIKE_NESTED]`
- `SIMPLIFY.prereqs = [MULT_FACTS, ADD_UNLIKE_COPRIME]`
Node ids are canonical SCREAMING_SNAKE_CASE; `getNode` THROWS on an unknown id and
`prereqsOf` maps every prereq through `getNode`, so any id typo or reordering that
breaks the contract crashes the DAG at initialization rather than silently
mis-crediting.

## Consequences
- The arithmetic foundation (`MULT_FACTS`) is still a real prerequisite edge for
  scaling denominators, but it never displaces the fraction prereq from the
  credit-bearing last slot.
- This ordering is a documented, test-guarded invariant (constitution §5.7,
  `gotchas.md` §1) — appending instead of prepending is a silent correctness bug,
  not a style choice.
- Any future node whose `add_across_unlike` credit should fall on a specific prereq
  must keep that prereq LAST and prepend foundational ones.
