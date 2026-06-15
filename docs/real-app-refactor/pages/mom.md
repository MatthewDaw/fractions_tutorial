# Work Order — mom (Babushka's Kitchen)

- **Component:** `web/src/MomsRoom.jsx` · **Route:** `#/mom` · **CSS:** `momsroom.css` · **Effort:** L
- **Uses shared shell:** NO (RawScreen, custom fixed-zone layout). Work = extract shared chrome (KitchenShell/MasteryDisplay/AnswerCard).
- **Priority:** LATE (touches shared chrome + engine).

## Target wireframe screens
`docs/wireframe/screens/kitchen.html`, `kitchen-solved.html`, `kitchen-wall.html`, `kitchen-lookahead.html`, `kitchen-done.html`, `kitchen-wrong.html`, `kitchen-kid.html`, `kitchen-cat.html`, `kitchen-grandpa.html`.

## Design gaps to close
- Custom topbar (.mr-heart star, .mr-progress pips) — not LessonShell.
- Goal band, tutor ribbon, answer card, skill panel all bespoke (no shared components).
- No StageTabs (stages mirror/combine/lookahead are state-driven, invisible).
- Mastery via direct localStorage (kitchenProgress.js), not registry.

## Dedup moves
- Extract `<KitchenShell>` (or parameterized LessonShell variant) for topbar (star num-mark, progress pips, Back/Settings/Restart).
- Extract `<MasteryDisplay>`/ProgressBar from CURRICULUM + mastered.
- Extract `<Portrait>` → shared Cast component (owner+mood).
- Extract `<LearnItButton>` (wall), `<Dialogue>`/banter volley, `<VictoryScreen>` (finale), `<AnswerCard>` (Slate+Check), `<SkillInfo>`.
- ScratchCanvas → inline BlankSlate or parameterize class names.
- ROOM_TO_NODE / ROOM_SKILL → central lessons registry (engine graph bindings).

## Mechanics to PRESERVE (CRITICAL — engine-heavy)
Stylus Slate write (stylus/typing modes); engine `judgeAndAdvance` (problem_present/answer bursts, Decision kinds PresentProblem/RouteToRoom/ReturnToKitchen/Fade/ResumeMastery); RouteToRoom wall + stumpingRecipeId sessionStorage handoff; ReturnToKitchen banter→advance; look-ahead probe (P_known ≥ 0.6 → skip); prop animations; scratch canvas tools; bad-answer flash; banter timing; incomplete-answer rejection; mixed vs plain answer parsing; mastery persistence; check button states; character ownership.

## Playwright test plan
1. Fresh: 0/5 pips, r1 'on', goal prose, Kid portrait, Lesson 1 blurb, two empty Slate cells, scratch canvas.
2. Write 5/8 → ready; Check correct → prop solved anim, Rosette 3 stars, banter loop, 'Next recipe'.
3. Next → fresh problem.
4. Wrong → bad flash, nudge; mirror stage → RouteToRoom wall 'Learn it'; click → onOpenRoom + sessionStorage.
5. Return from wall → same stumping recipe; correct → ReturnToKitchen banter + mastery commit.
6. Look-ahead: P_known<0.6 → notyet, no addMastered; mocked ≥0.6 → skip + addMastered.
7. Done: finale, Play again → restart.
8. Mixed answer (whole+leftover) parsing; incomplete → reject; settings toggle re-renders Slate; restart clears localStorage.

## Risks
Engine decision latency (test slow/offline mock); sessionStorage handoff (try/catch); mastery sync localStorage vs engine; character mood mapping fallback; prop anim CSS class existence; banter audio sync; den=0 grade guard; P_known threshold 0.6; pip/CURRICULUM sync; wall node fallback.

## Definition of done
Kitchen chrome extracted, engine untouched · Playwright passes incl. wall/return/lookahead, zero errors · build clean · vitest green · worktree + PR.
