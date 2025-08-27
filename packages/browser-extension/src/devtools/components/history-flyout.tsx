import { Accessor, createSignal, For } from 'solid-js';
import {
  getSelectedMessage,
  messageHistory,
  resetSelectedMessage,
  setSelectedMessage,
} from '../state/messages';
import { openComponentValue } from '../state/components';
import { DataMessageHistory } from '../types';
import { effect } from 'solid-js/web';
import { AlphaSurveyLink } from './alpha-survey-link';
import { bucketCountLarge, metric } from '../metrics';

export function HistoryFlyout({
  messageHistoryEntries,
}: {
  messageHistoryEntries: Accessor<DataMessageHistory>;
}) {
  const [isHistoryOpened, setIsHistoryOpened] = createSignal(false);
  effect(() => {
    if (isHistoryOpened() && messageHistoryEntries().length > 1) {
      queueMicrotask(() => {
        document.querySelector('[data-scroll-target=last-error]')!.scrollIntoView({
          behavior: 'smooth',
        });
      });
    }
  });
  return (
    <div
      data-testid="history-flyout"
      class="z-30 flex flex-col transition-all absolute bottom-0 bg-gray-100 w-full h-10 py-2 px-3 overflow-hidden"
      classList={{
        'h-full': isHistoryOpened(),
        'overflow-scroll': isHistoryOpened(),
        'pt-0': isHistoryOpened(),
      }}
    >
      <button
        class="sticky top-0 left-0 bg-gray-100 text-sm text-gray-600 dark:text-gray-100 dark:bg-alpine-400 font-medium cursor-pointer w-full text-left"
        classList={{
          'pt-[1px]': !isHistoryOpened(),
          'pb-4': !isHistoryOpened(),
          'py-3': isHistoryOpened(),
          'border-b-1': isHistoryOpened(),
        }}
        onClick={() => {
          metric('history_opened', {
            to: !isHistoryOpened(),
            messages: bucketCountLarge(messageHistoryEntries().length),
          });
          setIsHistoryOpened(!isHistoryOpened());
        }}
      >
        <span
          class="arrow mr-2"
          classList={{
            right: !isHistoryOpened(),
            down: isHistoryOpened(),
          }}
        ></span>
        History{' '}
        <span class="ml-1 float-right">
          <AlphaSurveyLink feature="history" />
        </span>
      </button>

      {openComponentValue() ? (
        <ul>
          <For each={messageHistoryEntries()}>
            {(messageEntry, index) => {
              const messages = messageHistoryEntries();
              const diff =
                messages[index()] && messages[index() - 1]
                  ? Number(messages[index()].receivedAt) - Number(messages[index() - 1].receivedAt)
                  : 0;
              return (
                <li
                  class="flex"
                  data-testid={`history-message-${index()}`}
                  data-scroll-target={
                    index() === messageHistoryEntries().length - 1 ? 'last-error' : ''
                  }
                >
                  <button
                    onClick={() => {
                      if (getSelectedMessage()?.id === messageEntry.id) {
                        resetSelectedMessage();
                      } else {
                        setSelectedMessage(messageEntry.id);
                      }
                    }}
                    class="flex flex-1 cursor-pointer px-2 py-3 text-sm text-bold rounded-sm text-base font-mono dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-500"
                    classList={{
                      'text-white bg-alpine-300 dark:text-gray-100 dark:bg-alpine-300':
                        messageHistory.selectedMessageId === messageEntry.id,
                      'text-base dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-500':
                        messageHistory.selectedMessageId !== messageEntry.id,
                    }}
                  >
                    <span class="flex mr-auto">
                      {messageEntry.receivedAt.toLocaleTimeString(window.navigator.language, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        fractionalSecondDigits: 3,
                      })}
                    </span>{' '}
                    <span class="flex ml-auto">
                      +<span class="inline-block min-w-8 mr-1 text-right">{diff.toFixed(0)}</span>ms
                    </span>
                  </button>
                </li>
              );
            }}
          </For>
        </ul>
      ) : (
        <div class="flex m-auto text-sm text-center text-gray-400 dark:text-gray-50">
          Select a component to view state history
        </div>
      )}
    </div>
  );
}
