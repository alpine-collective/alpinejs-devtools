import { createSignal } from 'solid-js';
import { componentsValue, state, storesValue } from '../state';

interface FooterProps {
  setActiveTab: Function;
}
const settingsPanelEnabled = () => false;
export function Footer({ setActiveTab }: FooterProps) {
  const [_settingsPanelOpen, setSettingsPanelOpen] = createSignal(false);

  return (
    <div class="flex font-bold text-gray-400 border-t border-gray-300 bg-white">
      <div class="flex-1">
        <div class="flex items-center text-xs leading-9 font-medium font-mono">
          <div class="flex-1 pl-3" data-testid="footer-line">
            Watching{' '}
            <div class="inline-flex">
              <a
                href="#"
                data-testid="footer-components-link"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('components');
                }}
              >
                {componentsValue().length}{' '}
                {componentsValue().length !== 1 ? 'components' : 'component'}
              </a>
              ,&nbsp;
              <a
                href="#"
                data-testid="footer-stores-link"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('stores');
                }}
              >
                {storesValue().length} {storesValue().length !== 1 ? 'stores' : 'component'}
              </a>
              {/* ,&nbsp;
                <a
                    href="#"
                    data-testid="footer-warnings-link"
                    onClick={(e) => {
                        e.preventDefault()
                        setActiveTab('warnings')
                    }}
                    class={errors().length > 0 ? 'text-red-400' : ''}
                >
                    {errors().length} {errors().length !== 1 ? 'warnings' : 'warning'}
                </a> */}
            </div>
          </div>

          <div
            data-testid="version-line"
            class="flex items-center transition-colors duration-700 ease-in-out"
          >
            <svg
              class={`mr-1.5 h-2 w-2 transition-colors duration-700 ease-in-out ${
                // isLatest() ? 'text-green-500' : 'text-orange-500'
                'text-green-500'
              }`}
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            <a
              class="inline-flex items-center xs:space-x-1"
              target="_blank"
              href="https://github.com/alpinejs/alpine/releases"
            >
              <span class="hidden xs:block">Alpine.js</span>
              <span>{state.version.detected}</span>
              <span class="hidden xs:block">detected</span>
            </a>
          </div>
        </div>
      </div>

      <div class="flex items-center ml-3 px-2.5 space-x-1 border-l border-gray-300 transition-colors duration-700">
        <a
          href="https://alpinejs.dev"
          target="_blank"
          title="Alpine.js Docs"
          class="hover:opacity-75"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </a>
        <a
          href="https://github.com/alpine-collective/alpinejs-devtools"
          target="_blank"
          title="Alpine Devtools GitHub"
          class="hover:opacity-75"
        >
          <svg
            class="fill-current w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-2 -2 24 24"
          >
            <path d="M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0" />
          </svg>
        </a>
        <a
          href="https://alpinedevtools.com/pricing?utm_source=extension&utm_campaign=footer-heart-icon"
          target="_blank"
          title="Devtools Early Access"
          class="hover:opacity-75"
        >
          <svg
            class="fill-current w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </a>
        {settingsPanelEnabled() && (
          <button
            class="hover:opacity-75 focus:outline-none"
            onClick={() => setSettingsPanelOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <title>Settings</title>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
