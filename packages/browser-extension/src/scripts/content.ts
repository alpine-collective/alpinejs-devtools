import { CONTENT } from '../devtools/ports';

function loadScriptInRealWorld(path: string) {
  return new Promise(async (resolve, reject) => {
    const script = document.createElement('script');
    // Was originally:
    // script.src = chrome.runtime.getURL(path)
    // which causes issues on sites with CSPs, see:
    // https://github.com/alpine-collective/alpinejs-devtools/issues/445
    script.innerHTML = await fetch(chrome.runtime.getURL(path)).then((res) => res.text());
    script.type = 'module';

    script.addEventListener('error', (err) => reject(err));
    script.addEventListener('load', () => resolve(undefined));

    /* The script should execute as soon as possible */
    const mount = document.head || document.documentElement;
    mount.appendChild(script);
  }).catch((err) => console.warn(`[alpine-devtools] error injecting "${path}"`, err));
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
    if (import.meta.env.DEV) {
      console.log('[alpine-devtools] detector/backend -> content message', e?.data);
    }
    port.postMessage(e.data);
  } else {
    console.warn('[alpine-devtools] CONTENT port disconnected, skipping message send', e);
  }
}
// window is shared with detector.ts/backend.js
window.addEventListener('message', forwardWindowMessageListener);

loadScriptInRealWorld('./detector.js');
