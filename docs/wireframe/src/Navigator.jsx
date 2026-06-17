import { Link } from "react-router-dom";

/* The wireframe index / navigator (was index.html). Lists every screen as a
   client-side route. Links use the route name (filename without .html). */

function L({ to, children, route }) {
  return (
    <Link className="wf-index-link" to={"/" + to}>
      {children}
      {route ? <span className="il-route">{route}</span> : null}
    </Link>
  );
}

const STEPS = [
  ["№1 Equal Groups (m1)", [
    ["room-m1", "1 Manipulate"], ["room-m1-2-bind", "2 Bind"], ["room-m1-3-fade", "3 Fade"],
    ["room-m1-4-workbench", "4 Workbench"], ["room-m1-5-numbers", "5 Numbers"], ["room-m1-6-applied", "6 Applied"],
    ["room-m1-sw-showwork", "Show Work"], ["room-m1-7-words", "7 Words"], ["room-m1-practice", "★ Practice"],
  ]],
  ["№2 Times Facts (m3)", [
    ["room-m3", "1 Manipulate"], ["room-m3-2-bind", "2 Bind"], ["room-m3-3-fade", "3 Fade"],
    ["room-m3-4-workbench", "4 Workbench"], ["room-m3-5-numbers", "5 Numbers"], ["room-m3-6-applied", "6 Applied"],
    ["room-m3-sw-showwork", "Show Work"], ["room-m3-7-words", "7 Words"], ["room-m3-practice", "★ Practice"],
  ]],
  ["№3 The Bottom Number (den)", [
    ["room-den-paint", "1 Paint"], ["room-den", "2 Split"], ["room-den-match", "3 Match"],
    ["room-den-build", "4 Build"], ["room-den-3-smaller", "5 Smaller"],
    ["room-den-4-numbers", "6 Numbers"], ["room-den-practice", "★ Practice"],
  ]],
  ["№4 The Top Number (num)", [
    ["room-num-paint", "1 Paint"], ["room-num", "2 Shade"], ["room-num-2-count", "3 Count"],
    ["room-num-3-whole", "4 Whole"], ["room-num-build", "5 Build"], ["room-num-make", "6 Make"],
    ["room-num-5-numbers", "7 Numbers"], ["room-num-6-story", "8 Story"], ["room-num-7-words", "9 Words"], ["room-num-practice", "★ Practice"],
  ]],
  ["№5 Same Denominators · On the Number Line (nl + r1)", [
    ["room-nl", "1 Place"], ["room-nl-2-write", "2 Write"], ["room-r1", "3 Manipulate"],
    ["room-r1-5-numbers", "4 Numbers"], ["room-r1-6-applied", "5 Applied"],
    ["room-r1-sw-showwork", "6 Show Work"], ["room-r1-7-words", "7 Words"], ["room-r1-practice", "★ Practice"],
  ]],
  ["№6 Taking Away (s1)", [
    ["room-s1", "1 Decompose"], ["room-s1-2-takeaway", "2 Take Away"], ["room-s1-3-numbers", "3 Numbers"],
    ["room-s1-4-words", "4 Words"], ["room-s1-practice", "★ Practice"],
  ]],
  ["№7 Equivalent Fractions (r4)", [
    ["room-r4-2-bind", "1 Double"], ["room-r4-3-fade", "2 Triple"],
    ["room-r4-4-numbers", "3 Raise"], ["room-r4-5-applied", "4 Find · Pick"], ["room-r4-6-words", "5 Find · All"],
    ["room-r4-7-sort", "6 Sort"], ["room-r4-practice", "★ Practice"],
  ]],
  ["№9 Simplify (simp)", [
    ["room-simp", "1 Identify"], ["room-simp-2-bundle", "2 Bundle"], ["room-simp-3-lowest", "3 Lowest Terms"],
    ["room-simp-4-gcf", "4 Big Bundle"], ["room-simp-5-pick", "5 Pick"], ["room-simp-6-numbers", "6 Numbers"],
    ["room-simp-practice", "★ Practice"],
  ]],
  ["№10 Scale One (r3)", [
    ["room-r3", "1 Manipulate"], ["room-r3-2-bind", "2 Bind"], ["room-r3-3-fade", "3 Fade"],
    ["room-r3-5-ghost", "4 Ghost"], ["room-r3-6-numbers", "5 Numbers"], ["room-r3-8-simplify", "6 Simplify"],
    ["room-r3-a-applied", "7 Applied"], ["room-r3-sw-showwork", "8 Show Work"], ["room-r3-7-words", "9 Words"], ["room-r3-practice", "★ Practice"],
  ]],
  ["№11 Cross-Multiply (r2)", [
    ["room-r2", "1 Manipulate"], ["room-r2-2-bind", "2 Bind"], ["room-r2-3-fade", "3 Fade"],
    ["room-r2-5-ghost", "4 Ghost"], ["room-r2-6-numbers", "5 Numbers"], ["room-r2-8-simplify", "6 Simplify"],
    ["room-r2-a-applied", "7 Applied"], ["room-r2-sw-showwork", "8 Show Work"], ["room-r2-7-words", "9 Words"], ["room-r2-practice", "★ Practice"],
  ]],
  ["№5 Compare & Check (cmp)", [
    ["room-cmp", "1 Boxes"], ["room-cmp-4-diff", "2 Rulers · Different"], ["room-cmp-scale", "3 Scale Up"],
    ["room-cmp-5-numbers", "4 Numbers"], ["room-cmp-practice", "★ Practice"],
  ]],
  ["№12 Mixed Numbers (r5)", [
    ["room-r5", "1 Identify"], ["room-r5-2-fill", "2 Fill a Whole"], ["room-r5-3-read", "3 Read"],
    ["room-r5-4-wholes", "4 How Many Wholes"], ["room-r5-5-back", "5 The Other Way"], ["room-r5-6-numbers", "6 Numbers"],
    ["room-r5-practice", "★ Practice"],
  ]],
];

