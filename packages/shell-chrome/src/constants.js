export const DEVTOOLS_RENDER_ATTR_NAME = 'data-devtools-render'
export const DEVTOOLS_RENDER_BINDING_ATTR_NAME = `:${DEVTOOLS_RENDER_ATTR_NAME}`
export const ADDED_ATTRIBUTES = [DEVTOOLS_RENDER_ATTR_NAME, DEVTOOLS_RENDER_BINDING_ATTR_NAME]

export const BACKEND_TO_PANEL_MESSAGES = {
    SET_COMPONENTS: 'set-components',
    SET_DATA: 'set-data',
}

export const PANEL_TO_BACKEND_MESSAGES = {
    GET_DATA: 'get-data',
}
