// FabBar.jsx — the floating "Concepts + Settings" action bar shown on the
// landing surfaces (Title + World map). Extracted from Shell.jsx so the title
// screen owns its own chrome (matching the wireframe, where .fab-bar lives
// inside the scene) instead of relying on Shell to overlay it.
//
// DATA/chrome only — no routing logic of its own. The host passes programmatic
// handlers (onConcepts/onSettings) so the app keeps a single navigation model
// (hash routing via Shell's `go`). Styling lives in world.css (.fab-bar /
// .settings-fab), global and unscoped, so both Title and World render identically.
import { ConceptsIcon } from "./icons.jsx";

export default function FabBar({ onConcepts, onSettings }) {
  return (
    <div className="fab-bar">
      <button
        className="settings-fab concepts-fab"
        onClick={onConcepts}
        title="Concept Mastery Map"
        aria-label="Concepts"
      >
        <span className="settings-fab-icon"><ConceptsIcon /></span>
        <span className="settings-fab-label">Concepts</span>
      </button>
      <button
        className="settings-fab"
        onClick={onSettings}
        title="Settings"
        aria-label="Settings"
      >
        <span className="settings-fab-icon">
          <img
            src="/settings-gear.png"
            width="20"
            height="20"
            alt=""
            aria-hidden="true"
            style={{ display: "block", objectFit: "contain" }}
          />
        </span>
        <span className="settings-fab-label">Settings</span>
      </button>
    </div>
  );
}
