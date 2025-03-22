import { createEffect, JSXElement } from 'solid-js';
import Split, { SplitInstance } from 'split-grid';
import { orientation, breakpoint } from '../theme';

export function SplitPane({
  showTools,
  leftPaneContent,
  rightPaneContent,
}: {
  showTools: boolean;
  leftPaneContent: JSXElement;
  rightPaneContent: JSXElement;
}) {
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
      <div class="relative flex flex-col max-h-full overflow-scroll">{leftPaneContent}</div>
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
      <div class="flex-1 relative flex flex-col max-h-full overflow-scroll">{rightPaneContent}</div>
    </div>
  );
}
