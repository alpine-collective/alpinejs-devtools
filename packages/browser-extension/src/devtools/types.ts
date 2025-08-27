import { PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';
import type { BACKEND_TO_PANEL_MESSAGES } from '../lib/constants';
import type { ALPINE_DEVTOOLS_PANEL_SOURCE, ALPINE_DEVTOOLS_PROXY_SOURCE } from './ports';
import { mapDataTypeToInputType } from '../lib/utils';

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

export type DataMessageHistory = Array<{
  id: `${string}-${string}`;
  data: ComponentData;
  receivedAt: Date;
}>;

export interface Component {
  depth: number;
  id: number;
  index: number;
  name: string;
  // TODO: this is only on output type and are not nullable
  isOpened?: boolean;
}

export interface Store {
  name: string;
  isOpen: boolean;
}

export interface FlattenedComponentData {
  attributeName: string;
  attributeValue: string | boolean | number;
  // matches output of serializeDataProperty, when that's typed, use ReturnType<typeof serializeDataProperty>
  dataType: // custom values
  | 'HTMLElement'
    | 'Unserializable'
    // output of `typeof v`
    | 'function'
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object';
  depth: number;
  directParentId: string;
  editAttributeValue?: string | boolean;
  hasArrow: boolean;
  id: string;
  inEditingMode: boolean;
  inputType: ReturnType<typeof mapDataTypeToInputType>;
  isArrowDown: boolean;
  isOpened: boolean;
  parentComponentId: number;
  readOnly: boolean;
}

export type FlattenedStoreData = Omit<FlattenedComponentData, 'parentComponentId'> & {
  parentStoreName: string;
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
