import { createMemo, For, Show } from 'solid-js';
import {
  filteredSelectedCompData,
  openComponentValue,
  setComponentFilter,
  filteredComponentsValue,
  componentFilterValue,
} from '../state/components';
import {
  getSelectedMessage,
  messageHistory,
  selectedFlattenedMessageData,
} from '../state/messages';
import { Component } from '../types';
import { ComponentListItem } from './component-list-item';
import { DataAttributeDisplay } from './data-attribute-display';
import { SplitPane } from './split-pane';
import {
  HistoryFlyout,
  setShowComponentEarlyAccessOverlay,
  showComponentEarlyAccessOverlay,
} from './history-flyout';
import { ComponentAttrListHeader } from './component-attr-list-header';
import { EarlyAccessNotice } from './early-access';

const messageHistoryEntries = createMemo(() =>
  openComponentValue() ? messageHistory.components[openComponentValue()!.id] : [],
);

export function ComponentGrid() {
  return (
    <>
      <Show when={showComponentEarlyAccessOverlay()}>
        <EarlyAccessNotice
          feature="Time Travel Debugging"
          featureCode="history"
          onClose={() => setShowComponentEarlyAccessOverlay(false)}
          enableClose
        />
      </Show>
      <SplitPane
        leftPaneContent={
          <>
            <div class="pt-2 pb-1 px-2 sticky top-0 z-10 bg-white w-full">
              <input
                data-testid="component-filter-input"
                type="text"
                placeholder="Filter components"
                class="w-full text-sm px-2 py-1 border border-gray-300 rounded-md dark:bg-alpine-500 dark:border-alpine-400"
                onInput={(e) => setComponentFilter(e.currentTarget.value)}
                value={componentFilterValue()}
              />
            </div>
            {filteredComponentsValue().length === 0 ? (
              <div
                data-testid="no-components-message"
                class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
              >
                No components found
              </div>
            ) : (
              <>
                <div
                  // pb- for managing the height of history
                  class="absolute p-2 pt-12 pb-9 min-w-full h-full overflow-scroll"
                >
                  {filteredComponentsValue().map((c: Component) => (
                    <ComponentListItem component={c} />
                  ))}
                </div>
              </>
            )}

            <HistoryFlyout messageHistoryEntries={messageHistoryEntries} />
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
                {filteredComponentsValue().length > 0 ? 'Select a component to view' : ''}
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
    </>
  );
}
