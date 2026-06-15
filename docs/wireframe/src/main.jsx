import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";

/* ── App CSS, imported in the SAME cascade order every static screen used ──
   tokens → shared structural sheets → per-skill sheets → wf-shell LAST.
   Loading them globally is safe: every sheet is namespaced by feature
   (.nl-*, .r1-*, .mr-*, …) so they don't collide across rooms. */
import "../css/app/tokens.css";

import "../css/app/lesson.css";
import "../css/app/world.css";
import "../css/app/lesson-board.css";
import "../css/app/lesson-unlike.css";
import "../css/app/stagetabs.css";
import "../css/app/questionband.css";
import "../css/app/slate.css";
import "../css/app/gen-practice.css";
import "../css/app/fitstage.css";
import "../css/app/engine-surfaces.css";
import "../css/app/blankslate.css";
import "../css/app/momsroom.css";
import "../css/app/conceptmap.css";
import "../css/app/mixreview.css";
import "../css/app/settings.css";
import "../css/app/title.css";
import "../css/app/sandbox.css";
import "../css/app/affectprobe.css";
import "../css/app/voicetap.css";

import "../css/app/m1.css";
import "../css/app/m3.css";
import "../css/app/nl.css";
import "../css/app/den.css";
import "../css/app/r1.css";
import "../css/app/r4.css";
import "../css/app/r5.css";
import "../css/app/s1.css";
import "../css/app/cmp.css";

/* navigator / index styling (also defines the base .wf-toolbar look) */
import "../css/wireframe.css";

/* wireframe-only chrome + design overrides — MUST be last so it wins */
import "../css/wf-shell.css";
import "./wf-app.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
