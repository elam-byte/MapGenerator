import type { Viewport } from './viewport';

const MINOR_GRID = 10;   // metres
const MAJOR_GRID = 100;  // metres
const MINOR_COLOR = 'rgba(255,255,255,0.07)';
const MAJOR_COLOR = 'rgba(255,255,255,0.18)';
const BORDER_COLOR = '#4a9eff';
const BORDER_WIDTH = 0.8; // world metres (will be scaled by zoom)

export function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport): void {
  const { worldWidth, worldHeight, panX, panY, zoom, canvasWidth, canvasHeight } = vp;

  // Visible world range
  const visLeft = panX;
  const visRight = panX + canvasWidth / zoom;
  const visBottom = panY;
  const visTop = panY + canvasHeight / zoom;

  // Draw minor grid lines (10 m)
  ctx.save();
  ctx.lineWidth = 1 / zoom; // 1 pixel regardless of zoom

  const drawLines = (step: number, color: string) => {
    ctx.strokeStyle = color;

    // Vertical lines
    const xStart = Math.floor(visLeft / step) * step;
    const xEnd = Math.ceil(visRight / step) * step;
    for (let x = xStart; x <= xEnd; x += step) {
      if (x < 0 || x > worldWidth) continue;
      ctx.beginPath();
      ctx.moveTo(x, Math.max(0, visBottom));
      ctx.lineTo(x, Math.min(worldHeight, visTop));
      ctx.stroke();
    }

    // Horizontal lines
    const yStart = Math.floor(visBottom / step) * step;
    const yEnd = Math.ceil(visTop / step) * step;
    for (let y = yStart; y <= yEnd; y += step) {
      if (y < 0 || y > worldHeight) continue;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, visLeft), y);
      ctx.lineTo(Math.min(worldWidth, visRight), y);
      ctx.stroke();
    }
  };

  drawLines(MINOR_GRID, MINOR_COLOR);
  drawLines(MAJOR_GRID, MAJOR_COLOR);

  // World border
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeRect(0, 0, worldWidth, worldHeight);

  ctx.restore();
}
