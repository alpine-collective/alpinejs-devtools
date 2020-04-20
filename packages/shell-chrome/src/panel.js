import './style.css'
import State from "./state";
import 'alpinejs';

injectScript(chrome.runtime.getURL("./backend.js"), () => {
  window.alpineState = new State();

  // 2. connect to background to setup proxy
  const port = chrome.runtime.connect({
    name: "" + chrome.devtools.inspectedWindow.tabId,
  });

  let disconnected = false;

  port.onDisconnect.addListener(() => {
    disconnected = true;
  });

  window.__alpineDevtool = {};

  port.onMessage.addListener(function (message) {
    if (message.type == "render-components") {
      alpineState.renderComponentsFromBackend(message.components);

      window.__alpineDevtool["port"] = port;
    }
  });
});

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
