import { PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';
import type { BACKEND_TO_PANEL_MESSAGES } from '../lib/constants';
import type { ALPINE_DEVTOOLS_PANEL_SOURCE, ALPINE_DEVTOOLS_PROXY_SOURCE } from './ports';
import { DataMessageHistory } from './state';

export type TabValues = 'components' | 'stores' | 'warnings';
export type DataAttrSource = 'component' | 'store' | 'message';

export type BackendToPanelMessageType =
  (typeof BACKEND_TO_PANEL_MESSAGES)[keyof typeof BACKEND_TO_PANEL_MESSAGES];
export type PanelToBackendMessageType =
  (typeof PANEL_TO_BACKEND_MESSAGES)[keyof typeof PANEL_TO_BACKEND_MESSAGES];

// can improve these types when backend.js is ported to TypeScript
export type BackendToPanelMessage = {
  [key: string]: any;
  type: BackendToPanelMessageType;
};

export type PanelToBackendMessage =
  | {
      [key: string]: any;
      action: PanelToBackendMessageType;
      source: typeof ALPINE_DEVTOOLS_PANEL_SOURCE | typeof ALPINE_DEVTOOLS_PROXY_SOURCE;
    }
  | {
      action: 'SET_DATA_FROM_SNAPSHOT';
      snapshot: DataMessageHistory[number];
      componentId: number;
    };

export type ComponentData = Record<
  string,
  | {
      value: string;
      type: 'string';
    }
  | {
      value: number;
      type: 'number';
    }
  | {
      value: boolean;
      type: 'boolean';
    }
  | {
      value: unknown | Array<unknown>;
      type: 'object';
    }
  | {
      value: {
        name: string;
        attributes: Array<string>;
        children: Array<string>;
      };
      type: 'HTMLElement';
    }
  | NoValueSerializedData
>;

export type NoValueSerializedData = {
  type: 'Unserializable' | 'function';
};
