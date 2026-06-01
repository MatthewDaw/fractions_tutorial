// dump-ink.mjs — decode captured tablet handwriting samples for inspection.
// Reads ink-log.jsonl (written by the dev-only /__ink endpoint, one record per
// "Check" press) and writes each cell's PNG to tools/ink-dump/ plus a summary of
// what the recognizer guessed vs. what was correct. Run: node tools/dump-ink.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.resolve(dir, "..", "ink-log.jsonl");
const outDir = path.resolve(dir, "ink-dump");
fs.mkdirSync(outDir, { recursive: true });

const lines = fs.existsSync(logPath)
  ? fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean)
  : [];
if (!lines.length) { console.log("ink-log.jsonl is empty — draw an answer on the tablet and press Check."); process.exit(0); }

function savePng(dataUrl, file) {
  if (!dataUrl || !dataUrl.startsWith("data:image/png;base64,")) return false;
  fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  return true;
}

console.log(`# ${lines.length} Check-press sample(s)\n`);
lines.forEach((ln, i) => {
  let r; try { r = JSON.parse(ln); } catch { return; }
  const tag = String(i).padStart(2, "0");
  const numFile = path.join(outDir, `${tag}-num.png`);
  const denFile = path.join(outDir, `${tag}-den.png`);
  const wroteN = r.num && savePng(r.num.png, numFile);
  const wroteD = r.den && savePng(r.den.png, denFile);
  const gN = r.num?.recognized?.text ?? r.numStr ?? "";
  const gD = r.den?.recognized?.text ?? r.denStr ?? "";
  const p = r.problem ? `${r.problem.aNum}/${r.problem.aDen} + ${r.problem.bNum}/${r.problem.bDen}` : "?";
  console.log(`[${tag}] beat=${r.beat ?? "?"}  problem=${p}  wrote=${gN}/${gD}  recognized→ "${r.numStr}"/"${r.denStr}"  correct=${r.correct}`);
  console.log(`     strokes: num=${r.num?.strokes?.length ?? 0} den=${r.den?.strokes?.length ?? 0}   png: ${wroteN ? path.relative(process.cwd(), numFile) : "—"} ${wroteD ? path.relative(process.cwd(), denFile) : "—"}`);
});
console.log(`\nPNGs written to ${path.relative(process.cwd(), outDir)}/`);
