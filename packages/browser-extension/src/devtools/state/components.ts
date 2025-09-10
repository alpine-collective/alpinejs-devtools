import { createMemo } from 'solid-js';
import { reconcile } from 'solid-js/store';
import { PANEL_TO_BACKEND_MESSAGES } from '../../lib/constants';
import { getPartialPrefixes } from '../../lib/prefix';
import { convertInputDataToType, flattenData } from '../../lib/utils';
import { panelPostMessage } from '../messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from '../ports';
import { metric } from '../metrics';
import { Component, ComponentData, DataAttrSource, FlattenedComponentData } from '../types';
import { pinnedPrefix } from './app';
import { state, setState } from './store';
import { messageHistory, selectedFlattenedMessageData, setMessageHistory } from './messages';
import { DataMessageHistory } from '../types';
import { MESSAGE_HISTORY_SIZE } from './message-history';

function withAllClosedComponents(components: Record<number, Component>): Record<number, Component> {
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

export function toggleComponentDataAttributeOpen(
  attribute: FlattenedComponentData,
  dataSourceType: DataAttrSource,
) {
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

    const flattenedData = isMessage
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

    if (isMessage) {
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

export const componentFilterValue = createMemo(() => state.componentFilter);

export const setComponentFilter = (filter: string) => setState('componentFilter', filter);

export const componentsValue = createMemo(() =>
  Object.values(state.components).sort((a, b) => a.index - b.index),
);

export const filteredComponentsValue = createMemo(() => {
  const filter = state.componentFilter.toLowerCase();
  if (!filter) {
    return componentsValue();
  }
  return componentsValue().filter((c) => c.name.toLowerCase().includes(filter));
});

export const openComponentValue = createMemo(() =>
  state.selectedComponentId ? state.components[state.selectedComponentId] : null,
);

export const selectedComponentFlattenedData = createMemo<FlattenedComponentData[]>(() => {
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
