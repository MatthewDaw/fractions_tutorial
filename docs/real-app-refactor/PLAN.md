# Master Refactor Plan — Port the Real App onto the Wireframe's Deduplication + Templatizing Architecture

**North star:** *The real app should borrow our deduplication and templatizing logic we built up in the wireframe.*

**Scope of this document set:** PLANNING ONLY. No app source under `web/` is modified here. This plan, the per-page work orders in `pages/`, and `FLEET.md` are the inputs an agent fleet executes later.

- Real app root: `C:/Users/mattd/Documents/gauntlet/fractions_tutorial/web`
- Wireframe root: `C:/Users/mattd/Documents/gauntlet/fractions_tutorial/docs/wireframe`

---

## A. Target Architecture (mirror the wireframe)

The wireframe's win is **one shell + one registry + thin per-screen data**. The real app is ~60% there: it already has `web/src/components/lesson/{LessonShell,LessonBoard,AnswerBar,HintRail,TutorRibbon,LessonGoal}.jsx`. What it lacks is the **central lesson registry** and **consistent shell usage**; every `App*.jsx`/`LessonUnlikeDen.jsx` still declares its own identity, STAGES array, intro strings, goal copy, and per-stage navigation inline.

**Target end-state:**

1. **`web/src/lessons/` registry** — one module per family, exporting `{ id, num, tag, title, route, tabs:[{ n, name, sub, href }], layout?:{railW,footH}, intros?, goals?, messages? }`. A top-level `web/src/lessons/index.js` aggregates them into a `LESSONS` object (mirrors `docs/wireframe/src/lessons/*.js` and `docs/wireframe/src/lessons.js`). The wireframe already ships the canonical content for all 10 families: `cmp, den, m1, m3, num, r2, r3, r4, r5, s1`.

2. **`LessonShell` stays the only chrome.** Each lesson component looks up `const L = LESSONS[id]` and passes:
   ```jsx
   <LessonShell
     no={L.num.replace('№','')} tag={L.tag} title={L.title}
     tabs={{ stages: L.tabs.map(t => ({ key:t.n, badge:t.n, title:t.name, sub:t.sub })),
             current: currentStageKey, onSelect: goToStage }}
     band={…} goal={…}> {body} </LessonShell>
   ```
   No lesson re-declares the STAGES array; tabs come from the registry.

3. **Thin per-screen data (incremental, lower priority).** The wireframe also splits interactive markup into data modules (`stageHTML/railHTML/answerHTML/tutorHTML`). For the real app the immediate win is **registry + consistent shell**; full data-module extraction (goal/intro/message copy → registry fields) is a follow-on that does NOT require touching interaction logic (drag/slate/engine stay as React components).

**Hard rule:** identity, tab order, goal/intro copy, and layout dimensions are *data* and belong in `web/src/lessons/`. State, grading, drag handlers, engine wiring (`useLessonScaffold`/`useLessonEngine`), and generators stay in the lesson component. Never push interactive logic into data.

---

## B. Foundation Phase (SEQUENTIAL — must land before any per-page work)

This phase is done by ONE agent on ONE branch, landed first, so all page agents build on a stable base. Order matters:

1. **F1 — Create the registry.** Add `web/src/lessons/{m1,m3,nl,r1,r2,r3,r4,r5,s1,cmp,den,num}.js` by porting the canonical content from `docs/wireframe/src/lessons/*.js`. (Note: wireframe has no `r1.js` and no `nl.js` — author these from the per-page findings: R1 tag "Adding Fractions", and NL "On the Number Line".) Add `web/src/lessons/index.js` exporting `LESSONS`. **No component imports it yet** — purely additive, zero behavior change. Build + vitest must pass.

2. **F2 — Confirm/normalize `LessonShell` + `LessonBoard` contract.** `LessonShell` already accepts `tabs:{stages,current,onSelect,label}`, `band`, `goal`. Document the canonical `stages` item shape `{key,badge,title,sub}` in a JSDoc block; ensure `StageTabs` derives `is-active`/`is-done` from `current`. No signature change expected — verify only. `LessonBoard` already delivers the 4-zone grid + `variant="split"|"wide"` and the screen-overlap fix; leave as-is.

3. **F3 — Shared helpers (optional but high-leverage), additive only:**
   - `web/src/lessons/useLessonIdentity.js` (or a plain function) → returns `{no,tag,title,tabsFor(currentKey,onSelect)}` from a lesson id, so every component wires the shell identically.
   - A `stagesFromRegistry(id)` mapper (`L.tabs → [{key,badge,title,sub}]`).
   These are NEW files; they do not alter existing behavior.

