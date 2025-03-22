import { isInspector, inspectorPortNameToTabId, PROXY, CONTENT } from '../devtools/ports';
import { CONTENT_TO_BACKGROUND_MESSAGES } from '../lib/constants';

// TODO: refactor this to a class?
let ports: Record<string, { devtools?: chrome.runtime.Port; backend?: chrome.runtime.Port }> = {};

const initPortsForTab = (tabId: number) => {
  if (!ports[tabId]) {
    ports[tabId] = {
      devtools: undefined,
      backend: undefined,
    };
  }
};
const resetPortsForTab = (tabId: number) => {
  ports[tabId] = {
    devtools: undefined,
    backend: undefined,
  };
};

chrome.runtime.onConnect.addListener(async (port) => {
  let tabId;
  if (port.name === CONTENT) {
    console.log('[alpine-devtools] content script requested connection');

    let disconnected = false;
    const contentTabId = port.sender?.tab?.id;
    function contentListener(message: any) {
      if (disconnected) {
        return;
      }
      console.log(`[alpine-devtools] (${port.name}, tabId: ${contentTabId}) -> background: `, message);
      if (message.type === CONTENT_TO_BACKGROUND_MESSAGES.ALPINE_DETECTED && message.alpineDetected && contentTabId) {
        chrome.action.setIcon({
          tabId: contentTabId,
          path: {
            16: 'icons/16.png',
            48: 'icons/48.png',
            128: 'icons/128.png',
          },
        });
        chrome.action.setPopup({
          tabId: contentTabId,
          popup: 'popups/enabled.html',
        });
      }
    }
    port.onMessage.addListener(contentListener);
    port.onDisconnect.addListener(() => {
      disconnected = true;
      port.onMessage.removeListener(contentListener);
      port.disconnect();
    });
  }
  if (isInspector(port)) {
    // this is a devtools tab creating a connection
    tabId = inspectorPortNameToTabId(port.name);
    console.log(`[alpine-devtools] injecting proxy for tabId "${tabId}"`);
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['./proxy.js'],
    });
    initPortsForTab(tabId);
    ports[tabId].devtools = port;
  } else {
    tabId = port.sender?.tab?.id;
    if (port.name !== PROXY) {
      console.warn(
        '[alpine-devtools] Received onConnect from ',
        port.name,
        ' not initialising a devtools <-> backend, tabId: ',
        tabId,
      );
      return;
    }
    if (tabId) {
      // This is coming from backend.js
      initPortsForTab(tabId);
      ports[tabId].backend = port;
    } else {
      console.warn('[alpine-devtools] sender not defined, not initialising port ', port.name);
    }
  }
  if (tabId && ports[tabId].devtools && ports[tabId].backend) {
    doublePipe(tabId, ports[tabId].devtools!, ports[tabId].backend!);
  }
  return;
});

/**
 * For each tab, 2-way forward messages, devtools <-> backend.
 */
function doublePipe(tabId: number, devtools: chrome.runtime.Port, backend: chrome.runtime.Port) {
  console.log('[alpine-devtools] starting double pipe, devtools:', devtools.name, 'backend: ', backend.name);
  devtools.onMessage.addListener(lOne);
  function lOne(message: any) {
    console.log('[alpine-devtools] devtools -> backend', message);
    backend.postMessage(message);
  }
  backend.onMessage.addListener(lTwo);
  function lTwo(message: any) {
    console.log(`[alpine-devtools] "${tabId}" backend -> devtools`, message);
    devtools.postMessage(message);
  }
  function shutdown() {
    console.log(`[alpine-devtools] tab "${tabId}" disconnected.`);
    devtools.onMessage.removeListener(lOne);
    backend.onMessage.removeListener(lTwo);
    devtools.disconnect();
    backend.disconnect();
    resetPortsForTab(tabId);
  }
  devtools.onDisconnect.addListener(shutdown);
  backend.onDisconnect.addListener(shutdown);
  console.log(`[alpine-devtools] tab "${tabId}" connected.`);
}
