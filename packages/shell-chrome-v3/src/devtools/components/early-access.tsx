export function EarlyAccessNotice({ feature }: { feature: string }) {
  return (
    <div class="grid h-full w-full overflow-hidden">
      <div class="relative w-full max-h-full overflow-scroll">
        <div
          data-testid="stores-unavailable-message"
          class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-500 text-sm"
        >
          <div>
            {feature} are currently part of the Early Access Program:&nbsp;
            <a
              class="border-transparent text-ice-700"
              href={`https://alpinedevtools.com/pricing?utm_source=extension&utm_campaign=${feature || 'early-access-component'}`}
              target="_blank"
            >
              Join Now To Access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
