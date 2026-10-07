# Verification tracker

## Stage 1 automated coverage

Vitest checks code normalization, international aliases, invalid and unsafe inputs, message bounds, forged score/identity fields, and complete phase policies for inbound contracts.

Playwright runs the same foundation flows on desktop (1440px) and mobile (360px):

- Landing render, console/runtime errors, horizontal overflow and screenshots.
- Code normalization, individual-key focus, backspace and arrow navigation, deep links.
- Alias validation, avatar selection, profile saving and persistence after reload.
- Host setup accurately communicates that live room creation is deferred.
- First-visit fake-password notice and persisted dismissal.
- Global mute persistence.
- Dialog focus trap, Escape and focus restoration.
- Jury button interaction, reset, reaction feedback and LearnCard.
- Absolute-deadline timer catching up after elapsed wall time.
- Reduced-motion styling, carousel, credits and not-found recovery.
- Express health endpoint.

## Final 45-check acceptance inventory

The following status is explicitly for the **whole game**, not the foundation. Later stages must replace every deferred entry with a verified result. No unimplemented feature is marked passed.

| Check                                            | Coverage now                                 | Status                                 |
| ------------------------------------------------ | -------------------------------------------- | -------------------------------------- |
| 1. Start documented app                          | Automated: Playwright webServer              | Foundation covered                     |
| 2–3. Create/join rooms                           | Stage 2                                      | Deferred                               |
| 4–5. Bots / minimum players                      | Stages 2 and 6                               | Deferred                               |
| 6–7. Ready / start game                          | Stage 2                                      | Deferred                               |
| 8–11. Persona / passwords / crack race / scores  | Stage 3                                      | Deferred                               |
| 12–16. Hacker / jury / anonymity / red flags     | Stage 4                                      | Deferred                               |
| 17. Round repetition                             | Stages 4–5                                   | Deferred                               |
| 18–23. Boss / results / share / replay / lobby   | Stage 5                                      | Deferred                               |
| 24–25. Big Screen and live updates               | Stages 2–5                                   | Deferred                               |
| 26–30. Reconnect / host transfer / pause / grace | Stages 2–6                                   | Deferred                               |
| 31. Duplicate names                              | Stage 2                                      | Deferred                               |
| 32–33. Duplicate and late submissions            | Stages 3–5                                   | Deferred                               |
| 34. Invalid Socket.IO payloads                   | Unit schemas covered; no active handlers yet | Partial; live test deferred            |
| 35–38. Room errors / spectator behavior          | Stage 2                                      | Deferred                               |
| 39. Refresh / back during active play            | Stages 3–6                                   | Deferred                               |
| 40. Server restart expiry                        | Stage 2                                      | Deferred                               |
| 41–42. Secret isolation / wiping                 | Stages 2–6                                   | Deferred                               |
| 43–44. Runtime / console errors                  | Automated foundation browser tests           | Foundation covered; full game deferred |
| 45. Production build                             | Stage verification gate                      | Foundation covered                     |

## Manual / device QA remaining for full release

- Actual iOS Safari audio unlock, screen lock, safe-area and keyboard behavior.
- Android at 4× CPU slowdown and slow 3G; Lighthouse targets and bundle budget.
- Physical touch swipes and vibration; device mute and interrupted playback.
- 3–20 real concurrent clients and projector readability.
- Twenty-second disconnection grace, host transfer, fewer-than-three pause and resume, and all-connected submission completion while somebody is disconnected.
- Clock skew, system sleep, background tabs, duplicate/late packets, malformed messages and event flooding.
- Profanity rules, HTML sanitization, duplicate-name suffixes, room capacity, IP room limits and 30-minute expiry.
- Server restart expires sessions, no secrets enter logs/storage, completed/expired rooms wipe password data.
- Keyboard-only flow and screen-reader announcements through all eight phases.

Bot Mode and the 20-client load script are Stage 6 deliverables and do not exist in the foundation. Do not treat sample players in the component lab as bots.
