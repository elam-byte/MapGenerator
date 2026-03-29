/**
 * Viz-Gateway: NATS sim.snapshots → WebSocket broadcast
 *
 * Usage:
 *   NATS_URL=nats://localhost:4222 PORT=8090 node viz-gateway/gateway.mjs
 *
 * Optional env vars:
 *   NATS_URL  (default: nats://localhost:4222)
 *   PORT      (default: 8090)
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { connect, StringCodec } from 'nats';

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const PORT = parseInt(process.env.PORT || '8090', 10);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });
const sc = StringCodec();

wss.on('connection', (ws) => {
  console.log(`[WS] client connected (total: ${wss.clients.size})`);

  ws.on('message', (data) => {
    // Forward vehicle commands from viewer UI to NATS
    try {
      const msg = JSON.parse(data.toString());
      if (msg?.type === 'vehicle_cmd' && nc) {
        nc.publish('vehicle.commands', sc.encode(JSON.stringify(msg.payload)));
      }
    } catch { /* ignore malformed */ }
  });

  ws.on('close', () => {
    console.log(`[WS] client disconnected (total: ${wss.clients.size})`);
  });
});

// Connect to NATS and forward snapshots to all WS clients
let nc;
try {
  nc = await connect({ servers: NATS_URL });
  console.log(`[NATS] connected: ${NATS_URL}`);

  const sub = nc.subscribe('sim.snapshots');
  (async () => {
    for await (const msg of sub) {
      const payload = msg.data; // raw Uint8Array / Buffer
      // Broadcast to all OPEN clients (fire-and-forget, latest-only at sender)
      for (const client of wss.clients) {
        if (client.readyState === 1 /* OPEN */) {
          client.send(payload);
        }
      }
    }
  })();
} catch (err) {
  console.warn(`[NATS] could not connect (${err.message}) — gateway running without NATS`);
}

server.listen(PORT, () => {
  console.log(`[Gateway] ws://0.0.0.0:${PORT}/ws`);
  console.log(`[Gateway] http://0.0.0.0:${PORT}/health`);
});
