/* tools/_stub.jsx — shared wrapper for the (currently inert) kitchen tool stubs.
 *
 * Renders a primitive HTML string inside a clearly-labelled placeholder so the
 * build passes and the markup is styled, while signalling that the interactive
 * behaviour is not wired yet. A tool agent replacing a stub can keep using this
 * wrapper or remove it once the tool is live.
 */
import { KitchenHtml } from "../../../kitchen/primitives.jsx";

export default function ToolStub({ id, html }) {
  return (
    <div className="kq-toolstub" data-tool={id}>
      <div className="kq-toolstub-tag">helper tool · preview (not interactive yet)</div>
      <KitchenHtml className="kq-toolstub-body" html={html} />
    </div>
  );
}
