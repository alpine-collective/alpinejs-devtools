import { theme, orientation } from '../theme';
// import { TabLink } from './tab-link'

interface HeaderProps {
  showTools: boolean;
}
export function Header({ showTools }: HeaderProps) {
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
        </div>
      </div>
    </div>
  );
}
