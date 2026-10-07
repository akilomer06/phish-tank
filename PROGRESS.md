# Phish Tank progress

## Stage boundary

**Stage 1: Foundation delivered (2026-10-08).** The specification requires stopping after its gate and waiting for the user's “go” before Stage 2. The full multiplayer game is not complete.

## Implemented in this stage

- npm workspaces (`client`, `server`, `shared`) and all required root commands.
- React 18, Vite, strict TypeScript, Tailwind, ESLint and Prettier.
- Zod event registry, phase policies, typed acknowledgments, public and private contracts.
- Express health endpoint and production SPA server foundation.
- Exact design tokens, fonts, original SVG fish/hook art, responsive Landing and Join.
- Local profile saving, code normalization and keyboard navigation, alias validation, emoji selection, training notice and mute preference.
- All specified UI primitives and an interactive `/components` gallery.
- Original synthesized audio, lazy sound/confetti imports, reduced motion, native accessible dialogs.
- Unit tests and desktop/mobile Playwright foundation coverage.
- Setup, architecture, contract and QA documentation.

## Decisions

- The Stage 1 form saves a real local profile and explicitly labels live rooms as Stage 2. It never fabricates a successful create/join response.
- Server scaffolding is limited to health and production static serving; Socket.IO state/handlers are Stage 2.
- Reject unsafe markup at the schema boundary rather than retain potentially executable HTML. The server's profanity and duplicate-name rules come in Stage 2.
- Share data types but never a catch-all room object with secret fields. Future projections must be tested at runtime.
- Self-host the specified Google Fonts families to remove third-party browser requests and improve predictable loading.
- Use generated original WAV effects, which the spec permits, and keep the full sound system available for the later phase screens.
- The finite birth-year domain (1999–2007) and crush-initial alphabet cannot each contain 60 unique values. For Stage 3, preserve these semantic domains; provide at least 60 values for the open-ended persona fields.
- Developer tooling runs on the available Node 24 host; the supported application target starts at Node 20.19 for modern Vite tooling.

## Verification

- `npm run typecheck` — passed across client, server and shared.
- `npm run lint` — passed, zero errors or warnings.
- `npm run test` — 14 contract tests passed.
- `npm run build` — client, server and shared passed.
- `npm run format:check` — passed.
- `npm run test:e2e` with installed Edge — 26 tests passed across desktop (1440px) and mobile (360px). Includes axe WCAG 2/2.1 AA scans of Landing, Join and the component gallery.
- Production smoke check using `npm start` on port 3002 — Landing, Join deep link, real health response and unknown-API 404 passed; no browser console errors/warnings or uncaught runtime errors.
- Desktop and mobile Landing/Join screenshots visually inspected; no horizontal overflow.
- Initial landing JavaScript is approximately 97.3 KB gzipped (entry, runtime and Landing chunk); sounds and confetti are separate lazy chunks.
- Dependency audit: zero known vulnerabilities after updating tooling and overriding the development launcher's pinned `shell-quote` to its patched release.

## Review fixes and practical limits

- Fixed keyboard Tab wrapping in dialogs; Escape and focus restoration are browser-tested.
- Fixed accessible roles on host/ready indicators. Accessibility scans wait until the page fade has completed, avoiding intermediate opacity measurements.
- Validated persisted player preferences on rehydration instead of trusting stored JSON fields.
- OneDrive initially exposed the new browser test as a cloud reparse entry, which Playwright skipped until the file was read/copied locally. The source file is now hydrated.
- The Windows execution sandbox blocks `tsx` from reading OS user metadata. Development-server validation required an approved execution outside that sandbox; this is an agent-environment restriction, not an application stub.
- The test host injects both `NO_COLOR` and `FORCE_COLOR`, producing terminal-only Node notices. Browser console and lint checks are clean. npm's environment policy also notes unapproved esbuild install scripts; installed binaries built and tested successfully.
- Physical iOS/Android audio unlock, haptics, slow-network/CPU testing, and Lighthouse scoring remain Stage 6 device/performance work. Node 20 compatibility is declared by the selected tooling, but this session's executions used the available Node 24 runtime.
- No live multiplayer, secret persistence, bots, game scoring or game-loop completion is claimed at this stage. The final 45-check inventory remains explicitly deferred where appropriate in `docs/QA.md`.
- The initial stage commit uses an explicit automated Codex author if no user Git identity is configured; no global Git identity or safe-directory setting is changed.

## Next stage (requires user approval)

Stage 2: implement RoomStore, Socket.IO validation/authorization/rate limits, room creation/joining, live lobby and host controls, reconnection/transfer, spectators, Big Screen lobby and clock synchronization.
