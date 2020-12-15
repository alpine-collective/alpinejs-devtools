import { getComponentName, isSerializable, serializeHTMLElement, set, waitForAlpine } from './utils'

window.__alpineDevtool = {
    components: [],
    uuid: 1,
    stopMutationObserver: false,
    hoverElement: null,
    observer: null,
}
window.addEventListener('message', handshake)

function startAlpineBackend() {
    getAlpineVersion()
    discoverComponents()

    // Watch on the body for injected components. This is lightweight
    // as work is only done if there are components added/removed
    observeNode(document.querySelector('body'))
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
                if (component.__alpineDevtool && component.__alpineDevtool.id === e.data.payload.componentId) {
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

        if (e.data.payload.action === 'hoverLeft') {
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

        if (e.data.payload.action === 'editAttribute') {
            Alpine.discoverComponents((component) => {
                if (component.__alpineDevtool.id === e.data.payload.componentId) {
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
            value: serializeHTMLElement(value, { include: ['children', 'attributes'] }),
            type: 'HTMLElement',
        }
    }
    const typeOfValue = typeof value
    if (typeOfValue === 'function') {
        return {
            // value field is unused for `function` type
            type: 'function',
        }
    }
    if (!isSerializable(value)) {
        return {
            // value field is unused for `Unserializable` type
            type: 'Unserializable',
        }
    }
    return {
        value,
        type: typeOfValue,
    }
}

function discoverComponents() {
    const rootEls = document.querySelectorAll('[x-data]')
    // Exit early if no components have been added or removed
    const allComponentsInitialized = Object.values(rootEls).every((e) => e.__alpineDevtool)
    if (window.__alpineDevtool.components.length === rootEls.length && allComponentsInitialized) {
        return false
    }

    window.__alpineDevtool.components = []

    rootEls.forEach((rootEl, index) => {
        Alpine.initializeComponent(rootEl)

        if (!rootEl.__alpineDevtool) {
            rootEl.__alpineDevtool = {}
        }

        if (!rootEl.__alpineDevtool.id) {
            rootEl.__alpineDevtool.id = window.__alpineDevtool.uuid++
            window[`$x${rootEl.__alpineDevtool.id}`] = rootEl.__x
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

        window.__alpineDevtool.components.push({
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
                components: JSON.stringify(window.__alpineDevtool.components),
                type: 'render-components',
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

function observeNode(node) {
    const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
    }

    window.__alpineDevtool.observer = new MutationObserver((mutations) => {
        if (!window.__alpineDevtool.stopMutationObserver) {
            discoverComponents()
        }
    })

    window.__alpineDevtool.observer.observe(node, observerOptions)
}

function disconnectObserver() {
    if (window.__alpineDevtool.observer) {
        window.__alpineDevtool.observer.disconnect()
        window.__alpineDevtool.observer = null
    }
}

function cleanupWindowHoverElement() {
    if (window.__alpineDevtool.hoverElement) {
        window.__alpineDevtool.hoverElement.remove()
        window.__alpineDevtool.hoverElement = null
    }
}
