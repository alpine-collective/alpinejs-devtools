import { createMemo } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';
import { panelPostMessage } from './messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from './ports';
import { convertInputDataToType, flattenData } from '../lib/utils';

interface State {
  version: {
    detected?: string;
  };
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
  attributeValue: string;
  dataType: string; // TODO: narrow this
  depth: number;
  directParentId: string;
  editAttributeValue?: string | boolean;
  hasArrow: boolean;
  id: string;
  inEditingMode: boolean;
  inputType: string; // TODO: narrow this
  isArrowDown: boolean;
  isOpened: boolean;
  parentComponentId: number;
  readOnly: boolean;
}

export type FlattenedStoreData = Omit<FlattenedComponentData, 'parentComponentId'> & {
  parentStoreName: string;
};

export const [state, setState] = createStore<State>({
  version: {},
  errors: [],
  components: {},
  preloadedComponentData: {},
  stores: {},
  preloadedStoreData: {},
});

export const setAlpineVersionFromBackend = (version: string) => {
  setState('version', {
    detected: version,
  });
};

export const setComponentsList = (components: Array<Component>, appUrl: string) => {
  // TODO: check for removed components
  const newComponents = { ...state.components };
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

export const setComponentData = (componentId: string, componentData: any) => {
  const prevDataAttributeState: Record<
    string,
    Record<number, FlattenedComponentData>
  > = selectedComponentFlattenedData()
    ? selectedComponentFlattenedData().reduce((acc, curr) => {
        // string and number keys are interchangeable?
        // @ts-expect-error
        if (!acc[curr.parentComponentId]) {
          // @ts-expect-error
          acc[curr.parentComponentId] = {};
        }
        // @ts-expect-error
        acc[curr.parentComponentId][curr.id] = curr;
        return acc;
      }, {})
    : {};

  const flattenedData = flattenData(componentData).map<FlattenedComponentData>((d) => {
    // top-level attributes should be open
    let isOpened = d.depth === 0;
    if (
      (prevDataAttributeState[componentId] &&
        prevDataAttributeState[componentId][d.id] &&
        prevDataAttributeState[componentId][d.id].isOpened) ||
      (d.directParentId &&
        prevDataAttributeState[componentId] &&
        prevDataAttributeState[componentId][d.directParentId] &&
        prevDataAttributeState[componentId][d.directParentId].isArrowDown)
    ) {
      // maintain previous open state
      isOpened = true;
    }

    let isArrowDown = false;
    if (
      prevDataAttributeState[componentId] &&
      prevDataAttributeState[componentId][d.id] &&
      prevDataAttributeState[componentId][d.id].hasArrow
    ) {
      isArrowDown = prevDataAttributeState[componentId][d.id].isArrowDown;
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
    triggerComponentDataLoad(selectedComponentId);
  }
}

function triggerComponentDataLoad(componentId: number) {
  panelPostMessage({
    componentId: componentId,
    action: PANEL_TO_BACKEND_MESSAGES.GET_DATA,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });
}

export function hoverOnComponent(component: Component) {
  panelPostMessage({
    componentId: component.id,
    action: PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });

  // pre-load component if not already selected
  if (state.selectedComponentId === component.id) {
    triggerComponentDataLoad(component.id);
  }
}

export function hoverLeftComponent(component: Component) {
  panelPostMessage({
    componentId: component.id,
    action: PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER,
    source: ALPINE_DEVTOOLS_PANEL_SOURCE,
  });

  if (state.selectedComponentId && component.id !== state.selectedComponentId) {
    // undo component preload when hovering away without clicking
    triggerComponentDataLoad(state.selectedComponentId);
  }
}

export function selectStore(storeName: Store['name']) {
  setState('selectedStoreName', storeName);
  if (!state.preloadedStoreData[storeName]) {
    panelPostMessage({
      storeName,
      action: PANEL_TO_BACKEND_MESSAGES.GET_STORE_DATA,
      source: ALPINE_DEVTOOLS_PANEL_SOURCE,
    });
  }
}

export function toggleDataAttributeOpen(attribute: FlattenedComponentData | FlattenedStoreData) {
  const isStore = 'parentStoreName' in attribute;
  if (attribute.hasArrow) {
    const childrenIdLength = attribute.id.split('.').length + 1;

    // this code generates something like: \\w+\\.\\w+\\.\\w+$
    let closeRegexStr = '';

    for (let i = 0; i < childrenIdLength - 1; i++) {
      closeRegexStr += String.raw`[^.]+\.`;
    }

    closeRegexStr += String.raw`[^.]+$`;

    const closeRegex = new RegExp(closeRegexStr);

    const flattenedData = isStore ? selectedStoreFlattenedData() : selectedComponentFlattenedData();

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