4. **F4 — Foundation verification gate.** `npm run build` clean, `npm run test`/vitest green, dev server boots on `http://localhost:5173`, and a smoke Playwright run loads `#/world` with **zero console/page errors** (recipe in §D). Only after F4 passes do page agents launch.

**Why sequential:** the registry and shell contract are shared files every page agent reads from. Landing them first means page agents only *consume* the registry (import a stable module) instead of racing to create it.

---

## C. Execution Phasing — Per-Page Agent Fleet (PARALLEL, worktree-isolated)

After Foundation lands on `main` (or the integration branch), fan out one agent per page. **Every page agent mutates `web/`, so isolation is mandatory.**

### Worktree isolation (required)
Each agent runs in its own git worktree so parallel edits never collide on disk:
```
git worktree add ../wt-<key> -b refactor/<key> <integration-branch>
```
- Agent works only inside its worktree; runs its own dev server (kill/avoid port clash — use a per-agent port or run Playwright against a freshly started instance; do not assume a shared 5173).
- On done: commit, push branch, open PR against the integration branch.

### File ownership (keep edits disjoint)
Each lesson family owns its own component(s) + CSS (e.g. `AppM1.jsx`+`m1.css`, `LessonUnlikeDen.jsx`+`r2/r3.css`). The registry files (`web/src/lessons/*.js`) are **read-only for page agents** after Foundation — a page agent that needs a registry tweak flags it as **shared-file contention** (see `FLEET.md`) rather than editing it directly. `LessonShell.jsx`/`LessonBoard.jsx` are likewise frozen post-F2; changes there are contention and must be serialized.

**Contention hotspots** (see `FLEET.md` for the matrix):
- `LessonUnlikeDen.jsx` is shared by **r2 AND r3** → those two must NOT run in parallel; assign to one agent or serialize.
- `Shell.jsx` (router) is touched by the two NEW lessons (den, num) and any route additions → serialize router edits.
- `web/src/styles/lesson-board.css`, `tokens.css` → frozen; any change is contention.

