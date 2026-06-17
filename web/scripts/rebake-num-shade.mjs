// rebake-num-shade.mjs — one-off: regenerate the num intro's two clips that need it
// and (for numi_shade) print exact word-start times so the box-fill animation in
// public/intros/num-top-number.html can be synced to the spoken count.
//
//   node scripts/rebake-num-shade.mjs
//
// Uses the SAME voice/model/settings/format as bake-intro-voice.mjs, but hits the
// /with-timestamps endpoint so we get a character-level alignment for the new mp3.

import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "voice");
const ENV_PATH = join(__dirname, "..", ".env");

const API = "https://api.elevenlabs.io";
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const VOICE_SETTINGS = { stability: 0.22, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true };

async function loadDotEnv() {
  let raw;
  try { raw = await readFile(ENV_PATH, "utf8"); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    if (line.trimStart().startsWith("#")) continue;
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

async function synthWithTimestamps(apiKey, voiceId, text) {
  const url = `${API}/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return res.json();
}

// Find the start time (s) of each target word in the character alignment.
function wordStarts(alignment, words) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const full = chars.join("");
  const lower = full.toLowerCase();
  const out = {};
  let from = 0;
  for (const w of words) {
    const idx = lower.indexOf(w.toLowerCase(), from);
    if (idx === -1) { out[w] = null; continue; }
    out[w] = starts[idx];
    from = idx + w.length;
  }
  const lastEnd = alignment.character_end_times_seconds[alignment.character_end_times_seconds.length - 1];
  return { out, lastEnd };
}

async function main() {
  await loadDotEnv();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVEN_VOICE_COOK;
  if (!apiKey || !voiceId) { console.error("Missing ELEVENLABS_API_KEY / ELEVEN_VOICE_COOK in web/.env"); process.exit(1); }

  const jobs = [
    { key: "numi_shade", text: "Shade the pieces you have — one, two, three, four, five.", count: true },
    { key: "numi_read",  text: "Five shaded out of eight — that's five eighths.", count: false },
  ];

  for (const j of jobs) {
    const r = await synthWithTimestamps(apiKey, voiceId, j.text);
    const buf = Buffer.from(r.audio_base64, "base64");
    await writeFile(join(OUT_DIR, `${j.key}.mp3`), buf);
    const al = r.alignment || r.normalized_alignment;
    const lastEnd = al.character_end_times_seconds[al.character_end_times_seconds.length - 1];
    console.log(`\n✓ ${j.key}.mp3  ${(buf.length / 1024).toFixed(0)} KB  duration≈${lastEnd.toFixed(2)}s`);
    if (j.count) {
      const { out } = wordStarts(al, ["one", "two", "three", "four", "five"]);
      console.log("  word starts (s, relative to clip start):");
      for (const w of ["one", "two", "three", "four", "five"]) {
        console.log(`    ${w.padEnd(5)} ${out[w] == null ? "?" : out[w].toFixed(3)}`);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
