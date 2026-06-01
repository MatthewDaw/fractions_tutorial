// generate-voice.mjs — bake the spoken lines into mp3 clips with ElevenLabs.
//
// Two speakers (Mom = female, Cook = male tutor), each a thick Russian-accented
// ElevenLabs voice. With ElevenLabs the accent lives in the VOICE, so the job is
// to pick the right library voices and put their ids in .env.
//
// ── One-time setup ───────────────────────────────────────────────────────────
//   1. Put your key in web/.env:   ELEVENLABS_API_KEY=...
//   2. Find Russian voices:        npm run voice -- --find russian
//        (or add voices in the ElevenLabs web Voice Library, then list your own:)
//                                  npm run voice -- --mine
//   3. Put the two ids in web/.env:
//        ELEVEN_VOICE_COOK=<male russian voice id>
//        ELEVEN_VOICE_MOM=<female russian voice id>
//
// ── Generate ─────────────────────────────────────────────────────────────────
//   npm run voice                 (bake missing clips)
//   npm run voice -- --force      (re-bake all)
//   npm run voice -- --only goal  (just these keys)
//
// Reads lines from src/voiceLines.js + intro cues from src/introR2.js and writes
// public/voice/<key>.mp3. Run it once (and again when a line changes); players
// never call the API.

import { writeFile, mkdir, access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LINES, SPEAKERS, speakerOf, MEOW_SFX } from "../src/voiceLines.js";
import { INTRO_CUES as INTRO_CUES_R1 } from "../src/introR1.js";
import { INTRO_CUES } from "../src/introR2.js";
import { INTRO_CUES as INTRO_CUES_R3 } from "../src/introR3.js";
import { INTRO_CUES as INTRO_CUES_R4 } from "../src/introR4.js";
import { INTRO_CUES as INTRO_CUES_R5 } from "../src/introR5.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "voice");
const ENV_PATH = join(__dirname, "..", ".env");

const API = "https://api.elevenlabs.io";
// Multilingual model: renders English in the chosen voice's (Russian) accent and
// is the most natural for accented English.
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
// Tuned for a CARTOONISH, over-the-top delivery: low stability => more wild,
// expressive, sing-song variation (not a flat narrator); high style =>
// exaggerates the voice's character; speaker boost for presence. If it ever gets
// TOO unhinged/unclear, nudge stability up (e.g. 0.4) or style down (e.g. 0.4).
const VOICE_SETTINGS = { stability: 0.22, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true };

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyKeys = (readFlag("--only") || "").split(",").map((s) => s.trim()).filter(Boolean);

function readFlag(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
}
async function exists(p) { try { await access(p); return true; } catch { return false; } }

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

function requireKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.error("✗ ELEVENLABS_API_KEY is not set. Get one at https://elevenlabs.io/app/settings/api-keys");
    console.error("  Add to web/.env:  ELEVENLABS_API_KEY=...");
    process.exit(1);
  }
  return key;
}

