import {
    BACKEND_TO_PANEL_MESSAGES,
    DEVTOOLS_RENDER_ATTR_NAME,
    DEVTOOLS_RENDER_BINDING_ATTR_NAME,
    PANEL_TO_BACKEND_MESSAGES,
} from './constants'
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
            this.selectedComponentId = null

            this._stopMutationObserver = false
            this._lastComponentCrawl = Date.now()
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
                type: BACKEND_TO_PANEL_MESSAGES.ADD_ERROR,
            })
        }

        discoverComponents() {
            const alpineRoots = Array.from(document.querySelectorAll('[x-data]'))

            const allComponentsInitialized = Object.values(alpineRoots).every((e) => e.__alpineDevtool)
            if (allComponentsInitialized) {
                const lastAlpineRender = alpineRoots.reduce((acc, el) => {
                    // we add `:data-devtools-render="Date.now()"` when initialising components
                    const renderTimeStr = el.getAttribute(DEVTOOLS_RENDER_ATTR_NAME)
                    const renderTime = parseInt(renderTimeStr, 10)
                    if (renderTime && renderTime > acc) {
                        return renderTime
                    }
                    return acc
                }, this._lastComponentCrawl)

                const someComponentHasUpdated = lastAlpineRender > this._lastComponentCrawl
                if (someComponentHasUpdated) {
                    this._lastComponentCrawl = Date.now()
                }

                // Exit early if no components have been added, removed and no data has changed
                if (!someComponentHasUpdated && this.components.length === alpineRoots.length) {
                    return false
                }
            }
            this.components = alpineRoots.map((rootEl, index) => {
                if (!rootEl.__x) {
                    // this component probably crashed during init
                    return
                }

                // doesn't look like we need this
                // Alpine.initializeComponent(rootEl)

                if (!rootEl.__alpineDevtool) {
                    // add an attr to trigger the mutation observer and run this function
                    // that will send updated state to devtools
                    rootEl.setAttribute(DEVTOOLS_RENDER_BINDING_ATTR_NAME, 'Date.now()')
                    rootEl.__alpineDevtool = {
                        id: this.uuid++,
                    }
                    window[`$x${rootEl.__alpineDevtool.id - 1}`] = rootEl.__x
                }

                if (rootEl.__alpineDevtool.id === this.selectedComponentId) {
                    this.getComponentData(this.selectedComponentId, rootEl)
                }

                const componentDepth =
                    index === 0
                        ? 0
                        : alpineRoots.reduce((depth, el, innerIndex) => {
                              if (index === innerIndex) {
                                  return depth
                              }

                              if (el.contains(rootEl)) {
                                  depth = depth + 1
                              }
                          }, 0)

                return {
                    name: getComponentName(rootEl),
                    depth: componentDepth,
                    index,
                    id: rootEl.__alpineDevtool.id,
                }
            })

            this._postMessage({
                components: this.components,
                type: 'set-components',
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

        getComponentData(componentId, componentRoot) {
            const data = Object.entries(componentRoot.__x.getUnobservedData()).reduce((acc, [key, value]) => {
                acc[key] = serializeDataProperty(value)

                return acc
            }, {})
            this._postMessage({
                type: BACKEND_TO_PANEL_MESSAGES.SET_DATA,
                componentId,
                data: JSON.stringify(data),
            })
        }

        handleGetComponentData(componentId) {
            this.selectedComponentId = componentId
            this.runWithMutationPaused(() => {
                Alpine.discoverComponents((component) => {
                    if (component.__alpineDevtool.id === componentId) {
                        this.getComponentData(componentId, component)
                    }
                })
            })
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
        if (e.data.source !== ALPINE_DEVTOOLS_PROXY) {
            return
        }
        if (e.data.payload === PANEL_TO_BACKEND_MESSAGES.SHUTDOWN) {
            window.removeEventListener('message', handleMessages)
            window.addEventListener('message', handshake)
            devtoolsBackend.shutdown()
            return
        }
        switch (e.data.payload.action) {
            case PANEL_TO_BACKEND_MESSAGES.SHOW_ERROR_SOURCE: {
                devtoolsBackend.runWithMutationPaused(() => {
                    const errorSource = devtoolsBackend.errorElements.find((el) => {
                        return el.__alpineErrorSourceId === e.data.payload.errorId
                    })

                    devtoolsBackend.addHoverElement(errorSource)
                })
                break
            }
            case PANEL_TO_BACKEND_MESSAGES.HIDE_ERROR_SOURCE: {
                devtoolsBackend.runWithMutationPaused(() => {
                    devtoolsBackend.cleanupHoverElement()
                })
                break
            }
            case PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT: {
                devtoolsBackend.runWithMutationPaused(() => {
                    Alpine.discoverComponents((component) => {
                        if (component.__alpineDevtool && component.__alpineDevtool.id === e.data.payload.componentId) {
                            devtoolsBackend.addHoverElement(component.__x.$el)
                        }
                    })
                })
                break
            }
            case PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER: {
                devtoolsBackend.runWithMutationPaused(() => {
                    Alpine.discoverComponents((component) => {
                        if (component.__alpineDevtool && component.__alpineDevtool.id === e.data.payload.componentId) {
                            devtoolsBackend.cleanupHoverElement()
                        }
                    })
                })
                break
            }
            case PANEL_TO_BACKEND_MESSAGES.EDIT_ATTRIBUTE: {
                devtoolsBackend.runWithMutationPaused(() => {
                    Alpine.discoverComponents((component) => {
                        if (component.__alpineDevtool.id === e.data.payload.componentId) {
                            const { attributeSequence, attributeValue } = e.data.payload
                            set(component.__x.$data, attributeSequence, attributeValue)
                        }
                    })
                })
                break
            }
            case PANEL_TO_BACKEND_MESSAGES.GET_DATA: {
                devtoolsBackend.handleGetComponentData(e.data.payload.componentId)
                break
            }
        }
    }
}

init()
