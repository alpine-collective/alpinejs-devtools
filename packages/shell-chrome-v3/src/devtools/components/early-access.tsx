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
    if (window.sa_event) {
      window.sa_event('early_access_opened', {
        featureCode,
      });
    }
  });
  return (
    <div class="grid h-full w-full overflow-hidden">
      <div class="relative w-full max-h-full overflow-scroll">
        <div
          data-testid="early-access-notice"
          class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-500 text-base leading-5"
        >
          <div class="flex flex-col my-auto items-center justify-center">
            <a
              href={FEATURE_LINK[featureCode]}
              target="_blank"
              onClick={() => {
                if (window.sa_event) {
                  window.sa_event('early_access_image_clicked', { featureCode });
                }
              }}
            >
              <img class="max-w-lg" src={FEATURE_IMAGE[featureCode]} />
            </a>
            <p class="mt-6 mb-6">
              {feature} are currently part of the{' '}
              <a
                href={`https://alpinedevtools.com/pricing?utm_source=extension&utm_campaign=${featureCode}_href`}
                class="underline"
              >
                Early Access Program
              </a>
            </p>
            <a
              class="bg-ice-700 hover:bg-ice-900 border-transparent text-white font-bold px-4 py-2 rounded-lg"
              href={`https://alpinedevtools.com/pricing?utm_source=extension&utm_campaign=${featureCode}_cta`}
              target="_blank"
              onClick={(_e) => {
                if (window.sa_event) {
                  window.sa_event('early_access_cta_clicked', {
                    featureCode,
                  });
                }
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
