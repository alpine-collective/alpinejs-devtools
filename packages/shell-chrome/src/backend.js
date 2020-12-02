import { getComponentName, serializeHTMLElement, set, waitForAlpine } from './utils'

window.addEventListener('message', handshake)
window.__alpineDevtool = {}

function startAlpineBackend() {
    getAlpineVersion()
    discoverComponents()

    document.querySelectorAll('[x-data]').forEach((el) => observeNode(el))
}

function handshake(e) {
    if (e.data.source === 'alpine-devtools-proxy' && e.data.payload === 'init') {
        window.removeEventListener('message', handshake)
        window.addEventListener('message', handleMessages)

        waitForAlpine(() => startAlpineBackend())
    }
}

function handleMessages(e) {
    if (e.data.source === 'alpine-devtools-proxy') {
        if (e.data.payload === 'shutdown') {
            window.removeEventListener('message', handleMessages)
            window.addEventListener('message', handshake)

            cleanupWindowHoverElement()
            disconnectObserver()
            return
        }
        window.__alpineDevtool.stopMutationObserver = true

        if (e.data.payload.action == 'hover') {
            Alpine.discoverComponents((component) => {
                if (component.__alpineDevtool && component.__alpineDevtool.id == e.data.payload.componentId) {
                    cleanupWindowHoverElement()

                    let hoverElement = document.createElement('div')
                    let bounds = component.__x.$el.getBoundingClientRect()

                    Object.assign(hoverElement.style, {
                        position: 'absolute',
                        top: bounds.top + 'px',
                        left: bounds.left + 'px',
                        width: bounds.width + 'px',
                        height: bounds.height + 'px',
                        backgroundColor: 'rgba(104, 182, 255, 0.35)',
                        borderRadius: '4px',
                        zIndex: 9999,
                    })
                    hoverElement.dataset.testid = 'hover-element'

                    window.__alpineDevtool.hoverElement = hoverElement
                    document.body.appendChild(window.__alpineDevtool.hoverElement)
                }
                setTimeout(() => {
                    window.__alpineDevtool.stopMutationObserver = false
                }, 10)
            })
        }

        if (e.data.payload.action == 'hoverLeft') {
            window.__alpineDevtool.stopMutationObserver = true

            Alpine.discoverComponents((component) => {
                if (component.__alpineDevtool && component.__alpineDevtool.id === e.data.payload.componentId) {
                    cleanupWindowHoverElement()
                }
            })
            setTimeout(() => {
                window.__alpineDevtool.stopMutationObserver = false
            }, 10)
        }

        if (e.data.payload.action == 'editAttribute') {
            Alpine.discoverComponents((component) => {
                if (component.__alpineDevtool.id == e.data.payload.componentId) {
                    const { attributeSequence, attributeValue } = e.data.payload
                    set(component.__x.$data, attributeSequence, attributeValue)
                }
                setTimeout(() => {
                    window.__alpineDevtool.stopMutationObserver = false
                }, 10)
            })
        }
    }
}

function serializeDataProperty(value) {
    if (value instanceof HTMLElement) {
        return {
            value: serializeHTMLElement(value),
            type: 'HTMLElement',
            __gen: true,
        }
    }
    const typeOfValue = typeof value
    if (typeOfValue === 'function') {
        return {
            value: 'function',
            type: 'function',
            __gen: true,
        }
    }
    if (Array.isArray(value)) {
        return {
            value: value.map((item) => serializeDataProperty(item)),
            type: typeOfValue,
            __gen: true,
        }
    }
    if (typeOfValue === 'object') {
        return {
            value: Object.fromEntries(
                Object.entries(value).map(([propertyName, propertyValue]) => [
                    propertyName,
                    serializeDataProperty(propertyValue),
                ]),
            ),
            type: typeOfValue,
            __gen: true,
        }
    }

    return {
        value: value,
        type: typeOfValue,
        __gen: true,
    }
}

function discoverComponents(isThroughMutation = false) {
    var rootEls = document.querySelectorAll('[x-data]')

    var components = []

    rootEls.forEach((rootEl, index) => {
        Alpine.initializeComponent(rootEl)

        if (!rootEl.__alpineDevtool) {
            rootEl.__alpineDevtool = {}
        }

        if (!isThroughMutation) {
            rootEl.__alpineDevtool.id = Math.floor(Math.random() * 100000 + 1)
        }

        var depth = 0

        if (index != 0) {
            rootEls.forEach((innerElement, innerIndex) => {
                if (index == innerIndex) {
                    return false
                }

                if (innerElement.contains(rootEl)) {
                    depth = depth + 1
                }
            })
        }

        const data = Object.entries(rootEl.__x.getUnobservedData()).reduce((acc, [key, value]) => {
            acc[key] = serializeDataProperty(value)
            return acc
        }, {})

        components.push({
            name: getComponentName(rootEl),
            depth: depth,
            data: data,
            index: index,
            id: rootEl.__alpineDevtool.id,
        })
    })

    window.postMessage(
        {
            source: 'alpine-devtools-backend',
            payload: {
                // stringify to unfurl proxies
                // there's no way to detect proxies but
                // we need to get rid of them
                // this avoids `DataCloneError: The object could not be cloned.`
                // see https://github.com/Te7a-Houdini/alpinejs-devtools/issues/17
                components: JSON.stringify(components),
                type: 'render-components',
                isThroughMutation: isThroughMutation,
            },
        },
        '*',
    )
}

function getAlpineVersion() {
    window.postMessage(
        {
            source: 'alpine-devtools-backend',
            payload: {
                version: window.Alpine.version,
                type: 'set-version',
            },
        },
        '*',
    )
}

observer = null

function observeNode(node) {
    const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
    }

    observer = new MutationObserver((mutations) => {
        if (!window.__alpineDevtool.stopMutationObserver) {
            discoverComponents((isThroughMutation = true))
        }
    })

    observer.observe(node, observerOptions)
}

function disconnectObserver() {
    if (observer) {
        observer.disconnect()
    }
}

function cleanupWindowHoverElement() {
    if (window.__alpineDevtool.hoverElement) {
        window.__alpineDevtool.hoverElement.remove()
    }
}
