import { createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import { PANEL_TO_BACKEND_MESSAGES } from '../lib/constants';
import { panelPostMessage } from './messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from './ports';
import { convertInputDataToType, flattenData } from '../lib/utils';

interface State {
  version: {
    detected?: string;
    latest?: string;
  };
  appUrl?: string;
  components: Record<number, Component>;
  selectedComponentId?: number;
  preloadedComponentData: Record<number, Array<FlattenedComponentData>>;
  errors: any[];
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

export interface Component {
  depth: number;
  id: number;
  index: number;
  name: string;
  // TODO: this is only on output type and are not nullable
  isOpened?: boolean;
}

export const [state, setState] = createStore<State>({
  version: {},
  errors: [],
  components: {},
  preloadedComponentData: {},
});

export const setAlpineVersionFromBackend = (version: string) => {
  setState({
    version: {
      detected: version,
    },
  });
};

export const setComponentsList = (components: Array<Component>, appUrl: string) => {
  console.log('setComponentsList', appUrl, components);

  // TODO: check for removed components
  const newComponents = { ...state.components };
  components.forEach((component, index) => {
    component.index = index;
    component.isOpened = state.selectedComponentId === component.id;
    newComponents[component.id] = component;
  });

  setState({
    components: newComponents,
  });

  if (appUrl !== state.appUrl || !components.find((c) => c.id === state.selectedComponentId)) {
    setState({
      selectedComponentId: undefined,
      preloadedComponentData: {},
      appUrl,
    });
  }
};

export const setComponentData = (componentId: string, componentData: string) => {
  console.log('setComponentData', componentId, componentData);
  // preloadedComponentData = flattendedData
  const flattenedData = flattenData(componentData).map<FlattenedComponentData>((d) => {
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

// TODO: rename this to `setAdditionalError`
export const renderError = (error: any) => {
  setState({
    errors: [...state.errors, error],
  });
};

function withAllClosedComponents(components: State['components']) {
  // TODO set isOpened = false to all components
  return { ...components };
}

export function selectComponent(component: Component) {
  const selectedComponentId = component.id;
  const newComponents = withAllClosedComponents(state.components);
  newComponents[component.id].isOpened = true;

  setState({
    selectedComponentId,
    components: newComponents,
  });
  if (!state.preloadedComponentData[component.id]) {
    panelPostMessage({
      componentId: selectedComponentId,
      action: PANEL_TO_BACKEND_MESSAGES.GET_DATA,
      source: ALPINE_DEVTOOLS_PANEL_SOURCE,
    });
  }
}

export function toggleDataAttributeOpen(attribute: FlattenedComponentData) {
  if (attribute.hasArrow) {
    const childrenIdLength = attribute.id.split('.').length + 1;

    // this code generate something like that \\w+\\.\\w+\\.\\w+$
    let closeRegexStr = '';

    for (let i = 0; i < childrenIdLength - 1; i++) {
      closeRegexStr += String.raw`\w+\.`;
    }

    closeRegexStr += String.raw`\w+$`;

    const closeRegex = new RegExp(closeRegexStr);

    const childrenAttributesIds = selectedComponentFlattenedData()
      .filter((attr) => {
        const { id } = attr;
        if (attribute.isArrowDown) {
          return id.startsWith(attribute.id) && id !== attribute.id && closeRegex.test(id);
        }
        return id.startsWith(`${attribute.id}.`) && id.split('.').length === childrenIdLength;
      })
      .map((attr) => attr.id);

    const newSelectedComponentFlattenedData = selectedComponentFlattenedData()
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

    setComponentFlattenedData(String(state.selectedComponentId), newSelectedComponentFlattenedData);
  }
}

export function saveAttributeEdit(editedAttr: FlattenedComponentData) {
  if (!window.__alpineDevtool.port) return;
  const newAttr = { ...editedAttr };
  newAttr.attributeValue = convertInputDataToType(editedAttr.inputType, editedAttr.editAttributeValue);
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

// ported from state.updateDevtoolsXData
export const componentsValue = createMemo(() => Object.values(state.components).sort((a, b) => a.index - b.index));

export const openComponentValue = createMemo(() =>
  state.selectedComponentId ? state.components[state.selectedComponentId] : null,
);

export const selectedComponentFlattenedData = createMemo(() => {
  return (state.selectedComponentId && state.preloadedComponentData[state.selectedComponentId]) || [];
});

const setComponentFlattenedData = (
  selectedComponentId: string,
  newSelectedComponentFlattenedData: Array<FlattenedComponentData>,
) => {
  setState({
    preloadedComponentData: {
      ...state.preloadedComponentData,
      [selectedComponentId]: newSelectedComponentFlattenedData,
    },
  });
};
