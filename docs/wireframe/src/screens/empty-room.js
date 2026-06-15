/* empty-room — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Empty room",
  route: "EmptyRoom",
  bodyHTML: `
<!-- EmptyRoom.jsx root -->
    <div class="emptyroom">
      <div class="foxing"></div>
      <div class="er-no">№11</div>
      <div class="er-tag">Lesson 11</div>
      <h1>Coming Soon</h1>
      <div class="er-note">
        This room isn't built yet. Head back to Babushka's kitchen and pick a lesson that's ready.
      </div>
      <!-- onBack → world.html -->
      <a class="backbtn" href="world.html">← Back to the kitchen map</a>
    </div>
`,
};
