import { isRequiredVersion } from '../../lib/utils';
import { openStoreValue, selectedStoreFlattenedData, state, storesValue } from '../state';
import { StoreListItem } from './store-list-item';
import { DataAttributeDisplay } from './data-attribute-display';
import { SplitPane } from './split-pane';
import { EarlyAccessNotice } from './early-access';
import { isEarlyAccess } from '../../lib/isEarlyAccess';
import { For, Show } from 'solid-js';

export function StoreGrid() {
  if (!isEarlyAccess()) {
    return <EarlyAccessNotice feature="Stores" />;
  }

  if (state.version.detected && !isRequiredVersion('3.8.0', state.version.detected)) {
    return (
      <div
        data-testid="stores-unavailable-message"
        class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
      >
        Devtools can only inspect stores from Alpine.js v3.8.0 onwards, detected v
        {state.version.detected}
      </div>
    );
  }

  return (
    <SplitPane
      leftPaneContent={
        <>
          {storesValue().length === 0 ? (
            <div
              data-testid="stores-not-found-message"
              class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
            >
              No stores found.
            </div>
          ) : (
            <div class="absolute min-w-full min-h-full p-2">
              {storesValue().map((s, i) => (
                <StoreListItem idx={i} storeName={s.name} isOpen={s.isOpen} />
              ))}
            </div>
          )}
        </>
      }
      rightPaneContent={
        <>
          {openStoreValue() ? (
            <div class="sticky top-0 left-0 z-20 w-full flex items-center px-3 py-2 text-base font-mono text-gray-600 bg-gray-100">
              <span class="opacity-25">$store{'['}'</span>
              <span>{openStoreValue()?.name}</span>
              <span class="opacity-25">'{']'}</span>
            </div>
          ) : (
            <div
              data-testid="select-store-message"
              class="flex h-full w-full items-center justify-center p-4 text-gray-400 text-sm bg-gray-50"
            >
              {storesValue().length > 0 ? 'Select a store to view' : ''}
            </div>
          )}

          <div
            classList={{
              hidden: !openStoreValue(),
            }}
            class="flex-1 px-3 py-2"
          >
            <div class="font-mono">
              <div class="leading-6 text-gray-300">{'{'}</div>
              <Show when={selectedStoreFlattenedData().length > 0}>
                <For each={selectedStoreFlattenedData()}>
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
