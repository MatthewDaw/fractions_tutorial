// The shared lesson ASSET library (Wave F). Ports the wireframe's shared
// primitive builders (eqBox.js / manip.js / compare.js geometry) into clean React
// components so every room draws the box / fraction / ruler / digit-grid / tools /
// compare-drag IDENTICALLY — killing the per-room inline re-implementations
// (DigitGrid ×4, EqBox, EqFrac, EqTools, MixRuler, CellBox, cmpDrag, ruler).
//
// Importing ANYTHING from here also pulls in styles/assets.css (the shared
// geometry/look), so a room gets correct styling for free.
//
// Usage:
//   import { EqBox, EqFrac, FracSlots, EqTools, DigitGrid, MixRuler, MixedNum,
//            MixedSlots, Ruler, CmpDrag, SymBin, CellBox, BigFrac }
//     from "./components/assets";
import "../../styles/assets.css";

export { EqBox, CellBox } from "./EqBox.jsx";
export { EqFrac, BigFrac, FracSlots } from "./EqFrac.jsx";
export { EqTools } from "./EqTools.jsx";
export { DigitGrid, DIGIT_DND_TYPE } from "./DigitGrid.jsx";
export { DigitSlot } from "./DigitSlot.jsx";
export { MixRuler, MixedNum, MixedSlots } from "./MixRuler.jsx";
export { Ruler } from "./Ruler.jsx";
export { default as FractionBuilder } from "./FractionBuilder.jsx";
export { CmpDrag, SymBin } from "./CmpDrag.jsx";
