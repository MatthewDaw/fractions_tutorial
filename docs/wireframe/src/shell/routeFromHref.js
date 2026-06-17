/* Converts a legacy static-screen href ("room-nl-2-write.html", "world.html")
   into the SPA's hash-route path ("/room-nl-2-write", "/world"). Leaves real
   external links (http…, mailto…) and in-page anchors (#…) untouched. */
export function routeFromHref(href) {
  if (!href) return "/";
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const clean = href.replace(/^\.?\//, "").replace(/\.html$/, "");
  return "/" + clean;
}
