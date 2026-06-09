<!-- slice: ui-surfaces → census coverage checklist -->
# ui-surfaces — coverage checklist

One line per owned census item.

## Source — `web/src/ui/**`
- [x] `web/src/ui/EngineSurfaces.jsx` — store→surface bridge container (design.md, tasks.md, ui-wireframes.md)
- [x] `web/src/ui/RationaleBanner.jsx` — KTD8 "why did this change?" banner (design.md, tasks.md, ui-wireframes.md)
- [x] `web/src/ui/AffectProbe.jsx` — consented self-report probe (design.md, requirements.md, ui-wireframes.md)
- [x] `web/src/ui/MasteryInspector.jsx` — counter-metrics + per-node inspector (design.md, tasks.md, ui-wireframes.md)

## Styles
- [x] `web/src/styles/engine-surfaces.css` — banner/toast/inspector layout (ui-wireframes.md, design.md)
- [x] `web/src/styles/affectprobe.css` — probe overlay layout (ui-wireframes.md)

## Tests
- [x] `web/tests/runtime/test_engine_surfaces.test.jsx` — store + EngineSurfaces wiring (tasks.md §7, design.md G/W/T)
- [x] `web/tests/runtime/test_affectProbe.test.jsx` — probe UI behavior (tasks.md §7, design.md)
