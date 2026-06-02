// bake-all-voice.mjs — COMPREHENSIVE in-lesson voice bake for EVERY static line.
//
// Why this exists: `scripts/generate-voice.mjs` predates the multiplication rooms
// and Babushka's-Room work, and `scripts/bake-intro-voice.mjs` only handles the 8
// intro cue sheets. Neither one, on its own, guarantees that every STATIC keyed
// spoken line across ALL lessons has a clip — so newer levels (m1 Equal Groups,
// m2 Baking Trays, m3 Times Facts, plus newly-added Babushka's-Room lines) can
// play silent. This script is the single authoritative enumerator + baker:
//
//   • src/voiceLines.js  LINES  — every fixed, keyed spoken line (lessons + rooms)
//   • the 8 intro cue sheets    — introM1/M2/M3 + introR1..R5 narration cues
//   • MEOW_SFX                  — the Cat's wordless meows (sound-generation, no voice)
//
// It diffs that full static set against public/voice/<key>.mp3 (treating empty
// files as missing) and renders the missing clips through the SAME ElevenLabs
// pipeline as generate-voice.mjs / bake-intro-voice.mjs / the dev /api/tts proxy
// (same endpoint, model, voice settings, output format) so new clips match.
//
// Speaker→voice routing is voiceLines.js's speakerOf(): mom/cook/kid/grandpa each
// resolve to an ELEVEN_VOICE_* id in web/.env; the Cat is SFX-only (no voice id).
//
//   node scripts/bake-all-voice.mjs            # bake only missing/empty clips
//   node scripts/bake-all-voice.mjs --dry      # report total/present/missing, bake nothing
//   node scripts/bake-all-voice.mjs --force    # re-bake every static clip
//   node scripts/bake-all-voice.mjs --only k1,k2   # just these keys
//
// Needs ELEVENLABS_API_KEY + the per-speaker ELEVEN_VOICE_* ids in web/.env
// (same as `npm run voice`). A speaker with no voice id set is reported and its
// lines skipped — never fabricated.

import { writeFile, mkdir, access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LINES, SPEAKERS, speakerOf, MEOW_SFX } from "../src/voiceLines.js";
import { INTRO_CUES as M1 } from "../src/introM1.js";
import { INTRO_CUES as M2 } from "../src/introM2.js";
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
const onlyKeys = (readFlag("--only") || "").split(",").map((s) => s.trim()).filter(Boolean);

