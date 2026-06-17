/* tools/r2.jsx — №10 Cross-Multiply helper tool (INTERACTIVE).
 *
 * Concept (Lesson 10 · Cross-Multiply): you cut your tray into HALVES (1/2) and
 * Ben cut his into THIRDS (1/3). Different bottoms, so the blocks don't line up.
 * Re-cut BOTH strips to a shared bottom (sixths): the half → 3/6 (×3) and the
 * third → 2/6 (×2). Now every block is the same size; the total is 5/6.
 *
 * This reuses the LESSON's strip + knife cutting tool (<StripCutter> → shared
 * Plank + Knife): the child drags knives onto BOTH strips until they match.
 * Pure manipulative — it never writes the answer; the child reads off the total.
 *
 * Props: see KitchenTool.jsx contract.
 */
import StripCutter from "../StripCutter.jsx";

export default function R2Tool({ onProgress, disabled = false }) {
  return (
    <StripCutter
      strips={[{ num: 1, den: 2 }, { num: 1, den: 3 }]}
      knives={[2, 3, 4]}
      onProgress={onProgress}
      disabled={disabled}
    />
  );
}
