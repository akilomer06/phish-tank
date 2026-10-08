# Vercel frontend + persistent room server

Stage 2 uses real Socket.IO connections and a single in-memory RoomStore. The frontend belongs on Vercel; the room server needs **one persistent Node process**. Do not horizontally scale this server or run separate in-memory copies.

Vercel's current WebSocket documentation says new connections are not guaranteed to reach the same function instance and recommends external storage for room state: [Manage persistent state](https://vercel.com/docs/functions/websockets#manage-persistent-state). The specification fixes memory storage for now, so this repository uses a separate room server. It does not claim Vercel lacks WebSocket support.

## Deploy the backend

1. Create a Render Blueprint from this GitHub repository using `render.yaml`, or create a Node Web Service manually.
2. Keep repository root as the service root; build with `npm ci && npm run build`; start with `npm start`.
3. Set `NODE_ENV=production` and `CLIENT_ORIGINS=https://YOUR-FRONTEND.vercel.app` using the real domain. Separate additional authorized origins with commas. No wildcards or trailing slashes.
4. The blueprint sets `TRUST_PROXY_HOPS=1` for Render's reverse proxy. Set this only when that proxy is trusted; local/direct deployments use `0`.
5. Use `/api/health` as the health-check path. A healthy server returns `{ "status": "ok", "stage": 2 }`.
6. Keep one instance. The free plan in the blueprint can sleep when idle, which loses in-memory rooms if the process stops. Choose an always-on plan yourself if uninterrupted rooms are needed.

Railway also works: use the same build/start commands and environment, expose the service's public HTTPS domain, and keep one replica. The proxy must pass WebSocket upgrades and Socket.IO polling at `/socket.io/`. Use an idle timeout longer than the 10-second heartbeat cycle; do not cache Socket.IO responses.

## Deploy the frontend on Vercel

1. Import `akilomer06/phish-tank`. Keep Root Directory at the **repository root**.
2. Checked-in `vercel.json` sets Vite, install `npm ci`, build `npm run build`, and output `client/dist`.
3. Add `VITE_SERVER_URL=https://YOUR-BACKEND.onrender.com`, using the actual backend URL, to the relevant Vercel environment. This is public configuration, not a secret.
4. Deploy/redeploy. Vite embeds this value at build time, so an environment change needs another build.
5. Confirm `CLIENT_ORIGINS` on the backend includes this exact frontend origin. Add preview origins explicitly if those deployments should connect; never allow every `*.vercel.app` website.

The rewrite preserves `/join`, `/room/CODE`, `/watch/CODE` and `/screen/CODE` on refresh. The browser connects directly to the backend; no Socket.IO traffic is sent to a Vercel Express Function.

## Variables

| Variable           | Where          | Purpose                                                        |
| ------------------ | -------------- | -------------------------------------------------------------- |
| `VITE_SERVER_URL`  | Client build   | Backend HTTPS origin; empty for same-origin local development  |
| `CLIENT_ORIGINS`   | Server runtime | Exact comma-separated frontend origins; required in production |
| `PORT`             | Server runtime | Platform listening port, default 3001                          |
| `NODE_ENV`         | Server runtime | `production` for hosting                                       |
| `TRUST_PROXY_HOPS` | Server runtime | Trusted reverse-proxy hop count; default 0                     |
| `MAX_ROOMS_PER_IP` | Server runtime | Active room quota per network; default 5                       |
| `PROFANITY_WORDS`  | Server runtime | Optional comma-separated replacement for the alias filter      |

Server settings are process environment variables; the server does not automatically read `.env` files. `.env.example` files document the settings, and Vite reads `client/.env.local` locally. Real `.env` files are ignored by Git. There are no game accounts or credential requirements.

## Hosted verification

- Check backend health JSON.
- Create a room in one browser and join on another device via QR/link.
- Confirm ready state and host settings synchronize.
- Open Big Screen and check membership/reactions without player controls.
- Refresh within 20 seconds and confirm identity and ready state restore.
- Leave the host and confirm control transfers to the next connected player.

A Git push can trigger a connected Vercel deployment. Local production checks do not verify provider account settings; the owner must configure the live backend and frontend environment. These files do not create accounts, purchase hosting or provision a paid service.
