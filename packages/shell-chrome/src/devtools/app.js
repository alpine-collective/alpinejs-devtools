/* Extension API-agnostic application setup */
import './styles.css'
import 'alpinejs'
import State from './state'
import { fetchWithTimeout } from '../utils'
import Split from 'split-grid'

export function init() {
    window.__alpineDevtool = {}
    window.alpineState = new State()
    // inject util function(s) for panel.html Alpine app
    window.fetchWithTimeout = fetchWithTimeout

    window.Split = Split
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
