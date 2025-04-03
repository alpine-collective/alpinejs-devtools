/* Entrypoint for Extension panel, integrates with Devtools/extension APIs, see also panel.html, app.js */
import { init, handleMessage } from './app'

function connect() {
    init()

    injectScript(chrome.runtime.getURL('./backend.js'), () => {
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

let injectionAttempts = 0
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
            if (injectionAttempts < 5) {
                console.warn('[alpine-devtools] error injecting script, retrying in 300ms', err)
                injectionAttempts += 1
                setTimeout(() => {
                    injectScript(scriptSrc, cb)
                }, 300)
            } else {
                console.error('[alpine-devtools] error injecting script, stopping retries', err)
            }
        }
        cb()
    })
}

connect()
onReload(() => {
    connect()
})
