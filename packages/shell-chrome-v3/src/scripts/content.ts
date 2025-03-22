import { CONTENT } from '../devtools/ports';

function loadScriptInRealWorld(path: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(path);
    script.type = 'module';

    script.addEventListener('error', (err) => reject(err));
    script.addEventListener('load', () => resolve(undefined));

    /* The script should execute as soon as possible */
    const mount = document.head || document.documentElement;
    mount.appendChild(script);
  });
}

const port = chrome.runtime.connect({ name: CONTENT });
let disconnected = false;
if (import.meta.env.DEV) {
  port.onMessage.addListener((e) => {
    console.log('[alpine-devtools] CONTENT port onMessage', e);
  });
}

port.onDisconnect.addListener((e) => {
  if (import.meta.env.DEV) {
    console.log('[alpine-devtools] onDisconnect', e);
  }
  disconnected = true;
  window.removeEventListener('message', forwardWindowMessageListener);
});

function forwardWindowMessageListener(e: any) {
  if (!disconnected) {
    console.log('[alpine-devtools] detector -> content message', e);
    port.postMessage(e.data);
  } else {
    console.warn('[alpine-devtools] CONTENT port disconnected, skipping message send', e);
  }
}
// window is shared with detector.ts
window.addEventListener('message', forwardWindowMessageListener);

loadScriptInRealWorld('./detector.js');
