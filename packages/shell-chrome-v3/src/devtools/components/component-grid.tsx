import { componentsValue, openComponentValue, selectedComponentFlattenedData } from '../state';
import { breakpoint, orientation } from '../theme';
import { ComponentListItem } from './component-list-item';
import { DataAttributeDisplay } from './data-attribute-display';
import { createEffect } from 'solid-js';
import Split, { SplitInstance } from 'split-grid';

export function ComponentGrid({ showTools }: { showTools: boolean }) {
  let panesRef!: HTMLDivElement;
  let handleRef!: HTMLDivElement;
  let split: SplitInstance | undefined = undefined;
  createEffect(() => {
    if (split) {
      split.destroy(true);
      panesRef.style.gridTemplateColumns = '';
      panesRef.style.gridTemplateRows = '';
    }

    split = Split({
      minSize: orientation() === 'landscape' ? 250 : 150,
      snapOffset: 0,
      [breakpoint() !== 'sm' ? 'columnGutters' : 'rowGutters']: [
        {
          track: 1,
          element: handleRef,
        },
      ],
    });
  });
  return (
    <div
      ref={panesRef}
      classList={{
        'opacity-75': !showTools,
        'grid-cols-panes': breakpoint() !== 'sm',
        'grid-rows-panes': breakpoint() === 'sm',
      }}
      class="grid h-full w-full overflow-hidden"
    >
      <div class="relative flex flex-col max-h-full overflow-scroll">
        {showTools && componentsValue().length === 0 ? (
          <div
            data-testid="no-components-message"
            class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-400 text-sm"
          >
            No components found
          </div>
        ) : (
          <div
            classList={{
              hidden: !showTools,
            }}
            class="absolute min-w-full min-h-full p-2"
          >
            {componentsValue().map((c) => (
              <ComponentListItem component={c} />
            ))}
          </div>
        )}
      </div>
      <div
        ref={handleRef}
        class="relative group flex items-center justify-center z-50"
        classList={{
          '-mx-1 px-1 cursor-col-resize': breakpoint() !== 'sm',
          '-my-1 py-1 cursor-row-resize': breakpoint() === 'sm',
        }}
      >
        <span
          class="absolute bg-gray-300"
          classList={{
            'w-px h-full': breakpoint() !== 'sm',
            'w-full h-px': breakpoint() === 'sm',
          }}
        ></span>

        <div
          class="flex items-center justify-center text-gray-400 border border-gray-300 bg-gray-200 rounded z-50 group-hover:text-blue-400 group-hover:border-blue-300 group-hover:bg-blue-200"
          classList={{
            'w-3 h-8': breakpoint() !== 'sm',
            'w-8 h-3': breakpoint() === 'sm',
          }}
        >
          <span>
            <svg
              class="w-3 h-3"
              classList={{ hidden: breakpoint() !== 'sm' }}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <svg
              class="w-3 h-3"
              classList={{ hidden: breakpoint() === 'sm' }}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </span>
        </div>
      </div>
      <div class="flex-1 relative flex flex-col max-h-full overflow-scroll">
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
            {showTools && componentsValue().length > 0 ? 'Select a component to view' : ''}
          </div>
        )}

        <div
          classList={{
            hidden: !showTools || !openComponentValue(),
          }}
          class="flex-1 px-3 py-2"
        >
          <div class="font-mono">
            <div class="leading-6 text-gray-300">x-data: {'{'}</div>
            {selectedComponentFlattenedData().length > 0 &&
              selectedComponentFlattenedData().map((data) => <DataAttributeDisplay attributeData={data} />)}
            <div class="leading-7 text-gray-300">{'}'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
