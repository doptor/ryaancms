import { useState, useCallback, useRef } from "react";

interface UndoRedoOptions {
  maxHistory?: number;
}

export function useUndoRedo<T>(initialState: T | null, options: UndoRedoOptions = {}) {
  const { maxHistory = 50 } = options;
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T | null>(initialState);
  const [future, setFuture] = useState<T[]>([]);
  const skipRecord = useRef(false);

  const set = useCallback((newState: T) => {
    if (skipRecord.current) {
      skipRecord.current = false;
      setPresent(newState);
      return;
    }
    setPresent((prev) => {
      if (prev !== null) {
        setPast((p) => [...p.slice(-(maxHistory - 1)), prev]);
      }
      setFuture([]);
      return newState;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      const newPast = p.slice(0, -1);
      setPresent((curr) => {
        if (curr !== null) setFuture((f) => [curr, ...f]);
        return previous;
      });
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const newFuture = f.slice(1);
      setPresent((curr) => {
        if (curr !== null) setPast((p) => [...p, curr]);
        return next;
      });
      return newFuture;
    });
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return { state: present, set, undo, redo, canUndo, canRedo };
}
