import { Show } from 'solid-js';
import {
  Component,
  hoverLeftComponent,
  hoverOnComponent,
  openComponentValue,
  selectComponent,
} from '../state';
import { isEarlyAccess } from '../../lib/isEarlyAccess';
import { inspectUserGlobal } from '../inspect';
import { metric } from '../metrics';

export function ComponentListItem({ component }: { component: Component }) {
  return (
    <a
      classList={{
        'text-white bg-alpine-300':
          openComponentValue()?.id === component.id && openComponentValue()?.isOpened,
        'text-gray-600 hover:bg-blue-200':
          openComponentValue()?.id !== component.id || !openComponentValue()?.isOpened,
      }}
      class="block cursor-pointer rounded"
      style={`padding-left: ${component.depth * 20}px;`}
      onMouseEnter={(_e) => {
        hoverOnComponent(component);
      }}
      onMouseLeave={(_e) => {
        hoverLeftComponent(component);
      }}
      onClick={(_e) => {
        metric('component_selected');
        selectComponent(component);
      }}
      data-testid="component-container"
    >
      <h5 class="flex items-center px-2 leading-7 font-mono whitespace-nowrap">
        <span class="opacity-25">&lt;</span>
        <span data-testid="component-name" class="text-base">
          {component.name}
        </span>
        <span class="opacity-25">&gt;</span>
        <div
          data-testid="console-global"
          class="text-gray pl-2 text-xs"
          title={`Available as $x${component.id - 1} in the console`}
        >
          = <span>{`$x${component.id - 1}`}</span>
        </div>
        <Show when={isEarlyAccess()}>
          <button
            class="ml-auto px-2 py-2 flex-row"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isEarlyAccess()) {
                return;
              } else {
                metric('component_root_el_inspected');
                hoverLeftComponent(component);
                inspectUserGlobal(`$x${component.id - 1}.$el`);
              }
            }}
            title={'Inspect Root Element'}
          >
            <svg
              class="w-4 h-4 flex"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path d="M6 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
              <path
                fill-rule="evenodd"
                d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm3.5 2.5a3 3 0 1 0 1.524 5.585l1.196 1.195a.75.75 0 1 0 1.06-1.06l-1.195-1.196A3 3 0 0 0 7.5 4.5Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </Show>
      </h5>
    </a>
  );
}
