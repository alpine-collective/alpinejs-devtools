/* @refresh reload */
import { renderApp } from './App';
import { loadPersistedEarlyAccessInfo } from '../lib/isEarlyAccess';
import { inspectorPortName } from './ports';
import { handleBackendToPanelMessage, unsetPort } from './messaging';
import { state } from './state/store';
import { DEVTOOLS_INITIAL_STATE_GLOBAL } from '../lib/constants';
import { sampledMetric } from './metrics';

let dispose: () => void;
/* Entrypoint for Extension panel, integrates with Devtools/extension APIs, initialises the solidJS app, see also index.html */
async function connect() {
  loadPersistedEarlyAccessInfo();

  if (dispose) {
    console.log('[alpine-devtools] unmounting solid app');
    dispose();
  }
  dispose = renderApp(document.getElementById('root')!);

  // There's probably a better way than injecting backend.js from here
  // eg. watching the active tab in content.ts or background.ts
  // the flow goes:
  // 1. [panel] inject backend
  // 2. [panel] connect on an "inspector" port
  // 3. connection is picked up by background
  // 4. background injects proxy (because the connection was triggered by an "inspector" port)
  // 5. proxy starts a connection back to background
  //    1. proxy forwards backend.window.postMessage on this connection
  // 6. background starts a 2-way pipe between proxy and devtools
  // What that means is that messages go:
  // - panel/devtools -(port)-> background -(port)-> proxy -(window)-> backend
  // - backend -(window)-> proxy -(port)-> background -(port)-> panel/devtools
  injectScript(
    chrome.runtime.getURL('./backend.js'),
    { selectedComponentId: state.selectedComponentId, selectedStoreName: state.selectedStoreName },
    () => {
      const port = chrome.runtime.connect({
        name: inspectorPortName(chrome.devtools.inspectedWindow.tabId),
      });

      let disconnected = false;

      port.onDisconnect.addListener(() => {
        console.log('[alpine-devtools] panel.tsx disconnecting');
        disconnected = true;
        unsetPort();
        port.onMessage.removeListener(panelToBackendMessageHandler);
      });

      function panelToBackendMessageHandler(message: any) {
        // ignore further messages, might not be needed since
        // we're removing the listener
        if (disconnected) {
          unsetPort();
          return;
        }
        handleBackendToPanelMessage(message, port);
      }

      port.onMessage.addListener(panelToBackendMessageHandler);
    },
  );
}

function onReload(reloadFn: () => void) {
  chrome.devtools.network.onNavigated.addListener(reloadFn);
}

let injectionAttempts = 0;
/**
 * Inject a globally evaluated script, in the same context with the actual
 * user app.
 */
function injectScript(scriptSrc: string, globals: any, cb: Function) {
  const src = `
    (function() {
      var script = document.constructor.prototype.createElement.call(document, 'script');
      script.src = "${scriptSrc}";
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
      window.${DEVTOOLS_INITIAL_STATE_GLOBAL} = ${JSON.stringify(globals)};
    })()
  `;
  chrome.devtools.inspectedWindow.eval(src, (_res, err) => {
    if (err) {
      if (injectionAttempts < 5) {
        console.warn('[alpine-devtools] error injecting script, retrying in 300ms', err);
        injectionAttempts += 1;
        setTimeout(() => {
          injectScript(scriptSrc, globals, cb);
        }, 300);
      } else {
        sampledMetric('inject_script_retry_stop');
        console.error('[alpine-devtools] error injecting script, stopping retries', err);
      }
    }
    cb();
  });
}

connect();
onReload(() => {
  connect();
});
