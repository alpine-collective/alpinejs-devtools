import { CONTENT_TO_BACKGROUND_MESSAGES } from '../lib/constants';

function detect(win: Window) {
  const detector = {
    delay: 300,
    retry: 4,
  };
  doDetect();
  function doDetect() {
    setTimeout(() => {
      const alpineGlobalDetected = !!window.Alpine;
      const alpineElementDetected = !!document.querySelector('[x-data],[data-x-data]');
      const alpineDetected = alpineGlobalDetected || alpineElementDetected;
      win.postMessage(
        {
          alpineDetected,
          type: CONTENT_TO_BACKGROUND_MESSAGES.ALPINE_DETECTED,
        },
        '*',
      );
      if (!alpineDetected && detector.retry > 0) {
        detector.retry -= 1;
        doDetect();
      }
    }, detector.delay);
  }
}

if (document instanceof HTMLDocument) {
  detect(window);
}
