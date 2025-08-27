import { createMemo } from 'solid-js';
import { reconcile } from 'solid-js/store';
import { PANEL_TO_BACKEND_MESSAGES } from '../../lib/constants';
import { getPartialPrefixes } from '../../lib/prefix';
import { convertInputDataToType, flattenData } from '../../lib/utils';
import { panelPostMessage } from '../messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from '../ports';
import { metric } from '../metrics';
import { FlattenedStoreData, Store } from '../types';
import { pinnedPrefix } from './app';
import { state, setState } from './store';

const primitiveMetricSentForStores = new Set<string>();

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
        {} as Record<string, Store>,
      ),
    ),
  );
};

export function toggleStoreDataAttributeOpen(attribute: FlattenedStoreData) {
  if (attribute.hasArrow) {
    const childrenIdLength = attribute.id.split('.').length + 1;

    // this code generates something like: \\w+\\.\\w+\\.\\w+$
    let closeRegexStr = '';

    for (let i = 0; i < childrenIdLength - 1; i++) {
      closeRegexStr += String.raw`[^.]+\.`;
    }

    closeRegexStr += String.raw`[^.]+$`;

    const closeRegex = new RegExp(closeRegexStr);

    const flattenedData = selectedStoreFlattenedData();

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

    setStoreFlattenedData(state.selectedStoreName!, newSelectedFlattenedData);
  }
}

export const setStoreData = (storeName: string, storeData: any) => {
  const flattenedData = flattenData(storeData).map(({ parentComponentId, ...el }) => ({
    ...el,
    parentStoreName: storeName,
  }));

  setStoreFlattenedData(storeName, flattenedData);
};

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

export const storesValue = createMemo(() => Object.values(state.stores));

export const openStoreValue = createMemo(() =>
  state.selectedStoreName ? state.stores[state.selectedStoreName] : null,
);

export const selectedStoreFlattenedData = createMemo(() => {
  return (state.selectedStoreName && state.preloadedStoreData[state.selectedStoreName]) || [];
});

export const filteredStoreFlattenedData = createMemo(() => {
  const flattenedData = selectedStoreFlattenedData();
  const storeName = state.selectedStoreName;

  if (storeName && !primitiveMetricSentForStores.has(storeName)) {
    if (flattenedData.length === 1 && flattenedData[0].attributeName === '__root_value') {
      metric('store_contains_primitive');
      primitiveMetricSentForStores.add(storeName);
    }
  }

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
