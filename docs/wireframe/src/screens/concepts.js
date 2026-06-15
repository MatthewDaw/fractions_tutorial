/* concepts — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Concept Mastery Map",
  route: "#/concepts",
  bodyHTML: `
<div class="scene cm-scene" data-vox-speaker="cook">
      <div class="paper-fill" style="position:absolute;inset:0"></div>
      <div class="foxing"></div>
      <div class="frame"></div>
      <div class="corner tl"><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" stroke-width="1.8" /><path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" stroke-width="1.2" opacity="0.7" /><circle cx="6" cy="6" r="2.4" fill="#a32a22" /></svg></div>
      <div class="corner tr"><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" stroke-width="1.8" /><path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" stroke-width="1.2" opacity="0.7" /><circle cx="6" cy="6" r="2.4" fill="#a32a22" /></svg></div>
      <div class="corner bl"><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" stroke-width="1.8" /><path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" stroke-width="1.2" opacity="0.7" /><circle cx="6" cy="6" r="2.4" fill="#a32a22" /></svg></div>
      <div class="corner br"><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" stroke-width="1.8" /><path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" stroke-width="1.2" opacity="0.7" /><circle cx="6" cy="6" r="2.4" fill="#a32a22" /></svg></div>

      <div class="cm-inner">
        <!-- header -->
        <div class="cm-head">
          <div class="cm-head-l">
            <div class="cm-kicker"><span class="cm-k-dot"></span>Babushka&rsquo;s Fractions</div>
            <h1 class="cm-h-title">Concept Mastery Map</h1>
            <div class="cm-h-sub">
              Pick a concept up top to open its subconcepts. Mastery is measured at the smallest
              card and rolls up — explore in any order, at your own pace.
            </div>
          </div>
          <div class="cm-head-r">
            <span class="cm-source placeholder">○ Placeholder data</span>
            <a href="world.html" class="cm-back">
              <span class="ar">&lsaquo;</span> Done
            </a>
          </div>
        </div>

        <!-- legend -->
        <div class="cm-legend">
          <span class="cm-legend-item"><i class="sw strong"></i>Mastered (85%+)</span>
          <span class="cm-legend-item"><i class="sw partial"></i>Partial (50%+)</span>
          <span class="cm-legend-item"><i class="sw weak"></i>Weak (15%+)</span>
          <span class="cm-legend-item"><i class="sw empty"></i>Not started</span>
        </div>

        <!-- TOP NAV — the high-level concepts (rolled-up rings) -->
        <nav class="cm-nav" role="tablist" aria-label="Math concepts">
          <a href="#" role="tab" aria-selected="true" class="cm-nav-tab partial is-active">
            <svg class="cm-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="51.4593 30.2221" transform="rotate(-90 17 17)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">63</text>
            </svg>
            <span class="cm-nav-tx">
              <span class="cm-nav-title">Multiplication</span>
              <span class="cm-nav-count">2 skills</span>
            </span>
          </a>
          <a href="#" role="tab" aria-selected="false" class="cm-nav-tab weak">
            <svg class="cm-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="35.1230 46.5584" transform="rotate(-90 17 17)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">43</text>
            </svg>
            <span class="cm-nav-tx">
              <span class="cm-nav-title">Fractions as Numbers</span>
              <span class="cm-nav-count">1 skill</span>
            </span>
          </a>
          <a href="#" role="tab" aria-selected="false" class="cm-nav-tab weak">
            <svg class="cm-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="39.2071 42.4743" transform="rotate(-90 17 17)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">48</text>
            </svg>
            <span class="cm-nav-tx">
              <span class="cm-nav-title">Adding &amp; Subtracting</span>
              <span class="cm-nav-count">4 skills</span>
            </span>
          </a>
          <a href="#" role="tab" aria-selected="false" class="cm-nav-tab partial">
            <svg class="cm-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="49.0088 32.6726" transform="rotate(-90 17 17)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">60</text>
            </svg>
            <span class="cm-nav-tx">
              <span class="cm-nav-title">Comparing &amp; Estimating</span>
              <span class="cm-nav-count">1 skill</span>
            </span>
          </a>
          <a href="#" role="tab" aria-selected="false" class="cm-nav-tab weak">
            <svg class="cm-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="39.2071 42.4743" transform="rotate(-90 17 17)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">48</text>
            </svg>
            <span class="cm-nav-tx">
              <span class="cm-nav-title">Equivalence &amp; Simplifying</span>
              <span class="cm-nav-count">1 skill</span>
            </span>
          </a>
          <a href="#" role="tab" aria-selected="false" class="cm-nav-tab partial">
            <svg class="cm-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="17" cy="17" r="13" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="65.3451 16.3363" transform="rotate(-90 17 17)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">80</text>
            </svg>
            <span class="cm-nav-tx">
              <span class="cm-nav-title">Mixed Numbers</span>
              <span class="cm-nav-count">1 skill</span>
            </span>
          </a>
        </nav>

        <!-- MAIN — the selected concept's subconcept breakdown (Multiplication) -->
        <div class="cm-detail">
          <div class="cm-detail-head">
            <svg class="cm-ring" width="50" height="50" viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="21" fill="none" stroke="var(--paper-3)" stroke-width="5" />
              <circle cx="25" cy="25" r="21" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="83.1265 48.8203" transform="rotate(-90 25 25)" />
              <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">63</text>
            </svg>
            <div class="cm-detail-tx">
              <h2 class="cm-detail-title">Multiplication</h2>
              <p class="cm-detail-blurb">Equal groups, arrays, and times facts — the groundwork the fraction work leans on.</p>
            </div>
          </div>
          <div class="cm-scroll">

            <!-- skill node 1: Equal Groups (EXPANDED) -->
            <div class="cm-node partial">
              <button class="cm-node-head" aria-expanded="true">
                <span class="cm-caret open">▸</span>
                <svg class="cm-ring" width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
                  <circle cx="21" cy="21" r="17" fill="none" stroke="var(--paper-3)" stroke-width="5" />
                  <circle cx="21" cy="21" r="17" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="70.4973 36.3168" transform="rotate(-90 21 21)" />
                  <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">66</text>
                </svg>
                <span class="cm-node-titles">
                  <span class="cm-node-title">
                    Equal Groups
                    <span class="cm-node-id">MULT_EQUAL_GROUPS</span>
                  </span>
                  <span class="cm-node-concept">Same count on every plate — add the group again and again, or multiply.</span>
                </span>
                <span class="cm-node-meta">
                  <span class="cm-node-ex">3 × 4</span>
                  <span class="cm-leafcount">5 cards</span>
                </span>
              </button>

              <div class="cm-node-body">
                <div class="cm-node-subhead">
                  <span class="cm-node-ccss" title="Common Core alignment">aligned to 3.OA.A.1</span>
                </div>
                <div class="cm-cards">
                  <div class="cm-card partial">
                    <div class="cm-card-top">
                      <span class="cm-chip scaffold">Visual</span>
                      <span class="cm-card-lv">L0</span>
                    </div>
                    <div class="cm-card-id">equal_groups_visual</div>
                    <div class="cm-bar" title="76% mastered">
                      <div class="cm-bar-fill" style="width:76%"></div>
                      <span class="cm-bar-num">76</span>
                    </div>
                  </div>
                  <div class="cm-card partial">
                    <div class="cm-card-top">
                      <span class="cm-chip scaffold">Guided</span>
                      <span class="cm-card-lv">L1</span>
                    </div>
                    <div class="cm-card-id">equal_groups_guided</div>
                    <div class="cm-bar" title="63% mastered">
                      <div class="cm-bar-fill" style="width:63%"></div>
                      <span class="cm-bar-num">63</span>
                    </div>
                  </div>
                  <div class="cm-card weak">
                    <div class="cm-card-top">
                      <span class="cm-chip scaffold">Partial</span>
                      <span class="cm-card-lv">L2</span>
                    </div>
                    <div class="cm-card-id">equal_groups_partial</div>
                    <div class="cm-bar" title="39% mastered">
                      <div class="cm-bar-fill" style="width:39%"></div>
                      <span class="cm-bar-num">39</span>
                    </div>
                  </div>
                  <div class="cm-card partial">
                    <div class="cm-card-top">
                      <span class="cm-chip transfer">Transfer</span>
                      <span class="cm-card-lv">L3</span>
                    </div>
                    <div class="cm-card-id">equal_groups_bare</div>
                    <div class="cm-bar" title="62% mastered">
                      <div class="cm-bar-fill" style="width:62%"></div>
                      <span class="cm-bar-num">62</span>
                    </div>
                  </div>
                  <div class="cm-card strong">
                    <div class="cm-card-top">
                      <span class="cm-chip transfer">Transfer</span>
                      <span class="cm-card-lv">L4</span>
                    </div>
                    <div class="cm-card-id">equal_groups_transfer</div>
                    <div class="cm-bar" title="93% mastered">
                      <div class="cm-bar-fill" style="width:93%"></div>
                      <span class="cm-bar-num">93</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- skill node 2: Times Facts (COLLAPSED) -->
            <div class="cm-node partial">
              <button class="cm-node-head" aria-expanded="false">
                <span class="cm-caret">▸</span>
                <svg class="cm-ring" width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
                  <circle cx="21" cy="21" r="17" fill="none" stroke="var(--paper-3)" stroke-width="5" />
                  <circle cx="21" cy="21" r="17" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-dasharray="63.0203 43.7938" transform="rotate(-90 21 21)" />
                  <text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="cm-ring-num">59</text>
                </svg>
                <span class="cm-node-titles">
                  <span class="cm-node-title">
                    Times Facts
                    <span class="cm-node-id">MULT_FACTS</span>
                  </span>
                  <span class="cm-node-concept">Skip-count the jar to the answer, then know it by heart.</span>
                </span>
                <span class="cm-node-meta">
                  <span class="cm-node-ex">7 × 8</span>
                  <span class="cm-leafcount">5 cards</span>
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
`,
};
