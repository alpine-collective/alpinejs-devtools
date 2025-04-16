import { metric } from '../metrics';

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

export function EarlyAccessNotice({
  feature,
  featureCode,
}: {
  feature: string;
  featureCode: 'stores' | 'warnings';
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
          <div class="flex flex-col my-auto pb-4 max-w-lg items-center justify-center">
            <a
              href={FEATURE_LINK[featureCode]}
              target="_blank"
              onClick={() => {
                metric('early_access_image_clicked', { featureCode });
              }}
            >
              <img class="max-w-xs" src={FEATURE_IMAGE[featureCode]} />
            </a>
            <p class="mt-6 mb-2 max-w-lg">
              <strong>{feature}</strong> are currently part of the{' '}
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
              , benefits include:
            </p>
            <ul class="list-disc mx-4 mb-6 max-w-lg">
              <li>
                Lifetime Early Access to{' '}
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
                  features
                </a>{' '}
                (stores, warnings, jump to element, more coming soon).
              </li>
              <li>1 year of basic support</li>
            </ul>
            <a
              class="bg-ice-700 hover:bg-ice-900 border-transparent text-white font-bold px-4 py-2 rounded-lg"
              href={`https://alpinedevtools.com/checkout?utm_source=extension&utm_campaign=${featureCode}_cta`}
              target="_blank"
              onClick={(_e) => {
                metric('early_access_cta_clicked', {
                  featureCode,
                  priceInButton: false,
                });
              }}
            >
              Get Access Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
