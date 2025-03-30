import type { BACKEND_TO_PANEL_MESSAGES, PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';
import type { ALPINE_DEVTOOLS_PANEL_SOURCE, ALPINE_DEVTOOLS_PROXY_SOURCE } from './ports';

export type TabValues = 'components' | 'stores' | 'warnings';

export type BackendToPanelMessageType =
  (typeof BACKEND_TO_PANEL_MESSAGES)[keyof typeof BACKEND_TO_PANEL_MESSAGES];
export type PanelToBackendMessageType =
  (typeof PANEL_TO_BACKEND_MESSAGES)[keyof typeof PANEL_TO_BACKEND_MESSAGES];

// can improve these types when backend.js is ported to TypeScript
export type BackendToPanelMessage = {
  [key: string]: any;
  type: BackendToPanelMessageType;
};

export type PanelToBackendMessage = {
  [key: string]: any;
  action: PanelToBackendMessageType;
  source: typeof ALPINE_DEVTOOLS_PANEL_SOURCE | typeof ALPINE_DEVTOOLS_PROXY_SOURCE;
};
