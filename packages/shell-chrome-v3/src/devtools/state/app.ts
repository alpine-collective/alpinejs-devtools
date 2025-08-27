import { createSignal } from 'solid-js';
import { effect } from 'solid-js/web';
import { setState, state } from './store';

export const [pinnedPrefix, setPinnedPrefix] = createSignal<string>('');

effect(() => {
  if (state.selectedComponentId || state.selectedStoreName) {
    setPinnedPrefix('');
  }
});

export const setPageLoaded = () => {
  setState('pageLoadCompleted', true);
};
