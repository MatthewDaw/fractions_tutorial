/* Normalizes raw-HTML slot content copied verbatim from the old static screens:
   rewrites relative asset paths (../assets/x.png) to the Vite-served root
   (/assets/x.png). Legacy *.html links are left as-is — the app-level anchor
   interceptor in App.jsx turns them into client-side route navigations. */
export function prepHtml(html) {
  if (!html) return "";
  return html.replace(/\.\.\/assets\//g, "/assets/");
}
