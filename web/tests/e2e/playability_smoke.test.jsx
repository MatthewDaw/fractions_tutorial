// playability_smoke.test.jsx — U12 playability net (characterisation pass).
//
// PURPOSE: Assert that each current room/screen mounts without throwing and
// shows at least one stable, unambiguous landmark element.  This is a
// REGRESSION GUARD for the Phase-B refactor (R19, plan U12 'net') — not a
// behavioural spec.  The tests must stay green throughout every U9–U11
// migration.
//
// SCOPE: AppR1, LessonUnlikeDen (r2-unit lesson config), AppR4, AppR5,
// MomsRoom, WorldMap, Shell (title-screen route).
//
// BROWSER-API SHIMS (jsdom gaps explained):
//   • window.Audio / HTMLAudioElement — BackgroundMusic and voice.js both call
//     `new Audio()` on module load / first render.  jsdom does not implement
//     the real HTMLMediaElement, so we replace the constructor with a no-op
//     stub that carries the interface methods the code actually calls
//     (play/pause/addEventListener/removeEventListener/dispatchEvent).
//   • window.speechSynthesis — voice.js calls `speechSynthesis.cancel()` in its
//     stopVoice cleanup; jsdom has no speech synthesis at all.
//   • HTMLCanvasElement.prototype.getContext — InkPad and ScratchCanvas call
//     canvas.getContext("2d"); jsdom returns null by default.  We stub it so
//     the returned ctx object satisfies every method call the components make
//     (setTransform, clearRect, beginPath, moveTo, lineTo, stroke, etc.).
//   • import.meta.env.BASE_URL — Vite injects this; in the Vitest jsdom
//     environment it defaults to "/" so voice/music URL construction is fine
//     without extra setup.
//   • localStorage — jsdom ships a working in-memory localStorage, so
//     kitchenProgress.js and BackgroundMusic need no stub.

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Global browser-API stubs — installed once before all tests.
// ---------------------------------------------------------------------------
beforeAll(() => {
  // ---- Audio stub -----------------------------------------------------------
  // voice.js: `new Audio(url)` — needs play(), pause(), addEventListener(),
  //   removeEventListener(), plus the autoplay-rejection catch path (play returns
  //   a Promise that may reject with { name:"NotAllowedError" }).
  // BackgroundMusic.jsx: same constructor call at line "const a = new Audio()".
  class AudioStub {
    constructor() {
      this.src = '';
      this.volume = 1;
      this.loop = false;
      this.preload = 'auto';
      this._listeners = {};
    }
    play()  { return Promise.resolve(); }
    pause() {}
    addEventListener(type, fn)    { (this._listeners[type] = this._listeners[type] || []).push(fn); }
    removeEventListener(type, fn) {
      if (this._listeners[type]) this._listeners[type] = this._listeners[type].filter(f => f !== fn);
    }
    dispatchEvent(e) {
      (this._listeners[e.type] || []).forEach(fn => { try { fn(e); } catch (_) {} });
    }
  }
  vi.stubGlobal('Audio', AudioStub);

  // ---- speechSynthesis stub ------------------------------------------------
  // voice.js: references `typeof speechSynthesis !== "undefined"` then calls
  // speechSynthesis.cancel() / speechSynthesis.speak().
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    speak:  vi.fn(),
    pause:  vi.fn(),
    resume: vi.fn(),
    getVoices: () => [],
  });

  // ---- SpeechSynthesisUtterance stub ---------------------------------------
  // voice.js: `new SpeechSynthesisUtterance(text)` then sets .rate/.pitch/.onstart/.onend
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; }
  });

  // ---- HTMLCanvasElement.getContext stub ------------------------------------
  // InkPad.jsx and ScratchCanvas.jsx call canvas.getContext("2d") and then use
  // the returned ctx object for drawing.  jsdom returns null; we return a spy
  // object that silently absorbs every 2D context call.
  const ctxStub = new Proxy({}, {
    get(_t, prop) {
      // Return a no-op function for any property access so the components can
      // call ctx.setTransform(...), ctx.clearRect(...), ctx.beginPath(), etc.
      return typeof prop === 'string' ? vi.fn() : undefined;
    },
    set() { return true; },
  });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxStub);

  // ---- requestAnimationFrame / cancelAnimationFrame stub -------------------
  // BackgroundMusic uses rAF for the fade helper; jsdom provides a basic stub
  // but it is sometimes missing in older versions.
  if (typeof window.requestAnimationFrame === 'undefined') {
    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 16));
    vi.stubGlobal('cancelAnimationFrame',  (id) => clearTimeout(id));
  }

  // ---- performance.now stub ------------------------------------------------
  // BackgroundMusic uses performance.now() for fade timing.
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
    vi.stubGlobal('performance', { now: () => Date.now() });
  }
});

// ---------------------------------------------------------------------------
// Lazy imports — placed after the stubs are installed via beforeAll so that
// modules that call `new Audio()` at module scope receive the stub constructor.
// (In practice Vitest runs beforeAll before any import in this file because we
// use dynamic imports inside each test block, but we declare them at the top
// scope and resolve lazily to keep the test bodies simple.)
// ---------------------------------------------------------------------------

