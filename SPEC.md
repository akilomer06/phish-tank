# PHISH TANK: MASTER BUILD SPEC

> Save this file in the repo root as `SPEC.md`. It is the single source of truth. Read all of it before writing any code.

---

## 0. HOW TO READ THIS SPEC (PRECEDENCE AND WORKING RULES)

- **The repository is the deliverable.** Create and edit files directly in the workspace. Never print the whole codebase in chat.
- **Autonomy.** Make reasonable decisions yourself and record them in `PROGRESS.md`. Ask me a question only if two requirements truly contradict each other or something is impossible. Do not ask me to connect pieces, finish code, or fix obvious errors.
- **No stubs.** No TODOs, placeholder handlers, pseudo-code, mock screens, fake API responses, or half-built features. If a feature is described anywhere here, ship the complete working version.
- **Conflict rule.** If two sections disagree, the more specific section wins, and Sections 12 to 17 override everything else.
- **Stop after Stage 1** and wait for my "go" (see Section 14). After that, continue stage by stage on my approval.

---

## 1. ROLE

You are a principal full-stack engineer, a senior product designer, and a game designer working as one team. Quality bar: it must feel like a polished commercial party game, not a school project. Use Jackbox, Kahoot, and the Among Us lobby only as inspiration for social energy, fast onboarding, dramatic reveals, and clear multiplayer feedback. Do NOT copy their branding, logos, artwork, assets, or distinctive layouts. Phish Tank has its own identity: **Neon Terminal Arcade** (Section 4).

---

## 2. PRODUCT SUMMARY

Phish Tank is a cybersecurity party game for 3 to 20 friends joining by link on their phones. Players learn by **being the attacker**: they build passwords, crack each other's, write fake scam messages, and judge real versus scam. Learning is hidden inside fast, funny gameplay, never preachy. Audience: college students and hostel groups. Tone: playful, cheeky, slightly chaotic.

---

## 3. TECH STACK (FIXED)

- **Client:** React 18, Vite, TypeScript (strict), Tailwind CSS, Framer Motion, Zustand, howler.js, canvas-confetti, qrcode.react, html-to-image
- **Server:** Node 20, Express, Socket.IO, TypeScript (strict), zod
- **Monorepo:** `/client`, `/server`, `/shared` (shared types, event names, zod schemas)
- **State:** in-memory room state behind a `RoomStore` interface so Redis can replace it later
- **Root scripts (create these FIRST, working across all packages):**
  - `npm run dev` (client and server together)
  - `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm start`
  - `npm run test:e2e` (Playwright)
- ESLint + Prettier configured. Zero errors required; fix warnings unless there is a documented reason.
- **Deploy notes:** server on Render or Railway, client on Vercel or Netlify. Document CORS, env vars, and WebSocket settings.

---

## 4. DESIGN SYSTEM: "NEON TERMINAL ARCADE" (FOLLOW EXACTLY)

Dark, glossy, hacker-meets-party. Layered depth, glow, and motion. Never flat or generic.

**Colors (CSS variables and Tailwind tokens):**
- `bg-0 #06080C` (app), `bg-1 #0C1118` (cards), `bg-2 #141B26` (raised), `border #1F2937`
- Neon green `#39FF88` (success, primary CTA), cyan `#22D3EE` (info), magenta `#FF3D81` (scam, danger), amber `#FFB020` (warning, low timer), violet `#8B5CF6` (boss, special)
- Text: `text-1 #F1F5F9`, `text-2 #94A3B8`, `text-3 #64748B`
- Every accent has a soft glow shadow token, e.g. `0 0 24px rgba(57,255,136,.35)`

**Typography (Google Fonts, preloaded, `font-display: swap`):**
- Headings and numbers: Space Grotesk 700. Body: Inter 400/500/600. Terminal, code, passwords: JetBrains Mono.
- Scale: 12/14/16/20/28/40/64px. Countdown numerals 96px or larger.

**Shape and spacing:**
- 8px grid. Cards radius 20px. Buttons radius 14px. Minimum tap target 52px high.
- Glass cards: `bg-1` at 80% opacity, 1px gradient border, backdrop blur.
- Background: subtle animated grid, faint scanlines, slow drifting particles (all disabled under `prefers-reduced-motion`).

