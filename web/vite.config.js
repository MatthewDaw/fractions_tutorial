import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Dev-only ink capture: the tablet POSTs every handwriting sample (raw stroke
// points + a PNG thumbnail of what was drawn + what the recognizer guessed) to
// /__ink, and we append it to ink-log.jsonl on the laptop. This lets us inspect
// REAL tablet strokes (not synthetic ones) to debug/improve digit recognition.
// Only active in `vite dev` — the endpoint does not exist in a production build.
function inkLogger() {
  const logPath = path.resolve(__dirname, 'ink-log.jsonl')
  return {
    name: 'ink-logger',
    configureServer(server) {
      server.middlewares.use('/__ink', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (c) => { body += c; if (body.length > 8e6) req.destroy() })
          req.on('end', () => {
            try { fs.appendFileSync(logPath, body.replace(/\r?\n/g, ' ') + '\n') } catch (_) {}
            res.statusCode = 204; res.end()
          })
        } else if (req.method === 'DELETE') {
          try { fs.writeFileSync(logPath, '') } catch (_) {}
          res.statusCode = 204; res.end()
        } else {
          let n = 0
          try { n = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).length } catch (_) {}
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ entries: n }))
        }
      })
    },
  }
}

// The engine (web/src/engine/**) is authored in TypeScript, but the React app
// (.js/.jsx) imports it with explicit `.js` extensions (the TS-idiomatic ESM
// style). Rollup/Vite don't map a `.js` specifier onto a `.ts` file on disk, so
// resolve that here for relative imports — fixes dev, build, AND vitest in one place.
function resolveTsFromJs() {
  return {
    name: 'resolve-ts-from-js',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null
      if ((source.startsWith('./') || source.startsWith('../')) && source.endsWith('.js')) {
        const tsPath = path.resolve(path.dirname(importer), source.slice(0, -3) + '.ts')
        if (fs.existsSync(tsPath)) return tsPath
      }
      return null
    },
  }
}

// host: true binds the dev/preview server to 0.0.0.0 so a tablet on the same
// Wi-Fi can open the printed "Network" URL. strictPort keeps the URL stable.
export default defineConfig({
  plugins: [resolveTsFromJs(), react(), inkLogger()],
  // onnxruntime-web ships its own .wasm/.mjs loader; let it resolve those itself
  // instead of Vite pre-bundling/transforming them (which 500s on the loader).
  optimizeDeps: { exclude: ["onnxruntime-web"] },
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['tests/**/*.test.{js,jsx,ts,tsx}'],
  },
})
