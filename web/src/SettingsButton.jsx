// SettingsButton.jsx - a header-cluster control that opens the Settings screen.
//
// Drop-in replacement for the old per-lesson/per-page sound toggle: same .ctrl-btn
// styling so it sits in the header controls cluster, but instead of muting it
// navigates to #/settings. Shell remembers the screen it was opened from and
// returns the player there on "Done". Volume + input mode now live in Settings.
export default function SettingsButton({ className = "ctrl-btn" }) {
  return (
    <button
      className={className}
      title="Settings"
      aria-label="Settings"
      onClick={() => { window.location.hash = "#/settings"; }}
    >
      <img src="/settings-gear.png" width="18" height="18" alt="" aria-hidden="true" style={{ display: "block", objectFit: "contain" }} />
    </button>
  );
}