export default function Navigator({ screens = {} }) {
  const has = (n) => Boolean(screens[n]);
  return (
    <div className="wf-index-wrap">
      <h1>Babushka's Fractions — UI Wireframe</h1>
      <p>
        A high-fidelity, fully clickable wireframe of the tutor app, separate from{" "}
        <code>web/</code> so you can edit the flow without touching the real app. Now a
        React + Vite SPA — all shared chrome lives in one <code>LessonScreen</code>{" "}
        component. Click any screen, or{" "}
        <Link to="/title"><b>start the flow at the Title screen ▸</b></Link>
      </p>

      <div className="wf-index-section">
        <h2>Shell &amp; navigation screens</h2>
        <div className="wf-index-grid">
          <L to="title" route="#/ (TitleScreen)">Title screen</L>
          <L to="world" route="#/world (WorldMap)">World map — shelves</L>
          <L to="shelf-found" route="#/world ▸ found">Shelf · Counting &amp; Times</L>
          <L to="shelf-build" route="#/world ▸ build">Shelf · Building Fractions</L>
          <L to="shelf-combine" route="#/world ▸ combine">Shelf · Combining &amp; Renaming</L>
          <L to="kitchen" route="#/mom (MomsRoom)">Babushka's Kitchen</L>
          <L to="settings" route="#/settings (SettingsScreen)">Settings</L>
          <L to="concepts" route="#/concepts (ConceptMap)">Concept Mastery Map</L>
          <L to="intro" route="RoomIntro">Room intro (video)</L>
          <L to="empty-room" route="EmptyRoom">Empty room (fallback)</L>
        </div>
      </div>

      <div className="wf-index-section">
        <h2>Babushka's Kitchen — one story problem per skill</h2>
        <div className="wf-index-grid">
          <L to="kitchen-m1" route="№1 · room-m1">Equal Groups</L>
          <L to="kitchen-m3" route="№2 · room-m3">Times Facts</L>
          <L to="kitchen-den" route="№3 · room-den">The Bottom Number</L>
          <L to="kitchen-num" route="№4 · room-num">The Top Number</L>
          <L to="kitchen-nl" route="№5 · room-nl">Same Denominators</L>
          <L to="kitchen-s1" route="№6 · room-s1">Taking Away</L>
          <L to="kitchen-r4" route="№7 · room-r4-2-bind">Equivalent Fractions</L>
          <L to="kitchen-simp" route="№9 · room-simp">Simplify</L>
          <L to="kitchen-r3" route="№9 · room-r3">Scale One</L>
          <L to="kitchen-r2" route="№11 · room-r2">Cross-Multiply</L>
          <L to="kitchen-cmp" route="№5 · room-cmp">Compare &amp; Check</L>
          <L to="kitchen-r5" route="№12 · room-r5">Mixed Numbers</L>
        </div>
      </div>

      <div className="wf-index-section">
        <h2>All lesson steps</h2>
        {STEPS.map(([heading, items]) => (
          <p key={heading}>
            <b>{heading}</b>
            <br />
            {items.map(([name, label], i) => (
              <span key={name}>
                {i > 0 ? " · " : ""}
                {has(name) ? (
                  <Link to={"/" + name}>{label}</Link>
                ) : (
                  <span className="wf-muted" title="not yet converted">{label}</span>
                )}
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}
