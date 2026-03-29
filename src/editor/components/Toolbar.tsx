import { useRef, useState } from 'react';
import type { Tool } from '../hooks/useEditorState';
import type { MapAction } from '../store/mapReducer';
import { safeParseMapModel } from '@shared/validation';

type Props = {
  activeTool: Tool;
  onToolChange: (t: Tool) => void;
  dispatch: (a: MapAction) => void;
  canUndo: boolean;
  canRedo: boolean;
};

const TOOLS: { tool: Tool; label: string; icon: string; title: string }[] = [
  { tool: 'select',        icon: '↖',  label: 'Select',   title: 'Select / Move (S)' },
  { tool: 'draw-line',     icon: '╱',  label: 'Line',     title: 'Draw Line Road (L)' },
  { tool: 'draw-arc',      icon: '⌒',  label: 'Arc',      title: 'Draw Arc Road (A)' },
  { tool: 'place-junction',icon: '⊞',  label: '4-Way',    title: 'Place 4-Way Junction (J)' },
  { tool: 'place-t-junction', icon: '⊤', label: 'T-Junc', title: 'Place T-Junction (T)' },
  { tool: 'place-vehicle', icon: '▭',  label: 'Vehicle',  title: 'Place Vehicle (V)' },
];

const sidebarStyle: React.CSSProperties = {
  width: 72,
  minWidth: 72,
  background: '#12122a',
  borderRight: '1px solid #2d2d4a',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px 0',
  gap: 4,
};

function ToolButton({
  icon,
  label,
  title,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 52,
        padding: '8px 4px',
        background: active ? '#3b3b6b' : 'transparent',
        border: active ? '1px solid #6366f1' : '1px solid transparent',
        borderRadius: 6,
        color: active ? '#a5b4fc' : '#6b7280',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        fontSize: 18,
        lineHeight: 1,
        transition: 'background 0.1s',
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: 9 }}>{label}</span>
    </button>
  );
}

function Divider() {
  return <div style={{ width: 44, height: 1, background: '#2d2d4a', margin: '4px 0' }} />;
}

function IconButton({
  icon,
  title,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 52,
        padding: '6px 4px',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 6,
        color: disabled ? '#374151' : '#6b7280',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 16,
      }}
    >
      {icon}
    </button>
  );
}

export function Toolbar({ activeTool, onToolChange, dispatch, canUndo, canRedo }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [worldPickerOpen, setWorldPickerOpen] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      try {
        const json = JSON.parse(text);
        const result = safeParseMapModel(json);
        if (result.ok) {
          dispatch({ type: 'IMPORT_MAP', model: result.model });
        } else {
          alert(`Invalid map file:\n${result.error}`);
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={sidebarStyle}>
      {/* New world */}
      <IconButton icon="＋" title="New World" onClick={() => setWorldPickerOpen(true)} />

      {worldPickerOpen && (
        <WorldDialog
          onConfirm={(w, h) => {
            dispatch({ type: 'NEW_WORLD', world: { width: w, height: h } });
            setWorldPickerOpen(false);
          }}
          onCancel={() => setWorldPickerOpen(false)}
        />
      )}

      <Divider />

      {/* Drawing tools */}
      {TOOLS.map(({ tool, icon, label, title }) => (
        <ToolButton
          key={tool}
          icon={icon}
          label={label}
          title={title}
          active={activeTool === tool}
          onClick={() => onToolChange(tool)}
        />
      ))}

      <Divider />

      {/* Undo / Redo */}
      <IconButton icon="↩" title="Undo (Ctrl+Z)" onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} />
      <IconButton icon="↪" title="Redo (Ctrl+Y)" onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} />

      <Divider />

      {/* Import */}
      <IconButton
        icon="📂"
        title="Import Map JSON"
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {/* Export */}
      <IconButton
        icon="💾"
        title="Export Map JSON"
        onClick={() => {
          // dispatch not needed — model is read in App; handled below via event
          document.dispatchEvent(new CustomEvent('ats-export'));
        }}
      />
    </div>
  );
}

function WorldDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (w: number, h: number) => void;
  onCancel: () => void;
}) {
  const sizes: [number, number][] = [[500, 500], [1000, 1000]];
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #3d3d5c',
          borderRadius: 8,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 240,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15 }}>New World</div>
        {sizes.map(([w, h]) => (
          <button
            key={`${w}x${h}`}
            onClick={() => onConfirm(w, h)}
            style={{
              background: '#0f0f23',
              border: '1px solid #4a4a7a',
              borderRadius: 6,
              color: '#a5b4fc',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {w} × {h} m
          </button>
        ))}
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
