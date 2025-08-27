import { createMemo } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { effect } from 'solid-js/web';
import { PANEL_TO_BACKEND_MESSAGES } from '../../lib/constants';
import { getPartialPrefixes } from '../../lib/prefix';
import { flattenData } from '../../lib/utils';
import { panelPostMessage } from '../messaging';
import { ALPINE_DEVTOOLS_PANEL_SOURCE } from '../ports';
import { DataMessageHistory, FlattenedComponentData } from '../types';
import { openComponentValue, selectedComponentFlattenedData } from './components';
import { snapshotToDataObj } from './message-history';
import { pinnedPrefix } from './app';
import { state } from './store';

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
