# ATS Map Generator

A standalone map editor and runtime viewer for the **Autonomous Traffic Simulator (ATS)**. Built to generate road network maps that can be exported and consumed directly by the ATS simulator — no external tooling required.

## Why

The ATS simulator needs a structured road map in `ATS Map JSON v1` format. This tool provides a visual way to draw road networks (lines + arcs, junctions, lanes) and export a valid map file without manual JSON editing.

## What's Inside

| App | Description |
|-----|-------------|
| **Map Editor** | Canvas-based road network editor — draw roads, place junctions, set lanes & speed limits, export JSON |
| **Runtime Viewer** | Three.js top-down viewer — load a map and watch live vehicle positions streamed at 20 Hz via WebSocket |
| **Viz-Gateway** | Node.js bridge — forwards `sim.snapshots` from NATS to WebSocket clients |

## Tech Stack

- **Editor** — React + Canvas 2D + TypeScript + Vite
- **Viewer** — Three.js (orthographic camera, instanced mesh for vehicles)
- **Gateway** — Node.js + `ws` + NATS client
- **Validation** — Zod (schema validation on map import/export)

## Run

```bash
# Install deps
pnpm install

# Start editor (localhost:5173)
pnpm dev

# Open viewer
open viewer.html   # or serve via vite and open /viewer.html

# Run mock simulator (generates fake vehicle snapshots over WebSocket)
node mock-sim.js

# Run viz-gateway (requires NATS)
NATS_URL=nats://localhost:4222 node viz-gateway/gateway.mjs
```

## Map Format

Maps export as `ATS Map JSON v1`:

```json
{
  "meta": { "version": "ats-map-v1", "unit": "m", "origin": "bottom-left", "world": { "width": 500, "height": 500 } },
  "junctions": [{ "id": "j1", "x": 100, "y": 200 }],
  "roads": [
    { "id": "r1", "kind": "line", "start": { "x": 0, "y": 0 }, "end": { "x": 100, "y": 0 }, "lanes": { "left": 1, "right": 1, "laneWidth": 3.5 } },
    { "id": "r2", "kind": "arc", "center": { "x": 100, "y": 50 }, "radius": 50, "startAngle": -1.57, "endAngle": 0, "clockwise": false, "lanes": { "left": 1, "right": 1, "laneWidth": 3.5 } }
  ],
  "vehicles": []
}
```

Coordinate system: meters, origin bottom-left, +x right, +y up, heading in radians (CCW positive).
