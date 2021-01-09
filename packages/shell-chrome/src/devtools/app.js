/* Extension API-agnostic application setup */
import State from './state'
import devtools from './devtools'

export function init() {
    window.__alpineDevtool = {}
    window.alpineState = new State()
    window.devtools = devtools
}

export function handleMessage(message, port) {
    /** @type {{alpineState: State}} */
    const { alpineState } = window
    if (message.type === 'render-components') {
        // message.components is a serialised JSON string
        alpineState.renderComponentsFromBackend(JSON.parse(message.components))

        window.__alpineDevtool.port = port
    }

    if (message.type === 'set-version') {
        alpineState.setAlpineVersionFromBackend(message.version)

        window.__alpineDevtool.port = port
    }

    if (message.type === 'render-error') {
        alpineState.renderError(message.error)

        window.__alpineDevtool.port = port
    }
}
