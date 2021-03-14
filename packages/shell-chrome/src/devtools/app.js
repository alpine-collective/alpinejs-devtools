/* Extension API-agnostic application setup */
import State from './state'
import devtools from './devtools'
import { BACKEND_TO_PANEL_MESSAGES } from '../constants'

export function init() {
    window.__alpineDevtool = {}
    window.alpineState = new State()
    window.devtools = devtools
}

function setPort(port) {
    window.__alpineDevtool.port = port
}

export function handleMessage(message, port) {
    /** @type {{alpineState: State}} */
    const { alpineState } = window

    if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_COMPONENTS) {
        alpineState.setComponentsList(message.components, message.url)
        setPort(port)
    }

    if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_DATA) {
        alpineState.setComponentData(message.componentId, JSON.parse(message.data))
        setPort(port)
    }

    if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_VERSION) {
        alpineState.setAlpineVersionFromBackend(message.version)
        setPort(port)
    }

    if (message.type === BACKEND_TO_PANEL_MESSAGES.ADD_ERROR) {
        alpineState.renderError(message.error)
        setPort(port)
    }
}
