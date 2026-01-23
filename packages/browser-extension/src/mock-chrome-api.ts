const addListener = () => {};
const emptyRules = {
  getRules: () => {},
  removeRules: () => {},
  addRules: () => {},
};

const mockPort: chrome.runtime.Port = {
  name: 'mock',
  onMessage: {
    addListener,
    removeListener: () => {},
    hasListener: () => false,
    hasListeners: () => false,
    ...emptyRules,
  },
  onDisconnect: {
    addListener,
    removeListener: () => {},
    hasListener: () => false,
    hasListeners: () => false,
    ...emptyRules,
  },
  disconnect: () => {},
  postMessage: () => {},
  sender: undefined,
};

const fakeStorage = {
  clear() {
    window.localStorage.removeItem('chrome-local');
  },
  set(partial) {
    console.log('setting partial', partial);
    window.localStorage.setItem('chrome-local', JSON.stringify(partial));
  },
  getKeys() {
    const storage = window.localStorage.getItem('chrome-local');
    return storage ? Promise.resolve(Object.keys(JSON.parse(storage))) : Promise.resolve([]);
  },
  get(key, cb) {
    const raw = window.localStorage.getItem('chrome-local');
    try {
      if (!raw) {
        throw new Error('chrome-local not set');
      }
      const parsed = JSON.parse(raw);
      if (cb) {
        cb(parsed);
      }
      return Promise.resolve(parsed[key]);
    } catch (e) {
      console.log("Key doesn't exist: ", key, raw, e);
    }
  },
} as chrome.storage.SyncStorageArea;

globalThis.chrome = {
  devtools: {
    panels: {
      create: (
        title: string,
        iconPath: string,
        pagePath: string,
        callback: (panel: chrome.devtools.panels.ExtensionPanel) => void,
      ) => {
        callback({
          onShown: {
            addListener,
            removeListener: () => {},
            hasListener: () => false,
            hasListeners: () => false,
            ...emptyRules,
          },
          onHidden: {
            addListener,
            removeListener: () => {},
            hasListener: () => false,
            hasListeners: () => false,
            ...emptyRules,
          },
          createStatusBarButton: () => ({}) as any,
          onSearch: {
            addListener,
            removeListener: () => {},
            hasListener: () => false,
            hasListeners: () => false,
            ...emptyRules,
          },
        });
      },
      openResource: () => {},
      elements: {
        createSidebarPane: () => {},
        onSelectionChanged: {
          addListener,
          removeListener: () => {},
          hasListener: () => false,
          hasListeners: () => false,
          ...emptyRules,
        },
      },
      sources: {
        createSidebarPane: () => {},
      },
    },
    inspectedWindow: {
      tabId: 123,
      eval: (
        source: string,
        callback?: (
          result: any,
          isException?: chrome.devtools.inspectedWindow.EvaluationExceptionInfo,
        ) => void,
      ) => {
        try {
          if (callback) callback(eval(source));
        } catch (e) {
          if (callback)
            callback(null, e as chrome.devtools.inspectedWindow.EvaluationExceptionInfo);
        }
      },
      reload: () => {},
    },
    network: {
      onNavigated: {
        addListener,
        removeListener: () => {},
        hasListener: () => false,
        hasListeners: () => false,
        ...emptyRules,
      },
      onRequestFinished: {
        addListener,
        removeListener: () => {},
        hasListener: () => false,
        hasListeners: () => false,
        ...emptyRules,
      },
      getHAR: () => {},
    },
  },
  runtime: {
    connect: () => {
      return mockPort;
    },
    onConnect: {
      addListener: (callback: (port: chrome.runtime.Port) => void) => {
        callback(mockPort);
      },
      removeListener: () => {},
      hasListener: () => false,
      hasListeners: () => false,
      ...emptyRules,
    },
    onMessage: {
      addListener,
      removeListener: () => {},
      hasListener: () => false,
      hasListeners: () => false,
      ...emptyRules,
    },
    onMessageExternal: {
      addListener,
      removeListener: () => {},
      hasListener: () => false,
      hasListeners: () => false,
      ...emptyRules,
    },
    sendMessage: () => {},
    getURL: (path: string) => path,
  },
  tabs: {
    onUpdated: {
      addListener,
      removeListener: () => {},
      hasListener: () => false,
      hasListeners: () => false,
      ...emptyRules,
    },
    sendMessage: () => {},
  },
  scripting: {
    executeScript: () => {
      return Promise.resolve([]);
    },
  },
  action: {
    setIcon: () => {},
    setPopup: () => {},
  },
  storage: {
    sync: fakeStorage,
    local: fakeStorage,
  },
} as unknown as typeof chrome;
