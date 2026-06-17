/* components/kitchen/KitchenTool.jsx — the TOOL DISPATCHER for Babushka's Kitchen.
 *
 * Each of the 12 kitchen questions has a UNIQUE, concept-matched manipulative (the
 * "helper tool" the child can drive instead of writing the answer cold). This
 * dispatcher takes a room and renders THAT room's tool.
 *
 * ── STATUS: STUBS ─────────────────────────────────────────────────────────────
 * For NOW every tool is a STUB: it renders the wireframe's static markup for that
 * tool (ported from answer.js TOOLS[id]) wrapped in a labelled placeholder. The
 * markup is styled and looks right, but it is INERT — no interactivity yet. A
 * later "tool agent" replaces each stub with a fully interactive version, editing
 * ONE file under tools/<id>.jsx (the files are disjoint on purpose).
 *
 * ════════════════════════════════════════════════════════════════════════════
 *  INTERFACE CONTRACT — what the dispatcher passes every tool component
 * ════════════════════════════════════════════════════════════════════════════
 * Each tools/<id>.jsx default-exports a React component with these props:
 *
 *   room        (object, required)  the room data from kitchen/rooms.js:
 *                                   { id, cook, story, recipe, answer, tutorLine, readVox }
 *                                   Read room.answer for the expected answer shape.
 *
 *   value       (object, optional)  the CURRENT answer value, same shape as
 *                                   KitchenAnswer's value (see KitchenAnswer.jsx):
 *                                     integer  → { int }
 *                                     fraction → { num, den }
 *                                     mixed    → { whole, num, den }
 *                                     compare  → { sym }
 *                                     choice   → { choiceIdx }
 *                                   A tool MAY mirror/derive this so the tool and
 *                                   the written answer stay in sync, but is not
 *                                   required to while it is a stub.
 *
 *   onChange    (fn, optional)      (nextValue) => void. When the child works the
 *                                   manipulative to a committed answer, call this
 *                                   with the SAME value shape KitchenAnswer uses,
 *                                   so driving the tool fills the answer surface.
 *
 *   onProgress  (fn, optional)      (info) => void. Fine-grained progress signal
 *                                   for the engine / analytics, e.g.
 *                                     onProgress({ kind: "manip_step", … })
 *                                   Optional; ignore while stubbing.
 *
 *   disabled    (bool, optional)    lock the tool (e.g. after the question is solved).
 *
 * A tool component should be SELF-CONTAINED: own its interaction state, render the
 * wireframe markup/classes (so styles/kitchen.css applies), and surface results
 * only through onChange/onProgress. Do not import from MomsRoom.
 * ════════════════════════════════════════════════════════════════════════════
 */

import "../../styles/kitchen.css";

import M1Tool from "./tools/m1.jsx";
import M3Tool from "./tools/m3.jsx";
import DenTool from "./tools/den.jsx";
import NumTool from "./tools/num.jsx";
import NlTool from "./tools/nl.jsx";
import S1Tool from "./tools/s1.jsx";
import R4Tool from "./tools/r4.jsx";
import SimpTool from "./tools/simp.jsx";
import R3Tool from "./tools/r3.jsx";
import R2Tool from "./tools/r2.jsx";
import R5Tool from "./tools/r5.jsx";

/** id → tool component. One file per tool so later agents edit disjoint files. */
export const TOOLS = {
  m1: M1Tool, m3: M3Tool, den: DenTool, num: NumTool, nl: NlTool, s1: S1Tool,
  r4: R4Tool, simp: SimpTool, r3: R3Tool, r2: R2Tool, r5: R5Tool,
};

export default function KitchenTool({ room, value, onChange, onProgress, disabled = false }) {
  if (!room || !room.id) return null;
  const Tool = TOOLS[room.id];
  if (!Tool) return null;
  return (
    <Tool room={room} value={value} onChange={onChange} onProgress={onProgress} disabled={disabled} />
  );
}
