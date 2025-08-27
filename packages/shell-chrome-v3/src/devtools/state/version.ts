import { createMemo } from 'solid-js';
import { setState, state } from './store';

export const setAlpineVersionFromBackend = (version: string) => {
  setState('version', {
    detected: version,
  });
};

export const isReadOnly = createMemo(() => {
  return (state.version?.detected ?? '').length === 0;
});
