export const DEVTOOLS_RENDER_ATTR_NAME = 'data-devtools-render';
export const DEVTOOLS_RENDER_BINDING_ATTR_NAME = `:${DEVTOOLS_RENDER_ATTR_NAME}`;
export const ADDED_ATTRIBUTES = [DEVTOOLS_RENDER_ATTR_NAME, DEVTOOLS_RENDER_BINDING_ATTR_NAME];

export const DEVTOOLS_ERROR_ELS_GLOBAL = '__devtools_error_els';
export const DEVTOOLS_INITIAL_STATE_GLOBAL = '__devtools_initial_state';

export const INIT_MESSAGE = 'init';

export const BACKEND_TO_PANEL_MESSAGES = {
  SET_VERSION: 'set-version',
  SET_COMPONENTS_AND_STORES: 'set-components-and-stores',
  SET_DATA: 'set-data',
  SET_STORE_DATA: 'set-store-data',
  ADD_ERROR: 'add-error',
} as const;

export const PANEL_TO_BACKEND_MESSAGES = {
  // shutdown is triggered from proxy.js
  SHUTDOWN: 'shutdown',
  // all other messages are triggered from devtools/state.js
  GET_DATA: 'get-data',
  GET_STORE_DATA: 'get-store-data',
  SHOW_ERROR_SOURCE: 'show-error-source',
  HIDE_ERROR_SOURCE: 'hide-error-source',
  HOVER_COMPONENT: 'hover',
  HIDE_HOVER: 'hide-hover',
  EDIT_ATTRIBUTE: 'edit-attribute',
  EDIT_STORE_ATTRIBUTE: 'edit-store-attribute',
} as const;

export const CONTENT_TO_BACKGROUND_MESSAGES = {
  ALPINE_DETECTED: 'ALPINE_DETECTED',
} as const;
