import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SPEAKERS } from './src/voiceLines.js'

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

// Dev-only in-character TTS service. The tablet POSTs { text, speaker } to
// /api/tts; we synthesize that line in the matching ElevenLabs character voice
// (same model + settings as scripts/generate-voice.mjs) and cache the mp3 to
// public/voice/cache/ keyed by speaker+text, so repeats are instant and the clip
// library grows on its own. This is what lets EVERY on-screen string be read
// aloud in-character with no robotic browser voice (see src/voice.js). Only
// active in `vite dev` — the endpoint does not exist in a production build.
function ttsServer() {
  const CACHE_DIR = path.resolve(__dirname, 'public', 'voice', 'cache')
  const ENV_PATH = path.resolve(__dirname, '.env')
  const API = 'https://api.elevenlabs.io'
  const MODEL_ID = 'eleven_multilingual_v2'
  const OUTPUT_FORMAT = 'mp3_44100_128'
  const VOICE_SETTINGS = { stability: 0.22, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true }
  const ENV_KEYS = ['ELEVENLABS_API_KEY', 'ELEVEN_VOICE_COOK', 'ELEVEN_VOICE_MOM', 'ELEVEN_VOICE_KID', 'ELEVEN_VOICE_GRANDPA']

  // read keys from web/.env (same parse as generate-voice.mjs); process.env wins
  let env = null
  function loadEnv() {
    if (env) return env
    env = {}
    try {
      const raw = fs.readFileSync(ENV_PATH, 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        if (line.trimStart().startsWith('#')) continue
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
        if (!m) continue
        let v = m[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        env[m[1]] = v
      }
    } catch (_) { /* no .env — service stays silent */ }
    for (const k of ENV_KEYS) if (process.env[k]) env[k] = process.env[k]
    return env
  }
  const voiceIdFor = (speaker) => {
    const sp = SPEAKERS[speaker]
    return sp && sp.voiceEnv ? (loadEnv()[sp.voiceEnv] || null) : null
  }

  const inflight = new Map() // dedupe concurrent identical syntheses
  async function synth(apiKey, voiceId, text) {
    const url = `${API}/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    })
    if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
    return Buffer.from(await res.arrayBuffer())
  }

  return {
    name: 'tts-server',
    configureServer(server) {
      server.middlewares.use('/api/tts', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy() })
        req.on('end', async () => {
          let text = '', speaker = 'cook'
          try { const j = JSON.parse(body || '{}'); text = String(j.text || '').slice(0, 600).trim(); speaker = String(j.speaker || 'cook') } catch (_) {}
          const silent = (code = 204) => { res.statusCode = code; res.end() }
          if (!text) return silent()
          const apiKey = loadEnv().ELEVENLABS_API_KEY
          const voiceId = voiceIdFor(speaker)
          if (!apiKey || !voiceId) return silent() // cat / unset voice → silent, never robotic
          const hash = crypto.createHash('sha1').update(speaker + '|' + text).digest('hex').slice(0, 16)
          const file = path.join(CACHE_DIR, `${speaker}-${hash}.mp3`)
          const send = (buf) => {
            res.setHeader('Content-Type', 'audio/mpeg')
            res.setHeader('Cache-Control', 'public, max-age=31536000')
            res.end(buf)
          }
          try {
            if (fs.existsSync(file)) return send(fs.readFileSync(file))
            let p = inflight.get(file)
            if (!p) {
              p = synth(apiKey, voiceId, text).then((buf) => {
                fs.mkdirSync(CACHE_DIR, { recursive: true })
                fs.writeFileSync(file, buf)
                return buf
              }).finally(() => inflight.delete(file))
              inflight.set(file, p)
            }
            send(await p)
          } catch (err) {
            server.config.logger.warn(`[tts] ${err.message}`)
            silent() // never robotic — just no audio on failure
          }
        })
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
  plugins: [resolveTsFromJs(), react(), inkLogger(), ttsServer()],
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
    // The playability-net smoke tests mount real, heavy component trees. Under a
    // default parallel `vitest run` on a many-core machine, first render of those
    // trees can exceed the default 5s timeout purely from CPU contention (they
    // pass in isolation). Raise the per-test timeout so the net is a trustworthy
    // regression guard and doesn't flake on the runner it ships with. This does
    // not weaken any assertion — it only stops starvation from masquerading as a
    // failure. A genuine hang still trips the 20s ceiling.
    testTimeout: 20000,
  },
})
