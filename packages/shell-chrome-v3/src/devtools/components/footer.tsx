import { createSignal, Show } from 'solid-js';
import { componentsValue } from '../state/components';
import { errors } from '../state/errors';
import { state } from '../state/store';
import { storesValue } from '../state/stores';
import { effect } from 'solid-js/web';
import { bucketCount, metric, sampledMetric } from '../metrics';
import {
  earlyAccessExpiry,
  isEarlyAccess,
  isEarlyAccessExpiryInPast,
} from '../../lib/isEarlyAccess';
import { msToDays } from '../time-utils';
import { breakpoint } from '../theme';

interface FooterProps {
  setActiveTab: Function;
}
const settingsPanelEnabled = () => false;
export function Footer({ setActiveTab }: FooterProps) {
  const [_settingsPanelOpen, setSettingsPanelOpen] = createSignal(false);

  effect(() => {
    if (state.pageLoadCompleted) {
      sampledMetric('watching_els', {
        components: bucketCount(componentsValue().length),
        stores: bucketCount(storesValue().length),
        errors: bucketCount(errors().length),
        version: state.version.detected || '',
      });
    }
  });

  return (
    <div class="flex font-bold text-gray-400 border-t border-gray-300 bg-white dark:text-gray-100 dark:bg-gray-600 dark:border-gray-600">
      <div class="flex-1">
        <div
          class="flex items-center text-xs leading-9 font-medium font-mono"
          data-testid="footer-left"
        >
          <div class="flex-1 pl-3" data-testid="footer-line">
            <div class="inline-flex">
              <button
                class="cursor-pointer inline-flex items-center hover:text-gray-500 dark:hover:text-gray-200"
                data-testid="footer-components-link"
                data-tooltip={
                  breakpoint() === 'sm'
                    ? `${componentsValue().length} ${
                        componentsValue().length !== 1 ? 'components' : 'component'
                      }`
                    : undefined
                }
                data-side="top"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('components');
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
                <span class="ml-1">{componentsValue().length}</span>
                <span class="hidden sm:inline ml-1">
                  {' '}
                  {componentsValue().length !== 1 ? 'components' : 'component'}
                </span>
              </button>
              ,&nbsp;
              <button
                class="cursor-pointer inline-flex items-center hover:text-gray-500 dark:hover:text-gray-200"
                data-testid="footer-stores-link"
                data-tooltip={
                  breakpoint() === 'sm'
                    ? `${storesValue().length} ${storesValue().length !== 1 ? 'stores' : 'store'}`
                    : undefined
                }
                data-side="top"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('stores');
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
                <span class="ml-1">{storesValue().length}</span>
                <span class="hidden sm:inline ml-1">
                  {' '}
                  {storesValue().length !== 1 ? 'stores' : 'store'}
                </span>
              </button>
              ,&nbsp;
              <button
                class={
                  errors().length > 0
                    ? 'cursor-pointer text-red-400 inline-flex items-center hover:text-red-600'
                    : 'cursor-pointer inline-flex items-center hover:text-gray-500 dark:hover:text-gray-200'
                }
                data-testid="footer-warnings-link"
                data-tooltip={
                  breakpoint() === 'sm'
                    ? `${errors().length} ${errors().length !== 1 ? 'warnings' : 'warning'}`
                    : undefined
                }
                data-side="top"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('warnings');
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="ml-1">{errors().length}</span>
                <span class="hidden sm:inline ml-1">
                  {' '}
                  {errors().length !== 1 ? 'warnings' : 'warning'}
                </span>
              </button>
            </div>
          </div>

          <Show when={!isEarlyAccess() && earlyAccessExpiry() && isEarlyAccessExpiryInPast()}>
            <button
              class="mr-4 flex underline cursor-pointer"
              onClick={() => setActiveTab('stores')}
            >
              Trial expired
            </button>
          </Show>
          <Show
            when={
              earlyAccessExpiry() &&
              earlyAccessExpiry() !== Infinity &&
              !isEarlyAccessExpiryInPast()
            }
          >
            <div class="mr-4 flex">
              Trial expires in: {msToDays(earlyAccessExpiry()! - Date.now()).toFixed(1)} days
            </div>
          </Show>
          <div
            data-testid="version-line"
            class="flex items-center transition-colors duration-700 ease-in-out"
            data-tooltip={`Alpine.js v${state.version.detected} detected`}
            data-side="top"
          >
            <svg
              class="mr-1.5 h-2 w-2 transition-colors duration-700 ease-in-out text-green-500"
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
              v{state.version.detected}
            </a>
          </div>
        </div>
      </div>

      <div class="text-gray-500 dark:text-gray-200 flex items-center ml-3 px-2.5 space-x-1 border-l border-gray-300 transition-colors duration-700">
        <a
          href={
            isEarlyAccess()
              ? 'mailto:support@alpinedevtools.com'
              : 'https://github.com/alpine-collective/alpinejs-devtools/issues/new'
          }
          target="_blank"
          data-tooltip="Report a Bug"
          data-side="top"
          class="hover:opacity-75 leading-9 font-medium font-mono"
          onClick={() => {
            metric('footer_cta', {
              target: isEarlyAccess()
                ? 'alpine_devtools_bug_email'
                : 'alpine_devtools_bug_gh_issue',
            });
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="w-4 h-4"
          >
            <path d="M11.983 1.364a.75.75 0 0 0-1.281.78c.096.158.184.321.264.489a5.48 5.48 0 0 1-.713.386A2.993 2.993 0 0 0 8 2c-.898 0-1.703.394-2.253 1.02a5.485 5.485 0 0 1-.713-.387c.08-.168.168-.33.264-.489a.75.75 0 1 0-1.28-.78c-.245.401-.45.83-.61 1.278a.75.75 0 0 0 .239.84 7 7 0 0 0 1.422.876A3.01 3.01 0 0 0 5 5c0 .126.072.24.183.3.386.205.796.37 1.227.487-.126.165-.227.35-.297.549A10.418 10.418 0 0 1 3.51 5.5a10.686 10.686 0 0 1-.008-.733.75.75 0 0 0-1.5-.033 12.222 12.222 0 0 0 .041 1.31.75.75 0 0 0 .4.6A11.922 11.922 0 0 0 6.199 7.87c.04.084.088.166.14.243l-.214.031-.027.005c-1.299.207-2.529.622-3.654 1.211a.75.75 0 0 0-.4.6 12.148 12.148 0 0 0 .197 3.443.75.75 0 0 0 1.47-.299 10.551 10.551 0 0 1-.2-2.6c.352-.167.714-.314 1.085-.441-.063.3-.096.614-.096.936 0 2.21 1.567 4 3.5 4s3.5-1.79 3.5-4c0-.322-.034-.636-.097-.937.372.128.734.275 1.085.442a10.703 10.703 0 0 1-.199 2.6.75.75 0 1 0 1.47.3 12.049 12.049 0 0 0 .197-3.443.75.75 0 0 0-.4-.6 11.921 11.921 0 0 0-3.671-1.215l-.011-.002a11.95 11.95 0 0 0-.213-.03c.052-.078.1-.16.14-.244 1.336-.202 2.6-.623 3.755-1.227a.75.75 0 0 0 .4-.6 12.178 12.178 0 0 0 .041-1.31.75.75 0 0 0-1.5.033 11.061 11.061 0 0 1-.008.733c-.815.386-1.688.67-2.602.836-.07-.2-.17-.384-.297-.55.43-.117.842-.282 1.228-.488A.34.34 0 0 0 11 5c0-.22-.024-.435-.069-.642a7 7 0 0 0 1.422-.876.75.75 0 0 0 .24-.84 6.97 6.97 0 0 0-.61-1.278Z" />
          </svg>
        </a>
        <a
          href="https://alpinejs.dev"
          target="_blank"
          data-tooltip="Alpine.js Docs"
          data-side="top"
          class="leading-9 font-medium font-mono"
          onClick={() => {
            metric('footer_cta', {
              target: 'alpinejs_dev',
            });
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="w-5 h-5 hover:opacity-75"
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
          data-tooltip="Alpine.js Devtools GitHub"
          data-side="top"
          data-align="end"
          class="leading-9 font-medium font-mono"
          onClick={() => {
            metric('footer_cta', {
              target: 'alpinejs_devtools_gh',
            });
          }}
        >
          <svg
            class="fill-current w-5 h-5 hover:opacity-75"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-2 -2 24 24"
          >
            <path d="M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0" />
          </svg>
        </a>
        <a
          href="https://alpinedevtools.com/pricing?utm_source=extension&utm_campaign=footer-heart-icon"
          target="_blank"
          data-tooltip="Support Alpine Devtools"
          data-side="top"
          data-align="end"
          class="leading-9 font-medium font-mono"
          onClick={() => {
            metric('footer_cta', {
              target: 'alpine_devtools_pricing',
            });
          }}
        >
          <svg
            class="fill-current w-5 h-5 hover:opacity-75"
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
            class="hover:opacity-75 focus:outline-hidden"
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
