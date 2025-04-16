import { BACKEND_TO_PANEL_MESSAGES } from '../lib/constants';
import { metric, toolDetector } from './metrics';
import {
  setAlpineVersionFromBackend,
  setComponentsList,
  setComponentData,
  setAdditionalError,
  setStoresFromList,
  setStoreData,
  setPageLoaded,
} from './state';
import type { BackendToPanelMessage, PanelToBackendMessage } from './types';

export function unsetPort() {
  window.__alpineDevtool = {};
}
function setPort(port: chrome.runtime.Port) {
  if (!window.__alpineDevtool) {
    window.__alpineDevtool = {};
  }
  window.__alpineDevtool.port = port;
}
/** panel -> browser/backend.ts messages */
// TODO: better message type since we should only allow msg.type === PANEL_TO_BACKEND_MESSAGE.*
export function panelPostMessage(message: PanelToBackendMessage) {
  if (window.__alpineDevtool.port) {
    window.__alpineDevtool.port.postMessage(message);
  } else {
    console.warn(`Unable to post message from panel, message: ${JSON.stringify(message)}`);
  }
}
/** browser/backend.ts -> panel messages */
export function handleBackendToPanelMessage(
  message: BackendToPanelMessage,
  port: chrome.runtime.Port,
) {
  switch (message.type) {
    case BACKEND_TO_PANEL_MESSAGES.SET_VERSION: {
      setAlpineVersionFromBackend(message.version);
      metric('detected_tools', {
        tools: toolDetector(message),
        version: message.version,
      });
      setPort(port);
      break;
    }
    case BACKEND_TO_PANEL_MESSAGES.SET_COMPONENTS_AND_STORES: {
      setComponentsList(message.components, message.url);
      setStoresFromList(message.stores);
      setPageLoaded();
      setPort(port);
      break;
    }
    case BACKEND_TO_PANEL_MESSAGES.SET_DATA: {
      const comps = JSON.parse(message.data);
      setComponentData(message.componentId, comps);
      setPort(port);
      break;
    }
    case BACKEND_TO_PANEL_MESSAGES.SET_STORE_DATA: {
      setStoreData(message.storeName, JSON.parse(message.storeData));
      setPort(port);
      break;
    }
    case BACKEND_TO_PANEL_MESSAGES.ADD_ERROR: {
      setAdditionalError(message.error);
      setPort(port);
      break;
    }
    default: {
      console.warn(`[alpine-devtools] message type "${message.type}"not implemented`);
      assertNever(message.type);
    }
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