**Reusable primitives (build all):** Button (primary glow / secondary / danger / ghost; press-scale and haptic), Card, Badge, Avatar (emoji in glowing ring in the player's color), PlayerChip, TimerRing (SVG ring; amber under 10s; pulsing red under 5s), ProgressBar, Toast, Modal, BottomSheet, EmojiReactionBar, LearnCard (slide-up sheet), Podium, StrengthMeter (segmented neon bar), CrackBar (race bar with glitch on completion), TypewriterText, SwipeCard (Tinder-style REAL/SCAM swipe with color wash), Skeleton loaders, EmptyState, ErrorState.

**Motion rules:**
- Page transitions 250ms fade plus 12px slide. Spring physics for cards. Staggered list entrances (40ms).
- Reveals are dramatic sequences: screen shake, glitch text, confetti, flash.
- Every tap gives feedback within 100ms (scale, glow, sound, vibrate).
- Only animate `transform` and `opacity`. Respect `prefers-reduced-motion` everywhere.

**Sound (howler):** global mute toggle; audio unlocks on first tap. Sounds: tap, success, fail, tick (last 5s), reveal whoosh, crack-complete, boss siren, victory fanfare. Use royalty-free or generated placeholders and document where real files go. Lazy-load all audio.

**Copywriting:** short, punchy, funny. Example: "Your password cracked in 0.4 seconds. Your ex would be proud." Never more than 2 lines of instruction on any screen.

---

## 5. SCREENS AND UX (mobile-first at 360 to 430px, scaling to tablet and desktop)

1. **Landing:** animated logo (fish hook through a glowing @), tagline, Create Room, Join Room, 3-step "How it works" carousel, mute toggle.
2. **Join:** 4-letter code boxes (auto-uppercase, auto-advance), name (max 14 chars), emoji avatar grid, friendly validation. Show once: "Use a fake password for your persona. Never type a real one."
3. **Lobby:** giant room code, copy-link button, QR code, live player grid with join animations, host crown, ready toggles, host settings (rounds 1 to 3, difficulty Easy/Medium/Hard, sound, Big Screen link), minimum 3 players, sticky bottom Start button for the host, Add Bot controls (Section 11).
4. **Persona Reveal:** cinematic ID-card flip with typewriter fill-in.
5. **Password Phase:** persona card pinned on top; password input with show/hide; live StrengthMeter and estimated crack time (display only; the server computes the authoritative score); rule hints appear only after first submit; submit triggers a "vault lock" animation.
6. **Crack Race (shared reveal):** every password attacked at once with animated CrackBars and a terminal log ("trying: rahul2004... FOUND in 0.8s"). Weakest falls first; the strongest survives with a shield effect. Non-weak passwords are partially masked.
7. **Hacker Phase:** victim's persona card; choose **Guess Password** (3 attempts, paid hints) or **Write Scam** (280-char textarea with counter, tactic chips that insert templates: Urgency, Authority, Reward, Fear, Personal, plus a live believability meter).
8. **Jury Phase:** SwipeCard stack of anonymous messages, 15s each, big REAL and SCAM buttons as an alternative to swiping, live group-confidence bar, then reveal with author, fooled count, and red-flag highlights (tapped words glow magenta with explanation tooltips).
9. **Boss Round:** violet theme, siren intro, chain diagram of attack steps; players tap where the victim could have stopped it; shared Defense Meter.
10. **Results:** animated podium, awards carousel, personal Security Report (scams spotted vs missed, password grade A to F, top 3 mistakes with fixes), shareable PNG card, Play Again, Back to Lobby.
11. **Big Screen (`/screen/:code`):** projector-optimized, large type, no input. Shows lobby QR, timers, crack race, jury results, leaderboard, live emoji rain, in real time.
12. **Spectators:** if a game has started, offer "Watch". Spectators get the Big Screen view read-only, can send emoji reactions, never see secrets, and do not count toward the 3-player minimum.
13. **Error and empty states:** room not found, room full, disconnected banner with auto-reconnect, and "Room expired, start a new one" after a server restart (rooms are in memory and are NOT restored).

All screens need loading, empty, error, and focus states.

---

## 6. GAME RULES AND SCORING (IMPLEMENT EXACTLY)

**State machine:** `LOBBY → PERSONA → PASSWORD → CRACK_RACE → HACKER → JURY → BOSS → RESULTS`. The loop `PASSWORD → CRACK_RACE → HACKER → JURY` repeats for the configured number of rounds (1 to 3), then BOSS once, then RESULTS. Play Again returns everyone to LOBBY in the same room.

**Timers:** Persona 8s, Password 45s, Crack Race about 15s, Hacker 90s, Jury 15s per message, Boss 20s per step. The server sends an absolute `endsAt`; clients compute remaining time locally and correct for clock offset using a ping-pong handshake. Use timestamps, never `setInterval` counting. A phase ends early when all connected players have submitted.

**Scoring:**
- Password: strength 0 to 100 maps to up to 300 points. Personal info, common-password hits, or keyboard walks apply penalties.
- Survive the crack race: +200 for lasting longer than the median.
- Guess Password: 500 (1st try), 300 (2nd), 150 (3rd). A hint costs 75.
- Scam author: 100 per person fooled, +150 if the victim is fooled.
- Jury correct vote: +100, plus a speed bonus up to +50.
- Victim spots the scam written about them: +200.
- Boss: +100 per correct step for every player; +300 team bonus if the Defense Meter is full.
- **Tie-breakers:** higher password score, then fewer wrong jury votes, then earlier submission time.

**Pairing:** victims are assigned by a **derangement** (nobody gets themselves; everybody is targeted exactly once). Must hold for odd counts.

**Fairness:** the server never sends another player's real password or secret fields before the reveal; shuffles jury order server-side; hides scam authors until reveal; ignores late and duplicate submissions.

---

## 7. CONTENT (SHIP REAL CONTENT AS JSON IN `/server/content`)

- **Personas:** generator with 60+ values per field: first names, nicknames, pet names, birth years (1999 to 2007), favorite IPL team/cricketer, college type, Indian hometowns, favorite food, favorite movie/actor, crush initial. Clues must make some passwords guessable (that is the lesson).
- **Scam messages (40):** `id, channel (SMS/WhatsApp/Email/Call script), text, redFlags[{phrase, explanation}], category` (KYC, OTP, delivery, job offer, lottery, UPI refund, fake support, crypto, loan app, electricity bill, etc.).
- **Real messages (40):** legitimate bank alerts, OTPs with warnings, delivery updates, college notices, each with a "why this is legit" note. Include tricky legit ones so it is not trivial.
- **Boss scenarios (6):** SIM swap, fake job offer, QR payment scam, fake KYC call, malicious APK, public Wi-Fi. Each has 4 steps, options, the correct break-the-chain answer, and an explanation.
- **Learn cards (20):** max 2 short lines plus one "Do this instead" tip.
- Indian context (UPI, Aadhaar, OTP, KYC, IPL), understandable globally. Content must be easy to extend.

---

## 8. ROBUSTNESS (HANDLE ALL OF THESE)

- **Reconnection:** player id and room token in `localStorage`; reconnect restores the exact room, phase, and the player's own permitted submitted data.
- **Host leaves:** auto-transfer to the longest-connected player.
- **Disconnect mid-phase:** 20s grace, then auto-skip with zero score. Nobody can block a phase forever.
- **Fewer than 3 active players during play:** pause with a "waiting for players" overlay; resume when restored.
- **Input:** sanitize (strip HTML, trim, length and charset limits), profanity filter with a configurable word list, auto-suffix duplicate names.
- **Abuse:** per-socket rate limits, rooms-per-IP limit, idle rooms deleted after 30 minutes.
- **Client:** handle clock skew, background tabs, and phone screen lock; prevent double-submit; `beforeunload` warning and back-button protection during active play.
- **iOS Safari:** `100dvh`, safe-area insets, 16px inputs (no zoom), audio unlock on first tap.
- **Privacy:** never log passwords; keep them only in room memory; wipe all room data when the game or room ends.

---

## 9. QUALITY AND PERFORMANCE

- Lighthouse: Performance 90+, Accessibility 95+, Best Practices 95+.
- Initial JS under 250KB gzipped; code-split by phase; lazy-load sounds and confetti.
- 60fps animations; no layout thrash; no memory leaks; remove all socket listeners and timers on unmount.
- **Accessibility:** WCAG AA contrast, visible focus states, `aria-live` announcements for timers and phase changes, keyboard support, labels on all icon buttons, reduced-motion support, color is never the only signal (pair with icons and text).
- Works on low-end Android (4x CPU throttle) and slow 3G.
- Strict TypeScript, zero console errors, zero avoidable warnings.

---

## 10. SAFETY AND ETHICS

- Everything is a simulation with fictional personas. Never ask for real passwords.
- Scam messages exist only inside the game and are labelled as training content. Add a short "Why this matters" credits page.
- No analytics, no third-party trackers, no accounts.

---

## 11. TESTING AND BOT MODE

- **Bot Mode (dev feature, host can add 1 to 10 bots):** bots join, submit passwords of varied strength, write simple scams, guess, vote with randomized accuracy, and answer boss steps, so one person can test the entire game alone.
- **Unit tests (Vitest):** scoring, tie-breakers, derangement pairing (including odd counts), password strength estimation, state machine transitions, reconnection logic.
- **End-to-end tests (Playwright):** multiple browser contexts simulating host, players, and Big Screen. The acceptance test in Section 16 must be automated wherever possible. Report which of the 45 checks are automated and which are manual.
- **Load script:** simulate 20 concurrent socket clients through a full game.
- **Manual QA checklist:** covers every edge case in Section 8.

---

## 12. SERVER-AUTHORITATIVE GAME ENGINE

The server is the single source of truth. Clients may animate, show countdowns, and give optimistic visual feedback, but must **never** decide authoritative outcomes.

**The server controls:** room membership, player and host identity, ready state, persona assignment, victim pairing, password submissions and scoring, crack race progression and results, hacker targets, guess attempts and hints, scam authorship and believability scoring, jury ordering, votes, correctness, speed bonuses, boss state and answers, Defense Meter, team bonus, scores, tie-breakers, phase transitions and timers, early completion, reconnection restoration, host transfer, and player removal or skipping.

**Never trust client-provided:** scores, remaining time, correct answers, other players' identities or secrets, password strength results, jury or boss correctness, or phase completion.

**Every incoming Socket.IO event** must be validated with a zod schema from `/shared`, checked against the current phase and the sender's player id, and rate-limited. Provide an event contract table (name, direction, payload type, validation) in the docs.

---

## 13. WORKFLOW AND VERIFICATION GATES

**A. Work in the workspace.** Create, edit, and complete files directly. Do not leave unfinished files behind.

**B. Progress tracking and git.**
- Maintain `PROGRESS.md`: completed stages, decisions made, known issues, next steps.
- Commit to git after every stage that passes its gate, with a clear message.
- If you must stop for any reason, leave the repo in a passing state and update `PROGRESS.md` so a new session can resume.

**C. Stage verification gate.** After every stage, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Also run the app and verify the relevant user flows. A stage is NOT complete if any of these are true: TypeScript errors, ESLint errors, failing tests, failing production build, client/server contract mismatches, missing or mismatched Socket.IO events, a broken visible UI flow, or any feature that is only mocked or partial. Fix everything before moving on.

**D. Stage report.** After each stage, report briefly: (1) what was built, (2) what was tested, (3) whether client and server build, (4) important notes. Then wait for my approval to continue (Stage 1 mandatory; afterwards I may tell you to proceed through several stages without stopping).

---

## 14. BUILD STAGES

- **Stage 1: Foundation.** Monorepo, root scripts (typecheck, lint, test, build, test:e2e), shared types and zod schemas, design tokens, fonts, all UI primitives, Landing, Join. **Stop and wait for my "go".**
- **Stage 2: Server and Lobby.** Server, RoomStore, room creation and joining, lobby, reconnection, host controls and transfer, spectators, Big Screen lobby, clock-sync handshake.
- **Stage 3: Persona, Password, Crack Race.** Persona generator, password scoring engine, crack simulation, shared reveal.
- **Stage 4: Hacker and Jury.** Derangement pairing, guess and scam flows, believability meter, SwipeCards, red-flag reveal, scoring.
- **Stage 5: Boss and Results.** Boss chains, Defense Meter, podium, awards, Security Report, shareable card, Play Again, Back to Lobby.
- **Stage 6: Hardening.** Bot Mode, full test suite, Playwright E2E, load script, sounds, accessibility and performance pass, deployment docs.

---

## 15. NO PREMATURE COMPLETION

Do not call the project "complete", "finished", "working", or "production-ready" just because pages render, the project compiles, the lobby works, Socket.IO connects, or the UI looks done. The **entire game loop must work end-to-end in a real multiplayer session**, with all eight phases and all transitions, including correct round repetition and the transitions to BOSS and RESULTS.

---

## 16. FINAL END-TO-END ACCEPTANCE TEST

Run with one real host plus Bot Mode (and Playwright multi-context where possible). All 45 checks must pass:

1. Start the app with the documented command.
2. Create a room.
3. Join the room.
4. Add bots.
5. Reach the 3-player minimum.
6. Ready players.
7. Start the game.
8. Complete Persona.
9. Submit passwords.
10. Run the Crack Race.
11. Verify password results and scoring.
12. Complete the Hacker phase.
13. Submit scams and password guesses.
14. Complete Jury.
15. Verify authors are anonymous before reveal.
16. Verify author reveal and red-flag highlights.
17. Verify the round loop repeats for the selected round count.
18. Complete the Boss Round.
19. Verify Defense Meter and team bonus.
20. Show Results.
21. Verify podium, awards, Security Report, and shareable card.
22. Use Play Again.
23. Verify Back to Lobby.
24. Open Big Screen mode.
25. Verify the Big Screen updates in real time.
26. Disconnect and reconnect a player during major phases.
27. Verify the player returns to the correct room, phase, and permitted submitted state.
28. Disconnect the host and verify automatic host transfer.
29. Drop below 3 active players and verify the pause overlay.
30. Verify the game continues after a disconnected player's grace period expires.
31. Test duplicate player names.
32. Test duplicate submissions.
33. Test late submissions.
34. Test invalid Socket.IO payloads.
35. Test room-not-found.
36. Test room-full.
37. Test game-already-started (spectator offer).
38. Verify spectator behavior as defined in Section 5.
39. Verify refresh and back-button protection during active play.
40. Verify the server-restart UI ("Room expired").
41. Verify no real password is ever exposed to another client.
42. Verify password data is wiped when the room or game ends.
43. Verify no uncaught runtime errors.
44. Verify no avoidable console errors or warnings.
45. Verify the production build succeeds.

If any check fails, fix it and rerun the affected tests.

---

## 17. FINAL SELF-REVIEW AND FIX PASS

After all stages, re-read the whole project against Sections 4, 8, 9, and 12 and check for:

- **Design and UX:** inconsistent spacing, wrong colors, missing glow, generic-looking components, wrong typography, missing animations, poor mobile or desktop layouts, touch targets under 52px, missing loading, empty, error, or focus states, color-only indicators, timer inconsistencies, overflow at 360px, safe-area and iOS Safari issues.
- **Multiplayer and state:** race conditions, duplicate or late submissions accepted, invalid-phase actions, wrong authorization, bad host transfer, reconnection mismatches, timer or clock desync, phases that can block forever, mishandled disconnects, rooms not cleaned up, secret leaks, wrong pairing, scoring, tie-breakers, or round and Boss transitions, any client-side result calculation.
- **Performance:** unnecessary rerenders, heavy initial bundle, early-loaded sounds or confetti, non-split phase components, frame drops, layout thrash, memory leaks, unremoved listeners or timers, excessive network events.
- **Accessibility:** keyboard support, screen-reader labels, `aria-live` announcements, focus indicators, reduced motion, contrast, accessible form controls and icon buttons.
- **Security:** zod on every event, sanitization, length and charset limits, profanity filter, rate limits, room/IP limits, no password logging or persistence, safe handling of malformed payloads.

**Fix every issue that can reasonably be fixed.** Do not just list them. Rerun the gate (Section 13C) and the affected acceptance checks. Only after this pass is the project complete.

---

## 18. FINAL DELIVERABLES (IN THE REPO)

1. Complete working code for all packages
2. Fully populated seed content (Section 7)
3. Architecture overview and Socket.IO event contract table
4. `README.md`: setup, scripts, env vars, deployment (Render + Vercel), troubleshooting
5. QA checklist and Bot Mode guide
6. `PROGRESS.md` with decisions, known limitations, and next steps
7. A final report listing which of the 45 acceptance checks are automated vs manual, and the result of each
