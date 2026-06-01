// voiceLines.js — single source of truth for every spoken line in the lesson.
//
// Each entry is a fixed line a character says aloud. The KEY names the audio
// clip (web/public/voice/<key>.mp3, pre-baked by scripts/generate-voice.mjs);
// the VALUE is the exact text — both the words the neural voice reads AND the
// text the browser Web Speech fallback reads if a clip is missing.
//
// Wording is TTS-friendly: fractions are spelled out ("one half", not "1/2")
// because neural voices read words far more reliably than "1/2".
//
// Two speakers (see SPEAKERS / LINE_SPEAKER below): a female "Babushka" and a male
// tutor ("Cook"). Each maps to a distinct, thick-Russian-accented ElevenLabs
// voice. With ElevenLabs the accent lives in the VOICE, not a text prompt — so
// thickness is chosen by picking the right library voices (see generate-voice).
//
// To add or change a line: edit it here, then run `npm run voice` to (re)bake
// the affected clip. App.jsx calls say("<key>").

export const LINES = {
  // --- Title / intro screen. Spoken by the Cook (tutor) on app load. ---
  titleWelcome: "Welcome to Babushka's Fractions!",

  goal:
    "Babushka needs one half of a dough strip plus one third of a dough strip. " +
    "The blocks are different sizes — slice them until every block is the same size, " +
    "join them, then write the total.",
  denPrompt: "Same size blocks! Now write the bottom number — how big is each block?",
  dontFit: "They don't fit. Make the blocks the same size first.",
  joined: "Joined! Count every block and write the top number.",
  sliceFirst: "Slice the strips into the same size blocks first.",
  dragTogether: "Drag the strips together to join them.",
  notQuite: "Not quite. Count every block.",
  fullMarks: "Yes! One half plus one third is five sixths. Full marks!",
  sameAs: "Right! That is the same as five sixths.",

  // --- Lesson 1 (Same Pieces). No pre-baked clips yet, so these play via the
  // Web Speech fallback until `npm run voice` bakes them. ---
  r1Goal:
    "Babushka needs two sevenths of a tray of oat cakes and three sevenths of a tray. " +
    "The pieces are already the same size — just count them up, and keep the bottom number the same.",
  r1CountUp: "Count them up — five sevenths. The bottom stays the same. Write the top number.",
  r1CountThem: "All one stack now. Count the pieces and write how many on top. The bottom stays the same.",
  r1Split: "Split them back apart — drag them together when you're ready to count.",
  r1FirstMerge: "Bring the stacks together and count the pieces first.",
  r1KeepBottom: "Careful — the bottom number is locked. We only count the tops.",
  r1NotQuite: "Not quite. Count every piece. The bottom stays the same.",
  r1FullMarks: "Yes! Two sevenths plus three sevenths is five sevenths. Full marks!",

  // --- Lesson 3 (More Than One Piece / non-unit). Worked example 3/8 + 1/4 = 5/8. ---
  r3Goal:
    "Babushka needs three eighths of a dough strip plus one quarter of a strip. " +
    "The blocks are different sizes — slice them until every block is the same size, " +
    "join them, then write the total.",
  r3FullMarks: "Yes! Three eighths plus one quarter is five eighths. Full marks!",
  r3SameAs: "Right! That is the same as five eighths.",

  // --- Lesson 4 (Tidying Up / simplify). Worked example 8/12 → 2/3. ---
  r4Goal:
    "Babushka's recipe came out as eight twelfths — too many tiny pieces. " +
    "Fuse equal groups into the fewest, biggest blocks, keeping the amount the same.",
  r4Fewest: "Fewest pieces! You fused them into the biggest blocks. Divide the top and bottom by the same number, then write the tidied fraction.",
  r4Bigger: "Bigger blocks now — you divided the top and bottom by the same number, and the amount held. Can you tidy it further?",
  r4Uneven: "That group size doesn't come out even — the top and bottom can't both split into that many. Try another group size.",
  r4KeepSame: "Keep the same amount — it has to stay equal to eight twelfths. Divide the top and bottom by the same number.",

  // --- Lesson 5 (Whole Units / improper → mixed). Worked example 9/7 → 1 and 2/7. ---
  r5Goal:
    "Babushka needs nine sevenths of a tray — but that's more than one whole. " +
    "Group the pieces into whole units, then name the leftover.",
  r5WholeLocked: "Snap! Seven pieces make one whole. Two sevenths are left over. Now write the mixed number — how many wholes, and the leftover.",
  r5GroupFirst: "Group the pieces into a whole first. Drag them into the frame until it fills.",
  r5LeftoverOnly: "Careful — the leftover is only the pieces outside the whole. One whole took seven, so two are left.",
  r5NotQuite: "Not quite. One whole filled, two sevenths sit in the leftover tray. Write one whole and the leftover on top.",
  r5FullMarks: "Yes! Nine sevenths is one whole and two sevenths. Full marks!",

  // ===========================================================================
  // BABUSHKA'S ROOM — story / word problems. Babushka poses each problem (mr_mom_goal_*),
  // gives nudges on a slip (mr_mom_nudge_*), and the counter cast banters AFTER
  // a correct answer (mr_<who>_<slug>_<n>). Fractions spelled out for the voice.
  // ===========================================================================

  // --- room framing ---
  mr_mom_welcome:
    "Welcome to my kitchen, solnyshko! Everybody has a little problem today. Read the story, find the number — and we will see who is exaggerating.",
  mr_mom_finale:
    "Every recipe, solved! You, solnyshko, are the smartest cook in this whole noisy kitchen. Now — who is hungry?",

  // --- Babushka's nudges (shared across problems) ---
  mr_mom_nudge_samebottom:
    "The pieces are the same size, so the bottom number does not grow. Only count the tops.",
  mr_mom_nudge_op:
    "Read it once more, solnyshko — are we adding more on, or taking some away?",
  mr_mom_nudge_count:
    "Count again, solnyshko — every piece, and the bottom stays the same.",
  mr_mom_nudge_unlike:
    "Different size pieces! Cut them to the same size first, and only then add.",
  mr_mom_nudge_tidy:
    "That is the right amount — but tidy it down to the fewest, biggest pieces.",
  mr_mom_nudge_mixed:
    "More than one whole! Write the whole units first, then the leftover on the top.",
  mr_mom_nudge_fillboth:
    "Fill in both numbers for me — a top and a bottom.",
  mr_mom_nudge_scaleone:
    "One bottom fits inside the other — rename just that one fraction so the bottoms match, then add.",
  mr_mom_nudge_cross:
    "Neither bottom fits the other — rename both fractions to a shared bottom, then add.",

  // --- adaptive-flow lines (wall / skip-ahead / not-yet) ---
  mr_mom_wall:
    "Oof, this one is tricky, solnyshko! Pop into the lesson, then come back and show me.",
  mr_mom_skip:
    "Look at you! You already know the next lesson. Let us skip right ahead!",
  mr_mom_notyet:
    "Not yet — but that one is the next lesson. Let us go and learn it together!",

  // NOTE on the Cat: the Cat never uses words. Its banter beats (mr_cat_*) are
  // tailored MEOW sound effects (see MEOW_SFX below — generated via ElevenLabs'
  // sound-generation endpoint, a different meow per moment). The on-screen ribbon
  // shows the meow as onomatopoeia; Babushka carries the joke by reacting to it. So
  // every Cat exchange is: meow (a mood) → Babushka translates/answers → meow (a button).

  // --- R1: chocolate bar (Kid) — 3/8 + 2/8 of HIS chocolate is gone ---
  mr_mom_goal_choc:
    "You snapped off three eighths of the chocolate bar, and your brother snapped off two eighths. How much of the bar is gone?",
  mr_kid_choc_1: "Five eighths! But I only ate three eighths, I counted on the way down!",
  mr_mom_choc_2: "And your brother's two eighths makes five. That is half my baking bar, gone before lunch.",
  mr_kid_choc_3: "The other two eighths jumped into my mouth by themselves. Very brave squares.",

  // --- R1: Grandpa's pie (Grandpa) — ate 4/6, guards the last 2/6 ---
  mr_mom_goal_pie:
    "Grandpa's pie was cut into sixths. He ate four sixths at dinner. How much pie is left for breakfast?",
  mr_gp_pie_1: "Two sixths left! I will guard these two slices with my whole life.",
  mr_mom_pie_2: "Papa, last week you 'guarded' a cheesecake. There were no survivors.",
  mr_gp_pie_3: "A guard must taste for poison. Repeatedly. It is very dangerous work, malysh.",

  // --- R1: cracker sheet (Kid) — has 1/4, needs 2/4 MORE for s'mores ---
  mr_mom_goal_cracker:
    "The graham sheet snaps into four. You have one fourth, but s'mores need three fourths. How much more do you need?",
  mr_kid_cracker_1: "Two more fourths and the s'more is structurally complete!",
  mr_mom_cracker_2: "Structurally. Dushka, it is a marshmallow, not a bridge.",
  mr_kid_cracker_3: "A delicious bridge. Engineered straight into my mouth.",

  // --- R1: sausage chain (Grandpa) — 4/9 + 3/9 = 7/9 on the plate ---
  mr_mom_goal_sausage:
    "Grandpa grilled four ninths of the sausage chain, then added three ninths more. How much is on the plate now?",
  mr_gp_sausage_1: "Four ninths, then three ninths more — seven ninths of sausage on one plate. I may weep.",
  mr_mom_sausage_2: "He cried fewer tears at our wedding than he is crying right now.",
  mr_gp_sausage_3: "You did not sizzle in the pan, my love. The sausage, it sizzles.",

  // --- R1: egg carton (Cat) — 12/12 − 8/12 = 4/12 left (CAT = meows) ---
  mr_mom_goal_eggs:
    "Babushka set out a full carton — twelve twelfths of eggs. She used eight twelfths for baking. How many twelfths are left?",
  mr_cat_eggs_1: "Mrrrr…",
  mr_mom_eggs_2: "Four eggs left, and you are eyeing every one. Those four are for the cake, kotik — not for hockey.",
  mr_cat_eggs_3: "Mrow.",

  // --- R2: two trays (Kid) — 1/2 + 1/3 = 5/6, the Ben rivalry ---
  mr_mom_goal_trays:
    "You cut your tray into halves and Ben cut his into thirds. Babushka needs one half plus one third. Cut them to the same size, then add.",
  mr_kid_trays_1: "I cut halves, Ben cut thirds, and it comes out... sixths. Five sixths!",
  mr_mom_trays_2: "Two cooks, one cake. Sixths is how the two of you make peace.",
  mr_kid_trays_3: "Ben does not deserve peace. Ben licked the spoon and put it BACK.",

  // --- R2: dough + bacon (Grandpa) — 1/2 + 1/4 = 3/4 ---
  mr_mom_goal_doughbacon:
    "Grandpa has half a strip of dough and one fourth of a strip of bacon. Laid end to end on the ruler, how much is that altogether?",
  mr_gp_doughbacon_1: "Half of dough, one quarter of bacon — three quarters of a perfect morning.",
  mr_mom_doughbacon_2: "You measure the bacon more carefully than your own blood pressure, Papa.",
  mr_gp_doughbacon_3: "The bacon IS the blood pressure. Worth every single beat.",

  // --- R2: mismatched candy bars (Kid) — 1/4 + 1/6 = 5/12 ---
  mr_mom_goal_candy:
    "One candy bar splits into four, the other into six. You have one fourth and one sixth. Cut them to the same size, then add.",
  mr_kid_candy_1: "I cut a tiny candy into TWELFTHS just to add a fourth and a sixth. Five twelfths!",
  mr_mom_candy_2: "And now you know why we cut to the same size before we add.",
  mr_kid_candy_3: "I know it in my bones. And in my one missing twelfth. For testing.",

  // --- R3: lunchbox (Kid) — 6/8 tidies to 3/4 so the lid shuts ---
  mr_mom_goal_lunchbox:
    "Six eighths of a sandwich sits in little pieces. Pack it as the fewest, biggest pieces so the lid will close. Write the tidy fraction.",
  mr_kid_lunchbox_1: "Six little pieces — lid will not shut. Three big pieces — three fourths — and CLICK!",
  mr_mom_lunchbox_2: "Fewest pieces, and the lid finally forgives you.",
  mr_kid_lunchbox_3: "I deserve a prize for this. A snack-sized prize.",

  // --- R3: carrots (Grandpa) — 6/9 tidies to 2/3 (the messy-workshop callback) ---
  mr_mom_goal_carrots:
    "Six ninths of the carrots are loose. Tie them into the biggest equal bundles. Write the tidy fraction.",
  mr_gp_carrots_1: "Six loose carrots, tied into two thirds — neat as a row of soldiers, eh, malysh?",
  mr_mom_carrots_2: "If only your workshop learned the same lesson, Papa.",
  mr_gp_carrots_3: "My workshop has a system! The system is chaos. It works for me.",

  // --- R3: cookie tin (Cat) — 4/12 tidies to 1/3 (CAT = meows) ---
  mr_mom_goal_cookietin:
    "Four twelfths of the cookies rattle around loose. Group them into the fewest, biggest equal bundles. Write the tidy fraction.",
  mr_cat_cookietin_1: "Mrrp?",
  mr_mom_cookietin_2: "Four twelfths tidies down to one third — and no, that third is still not yours. Cats do not eat cookies.",
  mr_cat_cookietin_3: "MRRROW.",

  // --- R3: add then tidy (Kid) — 1/8 + 3/8 = 4/8, then tidy to 1/2 ---
  mr_mom_goal_addtidy:
    "First add one eighth plus three eighths. Then tidy your answer to the fewest, biggest pieces. Two steps!",
  mr_kid_addtidy_1: "Add — four eighths! Tidy — one half! Two steps and zero mistakes!",
  mr_mom_addtidy_2: "A two-step cook. Soon you will be running my whole kitchen.",
  mr_kid_addtidy_3: "Does the kitchen come with a snack budget? Asking for me, specifically.",

  // --- R4: cupcake boxes (Kid) — 14/4 = 3 boxes and 2 left over ---
  mr_mom_goal_cupcakebox:
    "You baked fourteen cupcakes and each box holds four. How many full boxes, and how many cupcakes left over?",
  mr_kid_cupcakebox_1: "Three full boxes... and two little cupcakes with no box at all.",
  mr_mom_cupcakebox_2: "And those two lonely ones never last long when you are in the room.",
  mr_kid_cupcakebox_3: "Hungry ghosts, Mama. I am only a witness.",

  // --- R4: cooling-rack pies (Grandpa) — 7/4 = 1 whole and 3/4 ---
  mr_mom_goal_coolpie:
    "Seven quarter-slices of pie are cooling. Four quarters make one whole pie. How many whole pies, and the leftover?",
  mr_gp_coolpie_1: "Seven quarter-slices — one whole pie, and three quarters more. Glorious!",
  mr_mom_coolpie_2: "And how many survive the windowsill until supper, Papa?",
  mr_gp_coolpie_3: "…One whole pie and three quarters FEWER. For quality control.",

  // --- R4: muffin tins (Cat) — 9/6 = 1 tin and 3/6 over (CAT = meows) ---
  mr_mom_goal_muffin:
    "Nine sixths of muffins came out — a tin holds six. How many whole tins, and how many sixths left over?",
  mr_cat_muffin_1: "Mrrrow…",
  mr_mom_muffin_2: "One full tin, and three muffins over — and do NOT bat those three onto the floor.",
  mr_cat_muffin_3: "Mew?",

  // --- R4: half-pie two-step (Cat) — 3/4 + 3/4 = 1 and 1/2 pies (CAT = meows) ---
  mr_mom_goal_halfpie:
    "Add three fourths of a pie plus three fourths of a pie. Then say it as whole pies and a leftover. Two steps!",
  mr_cat_halfpie_1: "Mrrrow!",
  mr_mom_halfpie_2: "One and one half pies — for the WHOLE family, kotik. That does not mean only you.",
  mr_cat_halfpie_3: "Mrr.",
};

