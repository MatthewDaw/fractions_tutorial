# Themed-Load Isomorphism Rubric & Audit (U10)

**Date:** 2026-06-02
**Plan:** `docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md` (U10)
**Origin finding:** `docs/ideation/2026-06-02-pedagogical-correctness-ideation.md` (#7 — themed cognitive load)

## Why this exists

The app leans on a rich Soviet/Babushka kitchen theme (character voices, animated
intros, kitchen narrative). The 2026 *seductive details* meta-analysis (Educational
Psychology Review, 177 effect sizes) shows a reliable **negative** learning effect
from thematic content that is perceptually salient but **not structurally integrated**
with the task — strongest for low-prior-knowledge learners on complex tasks, and
strongest when the decorative content is animated/voiced *during* the work.

This rubric is the test we apply to every themed surface, plus the audit results.

## The rubric

For each themed asset, ask:

1. **Does it carry the math, or sit beside it?** Isomorphic theme *is* the math
   (the denominator is the number of jar slots; stacking blocks to a line *is* the
   addition). Decorative theme is flavor that rides alongside (a character animating
   while the child computes).
2. **When does it fire?** *Pre-solve* (intro / framing — the disposable "jump pad")
   vs *during the active operation* (highest extraneous-load risk) vs *learner-
   initiated* (tap-to-read — opt-in, zero forced load).
3. **Is it structural feedback or ambient?** Feedback tied to the child's move
   (confirming/correcting the math) is structural. Ambient narration that plays
   unprompted while the child is thinking is decorative load.

**Pass condition:** themed content that fires *during the solve* is either (a)
isomorphic to the math, (b) structural feedback in response to the child's action,
or (c) learner-initiated. Ambient, perceptually-salient, decorative content during
the operation is a **fail** and should be quieted.

## Audit results

| Surface | When it fires | Verdict |
|---|---|---|
| **Manipulatives** (blocks, jars, GroupBar, ruler) | During solve | **Pass** — isomorphic: the manipulative *is* the math (drag blocks to the line = the sum). |
| **`say()` narration in lessons** (`AppR1/R4/M1/...`) | Only from action handlers (on place/check/correct/wrong) | **Pass** — structural feedback tied to the child's move (e.g. "keep the bottom the same"), never ambient. Verified: every `say()` call site is inside a handler, not an idle/stage-entry effect. |
| **Stage-entry ribbon** (`useLessonScaffold` introFor) | On stage change | **Pass** — sets ribbon *text* only (`useLessonScaffold.js` stage-change effect); does **not** auto-narrate. The child can tap-to-read it (opt-in). |
| **Award / reteach beats** (U5) | On correct / on diagnosed wrong | **Pass** — structural: confirms or corrects the math. Reteach copy is math-carrying ("keep the bottom the same"), not flavor. |
| **TapToRead speaker buttons** | Learner-initiated only | **Pass** — opt-in; `readAloud` even yields to app feedback so it never talks over a result. |
| **Intro videos** (`RoomIntro`, `public/intros/*.html` + voiced cue sheets) | **Pre-solve**, auto-narrated, character-heavy | **Pass with watch-flag** — perceptually salient and auto-playing, but it is the *pre-solve jump pad* the philosophy intends (`app_philosophy.md`: cooking is a disposable jump pad). A **Skip** affordance already exists. Monitor for low-prior-knowledge learners; if observed to overwhelm, shorten or make the skip more prominent. |
| **MomsRoom characters / banter** (`voiceLines.js`, cast) | Between problems (post-answer banter) | **Pass** — fires *between* problems, not during the active solve; carries the goal-orientation framing. |

## Outcome: no suppression code warranted

The plan anticipated a `decorative`-flag suppression mechanism for narration that
auto-plays during the operation. **The audit found no such narration** — every
in-solve `say()` is structural feedback from an action handler, stage entry is
text-only, and theme is otherwise pre-solve or tap-initiated. Building a
decorative-suppression channel now would be speculative machinery with nothing to
suppress (YAGNI). The in-solve experience already passes the rubric.

## Convention to keep it clean (enforce in review)

1. **App-driven `say()` during a lesson must be structural** — feedback or
   instruction tied to the math the child is doing. Never fire ambient/decorative
   narration from an idle timer or stage-entry effect.
2. **Decorative / character theme is pre-solve (intro) or tap-opt-in (TapToRead)** —
   never forced during the active operation.
3. **New animated/voiced theme that would play during the solve** must pass rubric
   test (1): it has to carry the math, or it does not ship in the solve window.
4. If a future surface *does* introduce ambient in-solve narration, add the
   `say(key, { decorative: true })` + active-operation suppression gate then (the
   call-site-tagged design from the U10 plan), so learner-initiated tap-to-read and
   structural feedback are never cut.

## Accessibility note

Tap-to-read is the assisted-reader access path. Any future suppression must tag the
**call site** (auto-play vs `readAloud`), never the audio channel — cutting the
shared channel would silence a learner who *tapped* to hear a line. The current code
already separates these (`say` app-driven vs `readAloud` tap-driven in `voice.js`).
