// SectionLabel.jsx — shared numbered section heading ("1 Sound", "2 How you
// answer"): a small numbered chip + label + trailing rule. Mirrors the
// wireframe's `.st-sec-label` markup. Pure presentation.
export default function SectionLabel({ num, children, className = "" }) {
  return (
    <div className={"st-sec-label " + className}>
      <span className="st-sl-num">{num}</span>{children}<span className="st-sl-rule" />
    </div>
  );
}
