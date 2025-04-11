import { createMemo, createSignal } from 'solid-js';
import { createStore, reconcile, unwrap } from 'solid-js/store';
import { PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';
import { panelPostMessage } from './messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from './ports';
import { convertInputDataToType, flattenData, mapDataTypeToInputType } from '../lib/utils';
import { metric } from './metrics';
import { effect } from 'solid-js/web';
import { getPartialPrefixes } from '../lib/prefix';
import { MESSAGE_HISTORY_SIZE, snapshotToDataObj } from './state/message-history';
import type { ComponentData, DataAttrSource } from './types';

interface State {
  version: {
    detected?: string;
  };
  pageLoadCompleted: boolean;
  appUrl?: string;
  components: Record<number, Component>;
  selectedComponentId?: number;
  preloadedComponentData: Record<number, Array<FlattenedComponentData>>;
  stores: Record<string, Store>;
  selectedStoreName?: string;
  preloadedStoreData: Record<string, Array<FlattenedStoreData>>;
  errors: any[];
}
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

export interface EvalError {
  type: 'eval';
  message: string;
  expression?: string;
  source: { name: string; attributes?: Array<string>; children?: Array<string> };
  errorId: number;
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

export const [state, setState] = createStore<State>({
  pageLoadCompleted: false,
  version: {},
  errors: [],
  components: {},
  preloadedComponentData: {},
  stores: {},
  preloadedStoreData: {},
});

export const [pinnedPrefix, setPinnedPrefix] = createSignal<string>('');

effect(() => {
  if (state.selectedComponentId || state.selectedStoreName) {
    setPinnedPrefix('');
  }
});
export type DataMessageHistory = Array<{
  id: `${string}-${string}`;
  data: ComponentData;
  receivedAt: Date;
}>;

interface MessageHistory {
  selectedMessageId?: string;
  /** Do not use directly, read via {@link selectedFlattenedMessageData} */
  flattenedSelectedMessageData: FlattenedComponentData[];
  openedAttrs: Set<FlattenedComponentData['id']>;
  arrowDownAttrs: Set<FlattenedComponentData['id']>;
  components: Record<number, DataMessageHistory>;
}

export const [messageHistory, setMessageHistory] = createStore<MessageHistory>({
  components: {},
  flattenedSelectedMessageData: [],
  openedAttrs: new Set(),
  arrowDownAttrs: new Set(),
});

export const setSelectedMessage = (id: DataMessageHistory[number]['id']) => {
  setMessageHistory('selectedMessageId', id);
};
export const resetSelectedMessage = () => {
  setMessageHistory('selectedMessageId', undefined);

  const openedAttrs = new Set<string>();
  const arrowDownAttrs = new Set<string>();
  if (selectedComponentFlattenedData()?.length > 0) {
    selectedComponentFlattenedData()!.forEach((el) => {
      if (el.isOpened) {
        openedAttrs.add(el.id);
      }
      if (el.isArrowDown) {
        arrowDownAttrs.add(el.id);
      }
    });
  }
  setMessageHistory('openedAttrs', openedAttrs);
  setMessageHistory('arrowDownAttrs', arrowDownAttrs);
};
export const getSelectedMessage = createMemo<DataMessageHistory[number] | undefined>(() => {
  if (!messageHistory.selectedMessageId || !openComponentValue()) {
    return undefined;
  }
  return messageHistory.components[openComponentValue()!.id].find(
    (el) => el.id === messageHistory.selectedMessageId,
  );
});

export const selectedFlattenedMessageData = createMemo(() => {
  const flattenedData = messageHistory.flattenedSelectedMessageData.map((el) => {
    return {
      ...el,
      isArrowDown: messageHistory.arrowDownAttrs.has(el.id),
      isOpened: messageHistory.openedAttrs.has(el.id) || el.depth === 0,
    };
  });
  if (!pinnedPrefix()) {
    return flattenedData;
  }
  const prefix = pinnedPrefix();

  const filteredAttrs = flattenedData.filter(
    (el) => getPartialPrefixes(prefix).includes(el.id) || el.id.startsWith(`${prefix}.`),
  );
  if (filteredAttrs.length > 0) {
    return filteredAttrs;
  }
  return flattenedData;
});

effect(() => {
  if (state.selectedComponentId || state.selectedStoreName) {
    resetSelectedMessage();
  }
});

effect(() => {
  if (getSelectedMessage()?.data) {
    const newMessageData = flattenData(getSelectedMessage()!.data);
    setMessageHistory('flattenedSelectedMessageData', newMessageData);
  } else {
    setMessageHistory('flattenedSelectedMessageData', []);
  }
});

export const setDataFromSnapshot = (snapshot: DataMessageHistory[number], componentId: number) => {
  panelPostMessage({
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
    action: PANEL_TO_BACKEND_MESSAGES.SET_DATA_FROM_SNAPSHOT,
    snapshot: {
      ...unwrap(snapshot),
      data: snapshotToDataObj(unwrap(snapshot).data),
    },
    componentId,
  });
};

export const setAlpineVersionFromBackend = (version: string) => {
  setState('version', {
    detected: version,
  });
};

export const isReadOnly = createMemo(() => {
  return (state.version?.detected ?? '').length === 0;
});

export const setPageLoaded = () => {
  setState('pageLoadCompleted', true);
};

export const setComponentsList = (components: Array<Component>, appUrl: string) => {
  const incomingComponentIds = components.map((c) => c.id);
  const newComponents = Object.fromEntries(
    Object.entries(state.components).filter(([_k, c]) => incomingComponentIds.includes(c.id)),
  );
  components.forEach((component, index) => {
    component.index = index;
    component.isOpened = state.selectedComponentId === component.id;
    newComponents[component.id] = component;
  });

  setState('components', reconcile(newComponents));

  if (appUrl !== state.appUrl || !components.find((c) => c.id === state.selectedComponentId)) {
    setState({
      selectedComponentId: undefined,
      preloadedComponentData: {},
      appUrl,
    });
  }
};

export const setStoresFromList = (stores: Array<string>) => {
  setState(
    'stores',
    reconcile(
      stores.reduce(
        (acc, curr) => {
          acc[curr] = {
            name: curr,
            isOpen: false,
          };
          return acc;
        },
        {} as State['stores'],
      ),
    ),
  );
};

export const setComponentData = (componentId: string, componentData: ComponentData) => {
  const receivedAt = new Date();
  const newComponentMessages: DataMessageHistory = [
    ...(messageHistory.components[Number(componentId)] || []),
    {
      id: `${componentId}-${receivedAt.toISOString()}`,
      data: componentData,
      receivedAt,
    },
  ];
  if (newComponentMessages.length > MESSAGE_HISTORY_SIZE) {
    newComponentMessages.shift();
  }
  setMessageHistory(
    reconcile({
      ...messageHistory,
      components: {
        ...messageHistory.components,
        [Number(componentId)]: newComponentMessages,
      },
    }),
  );
  const existingComponentData = state.preloadedComponentData[Number(componentId)];
  const attrPrevState: Record<string, Record<number, FlattenedComponentData> | undefined> =
    existingComponentData
      ? existingComponentData.reduce(
          (acc, curr) => {
            acc[curr.parentComponentId] ??= {};
            acc[curr.parentComponentId]![curr.id] = curr;
            return acc;
          },
          {} as Record<string, Record<string, FlattenedComponentData> | undefined>,
        )
      : {};

  const flattenedData = flattenData(componentData).map<FlattenedComponentData>((d) => {
    // top-level attributes should be open
    let isOpened = d.depth === 0;
    if (
      attrPrevState[componentId]?.[d.id]?.isOpened ||
      (d.directParentId && attrPrevState[componentId]?.[d.directParentId]?.isArrowDown)
    ) {
      // maintain previous open state
      isOpened = true;
    }

    let isArrowDown = false;
    if (attrPrevState[componentId]?.[d.id]?.hasArrow) {
      isArrowDown = attrPrevState[componentId][d.id].isArrowDown;
    }

    return {
      ...d,
      isOpened,
      isArrowDown,
      parentComponentId: componentId,
    };
  });

  setComponentFlattenedData(componentId, flattenedData);
};

export const setStoreData = (storeName: string, storeData: any) => {
  const flattenedData = flattenData(storeData).map(({ parentComponentId, ...el }) => ({
    ...el,
    parentStoreName: storeName,
  }));

  setStoreFlattenedData(storeName, flattenedData);
};

/**
 * ERRORS
 */

// renamed from `renderError`
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

/**
 * END ERRORS
 */

function withAllClosedComponents(components: State['components']): State['components'] {
  return Object.fromEntries(
    Object.entries(components).map(([k, v]) => [
      k,
      {
        ...v,
        isOpened: false,
      },
    ]),
  );
}

export function selectComponent(component: Component) {
  const selectedComponentId = component.id;
  const newComponents = withAllClosedComponents(state.components);
  newComponents[component.id] = {
    ...newComponents[component.id],
    isOpened: true,
  };

  setState('selectedComponentId', selectedComponentId);
  setState('components', reconcile(newComponents));

  if (!state.preloadedComponentData[component.id]) {
    // This code should basically never run, backend.js
    // will send the data for each component: on discover and on change
    console.warn('[alpine-devtools] Loading component data on-demand');
    metric('component_data_on_demand_loaded');
    panelPostMessage({
      componentId: selectedComponentId,
      action: PANEL_TO_BACKEND_MESSAGES.GET_DATA,
      source: ALPINE_DEVTOOLS_PANEL_SOURCE,
    });
  }
}

export function hoverOnComponent(component: Component) {
  panelPostMessage({
    componentId: component.id,
    action: PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

export function hoverLeftComponent(component: Component) {
  panelPostMessage({
    componentId: component.id,
    action: PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

export function selectStore(storeName: Store['name']) {
  setState('selectedStoreName', storeName);
  if (!state.preloadedStoreData[storeName]) {
    console.warn('[alpine-devtools] Loading store data on-demand');
    metric('store_data_on_demand_loaded');
    panelPostMessage({
      storeName,
      action: PANEL_TO_BACKEND_MESSAGES.GET_STORE_DATA,
      source: ALPINE_DEVTOOLS_PANEL_SOURCE,
    });
  }
}

export function toggleDataAttributeOpen(
  attribute: FlattenedComponentData | FlattenedStoreData,
  dataSourceType: DataAttrSource,
) {
  const isStore = 'parentStoreName' in attribute;
  const isMessage = dataSourceType === 'message';
  if (attribute.hasArrow) {
    const childrenIdLength = attribute.id.split('.').length + 1;

    // this code generates something like: \\w+\\.\\w+\\.\\w+$
    let closeRegexStr = '';

    for (let i = 0; i < childrenIdLength - 1; i++) {
      closeRegexStr += String.raw`[^.]+\.`;
    }

    closeRegexStr += String.raw`[^.]+$`;

    const closeRegex = new RegExp(closeRegexStr);

    const flattenedData = isStore
      ? selectedStoreFlattenedData()
      : isMessage
        ? selectedFlattenedMessageData()
        : selectedComponentFlattenedData();

    const childrenAttributesIds = flattenedData
      .filter((attr) => {
        const { id } = attr;
        if (attribute.isArrowDown) {
          return id.startsWith(attribute.id) && id !== attribute.id && closeRegex.test(id);
        }
        return id.startsWith(`${attribute.id}.`) && id.split('.').length === childrenIdLength;
      })
      .map((attr) => attr.id);

    const newSelectedFlattenedData = flattenedData
      .map((d) => {
        if (childrenAttributesIds.includes(d.id)) {
          const newData = {
            ...d,
            isOpened: !attribute.isArrowDown,
          };
          if (d.hasArrow && attribute.isArrowDown) {
            newData.isArrowDown = false;
          }
          return newData;
        }
        return d;
      })
      .map((d) => {
        if (d.hasArrow && d.id === attribute.id) {
          return {
            ...d,
            isArrowDown: !d.isArrowDown,
          };
        }
        return d;
      });

    if (isStore) {
      // @ts-expect-error
      setStoreFlattenedData(state.selectedStoreName!, newSelectedFlattenedData);
    } else if (isMessage) {
      // @ts-expect-error
      setMessageHistory('flattenedSelectedMessageData', newSelectedFlattenedData);
      const openedAttrs = new Set<string>();
      const arrowDownAttrs = new Set<string>();
      newSelectedFlattenedData.forEach((el) => {
        if (el.isOpened) {
          openedAttrs.add(el.id);
        }
        if (el.isArrowDown) {
          arrowDownAttrs.add(el.id);
        }
      });
      setMessageHistory('openedAttrs', openedAttrs);
      setMessageHistory('arrowDownAttrs', arrowDownAttrs);
    } else {
      // @ts-expect-error
      setComponentFlattenedData(String(state.selectedComponentId), newSelectedFlattenedData);
    }
  }
}

export function saveComponentAttributeEdit(editedAttr: FlattenedComponentData) {
  if (!window.__alpineDevtool.port) return;
  const newAttr = { ...editedAttr };
  newAttr.attributeValue = convertInputDataToType(
    editedAttr.inputType,
    editedAttr.editAttributeValue,
  );
  newAttr.inEditingMode = false;

  setComponentFlattenedData(
    String(newAttr.parentComponentId),
    selectedComponentFlattenedData().map((el) => (el.id === newAttr.id ? newAttr : el)),
  );

  panelPostMessage({
    componentId: newAttr.parentComponentId,
    attributeSequence: newAttr.id,
    attributeValue: newAttr.attributeValue,
    action: PANEL_TO_BACKEND_MESSAGES.EDIT_ATTRIBUTE,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

export function saveStoreAttributeEdit(editedAttr: FlattenedStoreData) {
  if (!window.__alpineDevtool.port) {
    return;
  }
  const newAttr = { ...editedAttr };
  newAttr.attributeValue = convertInputDataToType(
    editedAttr.inputType,
    editedAttr.editAttributeValue,
  );
  newAttr.inEditingMode = false;

  setStoreFlattenedData(
    editedAttr.parentStoreName,
    selectedStoreFlattenedData().map((el) => (el.id === newAttr.id ? newAttr : el)),
  );

  panelPostMessage({
    storeName: newAttr.parentStoreName,
    attributeSequence: newAttr.id,
    attributeValue: newAttr.attributeValue,
    action: PANEL_TO_BACKEND_MESSAGES.EDIT_STORE_ATTRIBUTE,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

// ported from state.updateDevtoolsXData
export const componentsValue = createMemo(() =>
  Object.values(state.components).sort((a, b) => a.index - b.index),
);
export const storesValue = createMemo(() => Object.values(state.stores));

export const openComponentValue = createMemo(() =>
  state.selectedComponentId ? state.components[state.selectedComponentId] : null,
);

export const openStoreValue = createMemo(() =>
  state.selectedStoreName ? state.stores[state.selectedStoreName] : null,
);

export const selectedComponentFlattenedData = createMemo(() => {
  return (
    (state.selectedComponentId && state.preloadedComponentData[state.selectedComponentId]) || []
  );
});

export const filteredSelectedCompData = createMemo(() => {
  const flattenedData = selectedComponentFlattenedData();
  if (!pinnedPrefix()) {
    return flattenedData;
  }
  const prefix = pinnedPrefix();

  const filteredAttrs = flattenedData.filter(
    (el) => getPartialPrefixes(prefix).includes(el.id) || el.id.startsWith(`${prefix}.`),
  );
  if (filteredAttrs.length > 0) {
    return filteredAttrs;
  }
  metric('filter_by_prefix_no_such_paths', {
    datasource: 'components',
  });
  // TODO, should return each partial prefix
  return flattenedData;
});

const setComponentFlattenedData = (
  selectedComponentId: string,
  newSelectedComponentFlattenedData: Array<FlattenedComponentData>,
) => {
  setState(
    'preloadedComponentData',
    reconcile({
      ...state.preloadedComponentData,
      [selectedComponentId]: newSelectedComponentFlattenedData,
    }),
  );
};

export const selectedStoreFlattenedData = createMemo(() => {
  return (state.selectedStoreName && state.preloadedStoreData[state.selectedStoreName]) || [];
});

export const filteredStoreFlattenedData = createMemo(() => {
  const flattenedData = selectedStoreFlattenedData();
  if (!pinnedPrefix()) {
    return flattenedData;
  }
  const prefix = pinnedPrefix();

  const filteredAttrs = flattenedData.filter(
    (el) => getPartialPrefixes(prefix).includes(el.id) || el.id.startsWith(`${prefix}.`),
  );
  if (filteredAttrs.length > 0) {
    return filteredAttrs;
  }
  metric('filter_by_prefix_no_such_paths', {
    datasource: 'stores',
  });
  // TODO, should return each partial prefix
  return flattenedData;
});

const setStoreFlattenedData = (
  storeName: string,
  newSelectedComponentFlattenedData: FlattenedStoreData[],
) => {
  setState(
    'preloadedStoreData',
    reconcile({
      ...state.preloadedStoreData,
      [storeName]: newSelectedComponentFlattenedData,
    }),
  );
};
