import { useLayoutEffect } from "react";

/* Scales the 1280×800 #stage to fit the viewport (reserving the top 40px for the
   wireframe toolbar), exactly like the real app's useStageFit hook.

   Containment philosophy: keep it simple. The answer slate and the tutor cook
   fit their cells BY CONSTRUCTION via CSS (see wf-shell.css) — no measuring. The
   ONLY thing measured at runtime is each .fit-stage-content, which holds a few
   rooms' fixed-size play diagrams that can be wider/taller than their cell; we
   shrink those to fit (never enlarge), mirroring the real app's FitStage. */
const TOOLBAR = 40;

export function useStageFit(dep) {
  useLayoutEffect(() => {
    function fitInnerStages() {
      document.querySelectorAll(".fit-stage").forEach((parent) => {
        const el = parent.querySelector(".fit-stage-content");
        if (!el) return;
        el.style.transform = "none";
        const pw = parent.clientWidth;
        const ph = parent.clientHeight;
        const cw = el.scrollWidth;
        const ch = el.scrollHeight;
        if (!pw || !ph || !cw || !ch) return;
        const s = Math.min(1, pw / cw, ph / ch);
        if (s < 1) {
          el.style.transform = "scale(" + s + ")";
          el.style.transformOrigin = "top center";
        }
      });
    }

    function fit() {
      const stage = document.getElementById("stage");
      if (!stage) return;
      const fitEl = document.getElementById("fit");
      const vw = window.innerWidth;
      const vh = window.innerHeight - TOOLBAR;
      const s = Math.min(vw / 1280, vh / 800);
      stage.style.transformOrigin = "top left";
      stage.style.transform = "scale(" + s + ")";
      if (fitEl) {
        const w = 1280 * s;
        const h = 800 * s;
        fitEl.style.position = "fixed";
        fitEl.style.width = w + "px";
        fitEl.style.height = h + "px";
        fitEl.style.left = (vw - w) / 2 + "px";
        fitEl.style.top = TOOLBAR + (vh - h) / 2 + "px";
      }
      fitInnerStages();
    }

    let rafPending = 0;
    function scheduleFit() {
      cancelAnimationFrame(rafPending);
      rafPending = requestAnimationFrame(fit);
    }

    fit();
    const raf = requestAnimationFrame(fit);
    const t = setTimeout(fit, 200);

    // Re-fit once fonts load (late glyph metrics can change a diagram's size).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleFit).catch(() => {});
    }
    // Re-fit if a play diagram changes size after load (font swap, image, canvas).
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(scheduleFit);
      document.querySelectorAll(".fit-stage-content").forEach((el) => ro.observe(el));
    }

    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafPending);
      clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, [dep]);
}
