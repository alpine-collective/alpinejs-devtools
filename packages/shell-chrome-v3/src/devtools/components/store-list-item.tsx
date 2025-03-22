import { selectStore } from '../state';

export function StoreListItem({ storeName, isOpen }: { storeName: string; isOpen: boolean }) {
  return (
    <a
      classList={{
        'text-white bg-alpine-300': isOpen,
        'text-gray-600 hover:bg-blue-200': !isOpen,
      }}
      class="block cursor-pointer rounded"
      onClick={(_e) => {
        selectStore(storeName);
      }}
      data-testid="store-container"
    >
      <h5 class="flex items-center px-2 leading-7 font-mono whitespace-nowrap">
        <span class="opacity-25">$store{"['"}</span>
        <span data-testid="component-name" class="text-base">
          {storeName}
        </span>
        <span class="opacity-25">{"']"}</span>
      </h5>
    </a>
  );
}
