import { useEffect } from "react";
import { Routes, Route, useNavigate, useParams, Navigate, Link } from "react-router-dom";
import LessonScreen from "./shell/LessonScreen.jsx";
import RawScreen from "./shell/RawScreen.jsx";
import KitchenScreen from "./shell/KitchenScreen.jsx";
import Navigator from "./Navigator.jsx";
import { routeFromHref } from "./shell/routeFromHref.js";

/* Build the screen registry from every data module under src/screens/.
   Each file default-exports a data object with a `kind` ("lesson" | "raw").
   The route name is the filename without extension, matching the old static
   filenames so cross-links keep working (e.g. room-nl.js → /room-nl). */
const modules = import.meta.glob("./screens/*.js", { eager: true });
const SCREENS = {};
for (const path in modules) {
  const name = path.split("/").pop().replace(/\.js$/, "");
  SCREENS[name] = modules[path].default;
}

function NotConverted({ name }) {
  return (
    <div className="wf-index-wrap">
      <h1>Not converted yet</h1>
      <p>
        The screen <code>{name}</code> hasn't been ported to a React data module
        yet (no <code>src/screens/{name}.js</code>).
      </p>
      <p><Link to="/">⌂ Back to all screens</Link></p>
    </div>
  );
}

function Screen() {
  const { name } = useParams();
  const data = SCREENS[name];
  if (!data) return <NotConverted name={name} />;
  if (data.kind === "lesson") return <LessonScreen data={data} />;
  if (data.kind === "kitchen") return <KitchenScreen data={data} />;
  return <RawScreen data={data} />;
}

/* Anchor interceptor — legacy markup inside raw-HTML slots still contains
   <a href="something.html">. Catch those clicks and turn them into client-side
   route navigations instead of full page loads. */
function useLegacyLinkInterceptor() {
  const navigate = useNavigate();
  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || /^(https?:|mailto:|#)/.test(href)) return;
      if (!href.endsWith(".html")) return;
      e.preventDefault();
      navigate(routeFromHref(href));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
}

export default function App() {
  useLegacyLinkInterceptor();
  return (
    <Routes>
      <Route path="/" element={<Navigator screens={SCREENS} />} />
      <Route path="/:name" element={<Screen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
