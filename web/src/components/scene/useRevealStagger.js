// useRevealStagger.js — the shared "load reveal" hook used by standalone scenes
// (Settings, Title, …). After mount it flips `ready` to true on a short timeout,
// which the scene's CSS uses to fade/slide its `.rv .dN` elements in, staggered.
//
// This is DATA/PRESENTATION timing only — no interactive logic. Each scene keeps
// its own `.scene.ready .dN { transition-delay }` rules; the hook just owns the
// mount→ready transition (default 90ms, matching the original SettingsScreen).
import { useEffect, useState } from "react";

export default function useRevealStagger(delay = 90) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}
