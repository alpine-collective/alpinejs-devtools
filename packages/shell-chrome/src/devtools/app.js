/* Extension API-agnostic application setup */
import State from './state'
import devtools from './devtools'

export function init() {
    window.__alpineDevtool = {}
    window.alpineState = new State()
    window.devtools = devtools
}

export function handleMessage(message, port) {
    if (message.type === 'render-components') {
        // message.components is a serialised JSON string
        window.alpineState.renderComponentsFromBackend(JSON.parse(message.components))

        window.__alpineDevtool.port = port
    }

    if (message.type === 'set-version') {
        window.alpineState.setAlpineVersionFromBackend(message.version)

        window.__alpineDevtool.port = port
    }
}
