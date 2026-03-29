import type { MapModel } from '@shared/types';

type Props = { model: MapModel; zoom: number };

export function HUD({ model, zoom }: Props) {
  const { world } = model.meta;
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(10,10,30,0.7)',
        color: '#9ca3af',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: '6px 10px',
        borderRadius: 4,
        pointerEvents: 'none',
        lineHeight: 1.7,
      }}
    >
      <div style={{ color: '#e5e7eb', fontWeight: 600 }}>
        {world.width} × {world.height} m
      </div>
      <div>Roads: {model.roads.length}</div>
      <div>Junctions: {model.junctions.length}</div>
      <div>Vehicles: {model.vehicles.length}</div>
      <div>Zoom: {zoom.toFixed(1)} px/m</div>
    </div>
  );
}
