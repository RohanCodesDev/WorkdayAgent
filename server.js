const express = require('express');
const next = require('next');

const port = Number.parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

async function start() {
  await app.prepare();

  const server = express();

  server.disable('x-powered-by');
  server.get('/api/health', (request, response) => {
    response.json({
      status: 'ok',
      uptime: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
      environment: dev ? 'development' : 'production',
    });
  });

  server.use((request, response) => handle(request, response));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
