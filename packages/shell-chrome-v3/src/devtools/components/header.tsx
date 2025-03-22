import { Accessor } from 'solid-js';
import { theme, orientation } from '../theme';
import { TabValues } from '../types';
import { TabLink } from './tab-link';

interface HeaderProps {
  showTools: boolean;
  activeTab: Accessor<TabValues>;
  setActiveTab: Function;
}
export function Header({ showTools, activeTab, setActiveTab }: HeaderProps) {
  return (
    <div
      classList={{
        'bg-gray-100': !showTools,
        [theme['bg-header']]: showTools,
        'flex-col w-48 min-h-0 overflow-y-auto': orientation() === 'landscape',
        'flex-row items-center pl-3 pr-1 xs:pr-3': orientation() === 'portrait',
      }}
      class="flex h-15 py-px text-base tracking-tight font-bold text-white border-b border-gray-300 transition duration-700 transition-colors ease-in-out"
    >
      <div
        classList={{
          'flex-1': orientation() === 'portrait',
          'w-full': orientation() === 'landscape',
        }}
      >
        <div
          classList={{
            'flex-col px-3 py-2': orientation() === 'landscape',
            'items-center': orientation() === 'portrait',
          }}
          class="flex"
        >
          <svg
            class="w-10 h-10 mr-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 460 460"
            fill="currentColor"
            stroke="none"
          >
            <polygon
              classList={{ 'text-gray-600': !showTools, [theme['bg-logo-dark']]: showTools }}
              class="transform transition-colors duration-700"
              points="50,230 140,140 320,320 140,320"
            />
            <polygon
              classList={{ 'text-gray-400': !showTools, [theme['bg-logo-light']]: showTools }}
              class="transform transition-colors duration-700"
              points="320,140 410,230 320,320 230,230"
            />
          </svg>

          <div
            data-testid="status-line"
            classList={{
              hidden: showTools,
            }}
            class="flex items-center px-1 py-0.5 rounded text-xs text-gray-600 font-medium leading-4 bg-gray-300 bg-opacity-50 animate-pulse-fast transition transition-colors duration-700 ease-in-out"
            // :title="isLatest? 'Latest Version' : `Latest Version: ${latest}`"
          >
            <svg
              class="mr-1.5 h-2 w-2 text-gray-400 transition transition-colors duration-700 ease-in-out"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            <span>Alpine.js tools loading</span>
          </div>
          <div
            classList={{
              'opacity-0': !showTools,
              'flex-col pr-px leading-[3rem]': orientation() === 'landscape',
              'flex-row items-center pb-px leading-[3.25rem] xs:space-x-3': orientation() === 'portrait',
            }}
            class="flex text-sm text-ice-500 transition"
          >
            <TabLink activeTab={activeTab} setActiveTab={setActiveTab} tab="components">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                classList={{
                  'xs:mr-1': orientation() === 'landscape',
                  'xs:mr-0.5': orientation() === 'portrait',
                }}
                class="inline-block w-6 h-6 xs:w-5 xs:h-5 xs:opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </TabLink>
            <TabLink activeTab={activeTab} setActiveTab={setActiveTab} tab="stores">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                classList={{
                  'xs:mr-1': orientation() === 'landscape',
                  'xs:mr-0.5': orientation() === 'portrait',
                }}
                class="inline-block w-6 h-6 xs:w-5 xs:h-5 xs:opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </TabLink>
          </div>
        </div>
      </div>
    </div>
  );
}
