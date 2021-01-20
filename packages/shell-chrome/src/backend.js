import { getComponentName, isSerializable, serializeHTMLElement, set, waitForAlpine } from './utils'

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

function init() {
    class AlpineDevtoolsBackend {
        constructor() {
            this.components = []
            this.uuid = 1
            this.hoverElement = null
            this.observer = null
            this._stopMutationObserver = false
        }

        runWithMutationPaused(cb) {
            this._stopMutationObserver = true
            cb()
            setTimeout(() => {
                this._stopMutationObserver = false
            }, 10)
        }

        start() {
            this.getAlpineVersion()
            this.discoverComponents()

            // Watch on the body for injected components. This is lightweight
            // as work is only done if there are components added/removed
            this.observeNode(document.querySelector('body'))
        }

        shutdown() {
            this.cleanupHoverElement()
            this.disconnectObserver()
        }

        discoverComponents() {
            const rootEls = document.querySelectorAll('[x-data]')
            // Exit early if no components have been added or removed
            const allComponentsInitialized = Object.values(rootEls).every((e) => e.__alpineDevtool)
            if (this.components.length === rootEls.length && allComponentsInitialized) {
                return false
            }

            this.components = []

            rootEls.forEach((rootEl, index) => {
                Alpine.initializeComponent(rootEl)

                if (!rootEl.__alpineDevtool) {
                    rootEl.__alpineDevtool = {}
                }

                if (!rootEl.__alpineDevtool.id) {
                    rootEl.__alpineDevtool.id = this.uuid++
                    window[`$x${rootEl.__alpineDevtool.id - 1}`] = rootEl.__x
                }

                let depth = 0

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

                this.components.push({
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
                        components: JSON.stringify(this.components),
                        type: 'render-components',
                    },
                },
                '*',
            )
        }

        getAlpineVersion() {
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

        observeNode(node) {
            const observerOptions = {
                childList: true,
                attributes: true,
                subtree: true,
            }

            this.observer = new MutationObserver((_mutations) => {
                if (!this._stopMutationObserver) {
                    this.discoverComponents()
                }
            })

            this.observer.observe(node, observerOptions)
        }

        disconnectObserver() {
            if (this.observer) {
                this.observer.disconnect()
                this.observer = null
            }
        }

        addHoverElement(target) {
            this.cleanupHoverElement()

            let hoverElement = document.createElement('div')
            let bounds = target.getBoundingClientRect()

            Object.assign(hoverElement.style, {
                position: 'absolute',
                top: `${bounds.top}px`,
                left: `${bounds.left}px`,
                width: `${bounds.width}px`,
                height: `${bounds.height}px`,
                backgroundColor: 'rgba(104, 182, 255, 0.35)',
                borderRadius: '4px',
                zIndex: 9999,
            })
            hoverElement.dataset.testid = 'hover-element'

            this.hoverElement = hoverElement
            document.body.appendChild(this.hoverElement)
        }

        cleanupHoverElement() {
            if (this.hoverElement) {
                this.hoverElement.remove()
                this.hoverElement = null
            }
        }
    }
    // using a function scope to avoid running into issues on re-injection
    const devtoolsBackend = new AlpineDevtoolsBackend()
    window.addEventListener('message', handshake)

    const ALPINE_DEVTOOLS_PROXY = 'alpine-devtools-proxy'

    function handshake(e) {
        if (e.data.source === ALPINE_DEVTOOLS_PROXY && e.data.payload === 'init') {
            window.removeEventListener('message', handshake)
            window.addEventListener('message', handleMessages)

            waitForAlpine(() => {
                devtoolsBackend.start()
            })
        }
    }

    function handleMessages(e) {
        if (e.data.source === ALPINE_DEVTOOLS_PROXY) {
            if (e.data.payload === 'shutdown') {
                window.removeEventListener('message', handleMessages)
                window.addEventListener('message', handshake)
                devtoolsBackend.shutdown()
                return
            }

            if (e.data.payload.action === 'hover') {
                devtoolsBackend.runWithMutationPaused(() => {
                    Alpine.discoverComponents((component) => {
                        if (component.__alpineDevtool && component.__alpineDevtool.id === e.data.payload.componentId) {
                            devtoolsBackend.addHoverElement(component.__x.$el)
                        }
                    })
                })
            }

            if (e.data.payload.action === 'hoverLeft') {
                devtoolsBackend.runWithMutationPaused(() => {
                    Alpine.discoverComponents((component) => {
                        if (component.__alpineDevtool && component.__alpineDevtool.id === e.data.payload.componentId) {
                            devtoolsBackend.cleanupHoverElement()
                        }
                    })
                })
            }

            if (e.data.payload.action === 'editAttribute') {
                devtoolsBackend.runWithMutationPaused(() => {
                    Alpine.discoverComponents((component) => {
                        if (component.__alpineDevtool.id === e.data.payload.componentId) {
                            const { attributeSequence, attributeValue } = e.data.payload
                            set(component.__x.$data, attributeSequence, attributeValue)
                        }
                    })
                })
            }
        }
    }
}

init()
