import type { Point } from '@shared/types';
import { clamp } from '@shared/geometry';

export type Viewport = {
  panX: number;       // world-space X of the canvas left edge
  panY: number;       // world-space Y of the canvas bottom edge
  zoom: number;       // pixels per meter
  canvasWidth: number;
  canvasHeight: number;
  worldWidth: number;
  worldHeight: number;
};

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 200;

export function makeViewport(worldWidth: number, worldHeight: number): Viewport {
  // Will be sized properly once the canvas is mounted; start at 1px/m.
  return {
    panX: 0,
    panY: 0,
    zoom: 1,
    canvasWidth: 800,
    canvasHeight: 600,
    worldWidth,
    worldHeight,
  };
}

/**
 * Fit the viewport so the entire world is visible with padding.
 */
export function fitViewport(vp: Viewport): Viewport {
  const padding = 40; // pixels
  const zoomX = (vp.canvasWidth - padding * 2) / vp.worldWidth;
  const zoomY = (vp.canvasHeight - padding * 2) / vp.worldHeight;
  const zoom = clamp(Math.min(zoomX, zoomY), MIN_ZOOM, MAX_ZOOM);
  const visibleWorldW = vp.canvasWidth / zoom;
  const visibleWorldH = vp.canvasHeight / zoom;
  const panX = (vp.worldWidth - visibleWorldW) / 2;
  const panY = (vp.worldHeight - visibleWorldH) / 2;
  return { ...vp, zoom, panX, panY };
}

// ---------------------------------------------------------------------------
// Coordinate transforms
//
// The world has origin at bottom-left, +y up.
// Canvas 2D has origin at top-left, +y down.
//
// We apply the transform once per frame via ctx.setTransform so that all
// draw calls can use world coordinates directly:
//
//   canvasX =  (worldX - panX) * zoom
//   canvasY = canvasHeight - (worldY - panY) * zoom   (Y flip)
//
// Encoded as: ctx.setTransform(zoom, 0, 0, -zoom, -panX*zoom, canvasH + panY*zoom)
// ---------------------------------------------------------------------------

export function applyViewportTransform(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
): void {
  ctx.setTransform(
    vp.zoom, 0,
    0, -vp.zoom,
    -vp.panX * vp.zoom,
    vp.canvasHeight + vp.panY * vp.zoom,
  );
}

export function worldToCanvas(pt: Point, vp: Viewport): Point {
  return {
    x: (pt.x - vp.panX) * vp.zoom,
    y: vp.canvasHeight - (pt.y - vp.panY) * vp.zoom,
  };
}

export function canvasToWorld(pt: Point, vp: Viewport): Point {
  return {
    x: pt.x / vp.zoom + vp.panX,
    y: (vp.canvasHeight - pt.y) / vp.zoom + vp.panY,
  };
}

/**
 * Zoom toward a canvas-space point (keeps the world point under the cursor fixed).
 */
export function zoomAtPoint(
  vp: Viewport,
  canvasPt: Point,
  factor: number,
): Viewport {
  const worldPt = canvasToWorld(canvasPt, vp);
  const newZoom = clamp(vp.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const newPanX = worldPt.x - canvasPt.x / newZoom;
  const newPanY = worldPt.y - (vp.canvasHeight - canvasPt.y) / newZoom;
  return { ...vp, zoom: newZoom, panX: newPanX, panY: newPanY };
}

/**
 * Pan by a delta in canvas pixels.
 */
export function panByPixels(vp: Viewport, dx: number, dy: number): Viewport {
  // dx pixels right → panX increases (world moves left relative to canvas)
  // dy pixels down  → panY decreases (world moves up relative to canvas)
  return {
    ...vp,
    panX: vp.panX - dx / vp.zoom,
    panY: vp.panY + dy / vp.zoom,
  };
}

/**
 * A scale factor in world metres that represents one pixel — useful for
 * hit-test thresholds that should feel consistent regardless of zoom.
 */
export function pixelToWorld(vp: Viewport): number {
  return 1 / vp.zoom;
}
