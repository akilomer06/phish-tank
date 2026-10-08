import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createApplication } from './app.js';

const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    MAX_ROOMS_PER_IP: z.coerce.number().int().min(1).max(1000).default(5),
    CLIENT_ORIGINS: z.string().optional(),
    PROFANITY_WORDS: z.string().optional(),
  })
  .parse(process.env);
const production =
  process.env.NODE_ENV === 'production' ||
  process.argv.includes('--production');
const origins = (
  env.CLIENT_ORIGINS ??
  (production
    ? ''
    : 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3002,http://127.0.0.1:3002')
)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
if (production && !origins.length)
  throw new Error(
    'Set CLIENT_ORIGINS to your frontend origin before starting production.',
  );
for (const origin of origins)
  if (new URL(origin).origin !== origin)
    throw new Error(
      'CLIENT_ORIGINS must contain exact origins without paths or trailing slashes.',
    );
if (process.env.VERCEL)
  throw new Error(
    'This in-memory room server requires one persistent instance. Deploy the Vercel frontend and point VITE_SERVER_URL at that instance.',
  );
const runtime = createApplication({
  origins,
  trustProxyHops: env.TRUST_PROXY_HOPS,
  maxRoomsPerIp: env.MAX_ROOMS_PER_IP,
  profanity: env.PROFANITY_WORDS?.split(',')
    .map((word) => word.trim())
    .filter(Boolean),
});
if (production) {
  const clientPath = fileURLToPath(
    new URL('../../client/dist', import.meta.url),
  );
  runtime.app.use(express.static(clientPath));
  runtime.app.get('*', (_request, response) =>
    response.sendFile(path.join(clientPath, 'index.html')),
  );
}
runtime.httpServer.listen(env.PORT, '0.0.0.0', () =>
  console.info(`Phish Tank lobby: http://localhost:${env.PORT}`),
);
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  void runtime.close().then(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
