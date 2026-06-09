// test_decorative_suppression.test.jsx — plan 002 U10 / R14.
//
// Themed-load suppression: during an ACTIVE manipulation/answer window, ambient
// DECORATIVE narration must not auto-play (the seductive-details extraneous-load
// risk the themed-load isomorphism rubric flags). Suppression is tagged at the
// CALL SITE, not the shared audio source:
//   • say(key, { decorative: true })  → suppressed while the window is active
//   • say(key)            (structural) → ALWAYS plays (math-carrying feedback)
//   • say(key, { source: 'tap' }) / readAloud (tap-to-read) → ALWAYS plays
//     (the assisted-reader access path is never cut)
// Suppression also never touches the user's mute/volume settings — accessibility
// is never broken (a learner who opted into narration is not overridden).
//
// We exercise voice.js directly (the call-site mechanism lives there) and detect
// whether a clip was actually requested by spying on the Audio constructor: a
// baked-clip say() synchronously does `new Audio(url).play()`, so an Audio
// instance is created iff narration fired. jsdom has no real HTMLMediaElement, so
// we install the same no-op Audio/speechSynthesis stubs the playability smoke
// test uses.

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

// ---- Browser-API stubs (jsdom gaps; mirrors playability_smoke.test.jsx) ------
let audioCtorCalls = 0;
let playCalls = 0;

beforeAll(() => {
  class AudioStub {
    constructor(url) {
      this.src = url || '';
      this.volume = 1;
      this._listeners = {};
      audioCtorCalls++;
    }
    play()  { playCalls++; return Promise.resolve(); }
    pause() {}
    addEventListener(type, fn)    { (this._listeners[type] = this._listeners[type] || []).push(fn); }
    removeEventListener(type, fn) {
      if (this._listeners[type]) this._listeners[type] = this._listeners[type].filter(f => f !== fn);
    }
    dispatchEvent(e) { (this._listeners[e.type] || []).forEach(fn => { try { fn(e); } catch (_) {} }); }
  }
  vi.stubGlobal('Audio', AudioStub);
  vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: vi.fn(), pause: vi.fn(), resume: vi.fn(), getVoices: () => [] });
});

// voice.js holds module-level channel state; import once, reset counters/flags
// between cases so each assertion starts from a clean window.
import {
  setSuppressDecorativeNarration,
  isDecorativeNarrationSuppressed,
  readAloud,
  stopVoiceGlobal,
} from '../../src/voice.js';
// useVoice() exposes the same speak() seam through say(); we drive say() via the
// hook to assert the real lesson call site, not a private helper.
import { useVoice } from '../../src/voice.js';
import { renderHook } from '@testing-library/react';

// A real baked-clip key (entry in voiceLines.js) → say() takes the synchronous
// playUrl() clip path, so `new Audio()` fires immediately when narration plays.
const CLIP_KEY = 'r1CountUp';      // structural feedback line in AppR1
const CLIP_KEY_2 = 'titleWelcome'; // a second distinct baked clip

function freshSay() {
  const { result } = renderHook(() => useVoice());
  return result.current.say;
}

// readAloud() yields to app-driven say() for 250ms (no talk-over). Module-level
// `lastAppSayAt` persists across tests, so advance the clock past that guard
// before a tap-to-read assertion to isolate the suppression behavior under test.
function tapRead(textOrKey, speaker) {
  const realNow = Date.now;
  const spy = vi.spyOn(Date, 'now').mockReturnValue(realNow() + 10_000);
  try { readAloud(textOrKey, speaker); } finally { spy.mockRestore(); }
}

beforeEach(() => {
  setSuppressDecorativeNarration(false);
  stopVoiceGlobal();          // clear any pending play-intent so re-requests aren't toggled off
  audioCtorCalls = 0;
  playCalls = 0;
});

afterEach(() => {
  setSuppressDecorativeNarration(false);
  stopVoiceGlobal();
});

describe('U10/R14 — decorative narration suppression during the active solve', () => {
  it('AC1: during an active window, decorative auto-play narration does NOT fire', () => {
    const say = freshSay();
    setSuppressDecorativeNarration(true);          // active manipulation/answer window
    say(CLIP_KEY, { decorative: true });
    expect(audioCtorCalls).toBe(0);                 // no clip constructed → silent
    expect(playCalls).toBe(0);
  });

  it('AC2a: structural (untagged) narration still plays during the active window', () => {
    const say = freshSay();
    setSuppressDecorativeNarration(true);
    say(CLIP_KEY);                                  // no decorative flag → math-carrying
    expect(audioCtorCalls).toBe(1);
    expect(playCalls).toBe(1);
  });

  it('AC2b: learner-initiated tap-to-read still plays during the active window', () => {
    setSuppressDecorativeNarration(true);
    tapRead(CLIP_KEY);                              // tap-to-read path (source:"tap")
    expect(audioCtorCalls).toBe(1);
    expect(playCalls).toBe(1);
  });

  it('AC2c: an explicitly tap-sourced say() is exempt even if the line is decorative', () => {
    const say = freshSay();
    setSuppressDecorativeNarration(true);
    // A learner pressing a button to read a decorative line must still hear it.
    say(CLIP_KEY, { decorative: true, source: 'tap' });
    expect(audioCtorCalls).toBe(1);
    expect(playCalls).toBe(1);
  });

  it('AC3: outside the active window, decorative narration plays normally', () => {
    const say = freshSay();
    setSuppressDecorativeNarration(false);          // pre-solve / between problems
    say(CLIP_KEY, { decorative: true });
    expect(audioCtorCalls).toBe(1);
    expect(playCalls).toBe(1);
  });

  it('AC4: the gate is narrow — only decorative:true is suppressed, never structural', () => {
    const sayA = freshSay();
    setSuppressDecorativeNarration(true);
    sayA(CLIP_KEY, { decorative: true });           // suppressed
    expect(audioCtorCalls).toBe(0);
    // a structural line on the very same active window still speaks
    sayA(CLIP_KEY_2);
    expect(audioCtorCalls).toBe(1);
    expect(playCalls).toBe(1);
  });

  it('AC5: suppression respects user settings — it never mutes the channel or overrides volume', () => {
    const say = freshSay();
    setSuppressDecorativeNarration(true);
    say(CLIP_KEY, { decorative: true });            // suppressed (decorative)
    expect(audioCtorCalls).toBe(0);
    // The user who opted into narration is NOT cut off from access: structural
    // and tap-to-read still reach the channel unchanged while the flag is on.
    say(CLIP_KEY);
    tapRead(CLIP_KEY_2);
    expect(audioCtorCalls).toBe(2);
    expect(playCalls).toBe(2);
  });

  it('AC6: setter is idempotent and reflected by the read-only query', () => {
    setSuppressDecorativeNarration(true);
    expect(isDecorativeNarrationSuppressed()).toBe(true);
    setSuppressDecorativeNarration(true);
    expect(isDecorativeNarrationSuppressed()).toBe(true);
    setSuppressDecorativeNarration(false);
    expect(isDecorativeNarrationSuppressed()).toBe(false);
    // truthy/falsy coercion to a strict boolean
    setSuppressDecorativeNarration(1);
    expect(isDecorativeNarrationSuppressed()).toBe(true);
    setSuppressDecorativeNarration(0);
    expect(isDecorativeNarrationSuppressed()).toBe(false);
  });
});
