/* room-cmp-3-same — №5 Compare & Check · Stage 3 "Rulers · Same". Two ruler
   strips with the SAME bottom — pieces are the same size, so the longer red
   region wins. Compare 3/8 and 6/8. */
export default {
  kind: "lesson",
  lesson: "cmp",

  stageHTML: `
    <div style="display:flex;align-items:center;justify-content:center;height:100%">
      <div style="font-family:var(--serif);font-size:18px;color:var(--ink-mute);text-align:center;max-width:480px">
        <p style="margin:0 0 12px"><b style="color:var(--red)">Rulers · Same Base</b></p>
        <p style="margin:0">Two ruler strips, same bottom — the longer red region wins.<br>
        <em>(Screen coming soon.)</em></p>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Rulers · Same</h3>
      <div class="hint">When the bottoms match, the pieces are the same size.
        Line up both strips at 0 — the fraction whose red region stretches further is bigger.</div>
    </div>`,
};
