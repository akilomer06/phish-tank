# Phish Tank

An original cybersecurity party game with a Neon Terminal Arcade identity. All identities and scam messages are fictional training content.

**Current delivery: Stage 2 — Server and Lobby.** Create and join real rooms, share links and QR codes, change host settings, ready up, reconnect, transfer host, watch as a spectator and open a synchronized Big Screen. The full game is not complete: Start stays disabled until the gameplay stages are built, and bots arrive in Stage 6. See [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md).

## Run locally

Use Node **20.19+** and npm. Tests in this workspace use Node 24; the selected tooling also supports the specification's Node 20 target.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Express runs on port **3001**; Vite proxies `/api` and `/socket.io`. Shared contracts compile before development starts and remain under watch alongside the client and server.

| Route               | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/`                 | Landing, instructions, credits, global mute               |
| `/join`             | Join with room code, alias and avatar                     |
| `/join?mode=create` | Create a room as host                                     |
| `/join?code=ABCD`   | Prefilled invite                                          |
| `/room/ABCD`        | Player lobby and session restoration                      |
| `/screen/ABCD`      | Read-only Big Screen with QR and live reactions           |
| `/watch/ABCD`       | Spectator view with emoji reactions                       |
| `/components`       | Interactive UI primitive gallery with labeled sample data |

## Commands

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Run all three packages under watch                           |
| `npm run typecheck`    | Strict TypeScript checks across the packages                 |
| `npm run lint`         | ESLint with zero warnings allowed                            |
| `npm run test`         | Contract, room behavior and real Socket.IO integration tests |
| `npm run build`        | Build shared contracts, server and client                    |
| `npm start`            | Serve production client and live room server                 |
| `npm run test:e2e`     | Playwright desktop and 360px mobile tests                    |
| `npm run format`       | Apply Prettier                                               |
| `npm run format:check` | Check formatting                                             |

For browser tests, install Chromium once with `npx playwright install chromium`, or use installed Edge:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

Playwright starts isolated development servers on **5273 / 3101**, with a larger test-only room quota. Multiple browser contexts use real sockets. Screenshots and failure traces are in `test-results/`, and the HTML report is in `playwright-report/`; both are ignored by Git.

For a local production check in PowerShell:

```powershell
npm run build
$env:CLIENT_ORIGINS = 'http://localhost:3001'
npm start
```

Open **http://localhost:3001**. For other shells, set the same environment variable using that shell's syntax. Deep links have an SPA fallback, and unknown `/api/*` endpoints return JSON 404s.

## Hosting on Vercel

1. Deploy the room server as **one persistent instance** on Render or Railway. A Render blueprint is in `render.yaml`.
2. Import this repository in Vercel with the repository root as Root Directory. `vercel.json` specifies the build and `client/dist` output.
3. Set **`VITE_SERVER_URL`** in Vercel to the backend's public HTTPS URL, then redeploy.
4. Set **`CLIENT_ORIGINS`** on the backend to the exact Vercel frontend origin, with no trailing slash.

See [the deployment guide](docs/DEPLOYMENT.md) for complete configuration and validation. Vercel supports WebSockets, but its distributed instances cannot share this spec's in-memory rooms. The previous serverless Express service configuration has intentionally been replaced by a Vercel frontend plus one persistent backend.

## Packages and privacy

- `client/`: React 18, Vite, strict TypeScript, Tailwind, Framer Motion, Zustand and Socket.IO client. Routes, lobby styling, sounds and confetti load lazily.
- `server/`: Express and Socket.IO, replaceable RoomStore, identity/host checks, input validation, rate limits, 20-second reconnect grace, idle expiry and state projection.
- `shared/`: Zod schemas, event names, typed acknowledgments, public snapshots and owner-only data types.
- [Architecture and contract](docs/ARCHITECTURE.md), [QA tracker](docs/QA.md), [stage progress](PROGRESS.md).

Only display preferences, a notice acknowledgment and the player's own reconnect credentials persist on the device. Reconnect tokens never appear in public state, URLs, QR codes or logs. The server stores only a token hash. Room data lives in memory and expires after restart, after 30 minutes without meaningful activity, or once every disconnected player has exhausted their grace period. Spectators never count toward the player minimum.

All artwork is original SVG/CSS. The specified Google Fonts families are hosted locally with `font-display: swap`; licenses accompany the font files. Original synthesized WAV effects are in `client/public/audio/`. Regenerate with `node scripts/generate-audio.mjs`; replace `tap`, `success`, `fail`, `tick`, `reveal`, `crack`, `siren` or `victory` WAV files to customize. Both the host's room-sound setting and each player's own mute are respected. No analytics or trackers run in the browser.

## Troubleshooting

- Stop another instance if a port is in use; Vite refuses to silently switch ports.
- Run `npm run build -w shared` if shared imports cannot resolve after installation.
- Hosted connection failure: check `VITE_SERVER_URL` was set before the frontend build, the backend is awake, and `CLIENT_ORIGINS` exactly matches your frontend origin.
- Player disconnect: reconnect within 20 seconds to restore the seat. After that, join with a new identity. Host transfers immediately to the longest-connected remaining player.
- Same identity in two tabs: the newer connection takes over, and the old tab explains where the player went.
- Restart/expiry: rooms are intentionally not restored. Create a new room.
- Room full or game underway: use the Watch option. Spectators can react but cannot change gameplay or see private data.
- Sound: tap a control, check personal mute and the host's room-sound setting. Audio failure never blocks a room action.
- Start is disabled in this lobby release. Persona, Password and Crack Race are Stage 3; there is no hidden setting to enable an unfinished phase.

Never enter a real password, OTP, bank detail or account credential.
