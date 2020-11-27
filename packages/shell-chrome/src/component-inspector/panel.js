/* Entrypoint for Extension pane, see also panel.html */
import { init, handleMessage } from './app'

function connect() {
    injectScript(chrome.runtime.getURL('./backend.js'), () => {
        init()

        const port = chrome.runtime.connect({
            name: '' + chrome.devtools.inspectedWindow.tabId,
        })

        let disconnected = false

        port.onDisconnect.addListener(() => {
            disconnected = true
        })

        port.onMessage.addListener(function (message) {
            // ignore further messages
            if (disconnected) return
            handleMessage(message, port)
        })
    })
}

function onReload(reloadFn) {
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
  `
    chrome.devtools.inspectedWindow.eval(src, function (res, err) {
        if (err) {
            console.log(err)
        }
        cb()
    })
}

connect()
onReload(() => {
    connect()
})
