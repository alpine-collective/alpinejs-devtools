// This is a content-script that is injected only when the devtools are
// activated. Because it is not injected using eval, it has full privilege
// to the chrome runtime API. It serves as a proxy between the injected
// backend and the Alpine.js devtools panel.
import {
  ALPINE_DEVTOOLS_BACKEND_SOURCE,
  ALPINE_DEVTOOLS_PROXY_SOURCE,
  PROXY,
} from '../devtools/ports';

function proxy() {
  const proxyPort = chrome.runtime.connect({
    name: PROXY,
  });

  proxyPort.onMessage.addListener(sendMessageToBackend);
  window.addEventListener('message', sendMessageToDevtools);
  proxyPort.onDisconnect.addListener(handleDisconnect);

  sendMessageToBackend('init');

  function sendMessageToBackend(payload: any) {
    window.postMessage(
      {
        source: ALPINE_DEVTOOLS_PROXY_SOURCE,
        payload: payload,
      },
      '*',
    );
  }

  function sendMessageToDevtools(e: any) {
    if (e.data && e.data.source === ALPINE_DEVTOOLS_BACKEND_SOURCE) {
      proxyPort.postMessage(e.data.payload);
    } else {
      if (import.meta.env.DEV) {
        console.log('[alpine-devtools] PROXY, Not forwarding message', e);
      }
    }
  }

  function handleDisconnect() {
    proxyPort.onMessage.removeListener(sendMessageToBackend);
    window.removeEventListener('message', sendMessageToDevtools);
    sendMessageToBackend('shutdown');
  }
}

proxy();
