import { isFirefox } from './env';

window.addEventListener('message', e => {
  if (e.source === window && e.data.alpineDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

function detect (win) {
  setTimeout(() => {
    win.postMessage({
      alpineDetected: !!window.Alpine
    })
  }, 100)
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
