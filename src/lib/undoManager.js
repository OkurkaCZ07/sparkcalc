export function createUndoManager({ limit = 100 } = {}) {
  let history = [];
  let future = [];
  let present = null;

  return {
    reset(state) {
      history = [];
      future = [];
      present = structuredCloneSafe(state);
    },
    push(prev, next) {
      const p = structuredCloneSafe(prev);
      const n = structuredCloneSafe(next);
      // Avoid duplicates
      if (present && JSON.stringify(n) === JSON.stringify(present)) return;
      history.push(p);
      if (history.length > limit) history = history.slice(history.length - limit);
      future = [];
      present = n;
    },
    undo() {
      if (history.length === 0) return null;
      const prev = history.pop();
      if (present) future.unshift(present);
      present = structuredCloneSafe(prev);
      return present;
    },
    redo() {
      if (future.length === 0) return null;
      const next = future.shift();
      if (present) history.push(present);
      present = structuredCloneSafe(next);
      return present;
    },
    canUndo() { return history.length > 0; },
    canRedo() { return future.length > 0; },
  };
}

function structuredCloneSafe(x) {
  try {
    // eslint-disable-next-line no-undef
    if (typeof structuredClone === 'function') return structuredClone(x);
  } catch {}
  return JSON.parse(JSON.stringify(x));
}

