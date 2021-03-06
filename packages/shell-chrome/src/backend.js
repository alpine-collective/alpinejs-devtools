import { getComponentName, isSerializable, serializeHTMLElement, set, waitForAlpine, isRequiredVersion } from './utils'

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
            this.errorElements = []
            this.errorSourceId = 1

            this._stopMutationObserver = false
        }

        runWithMutationPaused(cb) {
            const alpineObserverPausedValue = window.Alpine.pauseMutationObserver
            window.Alpine.pauseMutationObserver = true
            this._stopMutationObserver = true
            cb()
            setTimeout(() => {
                if (window.Alpine.pauseMutationObserver) {
                    window.Alpine.pauseMutationObserver = alpineObserverPausedValue
                }
                this._stopMutationObserver = false
            }, 10)
        }

        start() {
            this.initAlpineErrorCollection()
            this.getAlpineVersion()
            this.discoverComponents()

            // Watch on the body for injected components. This is lightweight
            // as work is only done if there are components added/removed
            this.observeNode(document.querySelector('body'))
        }

        shutdown() {
            this.cleanupHoverElement()
            this.disconnectObserver()

            window.console.warn = this._realLogWarn
        }

        initAlpineErrorCollection() {
            if (!isRequiredVersion('2.8.0', window.Alpine.version) || !window.Alpine.version) {
                return
            }
            if (isRequiredVersion('2.8.1', window.Alpine.version)) {
                window.addEventListener('error', (errorEvent) => {
                    if (errorEvent.error && errorEvent.error.el && errorEvent.error.expression) {
                        const { el, expression } = errorEvent.error
                        this._handleAlpineError(el, expression, errorEvent.error.toString())
                    }
                })
                window.addEventListener('unhandledrejection', (rejectionEvent) => {
                    if (rejectionEvent.reason && rejectionEvent.reason.el && rejectionEvent.reason.expression) {
                        const { el, expression } = rejectionEvent.reason
                        this._handleAlpineError(el, expression, rejectionEvent.reason.toString())
                    }
                })
                return
            }

            this._realLogWarn = console.warn

            const instrumentedWarn = (...args) => {
                const argsString = args.join(' ')
                if (argsString.includes('Alpine Error:')) {
                    const [errorMessage] = argsString.match(/(?<=Alpine Error: ").*(?=")/)
                    const [expression] = argsString.match(/(?<=Expression: ").*(?=")/)
                    const element = args.find((el) => el instanceof HTMLElement)
                    this._handleAlpineError(element, expression, errorMessage)
                }
                this._realLogWarn(...args)
            }

            window.console.warn = instrumentedWarn
        }

        _handleAlpineError(element, expression, errorMessage) {
            if (!element.__alpineErrorSourceId) {
                element.__alpineErrorSourceId = this.errorSourceId++
            }
            this.errorElements.push(element)

            const alpineError = {
                type: 'eval',
                message: errorMessage,
                expression,
                source: serializeHTMLElement(element),
                errorId: element.__alpineErrorSourceId,
            }
            this._postMessage({
                error: alpineError,
                type: 'render-error',
            })
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
                if (!rootEl.__x) {
                    // this component probably crashed during init
                    return
                }

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

            this._postMessage({
                // stringify to unfurl proxies
                // there's no way to detect proxies but
                // we need to get rid of them
                // this avoids `DataCloneError: The object could not be cloned.`
                // see https://github.com/Te7a-Houdini/alpinejs-devtools/issues/17
                components: JSON.stringify(this.components),
                type: 'render-components',
            })
        }

        getAlpineVersion() {
            this._postMessage({
                version: window.Alpine.version,
                type: 'set-version',
            })
        }

        _postMessage(payload) {
            window.postMessage(
                {
                    source: 'alpine-devtools-backend',
                    payload,
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

            if (e.data.payload.action === 'show-error-source') {
                devtoolsBackend.runWithMutationPaused(() => {
                    const errorSource = devtoolsBackend.errorElements.find((el) => {
                        return el.__alpineErrorSourceId === e.data.payload.errorId
                    })

                    devtoolsBackend.addHoverElement(errorSource)
                })
            }
            if (e.data.payload.action === 'hide-error-source') {
                devtoolsBackend.runWithMutationPaused(() => {
                    devtoolsBackend.cleanupHoverElement()
                })
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
