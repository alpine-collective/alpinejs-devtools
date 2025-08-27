export function inspectUserGlobal(valueToInspect: string) {
  if (typeof chrome !== 'undefined') {
    chrome.devtools.inspectedWindow.eval(`inspect(${valueToInspect})`);
  }
}
export function scrollElGlobalIntoView(valueToInspect: string) {
  if (typeof chrome !== 'undefined') {
    chrome.devtools.inspectedWindow.eval(`${valueToInspect}.scrollIntoView({ block: 'center' })`);
  }
}