// NOTE: CSS imports inside the source components are transformed by Vite/Vitest
// to no-ops in the jsdom environment (the test environment has `css: {}` in
// vite.config).  If any component import throws due to a missing CSS module,
// add `css: { modules: { ... } }` to vite.config.test or install a CSS mock
// transformer — but in practice Vitest + jsdom silently discards plain CSS.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal no-op callback shared across tests. */
const noop = () => {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Playability smoke — AppR1', () => {
  it('mounts without throwing and shows the goal text', async () => {
    const { default: AppR1 } = await import('../../src/AppR1.jsx');
    render(
      <AppR1
        no={1}
        title="Same-Size Pieces"
        onBack={noop}
      />
    );
    // The component renders a .goal-text div with a stable fragment about
    // adding fractions with the same denominator.
    const goal = document.querySelector('.goal-text');
    expect(goal).not.toBeNull();
    expect(goal.textContent).toMatch(/Babushka/i);
  });
});

describe('Playability smoke — LessonUnlikeDen (r2-unit config)', () => {
  it('mounts without throwing and shows the goal / stage selector', async () => {
    // Import the real lesson config so the component gets its exact production
    // shape (anchor, bank, framing, handwriting flag, etc.).
    const [{ default: LessonUnlikeDen }, { default: r2Unit }] = await Promise.all([
      import('../../src/LessonUnlikeDen.jsx'),
      import('../../src/lessons/r2-unit.js'),
    ]);
    const { container } = render(
      <LessonUnlikeDen
        no={2}
        title="The Cook's Lesson"
        lesson={r2Unit}
        onBack={noop}
      />
    );
    // The component renders a .goal-text div once mounted at beat L0.
    const goal = container.querySelector('.goal-text');
    expect(goal).not.toBeNull();
    // The lesson always shows a "Read aloud" speaker button (present on every beat).
    // Scope to this render's container so a leaked tree from another test can't
    // turn this into a "multiple elements found" failure under parallel load.
    expect(within(container).getByText(/read aloud/i)).toBeTruthy();
  });
});

describe('Playability smoke — AppR4', () => {
  it('mounts without throwing and shows the goal text', async () => {
    const { default: AppR4 } = await import('../../src/AppR4.jsx');
    render(
      <AppR4
        no={4}
        title="The Tidying Room"
        onBack={noop}
      />
    );
    // The component renders a .goal-text div with text about 8/12.
    const goal = document.querySelector('.goal-text');
    expect(goal).not.toBeNull();
    expect(goal.textContent).toMatch(/8\/12|8 and 12|twelve|Babushka/i);
  });
});

describe('Playability smoke — AppR5', () => {
  it('mounts without throwing and shows the goal text', async () => {
    const { default: AppR5 } = await import('../../src/AppR5.jsx');
    render(
      <AppR5
        no={5}
        title="The Whole-Units Room"
        onBack={noop}
      />
    );
    // The component renders a .goal-text div with text about the anchor 9/7.
    const goal = document.querySelector('.goal-text');
    expect(goal).not.toBeNull();
    expect(goal.textContent).toMatch(/9\/7|whole|Babushka/i);
  });
});

describe('Playability smoke — AppM2 (Baking Trays / Arrays)', () => {
  it('mounts without throwing and shows the goal text', async () => {
    const { default: AppM2 } = await import('../../src/AppM2.jsx');
    render(
      <AppM2
        no={2}
        title="Baking Trays"
        onBack={noop}
      />
    );
    // The component renders a .goal-text div about the 4 × 6 tray (rows × columns).
    const goal = document.querySelector('.goal-text');
    expect(goal).not.toBeNull();
    expect(goal.textContent).toMatch(/Babushka|rows|tray|4 . 6/i);
  });
});

describe('Playability smoke — MomsRoom', () => {
  it('mounts without throwing and shows the topbar title', async () => {
    const { default: MomsRoom } = await import('../../src/MomsRoom.jsx');
    const { container } = render(
      <MomsRoom
        onBack={noop}
        onOpenRoom={noop}
      />
    );
    // The topbar always contains the stable subtitle "Babushka's Kitchen".
    // Scope to this render's container so a leaked tree from another test can't
    // turn this into a "multiple elements found" failure under parallel load.
    expect(within(container).getByText(/Babushka'?s Kitchen/i)).toBeTruthy();
    // The "Read aloud" speaker button is rendered in the goal bar.
    expect(within(container).getByText(/read aloud/i)).toBeTruthy();
  });
});

describe('Playability smoke — WorldMap', () => {
  it('mounts without throwing and shows the map heading', async () => {
    const { default: WorldMap } = await import('../../src/WorldMap.jsx');
    render(<WorldMap onOpen={noop} />);
    // The world-head always contains the h1 title.
    expect(screen.getByRole('heading', { name: /Babushka'?s Fractions/i })).toBeTruthy();
    // The map footer is a stable landmark element (copy/room-count may change,
    // so match the stable "… lessons, in order …" phrasing rather than a count).
    expect(screen.getByText(/lessons, in order/i)).toBeTruthy();
  });
});

describe('Playability smoke — Shell (title-screen route)', () => {
  it('mounts without throwing and shows the TitleScreen CTA button', async () => {
    // Shell reads the URL hash; set it to the title route before mounting.
    // The hash-route reader in Shell: `window.location.hash.replace(/^#\/?/, "") || "title"`.
    // An empty hash → "title" (the default), which is what we want.
    window.location.hash = '';

    const { default: Shell } = await import('../../src/Shell.jsx');
    render(<Shell />);

    // TitleScreen renders a single CTA button with class "start".
    // The button text is "Let's Slice!" (Russian/English label), so we query
    // by CSS class rather than name to stay resilient against copy changes.
    const startBtn = document.querySelector('button.start');
    expect(startBtn).not.toBeNull();
  });
});
