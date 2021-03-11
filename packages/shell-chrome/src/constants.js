export const DEVTOOLS_RENDER_ATTR_NAME = 'data-devtools-render'
export const DEVTOOLS_RENDER_BINDING_ATTR_NAME = `:${DEVTOOLS_RENDER_ATTR_NAME}`
export const ADDED_ATTRIBUTES = [DEVTOOLS_RENDER_ATTR_NAME, DEVTOOLS_RENDER_BINDING_ATTR_NAME]

export const BACKEND_TO_PANEL_MESSAGES = {
    SET_VERSION: 'set-version',
    SET_COMPONENTS: 'set-components',
    SET_DATA: 'set-data',
    ADD_ERROR: 'add-error',
}

export const PANEL_TO_BACKEND_MESSAGES = {
    // shutdown is triggered from proxy.js
    SHUTDOWN: 'shutdown',
    // all other messages are triggered from devtools/state.js
    GET_DATA: 'get-data',
    SHOW_ERROR_SOURCE: 'show-error-source',
    HIDE_ERROR_SOURCE: 'hide-error-source',
    HOVER_COMPONENT: 'hover',
    HIDE_HOVER: 'hide-hover',
    EDIT_ATTRIBUTE: 'edit-attribute',
}
