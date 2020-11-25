// Lifted from vue-devtools/packages/shared-utils/src/env.js
export const isBrowser = typeof navigator !== 'undefined'
export const isChrome = typeof chrome !== 'undefined' && !!chrome.devtools
export const isFirefox = isBrowser && navigator.userAgent.indexOf('Firefox') > -1
