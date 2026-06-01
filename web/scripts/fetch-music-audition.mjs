// fetch-music-audition.mjs — generate the background-music audition page.
//
// Streams candidates straight from Wikimedia Commons' CDN (upload.wikimedia.org),
// whose URL is derived deterministically from the filename's MD5 (no API call,
// no download). The page is opened in YOUR browser, which streams each track on
// click — robust even though server-side bulk fetches from here get rate-limited.
//
//   npm run music-audition        (rebuild the page)
//
// All tracks are free-licensed (Wikimedia Commons PD/CC, US-Gov PD, and the
// "PDP-CH" Public-Domain-Project historic 78rpm transfers) and shippable; the
// exact per-file license is confirmed before a chosen track is downloaded +
// loop-trimmed for the game. Some are vintage-mono .flac — fitting the game's
// antique printed-page look; they may buffer a beat on first play.

import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "music", "_audition");

// Commons file -> direct CDN URL. path = /commons/<h0>/<h0h1>/<Name_with_underscores>
function commons(file) {
  const name = file.replace(/ /g, "_");
  const h = createHash("md5").update(name, "utf8").digest("hex");
  return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h[0]}${h[1]}/${encodeURIComponent(name)}`;
}

// context: title | map | kitchen | rooms ; `pick:true` = already chosen
const CANDIDATES = [
  // ── TITLE — chosen ──
  { ctx: "title", pick: true, composer: "Tchaikovsky", piece: "Trepak / Russian Dance (Nutcracker)",
    mood: "Fast, gleeful Russian folk-dance — your title pick.", lic: "Commons (free)",
    file: "Tchaikovsky - Nutcracker Suite - Russian Dance - Philip Milman - Lud and Schlatts Musical Emporium.wav" },

  // ── WORLD MAP — chosen ──
  { ctx: "map", pick: true, composer: "Borodin", piece: "In the Steppes of Central Asia",
    mood: "Wide, unhurried caravan journey — your map pick.", lic: "Commons (free)",
    file: "Alexander Borodin - In The Steppes Of Central Asia.ogg" },

  // ── MOM'S KITCHEN — your keepers + a clean playful sub for Reed Flutes ──
  { ctx: "kitchen", keep: true, composer: "Tchaikovsky", piece: "Waltz of the Flowers (band)",
    mood: "Warm, lilting waltz — bustling-but-cozy.", lic: "US-Gov PD (USAF Band)",
    file: "Waltz of the Flowers - Concert Band - United States Air Force Band.mp3" },
  { ctx: "kitchen", keep: true, composer: "Mussorgsky", piece: "Tuileries (Pictures at an Exhibition)",
    mood: "Children chattering and playing — sunny, domestic bustle.", lic: "Commons (free)",
    file: "Modest Mussorgsky - pictures at an exhibition - iii. tuileries - allegretto non troppo, capriccioso.ogg" },
  { ctx: "kitchen", keep: true, composer: "Mussorgsky", piece: "Ballet of the Unhatched Chicks (Pictures)",
    mood: "Tiny, comic, fluttering — adorable and silly.", lic: "Commons (free)",
    file: "Modest Mussorgsky - pictures at an exhibition - v. ballet des poussins dans leurs coques - scherzino. vivo leggiero.ogg" },
  { ctx: "kitchen", note: "CLEAN substitute for Reed Flutes", composer: "Mussorgsky", piece: "Limoges, the Market (Pictures)",
    mood: "Fast, chattering market bustle — playful, and a clean modern recording.", lic: "Commons (free)",
    file: "Modest Mussorgsky - pictures at an exhibition - vii. limoges. le marche - allegretto vivo, sempre scherzando.ogg" },
  { ctx: "kitchen", note: "the piece you wanted — vintage transfer, judge the noise", composer: "Tchaikovsky", piece: "Dance of the Reed Flutes (alt transfer)",
    mood: "The Reed Flutes you liked, a different 78rpm transfer. If still too noisy I can denoise it.", lic: "Commons · PDP-CH (PD, vintage)",
    file: "PDP-CH - National Symphony Orchestra of London - Stanford Robinson, conductor - The Nutcracker Suite, Op. 71 - Chinese Dance - The Reed, Pipe Dance - Tchaikovsky - Decca-k1143-ar9081.flac" },

  // ── LESSON ROOMS — your keepers + more calm/ambient in the same vein ──
  { ctx: "rooms", keep: true, composer: "Mussorgsky", piece: "The Old Castle (Pictures)",
    mood: "Slow, gentle, hypnotic drone-melody — ideal calm focus bed.", lic: "Commons (free)",
    file: "Modest Mussorgsky - pictures at an exhibition - ii. il vecchio castello - andante.ogg" },
  { ctx: "rooms", keep: true, composer: "Borodin", piece: "In the Steppes of Central Asia",
    mood: "Wide, unhurried caravan — you asked to add this to the rotation.", lic: "Commons · Musopen (PD)",
    file: "Alexander Borodin - In The Steppes Of Central Asia.ogg" },
  { ctx: "rooms", composer: "Mussorgsky", piece: "Bydlo — the Ox-Cart (Pictures)",
    mood: "Slow, plodding ostinato that swells and fades — distant, atmospheric.", lic: "Commons (free)",
    file: "Modest Mussorgsky - pictures at an exhibition - iv. bydlo - sempre moderato, pesante.ogg" },
  { ctx: "rooms", composer: "Tchaikovsky", piece: "Symphony No. 4 — II. Andantino",
    mood: "Famous wistful oboe melody — gentle, flowing, melancholy-calm.", lic: "Commons · European Archive (PD)",
    file: "P.I. Tchalkovsky Symphony No.4 in F Minor Op.36 II. Andantino (Tchaikovsky) European Archive.ogg" },
  { ctx: "rooms", composer: "Tchaikovsky", piece: "Symphony No. 6 — II. Allegro con grazia",
    mood: "Lilting 5/4 'limping waltz' — graceful, clean modern recording.", lic: "Commons · Musopen (PD)",
    file: "Tchaikovsky - Symphony No. 6 in B minor, Op. 74 'Pathétique' - II. Allegro con grazia (Musopen Symphony).flac" },
  { ctx: "rooms", composer: "Tchaikovsky", piece: "Symphony No. 3 — III. Andante",
    mood: "Slow, songful andante — warm and unhurried.", lic: "Commons · European Archive (PD)",
    file: "Tchaikovsky Symphony No.3 in D major III. Andante (Tchaikovsky) European Archive.ogg" },
];

const CONTEXTS = [
  { id: "title",   label: "Title screen", note: "Chosen: Trepak. (Reference.)" },
  { id: "map",     label: "World / lesson map", note: "Chosen: Borodin. (Reference.)" },
  { id: "kitchen", label: "Mom's kitchen", note: "Your keepers (✓), a clean playful substitute, and the Reed Flutes alt transfer." },
  { id: "rooms",   label: "Lesson rooms", note: "Your keepers (✓) plus more calm/ambient in the same vein." },
];

function buildHtml() {
  const section = (c) => {
    const rows = CANDIDATES.filter((x) => x.ctx === c.id).map((x) => {
      const badge = x.pick ? ` <span class="pick">✓ selected</span>`
                  : x.keep ? ` <span class="pick">✓ keeper</span>`
                  : x.note ? ` <span class="new">${x.note}</span>` : "";
      return `<tr class="${x.pick || x.keep ? "sel" : ""}"><td><div class="pc">${x.composer} — ${x.piece}${badge}</div>
        <div class="mood">${x.mood}</div><div class="lic">${x.lic}</div></td>
        <td><audio controls preload="none" src="${commons(x.file)}"></audio></td></tr>`;
    }).join("");
    return `<h2>${c.label}</h2><p class="note">${c.note}</p><table>${rows}</table>`;
  };
  return `<!doctype html><meta charset="utf-8"><title>Music audition — Russian classical</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;margin:32px auto;max-width:920px;padding:0 20px;color:#1c1612;background:#faf9f5}
  h1{font-size:22px}h2{margin:30px 0 2px;font-size:14px;letter-spacing:.04em;text-transform:uppercase;color:#a32a22}
  .note{margin:0 0 10px;color:#6b5a47;font-size:13px;font-style:italic}
  table{border-collapse:collapse;width:100%;margin-bottom:8px}td{border:1px solid #e3d4b1;padding:9px 11px;vertical-align:middle}
  td:first-child{width:56%}tr.sel td{background:#f3ecd9}.pc{font-weight:600}
  .pick{color:#5a7a3a;font-size:11px;letter-spacing:.04em}.new{color:#a35a22;font-size:11px;font-style:italic}.mood{font-size:12px;color:#6b5a47;margin-top:2px}
  .lic{font-size:11px;color:#7a8a5a;margin-top:3px}
  audio{width:100%;height:34px}
  .lead{color:#6b5a47;font-size:13px}.foot{margin-top:24px;font-size:12px;color:#6b5a47;border-top:1px solid #e3d4b1;padding-top:12px}
</style>
<h1>🎼 Background music audition — Kitchen &amp; Rooms options</h1>
<p class="lead">Title (Trepak) and Map (Borodin) are locked — shown for reference. Below them, <b>6 fresh candidates each</b>
for the kitchen and the lesson rooms. All free-licensed (Commons PD/CC, US-Gov PD, or PDP-CH public-domain transfers),
streamed live from Commons — first play may buffer; the PDP-CH ones are warm vintage mono.</p>
${CONTEXTS.map(section).join("")}
<div class="foot">Compositions are public domain (Mussorgsky, Tchaikovsky, Borodin). “PDP-CH” = Public Domain Project
historic 78rpm transfers (PD recording). Pick one per room and I'll download, loop-trim, and wire per-screen
<code>&lt;audio loop&gt;</code> playback with a global mute + crossfade.</div>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "index.html"), buildHtml());
  const k = CANDIDATES.filter((x) => x.ctx === "kitchen").length;
  const r = CANDIDATES.filter((x) => x.ctx === "rooms").length;
  console.log(`Wrote audition → public/music/_audition/index.html  (kitchen: ${k}, rooms: ${r})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
