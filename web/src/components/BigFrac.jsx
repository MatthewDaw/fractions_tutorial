// BigFrac.jsx — a big stacked fraction: numerator over a denominator-colored rule
// (the rule carries the denominator's hue; a colored numeral would fail the
// contrast floor on cream paper). Shared by every room.
//   locked   — wear a padlock on the denominator (R1's locked bottom, R4's leftover)
//   children — room-specific accessories inside the .bignum (e.g. R3's ÷K chips)
import { denomColor } from "../denominatorColors.js";
import Lock from "./Lock.jsx";

export default function BigFrac({ num, den, locked = false, children }) {
  return (
    <div className="bignum" style={children ? { position: "relative" } : undefined}>
      <span className="n">{num}</span>
      <span className="bar" style={{ background: denomColor(den) }} />
      {locked
        ? <span className="d-wrap"><span className="d">{den}</span><span className="lockmark"><Lock size={12} /></span></span>
        : <span className="d">{den}</span>}
      {children}
    </div>
  );
}