// ── Cat meows (sound effects, not speech) ────────────────────────────────────
// The Cat never speaks words. Each mr_cat_* banter key maps to a tailored meow
// SFX prompt; `npm run voice` renders these via ElevenLabs' sound-generation
// endpoint to public/voice/<key>.mp3 (no character voice id needed). The matching
// LINES[key] above is the onomatopoeia shown in the ribbon (and the Web Speech
// fallback if a clip is missing).
export const MEOW_SFX = {
  mr_cat_eggs_1: "a single low, plotting house cat meow, mischievous, dry",
  mr_cat_eggs_3: "a single short, flat, unbothered house cat meow",
  mr_cat_cookietin_1: "a single hopeful, wheedling, begging house cat meow, rising at the end",
  mr_cat_cookietin_3: "a single loud, deeply offended house cat meow",
  mr_cat_muffin_1: "a single slow, scheming, drawn-out house cat meow",
  mr_cat_muffin_3: "a single short, innocent, questioning little house cat mew",
  mr_cat_halfpie_1: "a single grand, declarative, theatrical house cat meow",
  mr_cat_halfpie_3: "a single smug, dismissive, clipped house cat meow",
};

// ── Speakers ────────────────────────────────────────────────────────────────
// Two voices. Each speaker's ElevenLabs voice id comes from .env (so the picked
// library voice can change without touching code); `desc` documents intent for
// whoever picks the voice via `npm run voice -- --find russian`.
export const SPEAKERS = {
  cook: {
    label: "Cook — male tutor",
    voiceEnv: "ELEVEN_VOICE_COOK",
    // Target a CHARACTER / comedic voice, not a natural narrator.
    desc: "Cartoonishly exaggerated, silly, over-the-top thick Russian accent — a big, hammy, theatrical Russian master chef. Booming, comically heavy rolled R's, larger than life. Fun and goofy for kids, still clear enough to follow.",
  },
  mom: {
    label: "Babushka — female",
    voiceEnv: "ELEVEN_VOICE_MOM",
    desc: "Cartoonishly exaggerated, silly, over-the-top thick Russian accent — a warm, larger-than-life Russian mama. Theatrical, sing-song, comically heavy. Affectionate and goofy, still clear enough to follow.",
  },
  // ── Babushka's Room counter cast (banter only; they react AFTER the answer) ──
  kid: {
    label: "Kid — child apprentice",
    voiceEnv: "ELEVEN_VOICE_KID",
    desc: "A bright, eager young child apprentice with a light, playful thick-Russian-accented English. Excitable, cheeky, fast — a little goofball who loves snacks. Clear and kid-friendly.",
  },
  grandpa: {
    label: "Grandpa — old man",
    voiceEnv: "ELEVEN_VOICE_GRANDPA",
    desc: "A gruff, gravelly, lovable old Russian grandpa. Cartoonishly heavy accent, slow and grumbly, comically dramatic about food. Booming low rolled R's, warm underneath the grumble.",
  },
  // NOTE: the Cat is NOT a speaker — it only meows (see MEOW_SFX). No voice id.
};

// Who speaks each line. Anything not listed falls back to the prefix rules in
// speakerOf(), then to the Cook (male tutor). The goal / recipe-order lines are
// Mom; all coaching + intro narration is Cook.
export const DEFAULT_SPEAKER = "cook";
export const LINE_SPEAKER = {
  goal: "mom",
  r1Goal: "mom",
  r3Goal: "mom",
  r4Goal: "mom",
  r5Goal: "mom",
};

// Resolve a clip key (lesson line OR intro cue) to its speaker id.
// Babushka's Room keys carry the speaker as a prefix: mr_kid_*, mr_gp_*, mr_cat_*,
// mr_mom_* — so each banter line auto-routes to the right voice.
export const speakerOf = (key) => {
  if (LINE_SPEAKER[key]) return LINE_SPEAKER[key];
  if (key.startsWith("mr_kid_")) return "kid";
  if (key.startsWith("mr_gp_")) return "grandpa";
  if (key.startsWith("mr_cat_")) return "cat";
  if (key.startsWith("mr_mom_")) return "mom";
  return DEFAULT_SPEAKER;
};
