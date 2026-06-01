// fetch-music.mjs — download the CHOSEN background-music tracks into
// public/music/<slug>.<ext> for in-app playback (see src/music.js).
//
//   npm run music-fetch            (download missing)
//   npm run music-fetch -- --force
//
// All free-licensed (Wikimedia Commons PD/CC, US-Gov PD). Commons rate-limits
// bulk fetches, so requests are heavily spaced + retried. If a track fails here,
// just re-run on your own machine — your residential IP is rate-limited less.

import { writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "music");
const force = process.argv.includes("--force");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

function commons(file) {
  const name = file.replace(/ /g, "_");
  const h = createHash("md5").update(name, "utf8").digest("hex");
  return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h[0]}${h[1]}/${encodeURIComponent(name)}`;
}

// slug (becomes public/music/<slug>) -> Commons source filename. Keep slugs in
// sync with src/music.js.
const TRACKS = {
  "borodin-steppes.ogg": "Alexander Borodin - In The Steppes Of Central Asia.ogg",
  "waltz-flowers.mp3":   "Waltz of the Flowers - Concert Band - United States Air Force Band.mp3",
  "old-castle.ogg":      "Modest Mussorgsky - pictures at an exhibition - ii. il vecchio castello - andante.ogg",
  "bydlo.ogg":           "Modest Mussorgsky - pictures at an exhibition - iv. bydlo - sempre moderato, pesante.ogg",
  "sym4-andantino.ogg":  "P.I. Tchalkovsky Symphony No.4 in F Minor Op.36 II. Andantino (Tchaikovsky) European Archive.ogg",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function download(url, outPath) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 429) { await sleep(6000 * (i + 1)); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await writeFile(outPath, Buffer.from(await r.arrayBuffer()));
      return (await import("node:fs")).statSync(outPath).size;
    } catch (e) { if (i === 5) throw e; await sleep(4000 * (i + 1)); }
  }
  throw new Error("rate-limited after retries");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let made = 0, skipped = 0, failed = 0;
  for (const [slug, file] of Object.entries(TRACKS)) {
    const outPath = join(OUT_DIR, slug);
    if (!force && (await exists(outPath))) { console.log(`  • ${slug} (exists)`); skipped++; continue; }
    try {
      const size = await download(commons(file), outPath);
      console.log(`  ✓ ${slug.padEnd(22)} ${(size / 1024 | 0)} KB`);
      made++;
    } catch (e) {
      console.error(`  ✗ ${slug.padEnd(22)} ${e.message}`);
      failed++;
    }
    await sleep(8000); // be very polite to Commons between files
  }
  console.log(`\n${made} downloaded, ${skipped} skipped, ${failed} failed → public/music/`);
  if (failed) console.log("Re-run `npm run music-fetch` (works better from your own machine/IP).");
}
main().catch((e) => { console.error(e); process.exit(1); });
