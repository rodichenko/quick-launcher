import { useCallback } from 'react';

export function onEnterKey(action, enabled = true) {
  if (!enabled) {
    return undefined;
  }
  return function onKeyPress(e) {
    if (e && e.type === 'keypress' && !/^(space|enter)$/i.test(e.code)) {
      return Promise.resolve();
    }
    if (action) {
      return action(e);
    }
    return undefined;
  };
}

export default function useEnterKey(action, enabled = true) {
  return useCallback((e) => {
    const fn = onEnterKey(action, enabled);
    if (fn) {
      return fn(e);
    }
    return undefined;
  }, [action, enabled]);
}
