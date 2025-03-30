export function inspectUserGlobal(valueToInspect: string) {
  if (typeof chrome !== 'undefined') {
    chrome.devtools.inspectedWindow.eval(`inspect(${valueToInspect})`);
  }
}
