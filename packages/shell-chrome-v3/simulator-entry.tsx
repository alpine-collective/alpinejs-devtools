// dev-wrapper for component inspector panel
import './src/mock-chrome-api';
import { handleBackendToPanelMessage } from './src/devtools/messaging';
import { renderApp } from './src/devtools/App';
import {
  ALPINE_DEVTOOLS_PANEL_SOURCE,
  ALPINE_DEVTOOLS_BACKEND_SOURCE,
  ALPINE_DEVTOOLS_PROXY_SOURCE,
} from './src/devtools/ports';
import { INIT_MESSAGE } from './src/lib/constants';
import { loadPersistedEarlyAccessInfo, forceEarlyAccess } from './src/lib/isEarlyAccess';
import { setupWorker } from 'msw/browser';
import { handlers } from './src/mocks/handlers';

async function prepare() {
  if (typeof window !== 'undefined') {
    const worker = setupWorker(...handlers);
    await worker.start();
  }
}

function inject(src: string, done: Function) {
  const target = document.getElementById('target');
  if (!src || src === 'false') {
    return done();
  }
  const script = (target as HTMLIFrameElement).contentDocument!.createElement('script');
  script.src = src;
  script.onload = done as any;
  (target as HTMLIFrameElement).contentDocument!.body.appendChild(script);
}

let isInitialised = false;
function initProxy(window: Window, targetWindow: Window) {
  window.addEventListener('message', async (event) => {
    if (event.data.source === ALPINE_DEVTOOLS_BACKEND_SOURCE) {
      if (!isInitialised) {
        console.log('initialising panel');
        renderApp(document.querySelector('#devtools-container')!);
        isInitialised = true;
      }
      handleBackendToPanelMessage(event.data.payload, window as any);
      return;
    }
    if (event.data.source === ALPINE_DEVTOOLS_PANEL_SOURCE) {
      // format as expected by backend.js
      targetWindow.postMessage(
        {
          source: ALPINE_DEVTOOLS_PROXY_SOURCE,
          payload: (event.data && event.data.payload) || event.data,
        },
        '*',
      );
      return;
    }
    console.log('no handler for message: ', event.data);
  });
}

async function main() {
  await prepare();
  const target = document.getElementById('target');
  const targetWindow = (target as HTMLIFrameElement).contentWindow;

  if (new URL(window.location.href).searchParams.get('sa-enabled') === 'true') {
    forceEarlyAccess(false);
    loadPersistedEarlyAccessInfo();
  }

  initProxy(window, targetWindow!);

  // 1. load user app
  const targetPath = new URL(window.location.href).searchParams.get('target');
  (target as HTMLIFrameElement).src = targetPath || './v3.html';
  (target as HTMLIFrameElement).onload = () => {
    // 1. inject backend script to "target" iframe
    // import('./src/scripts/backend').then(() => {
    inject('./dist/backend.js', () => {
      // 2. init devtools
      targetWindow!.postMessage({
        source: ALPINE_DEVTOOLS_PROXY_SOURCE,
        payload: INIT_MESSAGE,
      });
      // 3. proxy messages from backend to `window`
      targetWindow!.addEventListener('message', (event: any) => {
        if (event.data.source === ALPINE_DEVTOOLS_BACKEND_SOURCE) {
          console.log('backend -> devtools', event.data?.payload);
          window.postMessage(event.data, '*');
        }
      });
    });
  };
}

main();
