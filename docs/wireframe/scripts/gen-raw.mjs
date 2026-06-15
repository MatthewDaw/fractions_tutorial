/* gen-raw.mjs — one-shot generator for RawScreen data modules.
   Any static screen WITHOUT the lesson-board (.lboard) chrome is a one-off
   scene (kitchen states, world, title, intro, settings, practice/words/applied
   steps, …). Its inner-#stage markup is captured verbatim into
   src/screens/<name>.js as { kind:"raw", title, route, bodyHTML }.
   Lesson pages (.lboard) are handled separately by hand/agents. */
import fs from "node:fs";
import path from "node:path";

const SCREENS = path.resolve("screens");
const OUT = path.resolve("src/screens");
fs.mkdirSync(OUT, { recursive: true });

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function extractBody(html) {
  const sIdx = html.indexOf('id="stage"');
  if (sIdx === -1) return null;
  const gt = html.indexOf(">", sIdx);
  if (gt === -1) return null;
  // Closing marker that ends the #stage + #fit wrappers (always its own line).
  const end = html.indexOf("\n  </div></div>", gt);
  if (end === -1) return null;
  return html.slice(gt + 1, end).trim();
}

function extractTitleRoute(html) {
  const m = html.match(/<span class="wf-tb-title">([\s\S]*?)<\/span>/);
  if (!m) {
    const t = html.match(/<title>([\s\S]*?)<\/title>/);
    return { title: t ? t[1].trim() : "Screen", route: "" };
  }
  let inner = m[1];
  const small = inner.match(/<small>([\s\S]*?)<\/small>/);
  let route = "";
  if (small) {
    route = small[1].replace(/^[\s·]+/, "").trim();
    inner = inner.replace(/<small>[\s\S]*?<\/small>/, "");
  }
  return { title: inner.replace(/\s+/g, " ").trim(), route };
}

let made = 0;
let skipped = 0;
for (const file of fs.readdirSync(SCREENS)) {
  if (!file.endsWith(".html")) continue;
  const html = fs.readFileSync(path.join(SCREENS, file), "utf8");
  if (html.includes('class="lboard"')) {
    skipped++;
    continue; // lesson page → not raw
  }
  const name = file.replace(/\.html$/, "");
  const body = extractBody(html);
  if (body == null) {
    console.warn("!! could not extract body:", file);
    continue;
  }
  const { title, route } = extractTitleRoute(html);
  const mod = `/* ${name} — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: ${JSON.stringify(title)},
  route: ${JSON.stringify(route)},
  bodyHTML: \`
${esc(body)}
\`,
};
`;
  fs.writeFileSync(path.join(OUT, name + ".js"), mod);
  made++;
}
console.log(`raw modules written: ${made}; lesson pages skipped: ${skipped}`);
