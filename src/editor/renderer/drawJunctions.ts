import type { Junction } from '@shared/types';
import { JUNCTION_HALF } from '@shared/types';
import type { Viewport } from './viewport';

const JUNCTION_COLOR = '#f59e0b';
const JUNCTION_SELECTED_COLOR = '#4af';
const JUNCTION_BORDER = 'rgba(255,255,255,0.4)';
const JUNCTION_SURFACE = 'rgba(60,60,80,0.85)';
const CLOSED_SIDE_COLOR = '#aaa';

/**
 * Get the 4 edge midpoints of a junction in world space.
 * Order: bottom, right, top, left (matching rotation 0, π/2, π, 3π/2 for closed side).
 */
function edgeMidpoints(j: Junction): { x: number; y: number }[] {
  const h = JUNCTION_HALF;
  return [
    { x: j.x, y: j.y - h }, // bottom  (rotation=0 → closed)
    { x: j.x + h, y: j.y }, // right   (rotation=π/2 → closed)
    { x: j.x, y: j.y + h }, // top     (rotation=π → closed)
    { x: j.x - h, y: j.y }, // left    (rotation=3π/2 → closed)
  ];
}

/** Index (0–3) of the closed side based on rotation. */
function closedSideIndex(rotation: number): number {
  const idx = Math.round((rotation / (Math.PI / 2)) % 4);
  return ((idx % 4) + 4) % 4;
}

export function drawJunctions(
  ctx: CanvasRenderingContext2D,
  junctions: Junction[],
  selectedId: string | null,
  vp: Viewport,
): void {
  ctx.save();
  const h = JUNCTION_HALF;

  for (const j of junctions) {
    const selected = j.id === selectedId;

    // Road surface fill
    ctx.fillStyle = JUNCTION_SURFACE;
    ctx.fillRect(j.x - h, j.y - h, h * 2, h * 2);

    // Border
    ctx.strokeStyle = selected ? JUNCTION_SELECTED_COLOR : JUNCTION_BORDER;
    ctx.lineWidth = 1.2 / vp.zoom;
    ctx.strokeRect(j.x - h, j.y - h, h * 2, h * 2);

    // Junction type indicator (colored center dot)
    ctx.beginPath();
    ctx.arc(j.x, j.y, 1.5, 0, Math.PI * 2, false);
    ctx.fillStyle = selected ? JUNCTION_SELECTED_COLOR : JUNCTION_COLOR;
    ctx.fill();

    // T-junction: draw closed side as a thick wall
    if (j.junctionType === 't-junction') {
      const ci = closedSideIndex(j.rotation);
      const corners = [
        { x: j.x - h, y: j.y - h }, // bottom-left
        { x: j.x + h, y: j.y - h }, // bottom-right
        { x: j.x + h, y: j.y + h }, // top-right
        { x: j.x - h, y: j.y + h }, // top-left
      ];
      // Edges: bottom (0→1), right (1→2), top (2→3), left (3→0)
      const edgeCorners: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];
      const [a, b] = edgeCorners[ci];
      ctx.save();
      ctx.strokeStyle = CLOSED_SIDE_COLOR;
      ctx.lineWidth = 2 / vp.zoom;
      ctx.beginPath();
      ctx.moveTo(corners[a].x, corners[a].y);
      ctx.lineTo(corners[b].x, corners[b].y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw open-side indicators (small arrows or ticks at edge midpoints)
    const mids = edgeMidpoints(j);
    const closedIdx = j.junctionType === 't-junction' ? closedSideIndex(j.rotation) : -1;
    ctx.save();
    ctx.fillStyle = selected ? JUNCTION_SELECTED_COLOR : JUNCTION_COLOR;
    for (let i = 0; i < 4; i++) {
      if (i === closedIdx) continue;
      ctx.beginPath();
      ctx.arc(mids[i].x, mids[i].y, 0.8, 0, Math.PI * 2, false);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Ghost junction preview while placing.
 */
export function drawGhostJunction(
  ctx: CanvasRenderingContext2D,
  pt: { x: number; y: number },
  _zoom: number,
  junctionType: '4-way' | 't-junction' = '4-way',
  rotation: number = 0,
): void {
  ctx.save();
  ctx.globalAlpha = 0.45;
  const h = JUNCTION_HALF;

  ctx.fillStyle = JUNCTION_SURFACE;
  ctx.fillRect(pt.x - h, pt.y - h, h * 2, h * 2);

  ctx.strokeStyle = JUNCTION_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(pt.x - h, pt.y - h, h * 2, h * 2);

  if (junctionType === 't-junction') {
    const ci = closedSideIndex(rotation);
    const corners = [
      { x: pt.x - h, y: pt.y - h },
      { x: pt.x + h, y: pt.y - h },
      { x: pt.x + h, y: pt.y + h },
      { x: pt.x - h, y: pt.y + h },
    ];
    const edgeCorners: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];
    const [a, b] = edgeCorners[ci];
    ctx.strokeStyle = CLOSED_SIDE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[a].x, corners[a].y);
    ctx.lineTo(corners[b].x, corners[b].y);
    ctx.stroke();
  }

  ctx.restore();
}