// ── Discovery: search the shared Voice Library for accented voices ────────────
async function findVoices(apiKey, query) {
  const q = query || "russian";
  const url = new URL(API + "/v1/shared-voices");
  url.searchParams.set("page_size", "30");
  url.searchParams.set("search", q);
  const res = await fetch(url, { headers: { "xi-api-key": apiKey } });
  if (!res.ok) throw new Error(`shared-voices HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const voices = data.voices || [];
  console.log(`\nVoice Library matches for "${q}" (${voices.length}):\n`);
  for (const v of voices) {
    const tags = [v.age, v.descriptive, (v.use_cases || v.use_case)].flat().filter(Boolean).join(", ");
    console.log(`  ${(v.name || "?").padEnd(22)} ${String(v.gender || "?").padEnd(7)} ${String(v.accent || "?").padEnd(12)} ${v.voice_id}`);
    if (tags) console.log(`    [${tags}]`);
    if (v.description) console.log(`    ${String(v.description).slice(0, 110)}`);
    if (v.preview_url) console.log(`    ▶ ${v.preview_url}`);
  }
  console.log(`\nPick a male id for ELEVEN_VOICE_COOK and a female id for ELEVEN_VOICE_MOM in web/.env.`);
  console.log(`(Some library voices must be added to your account first at https://elevenlabs.io/app/voice-library —`);
  console.log(` after adding, run \`npm run voice -- --mine\` to get the usable id.)`);
}

// ── List the voices already in your account ──────────────────────────────────
async function listMine(apiKey) {
  const res = await fetch(API + "/v1/voices", { headers: { "xi-api-key": apiKey } });
  if (!res.ok) throw new Error(`voices HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const voices = data.voices || [];
  console.log(`\nVoices in your account (${voices.length}):\n`);
  for (const v of voices) {
    const labels = v.labels || {};
    const tags = [labels.gender, labels.accent, labels.descriptive].filter(Boolean).join(", ");
    console.log(`  ${(v.name || "?").padEnd(22)} ${(v.voice_id).padEnd(26)} ${tags}`);
  }
  console.log(`\nSet ELEVEN_VOICE_COOK (male) and ELEVEN_VOICE_MOM (female) in web/.env to the ids above.`);
}

// ── TTS one line ─────────────────────────────────────────────────────────────
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

// ── SFX (the Cat's meows) — ElevenLabs sound-generation, no voice id needed ───
async function synthSfx(apiKey, prompt) {
  const url = `${API}/v1/sound-generation`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
    // short, single meow; higher prompt_influence so the descriptor (mood) lands.
    body: JSON.stringify({ text: prompt, duration_seconds: 1.4, prompt_influence: 0.6 }),
  });
  if (!res.ok) throw new Error(`SFX HTTP ${res.status} ${res.statusText} ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return Buffer.from(await res.arrayBuffer());
}

// All clips to bake: lesson lines + intro narration cues. A clip whose key is in
// MEOW_SFX is a Cat meow — rendered as a sound effect, not speech (no voice id).
function allJobs() {
  const jobs = Object.keys(LINES).map((key) => ({ key, text: LINES[key], speaker: speakerOf(key), sfx: MEOW_SFX[key] || null }));
  const introCues = [...INTRO_CUES_R1, ...INTRO_CUES, ...INTRO_CUES_R3, ...INTRO_CUES_R4, ...INTRO_CUES_R5];
  for (const c of introCues) jobs.push({ key: c.key, text: c.text, speaker: c.speaker || speakerOf(c.key) || "cook", sfx: null });
  return jobs;
}

async function main() {
  await loadDotEnv();
  const apiKey = requireKey();

  const findIdx = args.indexOf("--find");
  if (findIdx >= 0) return findVoices(apiKey, readFlag("--find"));
  if (args.includes("--mine")) return listMine(apiKey);

  await mkdir(OUT_DIR, { recursive: true });
  const jobs = allJobs().filter((j) => onlyKeys.length === 0 || onlyKeys.includes(j.key));
  if (jobs.length === 0) { console.error(`✗ No matching lines for --only ${onlyKeys.join(",")}`); process.exit(1); }

  // Resolve voices only for SPEECH speakers that actually have lines to bake, so
  // a not-yet-cast character doesn't block the rest. Meow (sfx) jobs need no voice.
  const usedSpeakers = [...new Set(jobs.filter((j) => !j.sfx).map((j) => j.speaker))];
  const voiceFor = {};
  for (const id of usedSpeakers) {
    const sp = SPEAKERS[id];
    const vid = sp && process.env[sp.voiceEnv];
    if (vid) voiceFor[id] = vid;
  }
  const hasSpeechJobs = jobs.some((j) => !j.sfx);
  if (hasSpeechJobs && Object.keys(voiceFor).length === 0) {
    console.error("✗ No voices set. Add ELEVEN_VOICE_* ids to web/.env (npm run voice -- --find russian).");
    process.exit(1);
  }

  console.log(`Baking up to ${jobs.length} clip(s) → ${OUT_DIR}`);
  for (const id of usedSpeakers) {
    const sp = SPEAKERS[id] || { label: id };
    console.log(voiceFor[id] ? `  ${sp.label}: voice ${voiceFor[id]}` : `  ${sp.label}: (no voice set — its lines will be skipped)`);
  }
  console.log("");

  let made = 0, skipped = 0, failed = 0;
  for (const job of jobs) {
    const outPath = join(OUT_DIR, `${job.key}.mp3`);
    // speech jobs need a cast voice; meow (sfx) jobs never do.
    if (!job.sfx && !voiceFor[job.speaker]) {
      const env = (SPEAKERS[job.speaker] || {}).voiceEnv || "?";
      console.log(`  • ${job.key.padEnd(16)} skip (no voice for "${job.speaker}" — set ${env})`);
      skipped++;
      continue;
    }
    if (!force && (await exists(outPath))) {
      console.log(`  • ${job.key.padEnd(16)} skip (exists; --force to re-bake)`);
      skipped++;
      continue;
    }
    try {
      const buf = job.sfx
        ? await synthSfx(apiKey, job.sfx)
        : await synth(apiKey, voiceFor[job.speaker], job.text);
      await writeFile(outPath, buf);
      console.log(`  ✓ ${job.key.padEnd(16)} ${(job.sfx ? "meow" : job.speaker).padEnd(7)} ${(buf.length / 1024).toFixed(0)} KB`);
      made++;
    } catch (err) {
      console.error(`  ✗ ${job.key.padEnd(14)} ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone — ${made} baked, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
