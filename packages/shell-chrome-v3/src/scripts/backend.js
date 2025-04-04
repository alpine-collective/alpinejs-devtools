import { ALPINE_DEVTOOLS_PROXY_SOURCE, ALPINE_DEVTOOLS_BACKEND_SOURCE } from '../devtools/ports';
import {
  BACKEND_TO_PANEL_MESSAGES,
  DEVTOOLS_RENDER_ATTR_NAME,
  DEVTOOLS_RENDER_BINDING_ATTR_NAME,
  PANEL_TO_BACKEND_MESSAGES,
  DEVTOOLS_ERROR_ELS_GLOBAL,
  INIT_MESSAGE,
  DEVTOOLS_INITIAL_STATE_GLOBAL,
} from '../lib/constants';
import { debounce } from '../lib/debounce';
// import { isEarlyAccess } from '../lib/isEarlyAccess';
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
      this.errorSourceId = 1;
      /** @type {number | undefined | null} */
      this.selectedComponentId = null;
      /** @type {string | undefined | null} */
      this.selectedStoreName = null;

      this.debouncedSetComponentData = debounce((...args) => {
        this.sendComponentData(...args);
      }, 5);
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
        if (import.meta.env.DEV) {
          console.warn('element has no dataStack', node);
        }
        return;
      }
      if (this.isV3) {
        // in v3 magics are registered on the data stack
        return Object.fromEntries(
          Object.entries(alpineDataInstance).filter(([key]) => !key.startsWith('$')),
        );
      } else {
        return alpineDataInstance?.getUnobservedData();
      }
    }

    getWriteableAlpineData(node) {
      const alpineDataInstance = this.getAlpineDataInstance(node);
      return this.isV3 ? alpineDataInstance : alpineDataInstance.$data;
    }

    start() {
      const { selectedComponentId, selectedStoreName } =
        window[DEVTOOLS_INITIAL_STATE_GLOBAL] ?? {};
      this.selectedComponentId = selectedComponentId;
      this.selectedStoreName = selectedStoreName;

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
      delete window[DEVTOOLS_ERROR_ELS_GLOBAL];
    }

    initAlpineErrorCollection() {
      if (!isRequiredVersion('2.8.1', this.alpineVersion) || !this.alpineVersion) {
        return;
      }
      // if (isEarlyAccess() && this.isV3 && isRequiredVersion('3.5.0', this.alpineVersion)) {
      if (this.isV3 && isRequiredVersion('3.5.0', this.alpineVersion)) {
        this._realLogWarn = console.warn.bind(console);
        const instrumentedWarn = (...args) => {
          const [maybeMessage] = args;
          if (maybeMessage?.length && maybeMessage.includes('Alpine Expression Error:')) {
            const [maybeAlpineExpressionErrorMsg = '', maybeExpression = ''] = maybeMessage
              .split('\n')
              .filter(Boolean);
            const errorMessage = maybeAlpineExpressionErrorMsg
              .replace('Alpine Expression Error:', ' ')
              .trim();
            const [expression] = maybeExpression.match(/(?<=Expression: ").*(?=")/) || [];
            const element = args.find((el) => el instanceof HTMLElement);
            this._handleAlpineError(element, expression, errorMessage);
            console.info(
              'Alpine Devtools intercepted an Alpine Expression Error, see it in the "Alpine.js" tab',
            );
            return;
          }
          this._realLogWarn(...args);
        };
        window.console.warn = instrumentedWarn;
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
          if (
            rejectionEvent.reason &&
            rejectionEvent.reason.el &&
            rejectionEvent.reason.expression
          ) {
            const { el, expression } = rejectionEvent.reason;
            this._handleAlpineError(el, expression, rejectionEvent.reason.toString());
          }
        });
        return;
      }
    }

    _handleAlpineError(element, expression, errorMessage) {
      // `el.__alpineErrorSourceId` is not used
      element.__alpineErrorSourceId ??= this.errorSourceId++;
      window[DEVTOOLS_ERROR_ELS_GLOBAL] = {
        ...(window[DEVTOOLS_ERROR_ELS_GLOBAL] || {}),
        [element.__alpineErrorSourceId]: element,
      };

      /** @type {import('../devtools/state').EvalError} */
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

        if (rootEl.__alpineDevtool.id === this.selectedComponentId) {
          this.sendComponentData(this.selectedComponentId, rootEl);
        }

        if (this.isV3) {
          const componentData = this.getAlpineDataInstance(rootEl);
          Alpine.effect(() => {
            Object.keys(componentData).forEach((key) => {
              let recursionDepth = 0;
              function visit(componentData, key) {
                recursionDepth += 1;
                // since effects track which dependencies are accessed,
                // run a fake component data access so that the effect runs
                void componentData[key];
                if (recursionDepth >= 10) {
                  return;
                }
                if (
                  componentData[key] &&
                  typeof componentData[key] === 'object' &&
                  !Array.isArray(componentData[key])
                ) {
                  Object.keys(componentData[key])
                    .filter((k) => !k.startsWith('$') && !k.startsWith('_x'))
                    .forEach((k) => {
                      visit(componentData[key], k);
                    });
                }
              }
              visit(componentData, key);
              if (rootEl.__alpineDevtool.id === this.selectedComponentId) {
                // this re-computes the whole component data
                // with effect we could send only the key-value of the field that's changed
                this.debouncedSetComponentData(this.selectedComponentId, rootEl);
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
            let recursionDepth = 0;
            function visit(componentData, key) {
              recursionDepth += 1;
              // since effects track which dependencies are accessed,
              // run a fake component data access so that the effect runs
              void componentData[key];
              if (recursionDepth >= 10) {
                return;
              }
              if (
                componentData[key] &&
                typeof componentData[key] === 'object' &&
                !Array.isArray(componentData[key])
              ) {
                Object.keys(componentData[key])
                  .filter((k) => !k.startsWith('$') && !k.startsWith('_x'))
                  .forEach((k) => {
                    visit(componentData[key], k);
                  });
              }
            }
            visit(this.alpineStoreMagic, storeName);
            if (storeName === this.selectedStoreName) {
              this.sendStoreData(this.selectedStoreName || storeName, this.alpineStoreMagic);
            }
          });
        });
      }

      console.info(
        `Alpine Devtools: detected ${this.components.length} components, ${this.stores.length} stores.`,
      );
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
      console.info(`Alpine Devtools: detected version ${this.alpineVersion}`);
      this._postMessage({
        version: this.alpineVersion,
        type: BACKEND_TO_PANEL_MESSAGES.SET_VERSION,
      });
    }

    _postMessage(payload) {
      window.postMessage(
        {
          source: ALPINE_DEVTOOLS_BACKEND_SOURCE,
          payload,
        },
        '*',
      );
    }

    /**
     *
     * @param {number} componentId
     * @param {HTMLElement} componentRoot
     * @returns
     */
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

    /**
     * @param {string} selectedStoreName
     * @param {any} $store
     */
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

    /**
     *
     * @param {number} componentId
     * @returns
     */
    handleGetComponentData(componentId) {
      if (this.selectedComponentId === componentId) {
        // component already loaded
        // any changes to the component's data will be picked up by the mutation observer
        return;
      }
      this.selectedComponentId = componentId;
      this.runWithMutationPaused(() => {
        this.discoverComponents((component) => {
          if (component.__alpineDevtool.id === componentId) {
            this.sendComponentData(componentId, component);
          }
        });
      });
    }

    /**
     *
     * @param {string} storeName
     * @returns
     */
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

    /**
     * @param {(el: HTMLElement) => void} cb
     */
    discoverComponents(cb) {
      if (this.isV3) {
        document.querySelectorAll('[x-data]').forEach(cb);
      } else {
        Alpine.discoverComponents(cb);
      }
    }

    /**
     *
     * @param {number} componentId
     * @param {string} attributeSequence
     * @param {string | boolean | number} attributeValue
     */
    handleSetComponentData(componentId, attributeSequence, attributeValue) {
      this.runWithMutationPaused(() => {
        this.discoverComponents((component) => {
          if (component.__alpineDevtool.id === componentId) {
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

    /**
     * @param {HTMLElement} target
     */
    addHoverElement(target) {
      this.cleanupHoverElement();

      let hoverElement = document.createElement('div');
      let bounds = target.getBoundingClientRect();

      Object.assign(hoverElement.style, {
        position: 'absolute',
        top: `${bounds.top + window.scrollY}px`,
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
  console.info('Alpine Devtools: waiting for init request...');
  window.addEventListener('message', handshake);

  function handshake(e) {
    if (e.data.source === ALPINE_DEVTOOLS_PROXY_SOURCE && e.data.payload === INIT_MESSAGE) {
      window.removeEventListener('message', handshake);
      window.addEventListener('message', handleMessages);

      waitForAlpine(() => {
        console.info('Alpine Devtools: starting...');
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
          const errorSource = window[DEVTOOLS_ERROR_ELS_GLOBAL]?.[e.data.payload.errorId];
          if (errorSource) {
            devtoolsBackend.addHoverElement(errorSource);
          }
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
            if (component.__alpineDevtool?.id === e.data.payload.componentId) {
              devtoolsBackend.addHoverElement(component);
            }
          });
        });
        break;
      }
      case PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER: {
        devtoolsBackend.runWithMutationPaused(() => {
          devtoolsBackend.discoverComponents((component) => {
            if (component.__alpineDevtool?.id === e.data.payload.componentId) {
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
