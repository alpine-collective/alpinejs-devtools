// This is the devtools script, which is called when the user opens the
// Chrome devtool on a page. We check to see if we global hook has detected
// Alpine presence on the page. If yes, create the Alpine panel; otherwise poll
// for 10 seconds.

let created = false;
let checkCount = 0;

chrome.devtools.network.onNavigated.addListener(createPanelIfHasAlpine);
const checkAlpineInterval = setInterval(createPanelIfHasAlpine, 1000);
createPanelIfHasAlpine();

function createPanelIfHasAlpine() {
  if (created || checkCount++ > 10) {
    clearInterval(checkAlpineInterval);
    return;
  }

  chrome.devtools.inspectedWindow.eval(
    "!!(window.Alpine)",
    function(hasAlpine) {
      if (!hasAlpine || created) {
        return;
      }

      clearInterval(checkAlpineInterval);
      created = true;
      chrome.devtools.panels.create(
        "Alpine.js",
        "alpine_extension.png",
        "panel.html",
        panel => {
          // panel loaded
          console.log(panel)
          console.log('panel loaded')
        }
      );
    }
  );
}