// audition-voices.mjs — bake a comparison table of candidate ElevenLabs voices,
// grouped by character (each group has its own lines + candidate voices).
//   npm run audition            (bake missing, rebuild the page)
//   npm run audition -- --force (re-bake everything)
//
// Pick one voice per character, put its id in web/.env (e.g. ELEVEN_VOICE_KID),
// wire the character in src/voiceLines.js SPEAKERS, then `npm run voice`.

import { writeFile, mkdir, access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", ".env");
const OUT_DIR = join(__dirname, "..", "public", "voice", "_audition");

const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const VOICE_SETTINGS = { stability: 0.22, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true };
const force = process.argv.includes("--force");

// Each character group: its own lines (role-appropriate) + candidate voices.
const GROUPS = [
  {
    id: "kid", label: "Kid — curious child",
    lines: [
      { key: "ask",   text: "Wow! Why are ze pieces all different sizes?" },
      { key: "cut",   text: "Ooh, I cut zem — now zey match!" },
      { key: "win",   text: "We did it! One half plus one third is five sixths!" },
    ],
    voices: [
      // Russian young MEN (real RU accent, but read as youths, not children):
      { key: "eugene",  id: "m0OQuJtWCw1V23P0pQmG", name: "Eugene — Bright & Clear",    tags: "🇷🇺 young man · upbeat" },
      { key: "leonid",  id: "bg9LrEYQkRYwqkxA8VOy", name: "Leonid Fomichev — Excited",  tags: "🇷🇺 moscow · excited" },
      { key: "agassi",  id: "9fK40vxwowu0fJFOPACM", name: "Agassi Roux — Friendly",     tags: "🇷🇺 moscow · casual" },
      // Cute CHILD voices (sound like a kid, but not Russian):
      { key: "candy",   id: "Nggzl2QAXh3OijoXD116", name: "Candy — Young & Sweet",      tags: "child · bubbly (non-RU)" },
      { key: "bibi",    id: "7Nj1UduP6iY6hWpEDibS", name: "Bibi Blume — Cheeky & Warm", tags: "child · cartoon (non-RU)" },
      { key: "donnel",  id: "FSuckdZNjSzYsEkK5aKN", name: "Donnel — Mischievous",       tags: "child · upbeat (non-RU)" },
    ],
  },
  {
    id: "grandpa", label: "Grandpa — warm elder",
    lines: [
      { key: "come",  text: "Come, little one. Let me show you a trick wit ze fractions." },
      { key: "slice", text: "First, ve slice zem until every piece is ze same size." },
      { key: "good",  text: "Ahh, you see? Five sixths. Very good, my child." },
    ],
    voices: [
      { key: "mikhail",  id: "a2cWmGM4AUuNsHwInFjF", name: "Mikhail — Calm & Low",         tags: "🇷🇺 moscow · deep, calm" },
      { key: "maksim",   id: "e5A3tSm7sjA7Sbiz2Qac", name: "Maksim — Deep Calm",           tags: "🇷🇺 moscow · deep" },
      { key: "romanbar", id: "O88Glmkh2nWihrGwNsFd", name: "Roman — Warm Baritone",        tags: "🇷🇺 st. petersburg · gentle" },
      { key: "vladimir", id: "NkBkAMqIBNjZUjXKAA7r", name: "Vladimir — Deep Narrator",     tags: "🇷🇺 standard · deep" },
      { key: "ivan",     id: "lxY8Pn0yWs1Ve9rBceah", name: "Ivan Nazarov — Classy, Rich",  tags: "🇷🇺 standard · classy" },
      { key: "nester",   id: "pM78bgjPVk0JXtaEnFoj", name: "Nester Surovy — Gravelly Mentor", tags: "🇷🇺 standard · deep, character" },
    ],
  },
];

async function exists(p) { try { await access(p); return true; } catch { return false; } }
async function loadDotEnv() {
  let raw; try { raw = await readFile(ENV_PATH, "utf8"); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    if (line.trimStart().startsWith("#")) continue;
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
async function synth(apiKey, voiceId, text) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text().catch(() => "")).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer());
}

function buildHtml() {
  const section = (g) => {
    const head = `<tr><th>Voice</th>${g.lines.map((l) => `<th>${l.key}<div class="ln">“${l.text}”</div></th>`).join("")}</tr>`;
    const rows = g.voices.map((v) => `
      <tr><td class="v"><div class="name">${v.name}</div><div class="tags">${v.tags}</div><div class="id">${v.id}</div></td>
      ${g.lines.map((l) => `<td><audio controls preload="none" src="${g.id}_${v.key}__${l.key}.mp3"></audio></td>`).join("")}</tr>`).join("");
    return `<h2>${g.label}</h2><table>${head}${rows}</table>`;
  };
  return `<!doctype html><meta charset="utf-8"><title>Voice audition — Kid & Grandpa</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;margin:32px auto;max-width:1100px;padding:0 20px;color:#1c1612;background:#faf9f5}
  h1{font-size:21px}h2{margin:30px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#a32a22}
  table{border-collapse:collapse;width:100%}th,td{border:1px solid #e3d4b1;padding:8px 10px;text-align:left;vertical-align:middle}
  th{background:#ede2c8;font-size:12px}.ln{font-weight:400;font-style:italic;color:#6b5a47;font-size:11px;margin-top:3px;max-width:220px}
  td.v{min-width:240px}.name{font-weight:600}.tags{font-size:11px;color:#a32a22}.id{font-family:monospace;font-size:11px;color:#6b5a47}
  audio{height:32px;width:200px}
</style>
<h1>🇷🇺 Voice audition — pick a Kid + a Grandpa</h1>
<p style="color:#6b5a47;font-size:13px">Exaggerated settings (stability 0.22 · style 0.7). The library has few truly-Russian
kid/grandpa voices, so judge by ear — both for character fit and how Russian it sounds. Tell me your picks.</p>
${GROUPS.map(section).join("")}`;
}

async function main() {
  await loadDotEnv();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) { console.error("✗ ELEVENLABS_API_KEY not set in web/.env"); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });

  let made = 0, skipped = 0, failed = 0;
  for (const g of GROUPS) {
    for (const v of g.voices) {
      for (const l of g.lines) {
        const out = join(OUT_DIR, `${g.id}_${v.key}__${l.key}.mp3`);
        if (!force && (await exists(out))) { skipped++; continue; }
        try { await writeFile(out, await synth(apiKey, v.id, l.text)); made++; process.stdout.write(`  ✓ ${g.id}/${v.key}/${l.key}\n`); }
        catch (e) { failed++; console.error(`  ✗ ${g.id}/${v.key}/${l.key} ${e.message}`); }
      }
    }
  }
  await writeFile(join(OUT_DIR, "index.html"), buildHtml());
  console.log(`\n${made} baked, ${skipped} skipped, ${failed} failed → /voice/_audition/index.html`);
}
main().catch((e) => { console.error(e); process.exit(1); });
