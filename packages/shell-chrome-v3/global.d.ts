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
    sa_metadata?: Record<string, any>;
    sa_pageview?: (pathname: string) => void;
    sa_event?: (eventName: string, metadata?: Record<string, string | number | boolean>) => void;
  }
}
