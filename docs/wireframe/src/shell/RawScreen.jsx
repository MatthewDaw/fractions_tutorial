import Toolbar from "./Toolbar.jsx";
import { useStageFit } from "./useStageFit.js";
import { prepHtml } from "./prepHtml.js";

/* Generic shell for one-off scenes (kitchen states, world map, title, intro,
   settings, …) that don't share the lesson-board chrome. Renders the toolbar +
   the scaled #fit/#stage box, and injects the screen's verbatim inner-#stage
   markup. `data` shape:
     { title, route, bodyHTML }                                                */
export default function RawScreen({ data }) {
  useStageFit(data.route || data.title);
  return (
    <>
      <Toolbar title={data.title} route={data.route} />
      <div id="fit">
        <div
          id="stage"
          dangerouslySetInnerHTML={{ __html: prepHtml(data.bodyHTML) }}
        />
      </div>
    </>
  );
}
