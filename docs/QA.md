# Verification tracker

## Stage 2 automated coverage

Vitest: **33 passing tests** across shared contracts, RoomService and real Socket.IO connections. These check normalization, invalid/forged payloads, public/private isolation, token hashing, resume and replacement, host authorization/transfer, room capacity, quotas, profanity, idle expiry, secret wiping, phase guards, start gates, generic pause/deadline adjustment, origin checks, rate limiting, clock synchronization and spectator restrictions.

Playwright runs on desktop (1440px) and mobile (360px), using an isolated server and installed Edge. It covers the foundation screens and real multiplayer lobby flows:

- Landing, Join, component gallery, keyboard navigation, validation, preferences and training notice.
- Dialog focus containment, Escape and focus restoration; reduced motion, overflow and console/runtime errors.
- Three independent players and a Big Screen observer, synchronized settings and readiness, reactions and accessibility scans.
- Same-seat refresh, explicit host leave, offline reconnect/host transfer, duplicate-tab session replacement and expired-session recovery.
- Screenshots of desktop/mobile lobby and Big Screen.

Final Stage 2 gate: **38 browser tests passed** across both viewport projects, including axe WCAG AA scans. Desktop Big Screen and mobile lobby screenshots were visually inspected. Production smoke checks passed for health, unknown-API 404, real create/join, readiness, deep-link refresh and Big Screen, with no browser console warnings/errors or uncaught runtime errors. Type checking, lint, all 33 unit/integration tests and client/server/shared production builds pass.

## Final 45-check acceptance inventory

This inventory concerns the **whole game**. Lobby coverage does not imply completed gameplay.

| Check                                            | Coverage now                                                | Status                                              |
| ------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| 1. Start documented app                          | Automated dev server and production build                   | Covered                                             |
| 2–3. Create/join rooms                           | Real sockets and desktop/mobile flows                       | Covered                                             |
| 4–5. Bots / minimum players                      | Minimum-player server gate; bots Stage 6                    | Partial                                             |
| 6–7. Ready / start game                          | Readiness and start validation; phase transition Stage 3    | Partial                                             |
| 8–11. Persona / passwords / crack race / scores  | Stage 3                                                     | Deferred                                            |
| 12–16. Hacker / jury / anonymity / red flags     | Stage 4                                                     | Deferred                                            |
| 17. Round repetition                             | Stages 4–5                                                  | Deferred                                            |
| 18–23. Boss / results / share / replay / lobby   | Stage 5                                                     | Deferred                                            |
| 24–25. Big Screen and live updates               | Lobby browser flows                                         | Lobby covered; game phases deferred                 |
| 26–30. Reconnect / host transfer / pause / grace | Browser, live socket and room tests; generic pause fixture  | Lobby covered; active-game behavior deferred        |
| 31. Duplicate names                              | Room tests, normalized unique suffixes                      | Covered                                             |
| 32–33. Duplicate and late submissions            | Stages 3–5                                                  | Deferred                                            |
| 34. Invalid Socket.IO payloads                   | Strict schemas and live socket tests                        | Covered for mounted handlers                        |
| 35–38. Room errors / spectator behavior          | Service tests and browser recovery/observer flows           | Lobby covered; in-progress game UI deferred         |
| 39. Refresh / back during active play            | Lobby identity survives refresh                             | Active play deferred                                |
| 40. Server restart expiry                        | Invalid-token browser recovery and expiry integration tests | Recovery covered; hosted restart rehearsal deferred |
| 41–42. Secret isolation / wiping                 | Token and owner-state tests; room expiry wipe               | Current data covered; future game secrets deferred  |
| 43–44. Runtime / console errors                  | Desktop/mobile foundation and lobby tests                   | Current screens covered                             |
| 45. Production build                             | Shared, server and client builds                            | Covered                                             |

## Manual / device QA remaining for full release

- Actual iOS Safari audio unlock, screen lock, safe areas and keyboard behavior.
- Android at 4× CPU slowdown and slow 3G; Lighthouse targets and full-game bundle budget.
- Physical touch swipes, vibration, device mute and interrupted playback.
- 3–20 real concurrent clients and projector readability on deployed infrastructure.
- Active-phase grace, pause/resume, all-connected submission completion, late/duplicate packets and clock skew after system sleep.
- Hosted server restart, full-game secret wiping and no secret logging through all game phases.
- Keyboard-only and screen-reader flows through all eight phases.

Bot Mode and the 20-client load script are Stage 6 deliverables. Component gallery samples are not bots.
