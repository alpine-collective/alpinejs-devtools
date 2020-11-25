import { isFirefox } from './env';
import { waitForAlpine } from './utils';

window.addEventListener('message', e => {
  if (e.source === window && e.data.alpineDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

function detect(win) {
    waitForAlpine(() => {
        win.postMessage({
            alpineDetected: !!window.Alpine
        })
    }, { maxAttempts: 3, interval: 250, delayFirstAttempt: true })
}

// inject the hook
if (document instanceof HTMLDocument) {
  installScript(detect)
}

function installScript (fn) {
  const source = ';(' + fn.toString() + ')(window)'

  if (isFirefox) {
    // eslint-disable-next-line no-eval
    window.eval(source) // in Firefox, this evaluates on the content window
  } else {
    const script = document.createElement('script')
    script.textContent = source
    document.documentElement.appendChild(script)
    script.parentNode.removeChild(script)
  }
}
