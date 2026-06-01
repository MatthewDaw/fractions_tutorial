// audioBus.js — a tiny global signal for "is any narration/voice playing right
// now?". Voice playback (voice.js, RoomIntro narration) brackets each utterance
// with voiceStart()/voiceEnd(); BackgroundMusic subscribes and pauses the music
// while a voice is talking, then resumes — so there's always music EXCEPT when a
// character is speaking ("whenever there is no audio, there is music").
//
// Count-based (handles overlapping/relaunched voices); callers must balance each
// start with an end. The transition-guarded helper in voice.js guarantees that.

let active = 0;
const listeners = new Set();

function emit() {
  const on = active > 0;
  for (const fn of listeners) { try { fn(on); } catch (e) {} }
}

export const audioBus = {
  voiceStart() { active += 1; if (active === 1) emit(); },
  voiceEnd() { if (active > 0) { active -= 1; if (active === 0) emit(); } },
  reset() { if (active !== 0) { active = 0; emit(); } },
  isVoiceActive() { return active > 0; },
  // subscribe(fn): fn(isActive) is called on every change and once immediately.
  subscribe(fn) { listeners.add(fn); fn(active > 0); return () => listeners.delete(fn); },
};
