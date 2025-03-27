import { ALPINE_DEVTOOLS_PROXY_SOURCE } from '../devtools/ports';
import {
  BACKEND_TO_PANEL_MESSAGES,
  DEVTOOLS_RENDER_ATTR_NAME,
  DEVTOOLS_RENDER_BINDING_ATTR_NAME,
  PANEL_TO_BACKEND_MESSAGES,
} from '../lib/constants';
import {
  getComponentName,
  isSerializable,
  serializeHTMLElement,
  set,
  waitForAlpine,
  isRequiredVersion,
} from '../lib/utils';

function serializeDataProperty(value) {
  if (value instanceof HTMLElement) {
    return {
      value: serializeHTMLElement(value, { include: ['children', 'attributes'] }),
      type: 'HTMLElement',
    };
  }
  const typeOfValue = typeof value;
  if (typeOfValue === 'function') {
    return {
      // value field is unused for `function` type
      type: 'function',
    };
  }
  if (!isSerializable(value)) {
    return {
      // value field is unused for `Unserializable` type
      type: 'Unserializable',
    };
  }
  return {
    value,
    type: typeOfValue,
  };
}

export function init(forceStart = false) {
  class AlpineDevtoolsBackend {
    constructor() {
      this.components = [];
      this.stores = [];
      this.uuid = 1;
      this.hoverElement = null;
      this.observer = null;
      this.errorElements = [];
      this.errorSourceId = 1;
      this.selectedComponentId = null;
      this.selectedStoreName = null;

      this._stopMutationObserver = false;
      this._lastComponentCrawl = Date.now();
    }

    get alpineVersion() {
      return window?.Alpine?.version || '';
    }

    get isV3() {
      return isRequiredVersion('3.0.0', this.alpineVersion);
    }

    /**
     * Can we use `Alpine.$data($rootEl)`?
     * Introduced in 3.8.0
     */
    get hasAlpineDataFn() {
      return isRequiredVersion('3.8.0', this.alpineVersion);
    }

    runWithMutationPaused(cb) {
      const alpineObserverPausedValue = window.Alpine.pauseMutationObserver;
      window.Alpine.pauseMutationObserver = true;
      this._stopMutationObserver = true;
      cb();
      setTimeout(() => {
        if (window.Alpine.pauseMutationObserver) {
          window.Alpine.pauseMutationObserver = alpineObserverPausedValue;
        }
        this._stopMutationObserver = false;
      }, 10);
    }

    getAlpineDataInstance(node) {
      if (this.isV3) {
        return node._x_dataStack?.[0];
      }
      return node.__x;
    }

    getReadOnlyAlpineData(node) {
      const alpineDataInstance = this.getAlpineDataInstance(node);
      if (!alpineDataInstance) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('element has no dataStack', node);
        }
        return;
      }
      if (this.isV3) {
        // in v3 magics are registered on the data stack
        return Object.fromEntries(Object.entries(alpineDataInstance).filter(([key]) => !key.startsWith('$')));
      } else {
        return alpineDataInstance?.getUnobservedData();
      }
    }

    getWriteableAlpineData(node) {
      const alpineDataInstance = this.getAlpineDataInstance(node);
      return this.isV3 ? alpineDataInstance : alpineDataInstance.$data;
    }

    start() {
      this.initAlpineErrorCollection();
      this.getAlpineVersion();
      this.watchComponents();
      // Watch on the body for injected components. This is lightweight
      // as work is only done if there are components added/removed
      this.observeNode(document.querySelector('body'));
    }

    shutdown() {
      this.cleanupHoverElement();
      this.disconnectObserver();

      window.console.warn = this._realLogWarn;
    }

    initAlpineErrorCollection() {
      if (!isRequiredVersion('2.8.0', this.alpineVersion) || !this.alpineVersion) {
        return;
      }
      if (isRequiredVersion('2.8.1', this.alpineVersion)) {
        window.addEventListener('error', (errorEvent) => {
          if (errorEvent.error && errorEvent.error.el && errorEvent.error.expression) {
            const { el, expression } = errorEvent.error;
            this._handleAlpineError(el, expression, errorEvent.error.toString());
          }
        });
        window.addEventListener('unhandledrejection', (rejectionEvent) => {
          if (rejectionEvent.reason && rejectionEvent.reason.el && rejectionEvent.reason.expression) {
            const { el, expression } = rejectionEvent.reason;
            this._handleAlpineError(el, expression, rejectionEvent.reason.toString());
          }
        });
        return;
      }

      this._realLogWarn = console.warn;

      const instrumentedWarn = (...args) => {
        const argsString = args.join(' ');
        if (argsString.includes('Alpine Error:')) {
          const [errorMessage] = argsString.match(/(?<=Alpine Error: ").*(?=")/);
          const [expression] = argsString.match(/(?<=Expression: ").*(?=")/);
          const element = args.find((el) => el instanceof HTMLElement);
          this._handleAlpineError(element, expression, errorMessage);
        }
        this._realLogWarn(...args);
      };

      window.console.warn = instrumentedWarn;
    }

    _handleAlpineError(element, expression, errorMessage) {
      if (!element.__alpineErrorSourceId) {
        element.__alpineErrorSourceId = this.errorSourceId++;
      }
      this.errorElements.push(element);

      const alpineError = {
        type: 'eval',
        message: errorMessage,
        expression,
        source: serializeHTMLElement(element),
        errorId: element.__alpineErrorSourceId,
      };
      this._postMessage({
        error: alpineError,
        type: BACKEND_TO_PANEL_MESSAGES.ADD_ERROR,
      });
    }

    watchComponents() {
      const alpineRoots = Array.from(document.querySelectorAll('[x-data]'));

      const allComponentsInitialized = Object.values(alpineRoots).every((e) => e.__alpineDevtool);
      if (allComponentsInitialized) {
        const lastAlpineRender = alpineRoots.reduce((acc, el) => {
          // we add `:data-devtools-render="Date.now()"` when initialising components
          const renderTimeStr = el.getAttribute(DEVTOOLS_RENDER_ATTR_NAME);
          const renderTime = parseInt(renderTimeStr, 10);
          if (renderTime && renderTime > acc) {
            return renderTime;
          }
          return acc;
        }, this._lastComponentCrawl);

        const someComponentHasUpdated = lastAlpineRender > this._lastComponentCrawl;
        if (someComponentHasUpdated) {
          this._lastComponentCrawl = Date.now();
        }

        // Exit early if no components have been added, removed and no data has changed
        if (!someComponentHasUpdated && this.components.length === alpineRoots.length) {
          return false;
        }
      }

      this.components = [];

      alpineRoots.forEach((rootEl, index) => {
        if (!this.getAlpineDataInstance(rootEl)) {
          // this component probably crashed during init
          return;
        }

        if (!rootEl.__alpineDevtool) {
          if (!this.isV3) {
            // only necessary for Alpine v2
            // add an attr to trigger the mutation observer and run this function
            // that will send updated state to devtools
            rootEl.setAttribute(DEVTOOLS_RENDER_BINDING_ATTR_NAME, 'Date.now()');
          }
          rootEl.__alpineDevtool = {
            id: this.uuid++,
          };
          window[`$x${rootEl.__alpineDevtool.id - 1}`] = this.getAlpineDataInstance(rootEl);
        }

        // fix eqeqeq
        if (rootEl.__alpineDevtool.id == this.selectedComponentId) {
          this.sendComponentData(this.selectedComponentId, rootEl);
        }

        if (this.isV3) {
          const componentData = this.getAlpineDataInstance(rootEl);
          Alpine.effect(() => {
            Object.keys(componentData).forEach((key) => {
              // since effects track which dependencies are accessed,
              // run a fake component data access so that the effect runs
              void componentData[key];
              // TODO: fix the fact we have one string, one number eqeqeq
              if (rootEl.__alpineDevtool.id == this.selectedComponentId) {
                // this re-computes the whole component data
                // with effect we could send only the key-value of the field that's changed
                this.sendComponentData(this.selectedComponentId, rootEl);
              }
            });
          });
        }

        const componentDepth =
          index === 0
            ? 0
            : alpineRoots.reduce((depth, el, innerIndex) => {
                if (index === innerIndex) {
                  return depth;
                }

                if (el.contains(rootEl)) {
                  return depth + 1;
                }

                return depth;
              }, 0);

        this.components.push({
          name: getComponentName(rootEl),
          depth: componentDepth,
          index,
          id: rootEl.__alpineDevtool.id,
        });
      });

      this.stores = Object.keys(this.alpineStoreMagic);

      this.stores.forEach((storeName, i) => {
        window[`$s${i}`] = this.alpineStoreMagic[storeName];
      });

      if (this.hasAlpineDataFn) {
        Alpine.effect(() => {
          Object.keys(this.alpineStoreMagic).forEach((storeName) => {
            if (storeName === this.selectedStoreName) {
              this.sendStoreData(this.selectedStoreName || storeName, this.alpineStoreMagic);
            }
          });
        });
      }

      this._postMessage({
        components: this.components,
        stores: this.stores,
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_COMPONENT_AND_STORES,
      });
    }

    get alpineStoreMagic() {
      if (this.hasAlpineDataFn) {
        return Alpine.$data(document.querySelector('[x-data]')).$store;
      }
      return {};
    }

    getAlpineVersion() {
      this._postMessage({
        version: this.alpineVersion,
        type: BACKEND_TO_PANEL_MESSAGES.SET_VERSION,
      });
    }

    _postMessage(payload) {
      window.postMessage(
        {
          source: 'alpine-devtools-backend',
          payload,
        },
        '*',
      );
    }

    sendComponentData(componentId, componentRoot) {
      const componentData = this.getReadOnlyAlpineData(componentRoot);

      if (!componentData) return;

      const data = Object.entries(componentData).reduce((acc, [key, value]) => {
        acc[key] = serializeDataProperty(value);

        return acc;
      }, {});

      this._postMessage({
        type: BACKEND_TO_PANEL_MESSAGES.SET_DATA,
        componentId,
        data: JSON.stringify(data),
      });
    }

    sendStoreData(selectedStoreName, $store) {
      const store = $store[selectedStoreName];
      const storeData =
        typeof store === 'object'
          ? Object.entries(store).reduce((acc, [key, value]) => {
              acc[key] = serializeDataProperty(value);

              return acc;
            }, {})
          : { __root_value: serializeDataProperty(store) };
      this._postMessage({
        type: BACKEND_TO_PANEL_MESSAGES.SET_STORE_DATA,
        storeName: selectedStoreName,
        storeData: JSON.stringify(storeData),
      });
    }

    handleGetComponentData(componentId) {
      // fix eqeqeq
      if (this.selectedComponentId == componentId) {
        // component already loaded
        // any changes to the component's data will be picked up by the mutation observer
        return;
      }
      this.selectedComponentId = componentId;
      this.runWithMutationPaused(() => {
        this.discoverComponents((component) => {
          // fix eqeqeq
          if (component.__alpineDevtool.id == componentId) {
            this.sendComponentData(componentId, component);
          }
        });
      });
    }

    handleGetStoreData(storeName) {
      if (this.selectedStoreName === storeName) {
        // store data already loaded
        // any changes to the store's data will be picked up by the mutation observer
        return;
      }
      this.selectedStoreName = storeName;
      if (this.hasAlpineDataFn) {
        this.sendStoreData(storeName, this.alpineStoreMagic);
      }
    }

    discoverComponents(cb) {
      if (this.isV3) {
        document.querySelectorAll('[x-data]').forEach(cb);
      } else {
        Alpine.discoverComponents(cb);
      }
    }

    handleSetComponentData(componentId, attributeSequence, attributeValue) {
      devtoolsBackend.runWithMutationPaused(() => {
        this.discoverComponents((component) => {
          // fix eqeqeq
          if (component.__alpineDevtool.id == componentId) {
            set(this.getWriteableAlpineData(component), attributeSequence, attributeValue);
          }
        });
      });
    }
    handleSetStoreData(storeName, attributeSequence, attributeValue) {
      if (this.hasAlpineDataFn) {
        if (typeof this.alpineStoreMagic[storeName] === 'object') {
          set(this.alpineStoreMagic[storeName], attributeSequence, attributeValue);
        } else {
          this.alpineStoreMagic[storeName] = attributeValue;
        }
      }
    }

    observeNode(node) {
      const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
      };

      this.observer = new MutationObserver((_mutations) => {
        if (!this._stopMutationObserver) {
          this.watchComponents();
        }
      });

      this.observer.observe(node, observerOptions);
    }

    disconnectObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }

    addHoverElement(target) {
      this.cleanupHoverElement();

      let hoverElement = document.createElement('div');
      let bounds = target.getBoundingClientRect();

      Object.assign(hoverElement.style, {
        position: 'absolute',
        top: `${bounds.top}px`,
        left: `${bounds.left}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        backgroundColor: 'rgba(104, 182, 255, 0.35)',
        borderRadius: '4px',
        zIndex: 9999,
      });
      hoverElement.dataset.testid = 'hover-element';

      this.hoverElement = hoverElement;
      document.body.appendChild(this.hoverElement);
    }

    cleanupHoverElement() {
      if (this.hoverElement) {
        this.hoverElement.remove();
        this.hoverElement = null;
      }
    }
  }
  // using a function scope to avoid running into issues on re-injection
  const devtoolsBackend = new AlpineDevtoolsBackend();
  if (forceStart) {
    waitForAlpine(() => {
      devtoolsBackend.start();
    });
  }
  window.addEventListener('message', handshake);

  function handshake(e) {
    if (e.data.source === ALPINE_DEVTOOLS_PROXY_SOURCE && e.data.payload === 'init') {
      window.removeEventListener('message', handshake);
      window.addEventListener('message', handleMessages);

      waitForAlpine(() => {
        devtoolsBackend.start();
      });
    }
  }

  function handleMessages(e) {
    if (e.data.source !== ALPINE_DEVTOOLS_PROXY_SOURCE) {
      return;
    }
    if (e.data.payload === PANEL_TO_BACKEND_MESSAGES.SHUTDOWN) {
      window.removeEventListener('message', handleMessages);
      window.addEventListener('message', handshake);
      devtoolsBackend.shutdown();
      return;
    }
    switch (e.data.payload.action) {
      case PANEL_TO_BACKEND_MESSAGES.SHOW_ERROR_SOURCE: {
        devtoolsBackend.runWithMutationPaused(() => {
          const errorSource = devtoolsBackend.errorElements.find((el) => {
            return el.__alpineErrorSourceId === e.data.payload.errorId;
          });

          devtoolsBackend.addHoverElement(errorSource);
        });
        break;
      }
      case PANEL_TO_BACKEND_MESSAGES.HIDE_ERROR_SOURCE: {
        devtoolsBackend.runWithMutationPaused(() => {
          devtoolsBackend.cleanupHoverElement();
        });
        break;
      }
      case PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT: {
        devtoolsBackend.runWithMutationPaused(() => {
          devtoolsBackend.discoverComponents((component) => {
            // fix number vs string eqeqeq
            if (component.__alpineDevtool && component.__alpineDevtool.id == e.data.payload.componentId) {
              devtoolsBackend.addHoverElement(component);
            }
          });
        });
        break;
      }
      case PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER: {
        devtoolsBackend.runWithMutationPaused(() => {
          devtoolsBackend.discoverComponents((component) => {
            // fix number vs string eqeqeq
            if (component.__alpineDevtool && component.__alpineDevtool.id == e.data.payload.componentId) {
              devtoolsBackend.cleanupHoverElement();
            }
          });
        });
        break;
      }
      case PANEL_TO_BACKEND_MESSAGES.EDIT_ATTRIBUTE: {
        devtoolsBackend.handleSetComponentData(
          e.data.payload.componentId,
          e.data.payload.attributeSequence,
          e.data.payload.attributeValue,
        );
        break;
      }

      case PANEL_TO_BACKEND_MESSAGES.EDIT_STORE_ATTRIBUTE: {
        devtoolsBackend.handleSetStoreData(
          e.data.payload.storeName,
          e.data.payload.attributeSequence,
          e.data.payload.attributeValue,
        );
        break;
      }
      case PANEL_TO_BACKEND_MESSAGES.GET_DATA: {
        devtoolsBackend.handleGetComponentData(e.data.payload.componentId);
        break;
      }

      case PANEL_TO_BACKEND_MESSAGES.GET_STORE_DATA: {
        devtoolsBackend.handleGetStoreData(e.data.payload.storeName);
        break;
      }
    }
  }
}

init();
