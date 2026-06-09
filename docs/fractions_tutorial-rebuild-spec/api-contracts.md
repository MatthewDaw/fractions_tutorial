# API Contracts

What goes here: the program-facing contracts — the engine public API surface
(`engine/index.ts` exports), the harness CLI subcommands + flags + emitted
artifacts, and the dev-only Vite HTTP endpoints (`/__ink`, `/api/tts`). There is
no production HTTP server; all contracts are module exports, the CLI, and dev
middleware.
