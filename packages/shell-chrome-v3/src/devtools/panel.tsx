/* @refresh reload */
import { renderApp } from './App';
import { inspectorPortName } from './ports';
import { handleBackendToPanelMessage } from './messaging';

/* Entrypoint for Extension panel, integrates with Devtools/extension APIs, initialises the solidJS app, see also index.html */
function connect() {
  renderApp(document.getElementById('root')!);

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
  injectScript(chrome.runtime.getURL('./backend.js'), () => {
    const port = chrome.runtime.connect({
      name: inspectorPortName(chrome.devtools.inspectedWindow.tabId),
    });

    let disconnected = false;

    port.onDisconnect.addListener(() => {
      disconnected = true;
    });

    port.onMessage.addListener(function (message) {
      // ignore further messages
      if (disconnected) return;
      handleBackendToPanelMessage(message, port);
    });
  });
}

function onReload(reloadFn: () => void) {
  chrome.devtools.network.onNavigated.addListener(reloadFn);
}

/**
 * Inject a globally evaluated script, in the same context with the actual
 * user app.
 *
 * @param {String} scriptName
 * @param {Function} cb
 */

function injectScript(scriptName: string, cb: Function) {
  const src = `
    (function() {
      var script = document.constructor.prototype.createElement.call(document, 'script');
      script.src = "${scriptName}";
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
    })()
  `;
  chrome.devtools.inspectedWindow.eval(src, function (res, err) {
    if (err) {
      console.log(err);
    }
    cb();
  });
}

connect();
onReload(() => {
  connect();
});
