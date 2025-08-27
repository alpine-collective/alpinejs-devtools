import { Show } from 'solid-js';
import { earlyAccessExpiry, isEarlyAccess, startTrial } from '../../lib/isEarlyAccess';
import { metric } from '../metrics';
import { ActivateLicense } from './activate-license';

const FEATURE_IMAGE = {
  stores: 'https://alpinedevtools.com/assets/alpine-devtools-stores.png',
  warnings: 'https://alpinedevtools.com/assets/alpine-devtools-warnings.png',
};
const FEATURE_LINK = {
  stores:
    'https://github.com/alpine-collective/alpinejs-devtools/blob/master/FEATURES.md#store-inspection',
  warnings:
    'https://github.com/alpine-collective/alpinejs-devtools/blob/master/FEATURES.md#warnings',
};

const FEATURE_DESCRIPTIONS = {
  stores: (
    <>
      <li>
        <strong>Inspect and edit store data</strong> to debug state-related issues.
      </li>
      {/* <li>
        <strong>Access stores in the console</strong> using globals like <code>$s0</code>,{' '}
        <code>$s1</code>.
      </li> */}
    </>
  ),
  warnings: (
    <>
      <li>
        <strong>View all warnings</strong> instead of the first few.
      </li>
      <li>
        <strong>Jump to the element</strong> that caused the error.
      </li>
    </>
  ),
};

export function EarlyAccessNotice({
  feature,
  featureCode,
  enableClose,
  onClose,
}: {
  feature: string;
  featureCode: 'stores' | 'warnings';
  enableClose?: boolean;
  onClose?: () => void;
}) {
  queueMicrotask(() => {
    metric('early_access_opened', {
      featureCode,
    });
  });
  return (
    <div class="grid h-full w-full overflow-hidden">
      <div class="relative w-full max-h-full overflow-scroll">
        <div
          data-testid="early-access-notice"
          class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-500 dark:text-gray-200 text-base leading-5"
        >
          <div class="relative flex flex-col my-auto pb-4 w-md items-start justify-center">
            <Show when={enableClose}>
              <div class="w-full flex justify-end">
                <button
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                  onClick={onClose}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </Show>
            <a
              href={FEATURE_LINK[featureCode]}
              target="_blank"
              class="m-auto"
              onClick={() => {
                metric('early_access_image_clicked', { featureCode });
              }}
            >
              <img class="max-w-xs" src={FEATURE_IMAGE[featureCode]} />
            </a>
            <Show when={!earlyAccessExpiry() && !isEarlyAccess()}>
              <>
                <p class="mt-6 mb-2 w-md">
                  The <strong>{feature}</strong> feature is part of our{' '}
                  <a
                    href={`https://alpinedevtools.com/pricing?utm_source=extension&utm_campaign=${featureCode}_href`}
                    target="_blank"
                    class="underline"
                    onClick={(_e) => {
                      metric('early_access_href_clicked', {
                        featureCode,
                      });
                    }}
                  >
                    Early Access Program
                  </a>
                  .
                </p>
                <p class="mb-2 w-md">Benefits of joining include:</p>
                <ul class="list-disc mx-4 mb-6 w-md">
                  <li>
                    <strong>Lifetime access</strong> to{' '}
                    <a
                      href="https://alpinedevtools.com/features?utm_source=extension&utm_campaign=ea_benefit_list_href"
                      target="_blank"
                      class="underline"
                      onClick={(_e) => {
                        metric('early_access_benefits_href_clicked', {
                          featureCode,
                        });
                      }}
                    >
                      all current and future premium features
                    </a>
                    .
                  </li>
                  <li>
                    <strong>One year of dedicated support</strong> from the developers.
                  </li>
                  {FEATURE_DESCRIPTIONS[featureCode]}
                </ul>
                <button
                  class="m-auto bg-ice-700 hover:bg-ice-900 border-transparent text-white font-bold px-4 py-2 rounded-lg"
                  data-testid="start-trial-button"
                  onClick={() => {
                    startTrial();
                    metric('early_access_cta_clicked', {
                      featureCode,
                      action: 'start_trial',
                    });
                  }}
                >
                  Start 7 day trial
                </button>
              </>
            </Show>
            <Show when={earlyAccessExpiry() && !isEarlyAccess()}>
              <>
                <p class="mt-6 mb-2 w-md">
                  Your trial has expired. To continue using <strong>{feature}</strong> and other
                  Early Access features, please purchase a license.
                </p>
                <a
                  class="m-auto bg-ice-700 hover:bg-ice-900 border-transparent text-white font-bold px-4 py-2 rounded-lg"
                  data-testid="get-access-button"
                  href={`https://alpinedevtools.com/checkout?utm_source=extension&utm_campaign=${featureCode}_cta`}
                  target="_blank"
                  onClick={(_e) => {
                    metric('early_access_cta_clicked', {
                      featureCode,
                      action: 'post_trial',
                    });
                  }}
                >
                  Get Access Now
                </a>
              </>
            </Show>
            <div class="mt-4 m-auto">
              <ActivateLicense />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
