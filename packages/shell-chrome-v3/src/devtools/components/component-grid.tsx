import { For, Show } from 'solid-js';
import { componentsValue, openComponentValue, selectedComponentFlattenedData } from '../state';
import { ComponentListItem } from './component-list-item';
import { DataAttributeDisplay } from './data-attribute-display';
import { SplitPane } from './split-pane';

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
            <div class="absolute min-w-full min-h-full p-2">
              {componentsValue().map((c) => (
                <ComponentListItem component={c} />
              ))}
            </div>
          )}
        </>
      }
      rightPaneContent={
        <>
          {openComponentValue() ? (
            <div class="sticky top-0 left-0 z-20 w-full flex items-center px-3 py-2 text-base font-mono text-gray-600 bg-gray-100">
              <span class="opacity-25">&lt;</span>
              <span>{openComponentValue()?.name}</span>
              <span class="opacity-25">&gt;</span>
            </div>
          ) : (
            <div
              data-testid="select-component-message"
              class="flex h-full w-full items-center justify-center p-4 text-gray-400 text-sm bg-gray-50"
            >
              {componentsValue().length > 0 ? 'Select a component to view' : ''}
            </div>
          )}

          <div
            classList={{
              hidden: !openComponentValue(),
            }}
            class="flex-1 px-3 py-2"
          >
            <div class="font-mono">
              <div class="leading-6 text-gray-300">x-data: {'{'}</div>
              <Show when={selectedComponentFlattenedData().length > 0}>
                <For each={selectedComponentFlattenedData()}>
                  {(data) => <DataAttributeDisplay attributeData={data} />}
                </For>
              </Show>

              <div class="leading-7 text-gray-300">{'}'}</div>
            </div>
          </div>
        </>
      }
    />
  );
}
