// TapToRead.jsx — the app-wide "read this aloud" layer.
//
// Mounted ONCE at the root (Shell.jsx). Rather than making EVERY line of text a
// tap target (which fired on any stray tap), this drops a little speaker button
// next to each readable block of copy — in the right character voice — with no
// per-page wiring: a MutationObserver scans #stage and injects the buttons.
//   • Press a button to read its block. If the block sits under [data-vox="<key>"]
//     we play that baked clip; otherwise we synthesize the block's own text via the
//     in-character TTS service, voiced by the nearest [data-vox-speaker] (def: Cook).
//   • Press the SAME button again while it's reading → the voice stops (toggle).
//
// Interactive / manipulative surfaces are skipped (forms, the handwriting Slate,
// the scratch canvas, nav cards, the intro rail) so a button never lands on a
// control. One voice plays at a time app-wide (see voice.js); there is NO robotic
// fallback anywhere.
import { useEffect, useRef } from "react";
import { useVoice } from "./voice.js";
import "./styles/voicetap.css";

// Blocks of copy that get a speaker button (the same set voicetap.css used to mark
// "tappable"). Leaf text blocks only — a block that CONTAINS another readable block
// is skipped so the button lands on the innermost line.
const READABLE = [
  ".goal-text", ".ribbon", ".hint", ".qcap", ".wp-story", ".wp-tag",
  ".puzzle-title", ".puzzle-tag", ".mr-asker-note", ".mr-recipe-of",
  ".gloss", ".ru-title", ".kicker", "h1", "h2", "h3", "p", "[data-vox]",
].join(",");
// Never inject into these (own behaviour / would nest a button inside a control).
const SKIP = [
  "canvas", "input", "textarea", "select", "[contenteditable]", "[data-novox]",
  ".slate-slot", ".mr-tools", "button", "a", "[role='button']",
  ".wcard", ".kitchen-open", ".backbtn",
  ".intro-transcript", ".intro-bar", ".intro-endcard",
].join(",");

const SPEAKER_SVG =
  '<svg viewBox="0 0 16 14" width="11" height="10" aria-hidden="true">' +
  '<path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="currentColor"/>' +
  '<path d="M11 4 Q14 7 11 10" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';
const STOP_SVG =
  '<svg viewBox="0 0 12 12" width="8" height="8" aria-hidden="true">' +
  '<rect x="2" y="2" width="8" height="8" fill="currentColor"/></svg>';

const hasText = (el) => !!(el && el.textContent && /\S/.test(el.textContent));

export default function TapToRead() {
  const { say, stopVoice, speaking } = useVoice();
  const activeRef = useRef(null);   // the button the child last pressed (intent)
  const speakingRef = useRef(false);

  // Reflect a button's on/off look (icon + class), driven by `speaking`.
  function setOn(btn, on) {
    if (!btn) return;
    btn.classList.toggle("vox-btn--on", on);
    btn.innerHTML = on ? STOP_SVG : SPEAKER_SVG;
    btn.setAttribute("aria-label", on ? "Stop reading" : "Read aloud");
  }

  // Keep the active button's visual in sync with the shared channel: it shows
  // "playing" only while audio is actually playing, and reverts when the clip ends
  // or another voice cuts it off. (We keep activeRef so a press after it ends
  // simply replays.)
  useEffect(() => {
    speakingRef.current = speaking;
    const b = activeRef.current;
    if (b) setOn(b, speaking);
  }, [speaking]);

  useEffect(() => {
    const stage = document.getElementById("stage");
    if (!stage) return;

    // Give one block its speaker button (idempotent).
    const addButton = (el) => {
      if (!el || el.nodeType !== 1) return;
      if (el.dataset.voxBtn) return;                  // already done
      if (el.closest(SKIP)) return;                   // control / opted out
      if (!hasText(el)) return;
      if (el.querySelector(READABLE)) return;         // not a leaf line → inner gets it
      // Already has a dedicated "Read aloud" control in its card (word problems,
      // the goal banner) → don't add a second, redundant button.
      if (el.parentElement && el.parentElement.querySelector(".speaker,.wp-readaloud")) return;
      el.dataset.voxBtn = "1";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vox-btn";
      btn.setAttribute("data-novox", "");
      btn.setAttribute("aria-label", "Read aloud");
      btn.innerHTML = SPEAKER_SVG;
      el.appendChild(btn);
    };

    const scan = () => stage.querySelectorAll(READABLE).forEach(addButton);

    // Debounce re-scans (and ignore the mutations our own buttons cause).
    let pending = 0;
    const obs = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => { pending = 0; scan(); });
    });
    scan();
    obs.observe(stage, { childList: true, subtree: true });

    // One capture-phase handler: a press toggles its block's narration, and never
    // leaks to the block (or any board handler) underneath.
    const onClick = (e) => {
      const btn = e.target.closest && e.target.closest(".vox-btn");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const host = btn.parentElement;
      if (btn === activeRef.current && speakingRef.current) { // playing this one → stop
        stopVoice();
        setOn(btn, false);
        activeRef.current = null;
        return;
      }
      if (activeRef.current && activeRef.current !== btn) setOn(activeRef.current, false);
      activeRef.current = btn;
      const keyed = host && host.closest("[data-vox]");
      const key = keyed && keyed.getAttribute("data-vox");
      const speakerEl = host && host.closest("[data-vox-speaker]");
      const speaker = (speakerEl && speakerEl.getAttribute("data-vox-speaker")) || "cook";
      const textOrKey = key || (host && (host.innerText || host.textContent)) || "";
      setOn(btn, true);                               // optimistic; effect corrects it
      // source:'tap' exempts a learner press from decorative-narration suppression
      // (the assisted-reader access path is never cut — U10/R14).
      say(textOrKey, { speaker, source: "tap" });
    };
    stage.addEventListener("click", onClick, true);

    return () => {
      if (pending) cancelAnimationFrame(pending);
      obs.disconnect();
      stage.removeEventListener("click", onClick, true);
      activeRef.current = null;
    };
  }, [say, stopVoice]);

  return null;
}
