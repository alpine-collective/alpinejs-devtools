import { createMemo } from 'solid-js';
import { reconcile } from 'solid-js/store';
import { PANEL_TO_BACKEND_MESSAGES } from '../../lib/constants';
import { panelPostMessage } from '../messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from '../ports';
import { setState, state } from './store';

export interface EvalError {
  type: 'eval';
  message: string;
  expression?: string;
  source: { name: string; attributes?: Array<string>; children?: Array<string> };
  errorId: number;
}

export const setAdditionalError = (error: any) => {
  setState('errors', reconcile([...state.errors, error]));
};

export const errors = createMemo(() => state.errors);

export const showErrorSource = (errorId: string) => {
  panelPostMessage({
    errorId,
    action: PANEL_TO_BACKEND_MESSAGES.SHOW_ERROR_SOURCE,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
};

export const hideErrorSource = (errorId: string) => {
  panelPostMessage({
    errorId,
    action: PANEL_TO_BACKEND_MESSAGES.HIDE_ERROR_SOURCE,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
};
