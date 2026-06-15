# Merge spec — fold №3 "On the Number Line" + №4 "Same Denominators" into ONE №3 lesson

We are merging two lessons into a single 12-step lesson **№3**. Each of the 12
step pages below must end up with (a) the SAME identity, and (b) the SAME 12-tab
strip, with only its own tab marked active.

## (a) Identity — set these on every one of the 12 pages

- Lesson number: **№3**
- Lesson title (puzzle-title): **Same Denominators**
- Lesson tag (puzzle-tag): **Lesson 3 · On the Number Line**
- Route hint: **#/nl**
- Toolbar title: **№3 Same Denominators · <StepName>**  (StepName = this page's step, e.g. "Place", "Bind", "Practice")

How that maps by file type:
- **Structured lesson modules** (have `num`, `tag`, `title`, `toolbarTitle`, `route` fields): set
  `num: "№3"`, `tag: "Lesson 3 · On the Number Line"`, `title: "Same Denominators"`,
  `route: "#/nl"`, `toolbarTitle: "№3 Same Denominators · <StepName>"`.
- **Raw modules** (have `title`, `route`, `bodyHTML`): set the `title:` field to
  `"№3 Same Denominators · <StepName>"`, `route: "#/nl"`, and inside `bodyHTML` set the
  `<span class="num-mark">№3</span>` and `<div class="puzzle-tag">Lesson 3 · On the Number Line</div>`.
  Also set the `<div class="puzzle-title">Same Denominators</div>`.

## (b) The 12-tab strip (identical on every page; only `active` differs)

Order, with n-badge / name / sub / href:

1. `1` · **Place** · "grow the fraction from 1/4 blocks" · room-nl.html
2. `2` · **Write** · "name the marked point" · room-nl-2-write.html
3. `3` · **Past 1** · "place a fraction bigger than a whole" · room-nl-3-numbers.html
4. `4` · **Manipulate** · "drag & count blocks" · room-r1.html
5. `5` · **Bind** · "blocks + write 5/7" · room-r1-2-bind.html
6. `6` · **Fade** · "blocks dim, write" · room-r1-3-fade.html
7. `7` · **Workbench** · "build it from the bin" · room-r1-4-workbench.html
8. `8` · **Numbers** · "bare 2/7 + 3/7 = ?" · room-r1-5-numbers.html
9. `9` · **Applied** · "write the sum, then total" · room-r1-6-applied.html
10. `sw` · **Show Work** · "show your work" · room-r1-sw-showwork.html
11. `10` · **Words** · "story problem" · room-r1-7-words.html
12. `★` · **Practice** · "fresh problems — paced to your mastery" · room-r1-practice.html

### Structured-module form (the `tabs:` array)
Replace the existing `tabs: [ … ]` with all 12 entries. For the page's OWN step, use
`active: true` and OMIT `href`. For all others, give `href` and OMIT `active`. Example entry:
`{ n: "4", name: "Manipulate", sub: "drag & count blocks", href: "room-r1.html", title: "drag & count blocks" }`
(the active one: `{ n: "1", name: "Place", sub: "grow the fraction from 1/4 blocks", active: true, title: "Drag 1/4 blocks onto the line" }`)

### Raw-module form (the `<div class="stage-tabs">` in bodyHTML)
Replace the entire existing `<div class="stage-tabs" …> … </div>` block with 12 children.
The active tab is a `<button>`; the rest are `<a href>`. Match the existing markup shape:
```
<div class="stage-tabs" role="tablist" aria-label="Lesson stages">
  <button type="button" role="tab" aria-selected="true" class="stage-tab is-active" title="…">
    <span class="stage-tab-n">4</span>
    <span class="stage-tab-tx"><span class="stage-tab-name">Manipulate</span><span class="stage-tab-sub">drag & count blocks</span></span>
  </button>
  <a href="room-nl.html" role="tab" aria-selected="false" class="stage-tab" title="…">
    <span class="stage-tab-n">1</span>
    <span class="stage-tab-tx"><span class="stage-tab-name">Place</span><span class="stage-tab-sub">grow the fraction from 1/4 blocks</span></span>
  </a>
  … all 12, in the order above …
</div>
```

## Step → page → which tab is active

| file | type | StepName | active n |
|------|------|----------|----------|
| room-nl.js | structured | Place | 1 |
| room-nl-2-write.js | structured | Write | 2 |
| room-nl-3-numbers.js | structured | Past 1 | 3 |
| room-r1.js | structured | Manipulate | 4 |
| room-r1-2-bind.js | structured | Bind | 5 |
| room-r1-3-fade.js | structured | Fade | 6 |
| room-r1-4-workbench.js | raw | Workbench | 7 |
| room-r1-5-numbers.js | structured | Numbers | 8 |
| room-r1-6-applied.js | raw | Applied | 9 |
| room-r1-sw-showwork.js | raw | Show Work | sw |
| room-r1-7-words.js | raw | Words | 10 |
| room-r1-practice.js | raw | Practice | ★ |

## Hard rules
- ONLY edit the file's identity + tab strip. Do NOT touch the stage/answer/rail/tutor
  CONTENT — the number-line steps keep their number-line content, the r1 steps keep theirs.
- Only edit files under `docs/wireframe/src/screens/`. Never touch web/ or shell components.
- Keep it valid JS.
