export {};

declare global {
  interface Window {
    Alpine?: {
      version?: string;
      pauseMutationObserver: boolean;
    };
    __alpineDevtool: {
      port?: chrome.runtime.Port;
    };
  }
}
