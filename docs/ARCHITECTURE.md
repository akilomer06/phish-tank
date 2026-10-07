# Foundation and contract

## Current boundaries

The browser renders and validates input; shared Zod schemas define the network boundary. The server owns all future game outcomes. Stage 1 deliberately exposes only the real Express `/api/health` endpoint. No fake network handlers, room state, scores or API responses stand in for later stages.

UI state is local React state. Zustand persists only display preferences and the alias/avatar. The component lab uses labeled sample values to verify reusable controls; these are never presented as a live game.

The future engine must sit behind a `RoomStore` interface and provide per-recipient views. A public `RoomSnapshot` cannot include passwords, tokens, correct answers before reveal, or anonymous scam authors. `OwnState` is sent only to its authenticated owner. Reconnect tokens travel only in acknowledgment responses to their owner and the resume request. A spectator receives public snapshots only.

No inbound event accepts a player id, score, authoritative deadline, correct answer, or result. Unknown payload keys are rejected by `.strict()`. Alias validation permits international letters, numbers, spaces, dots, underscores and hyphens; unsafe markup is rejected. The future server must additionally apply the configurable profanity filter, duplicate-name suffixes, identity/phase authorization, connection and IP rate limits, deadline/duplicate guards, and per-recipient serialization. Schemas alone do not supply authorization.

## Event contract

All names and types below exist in `shared/src/index.ts`. **Handlers are scheduled for Stages 2–5.** Every future C→S handler must call its corresponding `incomingSchemas[event].safeParse(payload)` before using input, then enforce the indicated authority and `EVENT_PHASES`. Every request has a typed `Ack<T>` callback: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.

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
| `reaction:received` | S→C       | `{emoji, senderId}`           | Validated public reaction                                                          |
| `server:error`      | S→C       | `{code, message}`             | Typed user-facing error without secrets                                            |

Phase data is a discriminated union. This prevents rendering jury or boss fields as though they were available in every phase. Reveal-only information has explicit separate types. Future code must still test actual serialized payloads for leaks; TypeScript is not a runtime privacy boundary.

## Design system

CSS variables and Tailwind tokens share the exact specification colors, type families and glow values. Buttons provide immediate scale feedback and optional vibration/audio. Native `<dialog>` supplies focus containment, Escape support, background inertness and focus restoration. Bottom sheets and LearnCards reuse that behavior. The timer uses an absolute timestamp plus server clock offset, recalculating from wall time after a background tab resumes. Swipe cards always provide labeled button alternatives.

React route chunks isolate Landing, Join and the component lab. Audio and confetti use dynamic imports. All scheduled component updates clean up on unmount. MotionConfig and CSS honor reduced motion. At small widths the how-to cards become an accessible step carousel.