function readFlag(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
}
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
async function synthSfx(apiKey, prompt) {
  const url = `${API}/v1/sound-generation`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
    body: JSON.stringify({ text: prompt, duration_seconds: 1.4, prompt_influence: 0.6 }),
  });
  if (!res.ok) throw new Error(`SFX HTTP ${res.status} ${res.statusText} ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return Buffer.from(await res.arrayBuffer());
}

// Build the FULL static job set: every LINES entry + every intro cue, deduped by
// key. A key in MEOW_SFX is a Cat meow → sound effect (no voice id); everything
// else is speech routed by speakerOf().  `room` is just a grouping label.
function allJobs() {
  const ALL_CUES = [
    ["m1", M1], ["m2", M2], ["m3", M3],
    ["r1", R1], ["r2", R2], ["r3", R3], ["r4", R4], ["r5", R5],
  ];
  const introKeys = new Set();
  for (const [, cues] of ALL_CUES) for (const c of cues) introKeys.add(c.key);

  const roomOfKey = (key) => {
    if (/^m1i_|_m1$|^mr_mom_(goal_1|nudge_1)$/.test(key)) return "m1";
    if (/^m2i_|_m2$/.test(key)) return "m2";
    if (/^m3i_/.test(key)) return "m3";
    if (/^r1/.test(key) || key.endsWith("_choc") || key.endsWith("_cracker") || key.endsWith("_sausage") || key.endsWith("_eggs")) return "r1";
    if (/^r2/.test(key)) return "r2";
    if (/^r3/.test(key)) return "r3";
    if (/^r4/.test(key)) return "r4";
    if (/^r5/.test(key)) return "r5";
    if (/^mr_/.test(key)) return "rooms";
    return "core";
  };

  const seen = new Set();
  const jobs = [];

  // 1) Every keyed LINES entry.
  for (const key of Object.keys(LINES)) {
    if (seen.has(key)) continue;
    seen.add(key);
    jobs.push({
      key, text: LINES[key],
      speaker: speakerOf(key),
      sfx: MEOW_SFX[key] || null,
      room: introKeys.has(key) ? roomFromIntro(key) : roomOfKey(key),
    });
  }
  // 2) Every intro cue (text/speaker authored in the cue sheet; key may overlap
  //    LINES for m1/m2/m3 — already covered above, so only ADD new ones).
  for (const [room, cues] of ALL_CUES) {
    for (const c of cues) {
      if (seen.has(c.key)) continue;
      seen.add(c.key);
      jobs.push({ key: c.key, text: c.text, speaker: c.speaker || speakerOf(c.key) || "cook", sfx: null, room });
    }
  }
  return jobs;

  function roomFromIntro(key) {
    if (key.startsWith("m1i_")) return "m1";
    if (key.startsWith("m2i_")) return "m2";
    if (key.startsWith("m3i_")) return "m3";
    return "core";
  }
}

async function main() {
  await loadDotEnv();

  let jobs = allJobs();
  if (onlyKeys.length) jobs = jobs.filter((j) => onlyKeys.includes(j.key));

  // Diff against disk (empty file = missing).
  for (const j of jobs) j.present = await existsNonEmpty(join(OUT_DIR, `${j.key}.mp3`));
  const todo = jobs.filter((j) => force || !j.present);

  // Group counts by room + speaker for the report.
  const byRoom = {};
  for (const j of jobs) {
    const r = (byRoom[j.room] = byRoom[j.room] || { total: 0, present: 0 });
    r.total++; if (j.present) r.present++;
  }
  console.log(`Static spoken clips: ${jobs.length} total, ${jobs.filter((j) => j.present).length} present, ${jobs.filter((j) => !j.present).length} missing/empty.`);
  console.log("\nBy lesson/group (present/total):");
  for (const r of Object.keys(byRoom).sort()) console.log(`  ${r.padEnd(8)} ${byRoom[r].present}/${byRoom[r].total}`);
  if (force) console.log("\n(--force: every static clip will be re-baked)");

  if (todo.length === 0) { console.log("\nNothing to bake."); return; }

  console.log(`\nTo bake (${todo.length}):`);
  for (const j of todo) {
    const kind = j.sfx ? "meow" : j.speaker;
    const sample = j.sfx ? j.sfx : j.text;
    console.log(`  ${j.room.padEnd(6)} ${j.key.padEnd(24)} [${String(kind).padEnd(7)}] "${String(sample).slice(0, 56)}${String(sample).length > 56 ? "…" : ""}"`);
  }
  if (dry) { console.log("\n--dry: synthesized nothing."); return; }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("\n✗ ELEVENLABS_API_KEY is not set. Add it to web/.env, then re-run.");
    console.error("  ELEVENLABS_API_KEY=...   (https://elevenlabs.io/app/settings/api-keys)");
    process.exit(1);
  }

  // Resolve a voice id per SPEECH speaker actually used. A missing id doesn't abort
  // the whole run — its lines are reported + skipped (never fabricated).
  const speechSpeakers = [...new Set(todo.filter((j) => !j.sfx).map((j) => j.speaker))];
  const voiceFor = {};
  const missingVoice = [];
  for (const id of speechSpeakers) {
    const sp = SPEAKERS[id];
    const vid = sp && process.env[sp.voiceEnv];
    if (vid) voiceFor[id] = vid;
    else missingVoice.push({ id, env: sp ? sp.voiceEnv : "?" });
  }
  console.log("\nVoices:");
  for (const id of speechSpeakers) {
    const sp = SPEAKERS[id] || { label: id };
    console.log(voiceFor[id] ? `  ${sp.label}: ${voiceFor[id]}` : `  ${sp.label}: (NO VOICE — set ${(SPEAKERS[id] || {}).voiceEnv || "?"} — its lines will be SKIPPED)`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log("");
  let made = 0, skipped = 0, failed = 0;
  for (const j of todo) {
    const outPath = join(OUT_DIR, `${j.key}.mp3`);
    if (!j.sfx && !voiceFor[j.speaker]) {
      console.log(`  • ${j.key.padEnd(24)} skip (no voice for "${j.speaker}")`);
      skipped++;
      continue;
    }
    try {
      const buf = j.sfx ? await synthSfx(apiKey, j.sfx) : await synth(apiKey, voiceFor[j.speaker], j.text);
      await writeFile(outPath, buf);
      console.log(`  ✓ ${j.key.padEnd(24)} ${(j.sfx ? "meow" : j.speaker).padEnd(7)} ${(buf.length / 1024).toFixed(0)} KB`);
      made++;
    } catch (err) {
      console.error(`  ✗ ${j.key.padEnd(24)} ${err.message}`);
      failed++;
    }
  }
  console.log(`\nDone — ${made} baked, ${skipped} skipped, ${failed} failed.`);
  if (missingVoice.length) {
    console.error("\nBlocked speakers (no voice id in web/.env):");
    for (const m of missingVoice) console.error(`  ${m.id} → set ${m.env}=<elevenlabs voice id>`);
    console.error("Then re-run:  node scripts/bake-all-voice.mjs");
  }
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
