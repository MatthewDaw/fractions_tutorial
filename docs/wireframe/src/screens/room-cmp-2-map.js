/* room-cmp-2-map — №5 Compare & Check · Stage 2 "Box → Ruler". Shows the same
   fraction rendered as both a shaded cell box AND a ruler strip, making the
   mapping between the two representations explicit before the ruler-only stages. */
export default {
  kind: "lesson",
  lesson: "cmp",

  stageHTML: `
    <div style="display:flex;align-items:center;justify-content:center;height:100%">
      <div style="font-family:var(--serif);font-size:18px;color:var(--ink-mute);text-align:center;max-width:480px">
        <p style="margin:0 0 12px"><b style="color:var(--red)">Box → Ruler</b></p>
        <p style="margin:0">This step maps the same fraction as a shaded square and as a ruler strip.<br>
        <em>(Screen coming soon.)</em></p>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Box → Ruler</h3>
      <div class="hint">The same amount — shown two ways. Both the square and the ruler are cut
        into the same number of equal pieces, and the same number are shaded.</div>
    </div>`,
};
