import { createMemo, For, Show } from 'solid-js';
import {
  componentsValue,
  filteredSelectedCompData,
  getSelectedMessage,
  messageHistory,
  openComponentValue,
  selectedFlattenedMessageData,
} from '../state';
import { ComponentListItem } from './component-list-item';
import { DataAttributeDisplay } from './data-attribute-display';
import { SplitPane } from './split-pane';
import { isEarlyAccess } from '../../lib/isEarlyAccess';
import { HistoryFlyout } from './history-flyout';
import { ComponentAttrListHeader } from './component-attr-list-header';

const messageHistoryEntries = createMemo(() =>
  openComponentValue() ? messageHistory.components[openComponentValue()!.id] : [],
);

export function ComponentGrid() {
  return (
    <SplitPane
      leftPaneContent={
        <>
          {componentsValue().length === 0 ? (
            <div
              data-testid="no-components-message"
              class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
            >
              No components found
            </div>
          ) : (
            <div
              class="absolute p-2 min-w-full h-full overflow-scroll"
              classList={{
                // pb- for managing the height of history
                'pb-9': isEarlyAccess(),
              }}
            >
              {componentsValue().map((c) => (
                <ComponentListItem component={c} />
              ))}
            </div>
          )}

          <Show when={isEarlyAccess()}>
            <HistoryFlyout messageHistoryEntries={messageHistoryEntries} />
          </Show>
        </>
      }
      rightPaneContent={
        <>
          {openComponentValue() ? (
            <div
              data-testid="attr-list-header"
              class="sticky top-0 left-0 z-20 w-full flex items-center px-3 py-2 text-base font-mono text-gray-600 bg-gray-100 dark:text-gray-100 dark:bg-alpine-400"
            >
              <ComponentAttrListHeader />
            </div>
          ) : (
            <div
              data-testid="select-component-message"
              class="flex h-full w-full items-center justify-center p-4 text-gray-400 text-sm bg-gray-50 dark:bg-alpine-400 dark:text-gray-50"
            >
              {componentsValue().length > 0 ? 'Select a component to view' : ''}
            </div>
          )}

          <div
            classList={{
              hidden: !openComponentValue(),
            }}
            class="flex-1 px-3 py-2 dark:bg-alpine-400 dark:text-gray-50"
          >
            <div class="font-mono">
              <Show when={getSelectedMessage()}>
                <div class="leading-6 text-gray-300">{'{'}</div>
                <For each={selectedFlattenedMessageData()}>
                  {(data) => <DataAttributeDisplay type="message" attributeData={data} />}
                </For>
                <div class="leading-6 text-gray-300">{'}'}</div>
              </Show>
              <Show when={!getSelectedMessage()}>
                <div class="leading-6 text-gray-300">$data: {'{'}</div>
                <Show when={filteredSelectedCompData().length > 0}>
                  <For each={filteredSelectedCompData()}>
                    {(data) => <DataAttributeDisplay type="component" attributeData={data} />}
                  </For>
                </Show>
                <div class="leading-7 text-gray-300">{'}'}</div>
              </Show>
            </div>
          </div>
        </>
      }
    />
  );
}
