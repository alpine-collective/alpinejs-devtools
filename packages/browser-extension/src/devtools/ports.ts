export const CONTENT = 'CONTENT';
export const PROXY = 'proxy';

// Called 'inspected' because of the Chrome API, but this is the "devtools panel"
export const INSPECTOR_PREFIX = 'INSPECTOR_';
export function isInspector(port: chrome.runtime.Port) {
  return port.name.startsWith(INSPECTOR_PREFIX);
}

export function inspectorPortName(tabId: number): string {
  return INSPECTOR_PREFIX + tabId;
}

export function inspectorPortNameToTabId(portName: string): number {
  return Number(portName.replace(INSPECTOR_PREFIX, ''));
}

export const ALPINE_DEVTOOLS_PROXY_SOURCE = 'alpine-devtools-proxy';
// Triggered by Panel
export const ALPINE_DEVTOOLS_PANEL_SOURCE = 'alpine-devtools-panel';
export const ALPINE_DEVTOOLS_BACKEND_SOURCE = 'alpine-devtools-backend';
