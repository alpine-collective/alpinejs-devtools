// not used yet but adding in here to make
// fixing bugs in future easier
export const isChrome = typeof chrome !== 'undefined' && !!chrome.devtools
export const isFirefox = isBrowser && navigator.userAgent.indexOf('Firefox') > -1