import type { MapModel } from '@shared/types';
import type { Viewport } from './viewport';
import type { EditorState } from '../hooks/useEditorState';
import { applyViewportTransform } from './viewport';
import { drawGrid } from './drawGrid';
import { drawRoads, drawGhostLine, drawGhostArc } from './drawRoads';
import { drawJunctions, drawGhostJunction } from './drawJunctions';
import { drawVehicles, drawGhostVehicle } from './drawVehicles';
import { arcFromThreePoints } from '@shared/geometry';

const BG_COLOR = '#12122a';

export function drawMap(
  ctx: CanvasRenderingContext2D,
  model: MapModel,
  vp: Viewport,
  editorState: EditorState,
): void {
  const { canvasWidth, canvasHeight } = vp;

  // Reset to identity for background clear
  ctx.resetTransform();
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Apply Y-flip viewport transform — all subsequent draw calls use world coords
  applyViewportTransform(ctx, vp);

  drawGrid(ctx, vp);
  drawRoads(ctx, model.roads, editorState.selectedId, vp);
  drawJunctions(ctx, model.junctions, editorState.selectedId, vp);
  drawVehicles(ctx, model.vehicles, editorState.selectedId, vp);

  // In-progress gesture overlays
  drawGestureOverlay(ctx, vp, editorState);
}

function drawGestureOverlay(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  editorState: EditorState,
): void {
  const { tool, lineGesture, arcGesture, hoverPoint } = editorState;

  if (tool === 'draw-line' && lineGesture && hoverPoint) {
    drawGhostLine(ctx, lineGesture.start, hoverPoint, vp.zoom);
    // Draw start point marker
    ctx.save();
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(lineGesture.start.x, lineGesture.start.y, 2 / vp.zoom, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
  }

  if (tool === 'draw-arc') {
    if (arcGesture?.phase === 'center-placed' && hoverPoint) {
      // Show radius preview circle
      const r = Math.hypot(
        hoverPoint.x - arcGesture.center.x,
        hoverPoint.y - arcGesture.center.y,
      );
      ctx.save();
      ctx.strokeStyle = 'rgba(74,175,255,0.25)';
      ctx.lineWidth = 1 / vp.zoom;
      ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
      ctx.beginPath();
      ctx.arc(arcGesture.center.x, arcGesture.center.y, r, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Center dot
      ctx.save();
      ctx.fillStyle = '#4af';
      ctx.beginPath();
      ctx.arc(arcGesture.center.x, arcGesture.center.y, 2 / vp.zoom, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.restore();
    }

    if (arcGesture?.phase === 'start-placed' && hoverPoint) {
      const { center, startPt, clockwise } = arcGesture;
      const { radius, startAngle, endAngle } = arcFromThreePoints(center, startPt, hoverPoint, clockwise);
      drawGhostArc(ctx, center, radius, startAngle, endAngle, clockwise, vp.zoom);
    }
  }

  if (tool === 'place-junction' && hoverPoint) {
    drawGhostJunction(ctx, hoverPoint, vp.zoom, '4-way');
  }

  if (tool === 'place-t-junction' && hoverPoint) {
    drawGhostJunction(ctx, hoverPoint, vp.zoom, 't-junction', 0);
  }

  if (tool === 'place-vehicle' && hoverPoint) {
    drawGhostVehicle(ctx, hoverPoint.x, hoverPoint.y, 0, vp.zoom);
  }
}
