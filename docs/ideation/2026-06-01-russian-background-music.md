# Ideation — Classical Russian background music

**Date:** 2026-06-01
**Focus:** Background/score music for the fractions game — distinctly Russian, public-domain, kid-math-friendly. Four contexts: title screen (foreground OK), world/lesson map, Mom's kitchen, lesson rooms (all three looping beds).
**Audition:** `web/public/music/_audition/index.html` (run `npm run music-audition`).

## Grounding

- The game's whole aesthetic is a vintage Soviet "Moscow Puzzles" printed page (Russo One / Old Standard TT, ink + muted red on cream), with a cartoonish-Russian voice cast (Cook, Mom, Kid, Grandpa, Cat). Music should match that warm, hand-printed, folk-tale tone — **not** epic film-score Russia.
- Players are kids (~6–10) doing arithmetic. Room music must sit *under* thought: low melodic density, slow harmonic motion, no sudden dynamics, loopable without an obvious seam.
- **Licensing reality:** the *compositions* are public domain (composers d. pre-1954), but each *recording* has its own copyright. Shippable sources = **Wikimedia Commons** (PD/CC), **US-Gov PD** (military bands), or commissioned/PD performances (Musopen). Commercial LP rips on the Internet Archive are **not** shippable.

## Survivors (ranked per context)

### 1. Title screen — foreground, grand, "here we go"
1. **Glinka — *Ruslan & Lyudmila* Overture.** `direct:` Commons recording verified. The definitive thrilling Russian curtain-raiser; bright, fast, joyful — sets "fun, not intimidating." Top pick.
2. **Mussorgsky — *Promenade* (Pictures at an Exhibition).** Stately, instantly-Russian, and thematically perfect (a museum-walk theme for a lesson-*map* game). Doubles as a leitmotif reused softer elsewhere.
3. **Tchaikovsky — Trepak / Russian Dance (Nutcracker).** Fast folk-dance glee; very "kids," very Russian. Short — loops or acts as a stinger.

### 2. World / lesson map — warm, wandering, loop
1. **Mussorgsky — *Promenade* (tranquillo).** `reasoned:` it is *literally* "walking between pictures" music → ideal map-traversal bed, and reusing the title theme softer builds cohesion (leverage/compounding).
2. **Borodin — *In the Steppes of Central Asia*.** Wide, slow caravan journey; gentle sense of travel and distance — a calm map feels exploratory, not idle.
3. **Tchaikovsky — *The Seasons*: November "Troika" (music-box arr.).** Sleigh-ride lilt as a toy music box = distinctly Russian + toy-box charm. *License caveat: NC-ND recording — audition-only; ship a PD/commissioned version.*

### 3. Mom's kitchen — cozy, warm, playful
1. **Tchaikovsky — Dance of the Sugar Plum Fairy.** Twinkling celesta reads as warm, magical, domestic — and it's a Nutcracker callback, keeping the score in one world.
2. **Tchaikovsky — *The Seasons*: June "Barcarolle" (music-box arr.).** Gentle lullaby-lilt; the music-box timbre suits a children's-kitchen toy-world. *NC-ND — audition-only.*
3. **Tchaikovsky — Waltz of the Flowers (US Air Force Band, PD).** Warm lilting waltz for a bustling-but-cozy kitchen; cleanly US-Gov PD.

### 4. Lesson rooms — light, must not distract from math
1. **Mussorgsky — *Promenade* (delicate).** Soft, sparse, slow — easy to think over, and a third dynamic of the title leitmotif (cohesion).
2. **Tchaikovsky — *The Seasons*: April "Snowdrop" (music-box arr.).** Simple, light, repetitive-friendly focus bed. *NC-ND — audition-only.*
3. **Borodin — *In the Steppes* (calm stretch).** Slow ambient pad-like texture; nearly subliminal under arithmetic.

## Cross-cutting idea (worth a look)
**Use the *Promenade* as a single recurring leitmotif across title → map → rooms** (bold → tranquillo → delicate). One melody the child subconsciously learns, re-orchestrated per screen, ties the whole app together for near-zero extra asset cost. This is the highest-leverage option and is reflected in the per-context picks above.

## Rejected / deferred (with reasons)
- **Rimsky-Korsakov — Flight of the Bumblebee:** iconic + Russian, but frantic — actively harms focus. Cut for rooms; possible SFX only.
- **Rachmaninoff / Prokofiev concertos, Tchaikovsky 1812 / Pathétique, Mussorgsky "Night on Bald Mountain":** too dramatic/loud/emotionally heavy for a kids' math bed.
- **Khachaturian "Sabre Dance", Shostakovich:** still in copyright (composers d. 1978 / 1975) — not PD.
- **Internet Archive commercial LP rips (Karajan, Cleveland, etc.):** recording still copyrighted — not shippable, excluded from the audition.
- **Music-box *Seasons* set (Gregor Quendel):** beautiful and on-theme, but **CC BY-NC-ND** — can't be looped/edited or shipped commercially. Kept in the audition as *vibe references* only.

## Next steps
1. Audition → pick one per context.
2. For any "free" Commons pick, confirm that file's exact license, then download + loop-trim into `public/music/<context>.{mp3,ogg}`.
3. For any music-box pick, source a PD recording (Musopen) or commission a short loop in that timbre.
4. Implement playback (per-screen `<audio loop>` with a global mute, crossfade on navigation) — a follow-up `ce-brainstorm`/`ce-plan`.
