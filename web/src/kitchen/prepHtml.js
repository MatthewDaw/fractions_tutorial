/* kitchen/prepHtml.js — normalize raw-HTML primitive/tool strings before they are
 * injected via dangerouslySetInnerHTML. Ported from the wireframe's prepHtml:
 * rewrites relative asset paths to the Vite-served root. The kitchen primitives
 * are all inline SVG/markup today, but tools may grow asset references later, so
 * this stays as the single normalization seam. */
export function prepHtmlSafe(html) {
  if (!html) return "";
  return html.replace(/\.\.\/assets\//g, "/assets/");
}

export default prepHtmlSafe;
