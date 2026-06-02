# Research notes

_Authored companion (not a tape projection). Records the literature that shaped the persona design._

## Fraction misconceptions
- Add-numerators-and-denominators (a/b + c/d → (a+c)/(b+d)) is the canonical unlike-denominator error;
  the inverse-error map plants it on the real operands so the engine fingerprints `add_denominators`.
- Whole-number bias, gap thinking, denominator neglect, and unit-fraction inversion lack a dedicated
  fingerprinter, so they are traced by the planted `answer_value`, not the engine `error_signature`.

## Mastery / learning models
- BKT (Corbett & Anderson) underlies the engine's P_known fold; personas are DELIBERATELY parameter-
  disjoint from it, and the sealed held-out family uses non-BKT (oscillatory / bimodal) laws so the
  judge is not a BKT-shape tautology.

## Avoidance / off-task behavior
- Baker's gaming / off-task / carelessness taxonomy informs the three misbehavior classes (off-task
  refuser, fast-but-shallow guesser, hint-leaning over-hinter).

## Anti-gaming evaluation
- Goodhart held-out discipline + deflated pass-rate (walk-forward) underlie the REAL/GAMING verdict.
