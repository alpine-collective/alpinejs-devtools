import { For, Show } from 'solid-js';
import { isEarlyAccess } from '../../lib/isEarlyAccess';
import { EarlyAccessNotice } from './early-access';
import { isRequiredVersion } from '../../lib/utils';
import { errors, hideErrorSource, showErrorSource, state } from '../state';
import { inspectUserGlobal } from '../inspect';
import { DEVTOOLS_ERROR_ELS_GLOBAL } from '../../lib/constants';
import { effect } from 'solid-js/web';

export function Warnings() {
  if (!isEarlyAccess()) {
    return <EarlyAccessNotice feature="Warnings and errors" featureCode="warnings" />;
  }
  let warningsRef!: HTMLDivElement;
  effect(() => {
    if (errors().length > 0) {
      queueMicrotask(() => {
        document.querySelector('[data-scroll-target=last-error]')!.scrollIntoView({
          behavior: 'smooth',
        });
      });
    }
  });
  return (
    <div class="flex h-full w-full overflow-hidden" data-testid="warnings-tab-content">
      <div
        ref={warningsRef}
        class="flex-1 flex flex-col max-h-full overflow-scroll text-gray-600"
        data-testid="warnings-scroll-container"
      >
        <Show
          when={
            state.version.detected &&
            isRequiredVersion('2.8.1', state.version.detected) &&
            errors().length === 0
          }
        >
          <div
            data-testid="no-warnings-message"
            class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
          >
            No warnings found
          </div>
        </Show>

        <Show when={state.version.detected && !isRequiredVersion('2.8.1', state.version.detected!)}>
          <div
            data-testid="no-warnings-message"
            class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
          >
            Warnings/Errors can't be collected for Alpine.js &lt;v2.8.1
          </div>
        </Show>

        <Show when={errors().length > 0}>
          <div>
            <For each={errors()}>
              {(error, index) => (
                <div
                  class="flex flex-col justify-center leading-6 text-gray-800 font-mono whitespace-nowrap cursor-pointer"
                  data-scroll-target={index() === errors().length - 1 ? 'last-error' : ''}
                  onMouseEnter={() => showErrorSource(error.errorId)}
                  onMouseLeave={() => hideErrorSource(error.errorId)}
                >
                  <Show when={error.type === 'eval'}>
                    <div
                      class="flex items-start border-b border-gray-300 p-2 pr-3 bg-red-50 bg-opacity-50 hover:bg-yellow-50"
                      data-testid={`eval-error-${error.source.name}`}
                      onClick={() => {
                        inspectUserGlobal(`window.${DEVTOOLS_ERROR_ELS_GLOBAL}[${error.errorId}]`);
                      }}
                    >
                      <div class="flex justify-center w-5 text-center mr-2">
                        <div class="inline-flex items-center justify-center w-3.5 h-3.5 mt-1 rounded-full text-white font-bold bg-red-500">
                          <svg
                            class="inline-block w-full h-full"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <line x1="16" y1="8" x2="8" y2="16"></line>
                            <line x1="8" y1="8" x2="16" y2="16"></line>
                          </svg>
                        </div>
                      </div>

                      <div class="w-full">
                        <div class="flex text-sm space-x-2">
                          <div class="sm:flex-1">
                            Error evaluating "<span class="text-purple">{error.expression}</span>"
                          </div>

                          <button
                            class="flex"
                            onClick={() => {
                              inspectUserGlobal(
                                `window.${DEVTOOLS_ERROR_ELS_GLOBAL}[${error.errorId}]`,
                              );
                            }}
                          >
                            <span class="sm:hidden">at&nbsp;</span>
                            <span class="opacity-25">&lt;</span>
                            <span data-testid="error-source">{error.source.name}</span>
                            <span class="opacity-25">&gt;</span>
                          </button>
                        </div>
                        <div class="flex text-sm">
                          <div class="mr-2">
                            <svg
                              class="inline-block w-3.5 h-3.5 -mt-0.5 -ml-0.5 text-gray-900 text-opacity-25"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                                clip-rule="evenodd"
                              />
                              <path
                                fill-rule="evenodd"
                                d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                          <span class="text-red-700">{error.message}</span>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
