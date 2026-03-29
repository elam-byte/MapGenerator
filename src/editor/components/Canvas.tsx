import { useRef, useEffect, useCallback, useState } from 'react';
import type { MapModel } from '@shared/types';
import type { Viewport } from '../renderer/viewport';
import { makeViewport, fitViewport } from '../renderer/viewport';
import type { EditorState, EditorStateActions } from '../hooks/useEditorState';
import type { MapAction } from '../store/mapReducer';
import { useCanvasInput } from '../hooks/useCanvasInput';
import { drawMap } from '../renderer/drawMap';
import { HUD } from './HUD';

type Props = {
  model: MapModel;
  editorState: EditorState;
  editorActions: EditorStateActions;
  dispatch: (action: MapAction) => void;
};

export function Canvas({ model, editorState, editorActions, dispatch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<Viewport>(() =>
    makeViewport(model.meta.world.width, model.meta.world.height),
  );
  const viewportRef = useRef<Viewport>(viewport);
  viewportRef.current = viewport;

  // Keep refs for RAF loop (no stale closures)
  const modelRef = useRef(model);
  const editorStateRef = useRef(editorState);
  modelRef.current = model;
  editorStateRef.current = editorState;

  // Resize observer — updates canvas resolution and fits viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio ?? 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        setViewport((prev) => {
          const updated = {
            ...prev,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            worldWidth: modelRef.current.meta.world.width,
            worldHeight: modelRef.current.meta.world.height,
          };
          return fitViewport(updated);
        });
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // When world dimensions change (new map), re-fit
  useEffect(() => {
    setViewport((prev) => {
      const updated = {
        ...prev,
        worldWidth: model.meta.world.width,
        worldHeight: model.meta.world.height,
      };
      return fitViewport(updated);
    });
  }, [model.meta.world.width, model.meta.world.height]);

  // RAF render loop
  useEffect(() => {
    let rafHandle: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawMap(ctx, modelRef.current, viewportRef.current, editorStateRef.current);
      rafHandle = requestAnimationFrame(loop);
    };

    rafHandle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafHandle);
  }, []);

  const stableSetViewport = useCallback((vp: Viewport) => setViewport(vp), []);

  useCanvasInput(canvasRef, viewportRef, stableSetViewport, model, editorState, editorActions, dispatch);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: getCursor(editorState),
        }}
      />
      <HUD model={model} zoom={viewport.zoom} />
    </div>
  );
}

function getCursor(state: EditorState): string {
  switch (state.tool) {
    case 'select': return 'default';
    case 'draw-line':
    case 'draw-arc': return 'crosshair';
    case 'place-junction':
    case 'place-vehicle': return 'copy';
    default: return 'default';
  }
}
