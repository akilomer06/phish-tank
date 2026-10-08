import express from 'express';
import path from 'node:path';

const app = express();
app.disable('x-powered-by');
app.get(['/api/health', '/health'], (_request, response) =>
  response.json({ status: 'ok', stage: 1 }),
);
app.use('/api', (_request, response) =>
  response.status(404).json({ error: 'Endpoint not found.' }),
);
if (
  process.env.NODE_ENV === 'production' ||
  process.argv.includes('--production')
) {
  const clientPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (_request, response) =>
    response.sendFile(path.join(clientPath, 'index.html')),
  );
}
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3001);
  const server = app.listen(port, '0.0.0.0', () =>
    console.info(`Phish Tank foundation: http://localhost:${port}`),
  );
  function shutdown() {
    server.close(() => process.exit(0));
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  module.exports.default = app;
}

