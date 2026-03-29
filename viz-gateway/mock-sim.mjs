/**
 * Mock simulator: publishes WorldSnapshot to NATS sim.snapshots at 20 Hz.
 * Used for testing the viewer without a real ATS simulator.
 *
 * Usage:
 *   NATS_URL=nats://localhost:4222 node viz-gateway/mock-sim.mjs
 */

import { connect, StringCodec } from 'nats';

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const TICK_MS = 50; // 20 Hz
const NUM_VEHICLES = 20;

const nc = await connect({ servers: NATS_URL });
const sc = StringCodec();
console.log(`[MockSim] connected to NATS: ${NATS_URL}`);
console.log(`[MockSim] publishing ${NUM_VEHICLES} vehicles at 20 Hz…`);

// Initialise vehicles with random positions in a 500×500 m world
const vehicles = Array.from({ length: NUM_VEHICLES }, (_, i) => ({
  id: `veh-${i}`,
  x: 50 + Math.random() * 400,
  y: 50 + Math.random() * 400,
  heading: Math.random() * Math.PI * 2,
  vx: (Math.random() - 0.5) * 4, // m/s
  vy: (Math.random() - 0.5) * 4,
  length: 3.0,
  width: 1.5,
  color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
}));

let tick = 0;
setInterval(() => {
  tick++;
  for (const v of vehicles) {
    v.x += v.vx * (TICK_MS / 1000);
    v.y += v.vy * (TICK_MS / 1000);
    v.heading += (Math.random() - 0.5) * 0.05;

    // Bounce off world edges
    if (v.x < 10 || v.x > 490) { v.vx *= -1; v.x = Math.max(10, Math.min(490, v.x)); }
    if (v.y < 10 || v.y > 490) { v.vy *= -1; v.y = Math.max(10, Math.min(490, v.y)); }
  }

  const snapshot = {
    t: tick,
    vehicles: vehicles.map(({ id, x, y, heading, length, width, color }) => ({
      id, x, y, heading, length, width, color,
    })),
  };

  nc.publish('sim.snapshots', sc.encode(JSON.stringify(snapshot)));
}, TICK_MS);
