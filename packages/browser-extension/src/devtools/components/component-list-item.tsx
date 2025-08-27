import { Show } from 'solid-js';
import {
  hoverLeftComponent,
  hoverOnComponent,
  openComponentValue,
  selectComponent,
} from '../state/components';
import { Component } from '../types';
import { isEarlyAccess } from '../../lib/isEarlyAccess';
import { inspectUserGlobal, scrollElGlobalIntoView } from '../inspect';
import { metric } from '../metrics';

export function ComponentListItem({ component }: { component: Component }) {
  return (
    <a
      classList={{
        'text-white bg-alpine-300 dark:text-gray-100 dark:bg-alpine-300':
          openComponentValue()?.id === component.id && openComponentValue()?.isOpened,
        'text-gray-600 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-500':
          openComponentValue()?.id !== component.id || !openComponentValue()?.isOpened,
      }}
      class="block cursor-pointer rounded-sm"
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
          data-tooltip={`Available as $x${component.id - 1} in the console`}
          data-align="center"
          data-side="bottom"
        >
          = <span>{`$x${component.id - 1}`}</span>
        </div>
        <Show when={isEarlyAccess()}>
          <button
            class="ml-auto px-1 py-2 flex-row cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isEarlyAccess()) {
                return;
              } else {
                metric('component_root_el_scrolled');
                scrollElGlobalIntoView(`$x${component.id - 1}.$el`);
              }
            }}
            data-tooltip="Scroll page to element"
            data-side="left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="h-4 w-4 opacity-85"
            >
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path
                fill-rule="evenodd"
                d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.238.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <button
            class="py-2 flex-row cursor-pointer"
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
            data-tooltip="Inspect in Elements tab"
            data-side="left"
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
