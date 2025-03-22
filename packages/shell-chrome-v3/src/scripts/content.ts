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

port.onMessage.addListener((e) => {
  console.log('CONTENT port onMessage', e);
});

// window is shared with detector.ts
window.addEventListener('message', (e) => {
  console.log('detector -> content message', e);
  port.postMessage(e.data);
});

loadScriptInRealWorld('./detector.js');
