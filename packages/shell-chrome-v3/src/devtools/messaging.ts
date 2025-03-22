import { BACKEND_TO_PANEL_MESSAGES } from '../lib/constants';
import { setAlpineVersionFromBackend, setComponentsList, setComponentData, renderError } from './state';

function setPort(port: chrome.runtime.Port) {
  if (!window.__alpineDevtool) {
    window.__alpineDevtool = {};
  }
  window.__alpineDevtool.port = port;
}
/** browser/backend.ts -> panel messages */
export function handleBackendToPanelMessage(message: any, port: chrome.runtime.Port) {
  if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_VERSION) {
    setAlpineVersionFromBackend(message.version);
    setPort(port);
  }

  if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_COMPONENTS) {
    setComponentsList(message.components, message.url);
    setPort(port);
  }

  if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_DATA) {
    setComponentData(message.componentId, JSON.parse(message.data));
    setPort(port);
  }

  if (message.type === BACKEND_TO_PANEL_MESSAGES.ADD_ERROR) {
    renderError(message.error);
    setPort(port);
  }
}

/** panel -> browser/backend.ts messages */
// TODO: better message type since we should only allow msg.type === PANEL_TO_BACKEND_MESSAGE.*
export function panelPostMessage(message: any) {
  if (window.__alpineDevtool.port) {
    window.__alpineDevtool.port.postMessage(message);
  } else {
    console.warn(`Unable to post message from panel, message: ${JSON.stringify(message)}`);
  }
}
