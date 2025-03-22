export function EarlyAccessNotice() {
  return (
    <div class="grid h-full w-full overflow-hidden">
      <div class="relative w-full max-h-full overflow-scroll">
        <div
          data-testid="stores-unavailable-message"
          class="flex flex-1 h-full w-full items-center justify-center p-4 text-gray-500 text-sm"
        >
          <div>
            Stores are currently part of the Early Access Program:&nbsp;
            <a class="border-transparent text-ice-700" href="https://github.com/sponsors/HugoDF/" target="_blank">
              Join Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
