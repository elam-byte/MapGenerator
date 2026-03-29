import { useEffect } from 'react';
import { MapProvider, useMapModel } from './store/MapContext';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { useEditorState } from './hooks/useEditorState';

function EditorInner() {
  const { model, dispatch, canUndo, canRedo } = useMapModel();
  const [editorState, editorActions] = useEditorState();

  // Export handler via custom event from Toolbar
  useEffect(() => {
    const handler = () => {
      const json = JSON.stringify(model, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ats-map-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    document.addEventListener('ats-export', handler);
    return () => document.removeEventListener('ats-export', handler);
  }, [model]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Toolbar
        activeTool={editorState.tool}
        onToolChange={editorActions.setTool}
        dispatch={dispatch}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Canvas
          model={model}
          editorState={editorState}
          editorActions={editorActions}
          dispatch={dispatch}
        />
      </div>

      <PropertiesPanel
        selectedId={editorState.selectedId}
        model={model}
        dispatch={dispatch}
      />
    </div>
  );
}

export function App() {
  return (
    <MapProvider>
      <EditorInner />
    </MapProvider>
  );
}
