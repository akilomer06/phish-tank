# Phish Tank progress

## Stage boundary

**Stage 2: Multiplayer lobby implemented (2026-10-08).** Stage 1 is complete, and the user approved Stage 2. The specification requires another approval before Stage 3. Gameplay is not yet implemented: the lobby explicitly disables Start and bot controls through server capabilities.

## Delivered

- Stage 1: npm workspaces, strict TypeScript, shared schemas, design system, responsive Landing/Join, accessible UI primitives, local preferences, self-hosted fonts and original audio/art.
- Stage 2: in-memory RoomStore, real Socket.IO create/join/watch/resume/leave, live player list, readiness and host settings.
- Four-letter room codes, normalized unique aliases, configurable profanity filter, capacity and per-IP room limits.
- Owner-only session acknowledgments and private state, hashed reconnect tokens, explicit public snapshot projections.
- Twenty-second reconnect grace, immediate host transfer to the longest-connected player, session takeover handling and expired-session recovery.
- Big Screen lobby, spectators, QR invitation, copy link, rate-limited reactions, room sound preference and server clock synchronization.
- Input schemas, host/phase authorization, connection/event rate limits, origin checks, idle-room expiry and secret wiping.
- Vercel frontend configuration, persistent Node backend configuration and a Render blueprint. Hosting has not been provisioned by this implementation.

## Decisions and limits

- Rooms live in one server process. Deploy the frontend to Vercel and the server to one persistent Node instance. Vercel WebSocket support does not make separate function instances share this room store; see `docs/DEPLOYMENT.md`.
- Start checks enforce the host, minimum three players and readiness, then return an explicit unavailable response until Stage 3 implements gameplay. Future event schemas exist, but their handlers return unavailable rather than simulate outcomes.
- Generic active-phase pause/deadline extension is unit-tested with a fixture. Actual game-phase reconnect, submission and reveal flows remain later-stage work.
- No accounts or database; server restarts expire rooms. Tokens are stored in the browser for reconnect and only their hashes are kept server-side. Private game data is not stored in browser preferences.
- Device audio/haptics, slow-network performance and the 20-client load run remain Stage 6 work.
- The available test host runs Node 24. The project targets Node 20.19 or newer; a separate Node 20 execution has not been performed here.
- The finite birth-year domain (1999–2007) and crush-initial alphabet cannot each contain 60 unique values. Stage 3 should preserve these domains and provide at least 60 entries for open-ended persona fields.

## Verification

- Type checking, ESLint and production builds pass across the workspaces.
- 33 contract, room-service and live Socket.IO integration tests pass.
- Browser coverage includes desktop/mobile create/join, three independent players, Big Screen, settings, ready status, host transfer, refresh, reconnect, session takeover, spectator reactions, expiry recovery and accessibility scans.
- All 38 desktop/mobile browser tests pass, including axe WCAG AA scans; desktop Big Screen and mobile lobby screenshots were visually inspected.
- Production smoke passes for health, API 404, create/join, readiness, refresh and Big Screen without browser console/runtime errors. The local preview is available at `http://localhost:3002`.
- Landing entry JavaScript is approximately 97.5 KB gzipped including its route and runtime; lobby, networking, audio and confetti load separately.

## Next stage (requires user approval)

Stage 3: persona datasets, password creation, password strength and scoring, crack race, server-owned deadlines and the first playable game phases.
