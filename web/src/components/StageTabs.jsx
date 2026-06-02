// StageTabs — the ONE shared lesson stage-selector ("top bar") for every lesson.
// A square numbered badge + NAME + italic subtitle per stage, laid out in a grid
// that wraps cleanly to a second row. Every lesson feeds it the same shape, so the
// bar looks and behaves identically everywhere (replacing the old per-lesson copies:
// .m1-stages / .m2-stages / .m3-stages / .r1-stages / .r4-stagebar / .beat-select).
//
// Props:
//   stages   — [{ key, badge, title?, sub?, suffix? }]
//     key    · stable id; compared against `current` and passed back to onSelect
//     badge  · what shows in the square (number / letter / glyph)
//     title  · short stage name (UPPERCASED by CSS)
//     sub    · one-line description (shown italic; also the hover tooltip)
//     suffix · optional node rendered after the text (e.g. a stylus ✎ marker)
//   current  — key of the active stage
//   onSelect — (key) => void, jump to a stage
//   label    — aria-label for the tablist
//
// "Done" (every stage positioned before the active one) is derived from list order
// here, so callers never compute completion state themselves.
import "../styles/stagetabs.css";

export default function StageTabs({ stages, current, onSelect, label = "Lesson stages" }) {
  const activeIdx = stages.findIndex((s) => s.key === current);
  return (
    <div className="stage-tabs" role="tablist" aria-label={label}>
      {stages.map((s, i) => {
        const active = s.key === current;
        const done = activeIdx > -1 && i < activeIdx;
        return (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={"stage-tab" + (active ? " is-active" : "") + (done ? " is-done" : "")}
            title={s.sub || s.title}
            onClick={() => onSelect(s.key)}
          >
            <span className="stage-tab-n">{s.badge}</span>
            {(s.title || s.sub) && (
              <span className="stage-tab-tx">
                {s.title && <span className="stage-tab-name">{s.title}</span>}
                {s.sub && <span className="stage-tab-sub">{s.sub}</span>}
              </span>
            )}
            {s.suffix ?? null}
          </button>
        );
      })}
    </div>
  );
}
