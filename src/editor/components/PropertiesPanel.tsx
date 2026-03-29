import type { ChangeEvent } from 'react';
import type { MapModel, Road, Vehicle, Junction, RoadLanes } from '@shared/types';
import type { MapAction } from '../store/mapReducer';

type Props = {
  selectedId: string | null;
  model: MapModel;
  dispatch: (a: MapAction) => void;
};

const panelStyle: React.CSSProperties = {
  width: 220,
  background: '#1a1a2e',
  borderLeft: '1px solid #2d2d4a',
  padding: '12px 10px',
  overflowY: 'auto',
  color: '#e5e7eb',
  fontFamily: 'sans-serif',
  fontSize: 13,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const labelStyle: React.CSSProperties = { color: '#9ca3af', fontSize: 11, marginBottom: 2 };
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f0f23',
  border: '1px solid #3d3d5c',
  borderRadius: 4,
  color: '#e5e7eb',
  padding: '4px 6px',
  fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 0.1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      style={inputStyle}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
    />
  );
}

function RoadPanel({ road, dispatch }: { road: Road; dispatch: (a: MapAction) => void }) {
  const { lanes } = road;
  const update = (patch: Partial<RoadLanes>) =>
    dispatch({ type: 'UPDATE_ROAD_LANES', id: road.id, lanes: { ...lanes, ...patch } });

  return (
    <>
      <div style={{ fontWeight: 600, color: '#a78bfa' }}>
        Road ({road.kind}) — {road.id}
      </div>
      <Field label="Left lanes">
        <NumInput value={lanes.left} min={0} max={3} step={1} onChange={(v) => update({ left: Math.round(v) })} />
      </Field>
      <Field label="Right lanes">
        <NumInput value={lanes.right} min={0} max={3} step={1} onChange={(v) => update({ right: Math.round(v) })} />
      </Field>
      <Field label="Lane width (m)">
        <NumInput value={lanes.laneWidth} min={2.8} max={4.0} step={0.1} onChange={(v) => update({ laneWidth: v })} />
      </Field>
    </>
  );
}

function VehiclePanel({ vehicle, dispatch }: { vehicle: Vehicle; dispatch: (a: MapAction) => void }) {
  const upd = (patch: Partial<Vehicle>) => dispatch({ type: 'UPDATE_VEHICLE', id: vehicle.id, patch });

  return (
    <>
      <div style={{ fontWeight: 600, color: '#34d399' }}>Vehicle — {vehicle.id}</div>
      <Field label="Heading (rad)">
        <NumInput value={vehicle.heading} step={0.05} onChange={(v) => upd({ heading: v })} />
      </Field>
      <Field label="Length (m)">
        <NumInput value={vehicle.length} min={1} step={0.5} onChange={(v) => upd({ length: v })} />
      </Field>
      <Field label="Width (m)">
        <NumInput value={vehicle.width} min={0.5} step={0.5} onChange={(v) => upd({ width: v })} />
      </Field>
      <Field label="Color">
        <input
          type="color"
          style={{ ...inputStyle, height: 32, padding: 2 }}
          value={vehicle.color ?? '#22c55e'}
          onChange={(e) => upd({ color: e.target.value })}
        />
      </Field>
    </>
  );
}

function JunctionPanel({ junction, dispatch }: { junction: Junction; dispatch: (a: MapAction) => void }) {
  const rotationDeg = Math.round((junction.rotation * 180) / Math.PI);
  return (
    <>
      <div style={{ fontWeight: 600, color: '#fbbf24' }}>
        Junction ({junction.junctionType}) — {junction.id}
      </div>
      <Field label="Position">
        <div style={{ color: '#9ca3af' }}>
          x: {junction.x.toFixed(1)} m<br />
          y: {junction.y.toFixed(1)} m
        </div>
      </Field>
      {junction.junctionType === 't-junction' && (
        <Field label="Closed side rotation">
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={rotationDeg}
            onChange={(e) => {
              const deg = parseInt(e.target.value, 10);
              dispatch({
                type: 'UPDATE_JUNCTION',
                id: junction.id,
                patch: { rotation: (deg * Math.PI) / 180 },
              });
            }}
          >
            <option value={0}>Bottom (0°)</option>
            <option value={90}>Right (90°)</option>
            <option value={180}>Top (180°)</option>
            <option value={270}>Left (270°)</option>
          </select>
        </Field>
      )}
    </>
  );
}

export function PropertiesPanel({ selectedId, model, dispatch }: Props) {
  if (!selectedId) {
    return (
      <div style={panelStyle}>
        <div style={{ color: '#4b5563', fontSize: 12 }}>Nothing selected.<br />Click an entity to inspect.</div>
      </div>
    );
  }

  const road = model.roads.find((r) => r.id === selectedId);
  if (road) return <div style={panelStyle}><RoadPanel road={road} dispatch={dispatch} /></div>;

  const vehicle = model.vehicles.find((v) => v.id === selectedId);
  if (vehicle) return <div style={panelStyle}><VehiclePanel vehicle={vehicle} dispatch={dispatch} /></div>;

  const junction = model.junctions.find((j) => j.id === selectedId);
  if (junction) return <div style={panelStyle}><JunctionPanel junction={junction} dispatch={dispatch} /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ color: '#4b5563', fontSize: 12 }}>Entity not found.</div>
    </div>
  );
}
