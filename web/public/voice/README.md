# Voice clips

Pre-baked, cartoonishly-thick Russian-accent narration. One `<key>.mp3` per
spoken line — generated with **ElevenLabs**, not hand-edited.

Two characters (see `src/voiceLines.js` → `SPEAKERS` / `LINE_SPEAKER`):
- **Cook** (male tutor) — *Did Vishchun* — all coaching + the intro narration
- **Mom** (female) — *Tatiana* — the goal / recipe-order lines

Played at runtime by `say("<key>")` in `App.jsx` and, for the R2 intro video, by
the synced narration + transcript in `RoomIntro.jsx` (cue sheet: `src/introR2.js`).

## (Re)generate

```powershell
# web/.env already holds the key + the two chosen voice ids:
#   ELEVENLABS_API_KEY=...
#   ELEVEN_VOICE_COOK=WtDqMP4cPOGB6kDiLZgi   # Did Vishchun
#   ELEVEN_VOICE_MOM=gCqVHuQpLDMkHrGiG95I    # Tatiana
cd web
npm run voice                 # bake any missing clips
npm run voice -- --force      # re-bake all
npm run voice -- --only goal  # just one line
```

Accent thickness/silliness is tuned in `scripts/generate-voice.mjs`
(`VOICE_SETTINGS`: low `stability`, high `style`).

## Audition more voices

```powershell
npm run audition              # bakes a comparison table to /voice/_audition/
```
Open `http://localhost:5173/voice/_audition/index.html` (note the explicit
`index.html` — a bare directory URL falls through to the app). Edit the
`VOICES` / `LINES` lists in `scripts/audition-voices.mjs` to change the lineup.

If clips are missing, `say()` falls back to the browser's built-in voice so the
app still works.
