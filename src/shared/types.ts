export type Point = { x: number; y: number };

export type WorldMeta = {
  version: 'ats-map-v1';
  unit: 'm';
  origin: 'bottom-left';
  world: { width: number; height: number };
};

export type JunctionType = '4-way' | 't-junction';

/** Junction size: 10 m × 10 m square */
export const JUNCTION_SIZE = 10;
export const JUNCTION_HALF = JUNCTION_SIZE / 2; // 5 m

export type Junction = {
  id: string;
  x: number;
  y: number;
  junctionType: JunctionType;
  /** Rotation in radians (multiples of π/2). For T-junction, determines which side is closed.
   *  0 = bottom closed, π/2 = right closed, π = top closed, 3π/2 = left closed */
  rotation: number;
};

/** Lanes relative to travel direction (start → end / startAngle → endAngle) */
export type RoadLanes = {
  left: number;      // lanes to the left
  right: number;     // lanes to the right
  laneWidth: number; // meters, default 3.5, range [2.8, 4.0]
};

export type RoadLine = {
  id: string;
  kind: 'line';
  start: Point;
  end: Point;
  lanes: RoadLanes;
  speedLimit?: number; // m/s
};

export type RoadArc = {
  id: string;
  kind: 'arc';
  center: Point;
  radius: number;
  startAngle: number; // radians
  endAngle: number;   // radians
  clockwise: boolean;
  lanes: RoadLanes;
  speedLimit?: number; // m/s
};

export type Road = RoadLine | RoadArc;

export type Vehicle = {
  id: string;
  x: number;
  y: number;
  heading: number; // radians, 0 = +x, CCW positive
  length: number;  // default 3.0 m
  width: number;   // default 1.5 m
  color?: string;  // CSS hex
};

export type MapModel = {
  meta: WorldMeta;
  junctions: Junction[];
  roads: Road[];
  vehicles: Vehicle[];
};

/** Runtime message: 20 Hz snapshot from simulator */
export type WorldSnapshot = {
  t: number; // tick index
  vehicles: Array<{
    id: string;
    x: number;
    y: number;
    heading: number;
    length: number;
    width: number;
    color?: string;
  }>;
};

/** Optional command from viewer UI back to simulator */
export type VehicleCommand = {
  t: number;
  id: string;
  desired_accel: number;
  desired_steer: number;
};

export const DEFAULT_LANE_WIDTH = 3.5;
export const DEFAULT_VEHICLE_LENGTH = 3.0;
export const DEFAULT_VEHICLE_WIDTH = 1.5;
export const DEFAULT_VEHICLE_COLOR = '#22c55e';
export const WORLD_SIZES = [500, 1000] as const;
