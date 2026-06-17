import { Link } from "react-router-dom";

/* The fixed wireframe toolbar above the scaled stage. Shared by every screen.
   `title` is the screen name; `route` is the optional hash-route hint shown in
   small grey text (e.g. "#/nl"). */
export default function Toolbar({ title, route }) {
  return (
    <nav className="wf-toolbar">
      <Link to="/">⌂ All screens</Link>
      <span className="wf-tb-title">
        {title}
        {route ? <small> · {route}</small> : null}
      </span>
      <span className="wf-tb-spacer" />
      <span className="wf-tb-badge">WIREFRAME</span>
    </nav>
  );
}
