import type { BACKEND_TO_PANEL_MESSAGES, PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';

export type TabValues = 'components' | 'stores';

export type BackendToPanelMessageType = (typeof BACKEND_TO_PANEL_MESSAGES)[keyof typeof BACKEND_TO_PANEL_MESSAGES];
export type PanelToBackendMessageType = (typeof PANEL_TO_BACKEND_MESSAGES)[keyof typeof PANEL_TO_BACKEND_MESSAGES];

// can improve these types when backend.js is ported to TypeScript
export type BackendToPanelMessage = {
  [key: string]: any;
  type: BackendToPanelMessageType;
};

export type PanelToBackendMessage = {
  [key: string]: any;
  action: PanelToBackendMessageType;
};
