/* fit.js — scales the 1280×800 #stage to fit the viewport, exactly like the
   real app's useStageFit hook, but reserving the top 40px for the wireframe
   toolbar. Also auto-scales each .fit-stage-content so it shrinks to fill (but
   never exceeds) its .fit-stage parent, mirroring what React's FitStage does. */
(function () {
  var TOOLBAR = 40;

  function fit() {
    var stage = document.getElementById("stage");
    if (!stage) return;
    var fitEl = document.getElementById("fit");
    var vw = window.innerWidth;
    var vh = window.innerHeight - TOOLBAR;
    var s = Math.min(vw / 1280, vh / 800);
    stage.style.transformOrigin = "top left";
    stage.style.transform = "scale(" + s + ")";
    if (fitEl) {
      var w = 1280 * s, h = 800 * s;
      fitEl.style.position = "fixed";
      fitEl.style.width = w + "px";
      fitEl.style.height = h + "px";
      fitEl.style.left = ((vw - w) / 2) + "px";
      fitEl.style.top = (TOOLBAR + (vh - h) / 2) + "px";
    }
    fitInnerStages();
  }

  /* Mirrors React FitStage: for each .fit-stage-content, calculate the largest
     scale ≤ 1 that makes the content fit inside its .fit-stage parent cell,
     then apply it with transform-origin top center. */
  function fitInnerStages() {
    document.querySelectorAll(".fit-stage").forEach(function (parent) {
      var el = parent.querySelector(".fit-stage-content");
      if (!el) return;

      /* Reset to natural size so we can measure the true content dimensions. */
      el.style.transform = "none";

      var pw = parent.clientWidth;
      var ph = parent.clientHeight;
      /* scrollWidth/scrollHeight give the un-clipped layout size. */
      var cw = el.scrollWidth;
      var ch = el.scrollHeight;
      if (!pw || !ph || !cw || !ch) return;

      var s = Math.min(1, pw / cw, ph / ch);
      if (s < 1) {
        el.style.transform = "scale(" + s + ")";
        el.style.transformOrigin = "top center";
      }
    });
  }

  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  if (document.readyState !== "loading") fit();
  else document.addEventListener("DOMContentLoaded", fit);
})();
