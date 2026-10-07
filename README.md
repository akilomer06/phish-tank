# Phish Tank

An original cybersecurity party game with a Neon Terminal Arcade identity. All identities and scam messages are fictional training content.

**Current delivery: Stage 1 — Foundation.** Landing, player setup, the design system, and shared contracts are implemented. This is not yet a playable multiplayer game. Live rooms, game phases, bots, and results follow the approval gates in [SPEC.md](SPEC.md). The setup form explicitly saves a local profile; it does not create a pretend room.

## Run locally

Use Node **20.19+** and npm. The runtime target is Node 20; the available development host uses Node 24. Keep `package-lock.json` committed.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The Express health endpoint is **http://127.0.0.1:3001/api/health**. Shared contracts compile automatically before development starts and stay under watch alongside the client and server.

Routes:

- `/` — Landing, how-to-play carousel, credits and sound settings.
- `/join` — Room code, player alias, emoji selection and local profile saving.
- `/join?code=TIDE` — Prefilled room code.
- `/join?mode=create` — Host identity preparation.
- `/components` — Interactive gallery of every Stage 1 UI primitive, with explicitly labeled sample data.

## Commands

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Run Vite and Express together                                |
| `npm run typecheck`    | Strict TypeScript checks across all three packages           |
| `npm run lint`         | ESLint, zero warnings allowed                                |
| `npm run test`         | Vitest contract validation tests                             |
| `npm run build`        | Build shared contracts, server and client                    |
| `npm start`            | Serve the production client and health endpoint on port 3001 |
| `npm run test:e2e`     | Playwright desktop and 360px mobile tests                    |
| `npm run format`       | Format the repository with Prettier                          |
| `npm run format:check` | Verify formatting                                            |

Before the first browser test, run `npx playwright install chromium`. Alternatively use an installed browser:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

Playwright starts the development servers automatically. Screenshots and failure traces are written to `test-results/`; the HTML report is in `playwright-report/`. Both are ignored by Git.

For a production check:

```sh
npm run build
npm start
```

Then open **http://localhost:3001**. Deep links use the production SPA fallback. Unknown `/api/*` routes correctly return JSON 404 responses.

## Packages and assets

- `client/` — React 18, Vite, TypeScript, Tailwind, Framer Motion, Zustand. Routes are lazy-loaded; Howler and confetti load only on interaction.
- `server/` — Express runtime foundation. No Socket.IO handlers are exposed in Stage 1.
- `shared/` — Zod input schemas, event names, acknowledgment types, phases, public snapshots and owner-only state types.
- `docs/ARCHITECTURE.md` — Boundaries and the typed event contract.
- `docs/QA.md` — Stage 1 tests and remaining acceptance work.
- `PROGRESS.md` — Stage decisions, verification results and next steps.

The neon fish and hook are original SVG/CSS artwork. Fonts are self-hosted Google Fonts families (Space Grotesk, Inter, JetBrains Mono), with `font-display: swap`; license files accompany the assets. No third-party font request or analytics runs in the browser.

Original synthesized WAV effects are in `client/public/audio/`. Regenerate them with `node scripts/generate-audio.mjs`. Replace files at these names to change the effects: `tap`, `success`, `fail`, `tick`, `reveal`, `crack`, `siren`, `victory`. No music or third-party audio licenses are required for the generated tones. Each sound is loaded on demand; the global mute preference persists locally.

Only the player alias, emoji, mute preference, and acknowledgment of the training notice persist. No passwords or room secrets exist in Stage 1 browser storage.

## Environment and deployment

`PORT` configures Express (default `3001`). `NODE_ENV=production` enables production static serving; `npm start` also explicitly enables it. Stage 1 uses same-origin `/api` requests, with Vite proxying them in development, so it needs no permissive CORS middleware.

For a single Render/Railway service, build with `npm ci && npm run build`, start with `npm start`, set `NODE_ENV=production`, and use `/api/health` for health checks. Express binds to `0.0.0.0` and honors the platform's `PORT`.

For a Vercel/Netlify client deployment, build from the repository root with `npm ci && npm run build`, publish `client/dist`, and rewrite non-file application routes to `index.html`. Proxy `/api/*` to the deployed server. The corresponding multiplayer configuration is a **Stage 2/6 requirement**, not implemented yet: an explicit allowed-client-origin list on the server, a configured Socket.IO URL on the client, WSS support, and proxy upgrade/idle-timeout settings. Do not deploy a multiplayer service before those stages pass. Rooms will be in-memory; a restart must expire them rather than imply persistence.

## Troubleshooting

- If a port is in use, stop the other project instance. Vite uses `strictPort` so a hidden port change cannot break browser tests.
- If shared imports cannot resolve, run `npm run build -w shared` (normally handled by `postinstall` and `predev`).
- If Playwright cannot find Chromium, install it or set `PLAYWRIGHT_CHANNEL` to an installed `msedge`/`chrome` browser.
- If sound is blocked, tap a control and verify the top-right mute setting. Audio is optional and must not prevent interaction.
- The game does not connect to rooms yet. Stage 2 is the next explicitly approved build stage.

Do not enter a real password, OTP, bank detail or account credential anywhere in the game.