### Landing order
1. Foundation (F1–F4) — solo, lands first.
2. **Low-risk shell-wiring pages** that already use `LessonShell` cleanly (m1, m3, s1, cmp, r4, r5, nl) — land in any order; disjoint files.
3. **Shared-component page** r1 (creates `web/src/lessons/r1.js` content was Foundation's job; r1 agent just consumes it). r1 is independent of r2/r3.
4. **Serialized pair** r2 then r3 (same `LessonUnlikeDen.jsx`). r2 lands, r3 rebases.
5. **NEW lessons** den, num (router + new component + CSS) — serialize router edits; see §E.
6. **Standalone scenes** (world-map, title, settings, intro, mom, review) — these mostly DON'T use `LessonShell`; their work orders are about *extracting shared chrome* (FabBar, SceneFrame, MasteryBadge) and are lower priority. Land last to avoid churning shared chrome mid-fleet.

---

## D. Standard Playwright Verification Recipe (every page agent MUST run)

Throwaway script, no source changes. Reuse the wireframe's installed Playwright (`docs/wireframe/node_modules/playwright` has chromium) or `npm i playwright --no-save && npx playwright install chromium`.

- Dev server: `cd web && npm run dev` → `http://localhost:5173` (fixed via `vite.config.js` `strictPort`). In a worktree, start a fresh instance / distinct port and target that.
- **Must click REAL elements, not just screenshot.** Drive every mechanic from the page's test plan (drag a pelmeni, write on a Slate, click a stage tab, pick a denominator, etc.) and assert resulting DOM/state.

Template:
```js
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1280,height:800} }); // scale=1
const consoleErrors=[], pageErrors=[];
page.on('console', m => m.type()==='error' && consoleErrors.push(m.text()));
page.on('pageerror', e => pageErrors.push(String(e)));
await page.goto(BASE + '/#/<route>', { waitUntil:'networkidle' });
await page.waitForSelector('<stable selector>', { timeout:15000 });
// ...drive each mechanic from the page work order's test plan, asserting after each...
console.log(JSON.stringify({ consoleErrors, pageErrors }, null, 2));
await browser.close();
```
Gate: **zero console errors, zero page errors**, and every asserted mechanic passes. `screenshot({path})` resolves against process cwd — use absolute paths.

---

## E. Two NEW Lessons to Build for Real (den, num)

These exist as full wireframes + registry entries but have **no real React component yet**.

- **den — "The Bottom Number" (denominator), route `#/den`.** Tabs: Split, Match, Smaller, Numbers, ★Practice. Taught on the 0→1 RULER: pick a bottom number → ruler splits into N equal pieces → bigger bottom = smaller piece → reason from the number → practice. Wireframe screens: `docs/wireframe/screens/room-den*.html`, data `docs/wireframe/src/screens/room-den*.js`, registry `docs/wireframe/src/lessons/den.js`.
- **num — "The Top Number" (numerator), route `#/num`.** Tabs: Shade, Count, Whole, Numbers, Story, Words, ★Practice. Explore top numbers → count shaded pieces → n/n = 1 whole → bare symbols → story → words → practice. Wireframe: `room-num*.html` / `room-num*.js` / `lessons/num.js`.

Build approach: new `web/src/AppDen.jsx` / `web/src/AppNum.jsx` (or one shared ruler-lesson component) that uses `LessonShell` + `LessonBoard` from day one, reuses `NumberLine`/`Slate`/`GenPracticeBoard`, and pulls identity/tabs from the registry. Add routes in `Shell.jsx` (`#/den`, `#/num`) and world-map entries. **Router edits are serialized** (den then num). Engine: register the appropriate skill nodes (e.g. a denominator/numerator skill) or reuse an existing one if present; verify the node id exists before wiring practice. See `pages/den.md` and `pages/num.md`.

---

## F. Risks & How Mechanics Are Protected

Mechanics that MUST keep working through the refactor — protected by the "data vs logic" rule and Playwright gates:

- **Drag interactions** (pelmeni/plates, strips/knives, blocks/sandbox, number-line points, group-bar chips, take-away pieces): keep components (`PlateGroup`, `Plank`, `BlockSandbox`, `NumberLine`, `GroupBar`) intact; only move *identity/copy* to the registry. Pointer math (client→stage scale `k = rect.width/1280`) must be recomputed per pointermove. Test via Playwright's native pointer API.
- **Slate / BlankSlate handwriting**: canvas refs + onChange/onSubmit stay in components; never serialize to HTML strings. Two-stage answer gates (den→num), locked denominators, autofocus keys preserved.
- **Engine / scaffold** (`useLessonScaffold`, `useLessonEngine`, `judgeAndAdvance`, `reportAttempt`, `applyEngineDecision`, RouteToRoom/ReturnToKitchen/Fade decisions): wiring is untouched — registry is data-only. Beat-owned navigation in `LessonUnlikeDen` (its own `NEXT_BEAT` ladder, post-RaiseScaffold hold) MUST stay component-owned; only the tab strip reads from the registry.
- **Generators / practice** (`GenPracticeBoard`, `generateFor`, `gradeAnswer`, skill ids like `MULT_EQUAL_GROUPS`, `ADD_SAME_DEN`, `SUB_SAME_DEN`, `IMPROPER_TO_MIXED`): skill ids are config, not registry chrome — leave with the component. Verify each practice stage still mints/grades a fresh problem.
- **Voice** (`say`, voice keys, `data-vox`): keep voice keys where they fire; if copy moves to the registry, the `data-vox` attribute must travel with it.

### Top 3 risks
1. **`LessonUnlikeDen.jsx` is shared by r2 + r3 and owns bespoke beat navigation** (1266 lines, its own `NEXT_BEAT` ladder, two-stage gate, cross-multiply visual). Parallel edits would collide and refactoring beats risks off-by-one stage transitions. → Serialize r2/r3 on one agent; keep beat logic component-owned, migrate only tab data.
2. **Drag/canvas mechanics regress silently** under coordinate-scale or remount changes (stale `k`, ghost portal offset under CSS `transform: scale`, BlankSlate canvas reset on stage change). → Mandatory Playwright pointer-driven tests per page; assert state after every drag/write.
3. **Two NEW lessons (den, num) need real engine/router integration that doesn't exist yet** — missing skill nodes, router fallthrough to world map, world-map entries. → Serialize router edits; verify the skill node id exists before wiring practice; gate on a full Playwright walk of all stages.

---

## G. Definition of Done (per page)

A page work order is DONE only when ALL hold:
1. **Design matches the wireframe** — chrome via `LessonShell`, 4-zone grid via `LessonBoard`, identity + tabs from `web/src/lessons/<id>.js`; every gap listed in the page's work order is closed.
2. **Dedup landed** — no inline STAGES/identity/intro/goal duplication left for that family; tabs/identity sourced from the registry.
3. **Mechanics verified via Playwright** — the page's full test plan runs clicking REAL elements; every asserted mechanic passes; **zero console errors, zero page errors**.
4. **Build passes** — `npm run build` clean.
5. **Vitest passes** — `npm run test` green (no regressions).
6. **Isolated + landed** — work done in a worktree on `refactor/<key>`, PR opened against the integration branch; shared-file contention flagged, not silently edited.

---

## H. Inventory

**14 page work orders** in `pages/`: m1, m3, nl, r1, r2, r3, r4, r5, s1, cmp, world-map, title, settings, intro, mom, review — plus **2 NEW** (den, num). See `FLEET.md` for launch order and ownership.
