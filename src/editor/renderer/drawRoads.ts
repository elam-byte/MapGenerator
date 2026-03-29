import type { Road, RoadLine, RoadArc } from '@shared/types';
import type { Viewport } from './viewport';

const CENTERLINE_COLOR = '#f0c040';
const LANE_EDGE_COLOR = 'rgba(255,255,255,0.55)';
const SELECTED_COLOR = '#4af';
const ROAD_SURFACE_COLOR = 'rgba(60,60,80,0.7)';

/** Perpendicular offset of a line direction vector. */
function perp(dx: number, dy: number, dist: number): [number, number] {
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [(-dy / len) * dist, (dx / len) * dist];
}

function drawRoadLine(
  ctx: CanvasRenderingContext2D,
  road: RoadLine,
  selected: boolean,
  zoom: number,
): void {
  const { start, end, lanes } = road;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const totalLeft = lanes.left * lanes.laneWidth;
  const totalRight = lanes.right * lanes.laneWidth;
  const halfW = (totalLeft + totalRight) / 2;
  const centerOffset = (totalLeft - totalRight) / 2;

  // Draw filled road surface
  if (halfW > 0) {
    const [lx, ly] = perp(dx, dy, centerOffset + halfW);
    const [rx, ry] = perp(dx, dy, centerOffset - halfW);
    ctx.save();
    ctx.fillStyle = ROAD_SURFACE_COLOR;
    ctx.beginPath();
    ctx.moveTo(start.x + lx, start.y + ly);
    ctx.lineTo(end.x + lx, end.y + ly);
    ctx.lineTo(end.x + rx, end.y + ry);
    ctx.lineTo(start.x + rx, start.y + ry);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.lineWidth = 1.5 / zoom;

  // Lane edge lines (white)
  ctx.strokeStyle = selected ? SELECTED_COLOR : LANE_EDGE_COLOR;
  for (let i = 0; i <= lanes.left; i++) {
    const offset = centerOffset + i * lanes.laneWidth;
    const [px, py] = perp(dx, dy, offset);
    ctx.beginPath();
    ctx.moveTo(start.x + px, start.y + py);
    ctx.lineTo(end.x + px, end.y + py);
    ctx.stroke();
  }
  for (let i = 0; i <= lanes.right; i++) {
    const offset = centerOffset - i * lanes.laneWidth;
    const [px, py] = perp(dx, dy, offset);
    ctx.beginPath();
    ctx.moveTo(start.x + px, start.y + py);
    ctx.lineTo(end.x + px, end.y + py);
    ctx.stroke();
  }

  // Centerline (dashed yellow)
  ctx.strokeStyle = selected ? SELECTED_COLOR : CENTERLINE_COLOR;
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  const [cx, cy] = perp(dx, dy, centerOffset);
  ctx.beginPath();
  ctx.moveTo(start.x + cx, start.y + cy);
  ctx.lineTo(end.x + cx, end.y + cy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawRoadArc(
  ctx: CanvasRenderingContext2D,
  road: RoadArc,
  selected: boolean,
  zoom: number,
): void {
  const { center, radius, startAngle, endAngle, clockwise, lanes } = road;
  const totalLeft = lanes.left * lanes.laneWidth;
  const totalRight = lanes.right * lanes.laneWidth;
  const halfW = (totalLeft + totalRight) / 2;
  const centerOffset = (totalLeft - totalRight) / 2;
  // CCW arc: left = outside (larger radius), right = inside (smaller radius)
  const outerRadius = radius + centerOffset + halfW;
  const innerRadius = radius + centerOffset - halfW;

  // NOTE: canvas ctx.arc() counterclockwise parameter is the INVERSE of our
  // `clockwise` flag because we applied a Y-flip via setTransform.
  const ctxCCW = clockwise; // inverted intentionally

  // Draw road surface
  if (outerRadius > 0 && innerRadius >= 0) {
    ctx.save();
    ctx.fillStyle = ROAD_SURFACE_COLOR;
    ctx.beginPath();
    ctx.arc(center.x, center.y, outerRadius, startAngle, endAngle, ctxCCW);
    ctx.arc(center.x, center.y, Math.max(0, innerRadius), endAngle, startAngle, !ctxCCW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.lineWidth = 1.5 / zoom;

  // Lane edge arcs
  ctx.strokeStyle = selected ? SELECTED_COLOR : LANE_EDGE_COLOR;
  for (let i = 0; i <= lanes.left; i++) {
    const r = radius + centerOffset + i * lanes.laneWidth;
    if (r <= 0) continue;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, startAngle, endAngle, ctxCCW);
    ctx.stroke();
  }
  for (let i = 0; i <= lanes.right; i++) {
    const r = radius + centerOffset - i * lanes.laneWidth;
    if (r <= 0) continue;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, startAngle, endAngle, ctxCCW);
    ctx.stroke();
  }

  // Centerline (dashed)
  const centerR = radius + centerOffset;
  if (centerR > 0) {
    ctx.strokeStyle = selected ? SELECTED_COLOR : CENTERLINE_COLOR;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, centerR, startAngle, endAngle, ctxCCW);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function drawRoads(
  ctx: CanvasRenderingContext2D,
  roads: Road[],
  selectedId: string | null,
  vp: Viewport,
): void {
  for (const road of roads) {
    const selected = road.id === selectedId;
    if (road.kind === 'line') {
      drawRoadLine(ctx, road, selected, vp.zoom);
    } else {
      drawRoadArc(ctx, road, selected, vp.zoom);
    }
  }
}

/**
 * Draw a ghost preview of a road being drawn (semi-transparent).
 */
export function drawGhostLine(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number },
  end: { x: number; y: number },
  zoom: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(74,175,255,0.6)';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawGhostArc(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise: boolean,
  zoom: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(74,175,255,0.6)';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle, clockwise); // Y-flip inverts
  ctx.stroke();
  ctx.setLineDash([]);
  // Draw center marker
  ctx.fillStyle = 'rgba(74,175,255,0.5)';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 2 / zoom, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.restore();
}
