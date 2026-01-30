import { createSignal } from 'solid-js';
import { PANEL_TO_BACKEND_MESSAGES } from '../../lib/constants';
import { panelPostMessage } from '../messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from '../ports';

const [isInspectorMode, setIsInspectorMode] = createSignal(false);
export { isInspectorMode };

export function enterInspectorMode() {
  setIsInspectorMode(true);
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.ENTER_INSPECTOR_MODE,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

export function exitInspectorMode() {
  if (!isInspectorMode()) return;
  setIsInspectorMode(false);
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.EXIT_INSPECTOR_MODE,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

export function toggleInspectorMode() {
  isInspectorMode() ? exitInspectorMode() : enterInspectorMode();
}
