// bake-intro-voice.mjs — (re)bake the narration clips for the 8 intro "videos".
//
// Why this exists: every intro's narration is a set of pre-baked mp3s under
// public/voice/<key>.mp3, played in sync by RoomIntro.jsx. The multiplication
// intros (m1i_*, m2i_*, m3i_*) shipped without their clips, so those videos play
// silently. This script enumerates ALL 8 intro cue sheets (the authoritative
// source for intro narration), finds which clips are missing/empty, and renders
// them through the SAME ElevenLabs pipeline as scripts/generate-voice.mjs and the
// dev /api/tts proxy (same voice, model, settings, format) so new clips match the
// existing ones exactly.
//
// Intros are narrated by the Cook (the male tutor narrator); no cue sheet sets a
// per-line speaker, so every intro line uses ELEVEN_VOICE_COOK.
//
//   node scripts/bake-intro-voice.mjs            # bake only missing/empty clips
//   node scripts/bake-intro-voice.mjs --force    # re-bake every intro clip
//   node scripts/bake-intro-voice.mjs --dry      # list the diff, synthesize nothing
//
// Needs ELEVENLABS_API_KEY + ELEVEN_VOICE_COOK in web/.env (same as `npm run voice`).

import { writeFile, mkdir, access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SPEAKERS, speakerOf } from "../src/voiceLines.js";
import { INTRO_CUES as M1 } from "../src/introM1.js";
import { INTRO_CUES as M3 } from "../src/introM3.js";
import { INTRO_CUES as R1 } from "../src/introR1.js";
import { INTRO_CUES as R2 } from "../src/introR2.js";
import { INTRO_CUES as R3 } from "../src/introR3.js";
import { INTRO_CUES as R4 } from "../src/introR4.js";
import { INTRO_CUES as R5 } from "../src/introR5.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "voice");
const ENV_PATH = join(__dirname, "..", ".env");

// Same endpoint/model/settings/format as generate-voice.mjs and the /api/tts proxy.
const API = "https://api.elevenlabs.io";
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const VOICE_SETTINGS = { stability: 0.22, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true };

const args = process.argv.slice(2);
const force = args.includes("--force");
const dry = args.includes("--dry");

// Every intro cue sheet, in room order. Each cue: { gate, pause, key, text }.
const ALL_CUES = [
  ["m1", M1], ["m3", M3],
  ["r1", R1], ["r2", R2], ["r3", R3], ["r4", R4], ["r5", R5],
];

async function existsNonEmpty(p) {
  try { const s = await stat(p); return s.isFile() && s.size > 0; } catch { return false; }
}

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

async function synth(apiKey, voiceId, text) {
  const url = `${API}/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await loadDotEnv();

  // Flatten cues to jobs; dedupe by key (a key never repeats across sheets, but be safe).
  const seen = new Set();
  const jobs = [];
  for (const [room, cues] of ALL_CUES) {
    for (const c of cues) {
      if (seen.has(c.key)) continue;
      seen.add(c.key);
      const speaker = c.speaker || speakerOf(c.key) || "cook"; // intros: always the Cook
      jobs.push({ room, key: c.key, text: c.text, speaker });
    }
  }

  // Diff: which clips are present vs missing/empty.
  const missing = [];
  for (const j of jobs) {
    j.present = await existsNonEmpty(join(OUT_DIR, `${j.key}.mp3`));
    if (force || !j.present) missing.push(j);
  }

  console.log(`Intro clips: ${jobs.length} total, ${jobs.filter((j) => j.present).length} present, ${jobs.filter((j) => !j.present).length} missing/empty.`);
  if (force) console.log("(--force: every intro clip will be re-baked)");
  if (missing.length === 0) { console.log("Nothing to bake."); return; }

  console.log(`\nTo bake (${missing.length}):`);
  for (const j of missing) console.log(`  ${j.room}  ${j.key.padEnd(14)} [${j.speaker}]  "${j.text.slice(0, 60)}${j.text.length > 60 ? "…" : ""}"`);

  if (dry) { console.log("\n--dry: synthesized nothing."); return; }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("\n✗ ELEVENLABS_API_KEY is not set. Add it to web/.env, then re-run.");
    console.error("  ELEVENLABS_API_KEY=...   (https://elevenlabs.io/app/settings/api-keys)");
    process.exit(1);
  }

  // Resolve a voice id per speaker used (intros => cook).
  const voiceFor = {};
  for (const id of new Set(missing.map((j) => j.speaker))) {
    const sp = SPEAKERS[id];
    const vid = sp && process.env[sp.voiceEnv];
    if (vid) voiceFor[id] = vid;
    else { console.error(`\n✗ No voice id for speaker "${id}". Set ${sp ? sp.voiceEnv : "?"} in web/.env.`); process.exit(1); }
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log("");
  let made = 0, failed = 0;
  for (const j of missing) {
    const outPath = join(OUT_DIR, `${j.key}.mp3`);
    try {
      const buf = await synth(apiKey, voiceFor[j.speaker], j.text);
      await writeFile(outPath, buf);
      console.log(`  ✓ ${j.key.padEnd(14)} ${j.speaker.padEnd(7)} ${(buf.length / 1024).toFixed(0)} KB`);
      made++;
    } catch (err) {
      console.error(`  ✗ ${j.key.padEnd(14)} ${err.message}`);
      failed++;
    }
  }
  console.log(`\nDone — ${made} baked, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
