import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { MapModel } from '@shared/types';
import { mapReducer, makeInitialHistory, type MapAction, type HistoryState } from './mapReducer';

type MapContextValue = {
  model: MapModel;
  history: HistoryState;
  dispatch: (action: MapAction) => void;
  canUndo: boolean;
  canRedo: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(mapReducer, undefined, makeInitialHistory);

  return (
    <MapContext.Provider
      value={{
        model: history.present,
        history,
        dispatch,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapModel(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapModel must be used within MapProvider');
  return ctx;
}
