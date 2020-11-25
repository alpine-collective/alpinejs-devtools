import './style.css'
import State from "./state";
import 'alpinejs';

// inject util function(s) for panel.html Alpine app
import { fetchWithTimeout } from './utils';

window.fetchWithTimeout = fetchWithTimeout;

function connect() {
    injectScript(chrome.runtime.getURL("./backend.js"), () => {
        const alpineState = new State();
        window.alpineState = alpineState;
        window.__alpineDevtool = {};

        // 2. connect to background to setup proxy
        const port = chrome.runtime.connect({
            name: "" + chrome.devtools.inspectedWindow.tabId,
        });

        let disconnected = false;

        port.onDisconnect.addListener(() => {
            disconnected = true;
        });

        port.onMessage.addListener(function (message) {
            // ignore further messages
            if (disconnected) return;
            if (message.type === "render-components") {
                // message.components is a serialised JSON string
                alpineState.renderComponentsFromBackend(JSON.parse(message.components));

                window.__alpineDevtool.port = port;
            }

            if (message.type === "set-version") {
                alpineState.setAlpineVersionFromBackend(message.version);

                window.__alpineDevtool.port = port;
            }
        });
    });
}

function onReload (reloadFn) {
    chrome.devtools.network.onNavigated.addListener(reloadFn)
}

/**
 * Inject a globally evaluated script, in the same context with the actual
 * user app.
 *
 * @param {String} scriptName
 * @param {Function} cb
 */

function injectScript(scriptName, cb) {
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
