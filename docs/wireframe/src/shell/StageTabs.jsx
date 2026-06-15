import { Link, useLocation } from "react-router-dom";
import { routeFromHref } from "./routeFromHref.js";
import { LESSONS } from "../lessons.js";

/* The lesson stage-tab strip — ONE component for every lesson step.

   A page passes only `lesson` (an id into lessons.js); this resolves the strip
   and marks the active tab by matching the current route — so there is NO
   per-page tab data or active flag. (A literal `tabs` array is still accepted.)

   Even rows are computed HERE at render time from the step count against the
   fixed 1280px stage, and the per-tab width is set inline — so the balanced
   layout is correct on the very first paint (no post-render reflow, no shift
   when navigating between steps). */

const STRIP_W = 1216; // #stage is a fixed 1280px box − .page horizontal padding
const GAP = 6; // --wf-tabs-gap
const MIN_TAB = 150; // smallest readable tab before wrapping

function tabBasis(count) {
  const perRowMax = Math.max(1, Math.floor((STRIP_W + GAP) / (MIN_TAB + GAP)));
  const rows = Math.ceil(count / perRowMax);
  const perRow = Math.ceil(count / rows);
  return `calc((100% - ${(perRow - 1) * GAP}px) / ${perRow})`;
}

export default function StageTabs({ lesson, tabs }) {
  const { pathname } = useLocation();
  const list = tabs || (lesson && LESSONS[lesson] ? LESSONS[lesson].tabs : []);
  const style = { flex: `1 1 ${tabBasis(list.length)}`, minWidth: 0 };

  return (
    <div className="stage-tabs" role="tablist" aria-label="Lesson stages">
      {list.map((t, i) => {
        const route = routeFromHref(t.href);
        const active = t.active != null ? t.active : route === pathname;
        const inner = (
          <>
            <span className="stage-tab-n">{t.n}</span>
            <span className="stage-tab-tx">
              <span className="stage-tab-name">{t.name}</span>
              <span className="stage-tab-sub">{t.sub}</span>
            </span>
          </>
        );
        return active ? (
          <button key={i} type="button" role="tab" aria-selected="true" className="stage-tab is-active" title={t.title || t.sub} style={style}>
            {inner}
          </button>
        ) : (
          <Link key={i} to={route} role="tab" aria-selected="false" className="stage-tab" title={t.title || t.sub} style={style}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
