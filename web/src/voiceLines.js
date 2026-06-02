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
    "The blocks are different sizes — rename BOTH as equivalent fractions over the same bottom, " +
    "so every block is the same size, then add them like same-denominators. " +
    "A fast way to find that shared bottom is to multiply the two bottoms — but the reason it works is the equivalent fractions.",
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

  // --- Lesson 4 (Simplify). Worked example 8/12 → 2/3. ---
  r4Goal:
    "Babushka's recipe came out as eight out of twelve. Group the cells and divide the top and bottom by the same number to find its simplest name, keeping the amount exactly the same.",
  r4Fewest: "Lowest terms! You divided the top and the bottom by the same number — that's dividing by one — so the amount never changed. Eight twelfths and two thirds are the same amount; two thirds is just its simplest name.",
  r4Bigger: "Good — you divided the top and bottom by the same number, and the filled edge held, so it's still the same amount. You can group it further to reach its simplest name.",
  r4Uneven: "That group size doesn't come out even — the top and bottom can't both split into that many. Pick a number that divides both evenly.",
  r4KeepSame: "Keep it the same amount — your answer has to stay equal to eight twelfths. Divide the top and the bottom by the same number, so you're really dividing by one.",

  // --- Lesson 5 (Whole Units / improper → mixed). Worked example 9/7 → 1 and 2/7. ---
  r5Goal:
    "Babushka needs nine sevenths of a tray — but that's more than one whole. " +
    "Group the pieces into whole units, then name the leftover.",
  r5WholeLocked: "Snap! Seven pieces make one whole. Two sevenths are left over. Now write the mixed number — how many wholes, and the leftover.",
  r5GroupFirst: "Group the pieces into a whole first. Drag them into the frame until it fills.",
  r5LeftoverOnly: "Careful — the leftover is only the pieces outside the whole. One whole took seven, so two are left.",
  r5NotQuite: "Not quite. One whole filled, two sevenths sit in the leftover tray. Write one whole and the leftover on top.",
  r5FullMarks: "Yes! Nine sevenths is one whole and two sevenths. Full marks!",

  // --- Simplify (R4) partial-credit line: a correct same-amount answer that is
  // not yet in lowest terms. Spoken on the two-star accept (CCSS: four eighths is
  // correct because it equals one half). ---
  r3Partial: "Right — that is the same amount, so it is correct! Two marks. Can you find its smallest name? Divide the top and the bottom once more.",

  // ===========================================================================
  // CCSS GAP-FILL LESSONS (plan 007): nl "On the Number Line" (FRACTION_ON_LINE),
  // s1 "Taking Away" (SUB_SAME_DEN), cmp "Compare & Check" (COMPARE_BENCHMARK).
  // Babushka-voiced goal lines (mom); the rest are the coaching Cook by default.
  // Fractions spelled out for the neural voice.
  // ===========================================================================

  // --- nl "On the Number Line" (CCSS 3.NF.A.2) ---
  nlGoal:
    "A fraction is a number — a single point on the line. Cut the line from zero to one into equal parts, then count from zero to find the point.",
  nlPlace:
    "Count the equal parts from zero. The bottom number is how many parts the whole is cut into; the top number is how many you count along.",
  nlWin:
    "Yes! That point IS the number — a fraction lives on the line, just like a whole number.",

  // --- s1 "Taking Away" (CCSS 4.NF.B.3a + 4.NF.B.3b). Anchor five eighths minus two eighths. ---
  s1Goal:
    "Babushka had five eighths of a loaf and used two eighths. The pieces are the same size, so take the tops apart and keep the bottom the same.",
  s1Decompose:
    "Five eighths is just five little one eighth pieces put together: one eighth plus one eighth plus one eighth plus one eighth plus one eighth. Break them apart so we can take some away.",
  s1TakeAway:
    "Take two eighths away and count what is left. Keep the bottom number the same — we only take pieces from the top.",
  s1Win:
    "Yes! Five eighths take away two eighths is three eighths. Subtract the tops, keep the bottom the same!",

  // --- cmp "Compare & Check" (CCSS 3.NF.A.3d / 4.NF.A.2 / 5.NF.A.2) ---
  cmpGoal:
    "Which fraction is bigger? Look at the two lines — the mark farther to the right is the larger amount. Pick the sign that goes between them: less than, equal, or greater than.",
  cmpBenchmark:
    "Pick the nearest landmark: zero, one half, or one. The half way mark is called out on the line so you can compare against it.",
  cmpReason:
    "Do not add it up — just reason about the size. One half is exactly a half, and two thirds is more than a half, so the total must be more than one whole.",
  cmpWin:
    "Yes! You reasoned it out without ever adding. A fraction's size tells you a lot.",

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
    "Grandpa grilled four eighths of the sausage chain, then added three eighths more. How much is on the plate now?",
  mr_gp_sausage_1: "Four eighths, then three eighths more — seven eighths of sausage on one plate. I may weep.",
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
    "Eight twelfths of the carrots are loose. Tie them into the biggest equal bundles. Write the tidy fraction.",
  mr_gp_carrots_1: "Eight loose carrots, tied into two thirds — neat as a row of soldiers, eh, malysh?",
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

  // ===========================================================================
  // MULTIPLICATION ROOMS (m1 Equal Groups, m2 Baking Trays, m3 Times Facts).
  // Intro narration (m1i_/m2i_/m3i_) is the Cook; in-room goal/nudge lines are
  // Babushka (mr_mom_*); Words-stage story read-alouds are the owner character
  // (mr_kid_/mr_grandpa_). Products spelled out in words for the voice.
  // ===========================================================================

  // --- m1 "Equal Groups" intro (Cook). Worked example 3 × 4 = 12. ---
  m1i_intro: "Babushka sets out three plates.",
  m1i_first: "Four pelmeni on the first plate.",
  m1i_same: "The same four on the next plate — every plate gets the same.",
  m1i_third: "And the same four again. Three equal plates of four.",
  m1i_add: "Four, plus four, plus four — add the group again and again.",
  m1i_times: "Three groups of four is three times four — twelve. Count the groups, not the numbers.",

  // --- m1 in-room (Babushka). Goal caption + every award; Applied nudge. ---
  mr_mom_goal_1:
    "Babushka has three plates, and she wants the same four pelmeni on every plate — add the group again and again, or multiply.",
  mr_mom_nudge_1:
    "Same plates either way, povaryonok — three plates of four. Set the plates first, then the pelmeni on each.",

  // --- m2 "Baking Trays" intro (Cook). Worked example 4 × 6 = 24. ---
  m2i_intro: "Loose buns all over — too messy to count.",
  m2i_tidy: "Tidy them into a tray: four rows of six.",
  m2i_count: "Count by rows — six, twelve, eighteen, twenty-four.",
  m2i_spin: "Spin the tray: four rows of six, or six rows of four — still twenty-four.",
  m2i_score: "Score it: four sixes is four fours and four twos — sixteen plus eight is twenty-four.",
  m2i_close: "A tray is a rectangle, povaryonok — rows times columns.",

  // --- m2 in-room (Babushka). Goal caption + every award; setup nudge. ---
  mr_mom_goal_m2:
    "Babushka's tray has four rows of six buns — a rectangle. Count it as rows times columns: four times six.",
  mr_mom_nudge_m2:
    "Rows times columns, povaryonok — set how many rows, then how many in each row. Either way around makes the same tray.",

  // --- m2 Words-stage banter (owner character, after a correct answer).
  // Only 4×6 (kid) and 5×8 (grandpa) are reachable as wired; the cat lines
  // (3×4, 8×2) are MEOW SFX (see MEOW_SFX) with Babushka carrying the count. ---
  mr_kid_4x6_1: "Four rows of six — that's twenty-four buns! I counted every single row!",
  mr_grandpa_5x8_1: "Five rows of eight, lined up like soldiers — forty pelmeni, malysh. Not one out of place.",
  mr_cat_3x4_1: "Mrow?",
  mr_grandpa_6x7_1: "Six by seven, split into the easy pieces — forty-two squares of pryanik altogether.",
  mr_kid_7x9_1: "Seven rows of nine — I split the big rack and got sixty-three cookies!",
  mr_cat_8x2_1: "Mrrr.",

  // --- m3 "Times Facts" intro (Cook). Worked example 7 × 8 = 56, products in words. ---
  m3i_intro: "Seven empty jars, and a scoop that holds eight.",
  m3i_scoop: "One handful into each jar — eight at a time.",
  m3i_count: "Count by eights: eight, sixteen, twenty-four, thirty-two, forty, forty-eight, fifty-six.",
  m3i_write: "Seven eights are fifty-six. Seven times eight is fifty-six.",
  m3i_byheart: "Skip-counting gets you there — but a master cook knows it by heart.",
  m3i_trick: "And if you forget, split it: seven fives and seven threes — thirty-five and twenty-one make fifty-six.",

  // --- m3 in-room goal/award lines (Babushka). The goal caption uses mr_mom_goal;
  // each stage's award reads a per-stage variant. Products spelled in words. ---
  mr_mom_goal:
    "Babushka has seven jars and scoops eight mushrooms into each — skip-count to the total, then learn the fact by heart: seven times eight.",
  mr_mom_goal_jar:
    "Yes! Seven eights skip-counted up to fifty-six. Seven times eight is fifty-six.",
  mr_mom_goal_ribbon:
    "Yes! The ribbon counts eight, sixteen, twenty-four, thirty-two, forty, forty-eight, fifty-six — seven times eight is fifty-six.",
  mr_mom_goal_line:
    "Yes! The line lands on fifty-six. Seven times eight is fifty-six.",
  mr_mom_goal_workbench:
    "Yes! Seven groups of eight — built and counted up. Seven times eight is fifty-six.",
  mr_mom_goal_bare:
    "Write the product, povaryonok — seven times eight.",
  mr_mom_goal_timesone:
    "Times one keeps the number just as it is.",
  mr_mom_goal_timeszero:
    "Times zero is always zero — no groups, nothing in the jar.",
  mr_mom_goal_fluent:
    "Times-zero is always zero, times-one keeps the number — you know them now.",
  mr_mom_goal_applied:
    "Yes! Seven times eight is fifty-six.",
  mr_mom_goal_words:
    "Yes! Seven bundles of eight — seven times eight is fifty-six.",

  // --- m3 in-room nudges (Babushka). ---
  mr_mom_nudge_write:
    "Write the product on the slate, povaryonok — how many in all?",
  mr_mom_nudge_addvsmult:
    "That is adding the numbers — we want groups of. Skip-count the jar instead.",
  mr_mom_nudge_skipcount:
    "Not there yet — keep scooping eight at a time and count along the jar.",
  mr_mom_nudge_fill:
    "Fill in both numbers for me — how many groups, and how many in each.",
  mr_mom_nudge_skipline:
    "Hop along the line by eights, povaryonok — land each jump on the next mark.",

  // --- m3 Words-stage story read-aloud (Grandpa). ---
  mr_grandpa_bundles_1:
    "Grandpa tied seven bundles of eight twigs each. Seven bundles of eight — fifty-six twigs, malysh, counted twice to be sure.",
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
  // m2 Baking Trays cat banter (unreachable as wired, kept for completeness):
  mr_cat_3x4_1: "a single curious, questioning little house cat mew, rising at the end",
  mr_cat_8x2_1: "a single low, guarding, possessive house cat meow",
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
  // CCSS gap-fill lessons — the goal lines are Babushka; coaching stays Cook.
  nlGoal: "mom",
  s1Goal: "mom",
  cmpGoal: "mom",
};

// Resolve a clip key (lesson line OR intro cue) to its speaker id.
// Babushka's Room keys carry the speaker as a prefix: mr_kid_*, mr_gp_*, mr_cat_*,
// mr_mom_* — so each banter line auto-routes to the right voice.
export const speakerOf = (key) => {
  if (LINE_SPEAKER[key]) return LINE_SPEAKER[key];
  if (key.startsWith("mr_kid_")) return "kid";
  if (key.startsWith("mr_gp_")) return "grandpa";
  if (key.startsWith("mr_grandpa_")) return "grandpa"; // m2/m3 use the full owner name
  if (key.startsWith("mr_cat_")) return "cat";
  if (key.startsWith("mr_mom_")) return "mom";
  return DEFAULT_SPEAKER;
};
