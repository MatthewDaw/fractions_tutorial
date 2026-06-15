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
  ["№3 Same Denominators · On the Number Line (nl + r1)", [
    ["room-nl", "1 Place"], ["room-nl-2-write", "2 Write"], ["room-r1", "3 Manipulate"],
    ["room-r1-5-numbers", "4 Numbers"], ["room-r1-6-applied", "5 Applied"],
    ["room-r1-sw-showwork", "Show Work"], ["room-r1-7-words", "6 Words"], ["room-r1-practice", "★ Practice"],
  ]],
  ["№4 Taking Away (s1)", [
    ["room-s1", "1 Decompose"], ["room-s1-2-takeaway", "2 Take Away"], ["room-s1-3-numbers", "3 Numbers"],
    ["room-s1-4-words", "4 Words"], ["room-s1-practice", "★ Practice"],
  ]],
  ["№5 Compare & Check (cmp)", [
    ["room-cmp", "1 Compare"], ["room-cmp-2-benchmark", "2 Benchmark"], ["room-cmp-3-reason", "3 Reason"], ["room-cmp-practice", "★ Practice"],
  ]],
  ["№6 Scale One (r3)", [
    ["room-r3", "1 Manipulate"], ["room-r3-2-bind", "2 Bind"], ["room-r3-3-fade", "3 Fade"],
    ["room-r3-w-workbench", "W Workbench"], ["room-r3-5-ghost", "Ghost"], ["room-r3-6-numbers", "Numbers"],
    ["room-r3-a-applied", "Applied"], ["room-r3-sw-showwork", "Show Work"], ["room-r3-7-words", "Words"], ["room-r3-practice", "★ Practice"],
  ]],
  ["№7 Cross-Multiply (r2)", [
    ["room-r2", "1 Manipulate"], ["room-r2-2-bind", "2 Bind"], ["room-r2-3-fade", "3 Fade"],
    ["room-r2-w-workbench", "W Workbench"], ["room-r2-5-ghost", "Ghost"], ["room-r2-6-numbers", "Numbers"],
    ["room-r2-a-applied", "Applied"], ["room-r2-sw-showwork", "Show Work"], ["room-r2-7-words", "Words"], ["room-r2-practice", "★ Practice"],
  ]],
  ["№8 Simplify (r4)", [
    ["room-r4", "1 Group"], ["room-r4-2-bind", "2 Bind"], ["room-r4-3-fade", "3 Fade"],
    ["room-r4-4-numbers", "4 Numbers"], ["room-r4-5-applied", "5 Applied"], ["room-r4-sw-showwork", "Show Work"],
    ["room-r4-6-words", "6 Words"], ["room-r4-practice", "★ Practice"],
  ]],
  ["№9 Mixed Numbers (r5)", [
    ["room-r5", "1 Manipulate"], ["room-r5-2-bind", "2 Bind"], ["room-r5-3-fade", "3 Fade"],
    ["room-r5-workbench", "W Workbench"], ["room-r5-4-numbers", "4 Numbers"], ["room-r5-applied", "Applied"],
    ["room-r5-sw-showwork", "Show Work"], ["room-r5-5-words", "5 Words"], ["room-r5-practice", "★ Practice"],
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
          <L to="review" route="#/review (MixedReview)">Mixed Basket review</L>
          <L to="settings" route="#/settings (SettingsScreen)">Settings</L>
          <L to="concepts" route="#/concepts (ConceptMap)">Concept Mastery Map</L>
          <L to="intro" route="RoomIntro">Room intro (video)</L>
          <L to="empty-room" route="EmptyRoom">Empty room (fallback)</L>
        </div>
      </div>

      <div className="wf-index-section">
        <h2>Babushka's Kitchen — states</h2>
        <div className="wf-index-grid">
          <L to="kitchen" route="default · Babushka poses">Problem (unsolved)</L>
          <L to="kitchen-solved" route="solved === true">Solved / celebration</L>
          <L to="kitchen-wrong" route="bad answer + nudge">Wrong / try again</L>
          <L to="kitchen-wall" route="RouteToRoom">The wall (go learn)</L>
          <L to="kitchen-lookahead" route="stage = lookahead">Lookahead probe</L>
          <L to="kitchen-done" route="done === true">All done / finale</L>
          <L to="kitchen-grandpa" route="who = grandpa">Cast · Grandpa</L>
          <L to="kitchen-kid" route="who = kid">Cast · Kid</L>
          <L to="kitchen-cat" route="who = cat">Cast · Cat (meow)</L>
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
