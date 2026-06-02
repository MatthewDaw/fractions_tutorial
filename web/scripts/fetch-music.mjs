// fetch-music.mjs — download the CHOSEN background-music tracks into
// public/music/<slug>.mp3 for in-app playback (see src/music.js).
//
//   npm run music-fetch            (download missing)
//   npm run music-fetch -- --force
//
// All free-licensed (Wikimedia Commons PD/CC, US-Gov PD). Commons rate-limits
// bulk fetches, so requests are heavily spaced + retried. If a track fails here,
// just re-run on your own machine — your residential IP is rate-limited less.
//
// EVERY app track is MP3: Ogg Vorbis is not universally decoded (silent in some
// Chrome/tablet setups, unsupported on iOS Safari), so any Commons .ogg source is
// transcoded to .mp3 here via the bundled static ffmpeg. Keep these slugs in sync
// with src/music.js.

import { writeFile, mkdir, access, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "music");
const force = process.argv.includes("--force");
const MP3_BITRATE = "192k";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

function commons(file) {
  const name = file.replace(/ /g, "_");
  const h = createHash("md5").update(name, "utf8").digest("hex");
  return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h[0]}${h[1]}/${encodeURIComponent(name)}`;
}

// slug (becomes public/music/<slug>, always .mp3) -> Commons source filename.
// Sources may be .ogg or .mp3; .ogg is transcoded to .mp3 after download.
const TRACKS = {
  "borodin-steppes.mp3": "Alexander Borodin - In The Steppes Of Central Asia.ogg",
  "waltz-flowers.mp3":   "Waltz of the Flowers - Concert Band - United States Air Force Band.mp3",
  "old-castle.mp3":      "Modest Mussorgsky - pictures at an exhibition - ii. il vecchio castello - andante.ogg",
  "bydlo.mp3":           "Modest Mussorgsky - pictures at an exhibition - iv. bydlo - sempre moderato, pesante.ogg",
  "sym4-andantino.mp3":  "P.I. Tchalkovsky Symphony No.4 in F Minor Op.36 II. Andantino (Tchaikovsky) European Archive.ogg",
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

function transcodeToMp3(srcPath, outPath) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ["-y", "-loglevel", "error", "-i", srcPath, "-codec:a", "libmp3lame", "-b:a", MP3_BITRATE, outPath]);
    let err = "";
    p.stderr.on("data", (d) => { err += d; });
    p.on("error", reject);
    p.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${err.slice(0, 200)}`)));
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let made = 0, skipped = 0, failed = 0;
  for (const [slug, file] of Object.entries(TRACKS)) {
    const outPath = join(OUT_DIR, slug);
    if (!force && (await exists(outPath))) { console.log(`  • ${slug} (exists)`); skipped++; continue; }
    try {
      const srcIsMp3 = extname(file).toLowerCase() === ".mp3";
      if (srcIsMp3) {
        const size = await download(commons(file), outPath);
        console.log(`  ✓ ${slug.padEnd(22)} ${(size / 1024 | 0)} KB`);
      } else {
        const tmp = join(OUT_DIR, `.tmp${extname(file)}`);
        await download(commons(file), tmp);
        await transcodeToMp3(tmp, outPath);
        await unlink(tmp).catch(() => {});
        const size = (await import("node:fs")).statSync(outPath).size;
        console.log(`  ✓ ${slug.padEnd(22)} ${(size / 1024 | 0)} KB (transcoded from ${extname(file)})`);
      }
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
