/* tools/r3.jsx — №9 Scale One helper tool (INTERACTIVE).
 *
 * Concept (room r3): Grandpa has 1/2 a strip + 1/4 a strip. One bottom (the 1/4)
 * already fits — re-cut the HALF into fourths so both strips share the same small
 * bottom, then read the total: 2/4 + 1/4 = 3/4.
 *
 * This reuses the LESSON's strip + knife cutting tool (<StripCutter> → shared
 * Plank + Knife): the child drags a ×2 knife onto the 1/2 strip to slice it into
 * fourths so both strips match. Pure manipulative — it never writes the answer.
 *
 * Props: see KitchenTool.jsx contract.
 */
import StripCutter from "../StripCutter.jsx";

export default function R3Tool({ onProgress, disabled = false }) {
  return (
    <StripCutter
      strips={[{ num: 1, den: 2 }, { num: 1, den: 4 }]}
      knives={[2, 3, 4]}
      onProgress={onProgress}
      disabled={disabled}
    />
  );
}
