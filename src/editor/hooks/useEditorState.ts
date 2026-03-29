import { useState, useCallback } from 'react';
import type { Point } from '@shared/types';

export type Tool =
  | 'select'
  | 'draw-line'
  | 'draw-arc'
  | 'place-junction'
  | 'place-t-junction'
  | 'place-vehicle';

export type LineGesture = {
  phase: 'start-placed';
  start: Point;
};

export type ArcGesture =
  | { phase: 'center-placed'; center: Point }
  | { phase: 'start-placed'; center: Point; startPt: Point; clockwise: boolean };

export type EditorState = {
  tool: Tool;
  selectedId: string | null;
  lineGesture: LineGesture | null;
  arcGesture: ArcGesture | null;
  hoverPoint: Point | null;
};

export type EditorStateActions = {
  setTool: (t: Tool) => void;
  setSelectedId: (id: string | null) => void;
  setLineGesture: (g: LineGesture | null) => void;
  setArcGesture: (g: ArcGesture | null) => void;
  setHoverPoint: (p: Point | null) => void;
  cancelGesture: () => void;
};

export function useEditorState(): [EditorState, EditorStateActions] {
  const [tool, setToolRaw] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineGesture, setLineGesture] = useState<LineGesture | null>(null);
  const [arcGesture, setArcGesture] = useState<ArcGesture | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);

  const setTool = useCallback((t: Tool) => {
    setToolRaw(t);
    setLineGesture(null);
    setArcGesture(null);
    setSelectedId(null);
  }, []);

  const cancelGesture = useCallback(() => {
    setLineGesture(null);
    setArcGesture(null);
  }, []);

  const state: EditorState = { tool, selectedId, lineGesture, arcGesture, hoverPoint };
  const actions: EditorStateActions = {
    setTool,
    setSelectedId,
    setLineGesture,
    setArcGesture,
    setHoverPoint,
    cancelGesture,
  };

  return [state, actions];
}
