import { isFirefox } from './env';

window.addEventListener('message', e => {
  if (e.source === window && e.data.alpineDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

// will detect Alpine.js as long as it loads within ~600ms
function detect(win, remainingAttempts = 3) {
    setTimeout(() => {
        const alpineDetected = !!window.Alpine
        win.postMessage({
            alpineDetected
        })
        if (!alpineDetected && remainingAttempts > 0) {
            detect(win, remainingAttempts - 1);
        }
    }, 200)
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
