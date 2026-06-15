// PrimaryButton.jsx — the shared red woodcut action button (the Settings "Done"
// control, `.st-back`). A `<button>` styled by the consuming scene's stylesheet
// (`.st-back` etc.). Renders an optional leading arrow glyph.
//
// onClick stays a real handler passed by the scene — this is chrome, not logic.
export default function PrimaryButton({ onClick, children, className = "", arrow = "‹", ...rest }) {
  return (
    <button className={"st-back " + className} onClick={onClick} {...rest}>
      {arrow != null && <span className="ar">{arrow}</span>} {children}
    </button>
  );
}
