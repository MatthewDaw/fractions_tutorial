# Work Order — intro (Room Intro / Video + Transcript)

- **Component:** `web/src/RoomIntro.jsx` · **CSS:** `world.css` (intro-* classes) · **Effort:** L
- **Uses shared shell:** NO (one-off full-screen). Work = extract reusable intro chrome + registry hookup.
- **Priority:** LATE.

## Target wireframe screens
`docs/wireframe/screens/intro.html` (RawScreen).

## Design gaps to close
- Custom intro-bar (bottom overlay) + endcard (modal) — not shared with topbar pattern (acceptable for intro, but back button duplicates ctrl-btn).
- Transcript rail inlined (not a component).
- Endcard copy parametric on room.title (verify dynamic, not hardcoded "Adding Fractions").

## Dedup moves
- Centralize room metadata (no/title/intro URL/introDurationMs) — extend `web/src/rooms.js` or the new `lessons/` registry; RoomIntro takes a lesson/room id, not the full room object.
- Move INTROS cue map + persistKey into the registry (per-lesson `intros.cues`), eliminating per-room `intro*.js` imports.
- Extract `useGatedNarration(cues, persistKey, playing, ended)` hook.
- Extract `<IntroEndcard>`, `<TranscriptRail>`, `<IntroBar>` components.
- VOICE_BASE → shared config; settings via context.
- Reuse a shared `<CtrlButton>` for the back button (matches LessonShell).

## Mechanics to PRESERVE
Narration gating to animation playhead via localStorage poll; pause/play syncs iframe `window.__anim` + audio + finish timer; seek/jump-to-line (`seekTo`, seekReqRef); transcript active state; replay (key bump + playhead reset); mute (volume 0, timing unchanged); endcard wall-clock timer (pause-aware); voice preload + autoplay fallback; same-origin iframe `window.__anim` contract.

## Playwright test plan
1. Load intro for a narrated room: `.intro.has-transcript`, transcript lines.
2. Initial: intro-bar visible, pause shows PAUSE glyph, tr-start active, activeIdx -1.
3. Play/pause toggles freeze/resume time + glyph.
4. Transcript click → window.__anim.seek spied; activeIdx + .active update.
5. Seek start → seekTo(0,0).
6. Skip → setEnded, endcard appears.
7. Endcard: room.title, two buttons.
8. Watch again → replayKey bump, playhead 0, bar reappears.
9. Continue → onContinue; back → onBack.
10. Timer (fast introDurationMs) auto-endcard; pause-aware remaining time.
11. Mute toggles volume, not timing.
12. No-narration room: no transcript, bar still works.

## Risks
Three-clock sync (iframe/localStorage/audio) — test with real `public/intros/*.html`; replay localStorage reset before remount (useLayoutEffect); stale settings volume; endcard copy must be dynamic; mute vs pause state machine; activeIdx vs visual highlight on skip; seek during endcard resumes; no-cues guard; race finish-timeout vs watch-again; missing voice file fallback.

## Definition of done
Intro chrome extracted + registry-driven cues · Playwright passes, zero errors · build clean · vitest green · worktree + PR.
