import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The wireframe is a standalone SPA living under docs/wireframe/. It is NOT part
// of web/ (the real app) and shares no build with it.
export default defineConfig({
  plugins: [react()],
  // The REAL app (web/) owns 5173 with strictPort. Pin the wireframe to its own
  // port so there's never any confusion about which one you're looking at.
  server: { port: 5180, strictPort: true, open: true },
  preview: { port: 5180, strictPort: true },
});
