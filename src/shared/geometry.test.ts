import { describe, it, expect } from 'vitest';
import {
  snapToGrid,
  distance,
  distanceToLineSegment,
  distanceToArc,
  angleInArc,
  normaliseAngle,
  arcFromThreePoints,
  arcSweep,
  pointInOrientedRect,
  roadHalfWidth,
  clamp,
} from './geometry';

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-1, 0, 10)).toBe(0));
  it('clamps above max', () => expect(clamp(15, 0, 10)).toBe(10));
  it('passes through', () => expect(clamp(5, 0, 10)).toBe(5));
});

describe('snapToGrid', () => {
  it('snaps to nearest 10m grid', () => {
    expect(snapToGrid({ x: 13, y: 27 }, 10)).toEqual({ x: 10, y: 30 });
  });
  it('leaves exact grid point unchanged', () => {
    expect(snapToGrid({ x: 100, y: 200 }, 10)).toEqual({ x: 100, y: 200 });
  });
});

describe('distance', () => {
  it('computes 3-4-5 triangle', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
  });
  it('returns 0 for same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });
});

describe('distanceToLineSegment', () => {
  it('returns 0 for point on segment', () => {
    expect(distanceToLineSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0);
  });
  it('measures perpendicular distance', () => {
    expect(distanceToLineSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(3);
  });
  it('uses endpoint when projection is outside segment', () => {
    expect(distanceToLineSegment({ x: -3, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5);
  });
  it('handles zero-length segment', () => {
    expect(distanceToLineSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

describe('normaliseAngle', () => {
  it('keeps angles in [0, 2π)', () => {
    expect(normaliseAngle(0)).toBeCloseTo(0);
    expect(normaliseAngle(Math.PI)).toBeCloseTo(Math.PI);
    expect(normaliseAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
    expect(normaliseAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });
});

describe('angleInArc', () => {
  const PI = Math.PI;
  it('CCW arc from 0 to π/2 — mid angle π/4 inside', () => {
    expect(angleInArc(PI / 4, 0, PI / 2, false)).toBe(true);
  });
  it('CCW arc from 0 to π/2 — angle π outside', () => {
    expect(angleInArc(PI, 0, PI / 2, false)).toBe(false);
  });
  it('CCW arc wrapping past 0 (3π/2 to π/4)', () => {
    expect(angleInArc(0, (3 * PI) / 2, PI / 4, false)).toBe(true);
    expect(angleInArc(PI, (3 * PI) / 2, PI / 4, false)).toBe(false);
  });
  it('CW arc from π/2 to 0 — angle π/4 inside', () => {
    expect(angleInArc(PI / 4, PI / 2, 0, true)).toBe(true);
  });
  it('CW arc from π/2 to 0 — angle π outside', () => {
    expect(angleInArc(PI, PI / 2, 0, true)).toBe(false);
  });
});

describe('distanceToArc', () => {
  const center = { x: 0, y: 0 };
  const radius = 10;

  it('returns 0 for point on arc', () => {
    // point at (10,0) — angle 0, on the arc 0→π/2 CCW
    expect(distanceToArc({ x: 10, y: 0 }, center, radius, 0, Math.PI / 2, false)).toBeCloseTo(0);
  });

  it('returns radial distance for point inside arc range', () => {
    // point at (12, 0) — angle 0 is in range, radial distance = 2
    expect(distanceToArc({ x: 12, y: 0 }, center, radius, 0, Math.PI / 2, false)).toBeCloseTo(2);
  });

  it('returns endpoint distance when angle is outside arc range', () => {
    // arc is 0→π/2 CCW; angle π is outside. Nearest endpoint is (10,0) or (0,10).
    // point at (0, -5): nearest arc endpoint is (10,0) → dist ≈ sqrt(100+25)=11.18
    const d = distanceToArc({ x: 0, y: -5 }, center, radius, 0, Math.PI / 2, false);
    expect(d).toBeCloseTo(Math.sqrt(100 + 25), 1);
  });
});

describe('arcSweep', () => {
  it('CCW quarter circle', () => {
    expect(arcSweep(0, Math.PI / 2, false)).toBeCloseTo(Math.PI / 2);
  });
  it('CW quarter circle', () => {
    expect(arcSweep(Math.PI / 2, 0, true)).toBeCloseTo(Math.PI / 2);
  });
  it('CCW full circle (0 → 0 is treated as 0 sweep — caller should avoid)', () => {
    // 0 to 2π CCW
    expect(arcSweep(0, 2 * Math.PI - 0.001, false)).toBeCloseTo(2 * Math.PI - 0.001, 2);
  });
  it('CCW arc wrapping past 0: 3π/2 → π/4', () => {
    expect(arcSweep((3 * Math.PI) / 2, Math.PI / 4, false)).toBeCloseTo((3 * Math.PI) / 4);
  });
});

describe('arcFromThreePoints', () => {
  it('computes radius and angles from center + two boundary points', () => {
    const center = { x: 0, y: 0 };
    const startPt = { x: 10, y: 0 };
    const endPt = { x: 0, y: 10 };
    const result = arcFromThreePoints(center, startPt, endPt, false);
    expect(result.radius).toBeCloseTo(10);
    expect(result.startAngle).toBeCloseTo(0);
    expect(result.endAngle).toBeCloseTo(Math.PI / 2);
  });
});

describe('pointInOrientedRect', () => {
  it('detects point inside axis-aligned rect', () => {
    expect(pointInOrientedRect({ x: 1, y: 0 }, { x: 0, y: 0 }, 2, 1, 0)).toBe(true);
  });
  it('rejects point outside axis-aligned rect', () => {
    expect(pointInOrientedRect({ x: 3, y: 0 }, { x: 0, y: 0 }, 2, 1, 0)).toBe(false);
  });
  it('rotated rect: point inside', () => {
    // 45° rotated rect; point at (1,1) — inside a 2×2 rotated square
    expect(pointInOrientedRect({ x: 1, y: 0 }, { x: 0, y: 0 }, 2, 2, Math.PI / 4)).toBe(true);
  });
});

describe('roadHalfWidth', () => {
  it('computes half-width for 1+1 lanes at 3.5 m', () => {
    expect(roadHalfWidth({ left: 1, right: 1, laneWidth: 3.5 })).toBeCloseTo(3.5);
  });
  it('zero lanes gives zero half-width', () => {
    expect(roadHalfWidth({ left: 0, right: 0, laneWidth: 3.5 })).toBe(0);
  });
});
