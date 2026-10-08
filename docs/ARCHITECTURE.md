# Multiplayer architecture and contract

## Current boundaries

The browser renders and validates input; shared Zod schemas define the network boundary. The server owns room membership, settings, readiness, identity and all future game outcomes. Stage 2 serves Express `/api/health` and real Socket.IO room handlers. Start remains disabled until gameplay is implemented in Stage 3.

UI state uses React and Zustand. Local storage keeps validated display preferences, alias/avatar and the reconnect token scoped to the backend origin. It does not store private game state. The component lab uses labeled sample values to verify reusable controls; these are never presented as a live game.

`RoomService` uses a `RoomStore` interface backed by `MemoryRoomStore`. Synchronous mutations run in one Node process. Public snapshots use an explicit projection; tokens and owner state are excluded. `OwnState` is sent only to its authenticated owner's socket. Random reconnect tokens travel only in session acknowledgments and resume requests; the server retains SHA-256 hashes and uses timing-safe comparison. A spectator receives public snapshots only. Future gameplay must preserve these boundaries for passwords, unrevealed answers and anonymous scam authors.

No inbound event accepts a player id, score, authoritative deadline, correct answer, or result. Unknown payload keys are rejected by `.strict()`. Alias validation permits international letters, numbers, spaces, dots, underscores and hyphens; unsafe markup is rejected. The server applies normalization, configurable profanity filtering, unique-name suffixes, identity/phase authorization, connection/IP/event rate limits and origin checks. Gameplay deadline and duplicate-submission guards remain later-stage work.

Disconnected players retain their seat for 20 seconds; the host immediately transfers to the longest continuously connected player. Resume restores identity and readiness without reclaiming host privileges. A second tab replacing the same session disconnects the first with a distinct event. Idle rooms expire after 30 minutes; expiry wipes member tokens and owner data. The generic active-phase pause/deadline adjustment is tested, but actual game phase transitions are deferred.

The client samples server time and uses the lowest round-trip sample for clock offset. Reconnection and foreground events restore membership and resynchronize time. Cleanup removes listeners and timers; Big Screen and Watch use spectator identities. Deployment uses a Vercel static frontend and one persistent room server; see `DEPLOYMENT.md`.

## Event contract

All names and types below exist in `shared/src/index.ts`. **Stage 2 mounts room, readiness, settings, reaction and clock handlers.** `game:start` validates prerequisites then returns `FEATURE_UNAVAILABLE`; bot and gameplay events also return unavailable after payload validation. Every mounted C→S handler validates input before use and enforces authority and `EVENT_PHASES`. Every request has a typed `Ack<T>` callback: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.

| Event               | Direction | Payload                       | Phase / authority / validation                                                     |
| ------------------- | --------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| `room:create`       | C→S       | `{name, avatar}`              | New connection; validated profile, room/IP quota                                   |
| `room:join`         | C→S       | `{code, name, avatar}`        | LOBBY; four uppercase letters, capacity, unique identity                           |
| `room:resume`       | C→S       | `{code, token}`               | Any; authenticate 32–256 character opaque token                                    |
| `room:watch`        | C→S       | `{code}`                      | Any; read-only spectator identity                                                  |
| `room:leave`        | C→S       | `{}`                          | Any; current connection only                                                       |
| `lobby:ready`       | C→S       | `{ready: boolean}`            | LOBBY; own player                                                                  |
| `lobby:settings`    | C→S       | `{rounds, difficulty, sound}` | LOBBY; host; rounds 1–3, fixed difficulty enum                                     |
| `lobby:add-bots`    | C→S       | `{count}`                     | LOBBY; host; integer 1–10 and capacity guard                                       |
| `game:start`        | C→S       | `{}`                          | LOBBY; host; ready and player minimum checks                                       |
| `password:submit`   | C→S       | `{password}`                  | PASSWORD; owner; 1–128 printable characters, once before deadline                  |
| `hacker:guess`      | C→S       | `{guess}`                     | HACKER; server-assigned target; 1–128 printable characters, at most three attempts |
| `hacker:hint`       | C→S       | `{}`                          | HACKER; server chooses hint and charges 75 points                                  |
| `hacker:scam`       | C→S       | `{text, tactic}`              | HACKER; plain text 1–280 characters, fixed tactic enum, once before deadline       |
| `jury:vote`         | C→S       | `{messageId, vote}`           | JURY; active message only, REAL/SCAM, once before deadline                         |
| `boss:answer`       | C→S       | `{stepId, optionId}`          | BOSS; current step and valid option, once before deadline                          |
| `game:again`        | C→S       | `{}`                          | RESULTS; host; wipe game data and return room to LOBBY                             |
| `reaction:send`     | C→S       | `{emoji}`                     | Any; player/spectator, allowlisted emoji, rate limit                               |
| `clock:ping`        | C→S       | `{sentAt}`                    | Any; finite nonnegative timestamp; ack includes server time                        |
| `room:state`        | S→C       | `RoomSnapshot`                | Public per-room state, safe for spectators                                         |
| `player:state`      | S→C       | `OwnState`                    | Authenticated owner only                                                           |
| `room:expired`      | S→C       | No payload                    | Token/room could not be restored after restart                                     |
| `session:replaced`  | S→C       | No payload                    | Another socket resumed this session; old socket disconnects                        |
| `reaction:received` | S→C       | `{emoji, senderId}`           | Validated public reaction                                                          |
| `server:error`      | S→C       | `{code, message}`             | Typed user-facing error without secrets                                            |

Phase data is a discriminated union. This prevents rendering jury or boss fields as though they were available in every phase. Reveal-only information has explicit separate types. Future code must still test actual serialized payloads for leaks; TypeScript is not a runtime privacy boundary.

## Design system

CSS variables and Tailwind tokens share the exact specification colors, type families and glow values. Buttons provide immediate scale feedback and optional vibration/audio. Native `<dialog>` supplies focus containment, Escape support, background inertness and focus restoration. Bottom sheets and LearnCards reuse that behavior. The timer uses an absolute timestamp plus server clock offset, recalculating from wall time after a background tab resumes. Swipe cards always provide labeled button alternatives.

React route chunks isolate Landing, Join, Lobby and the component lab. Socket.IO, audio and confetti load separately from the landing page. All scheduled component updates clean up on unmount. MotionConfig and CSS honor reduced motion. At small widths the how-to cards become an accessible step carousel.
