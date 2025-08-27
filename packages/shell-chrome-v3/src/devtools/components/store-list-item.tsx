import { metric } from '../metrics';
import { selectStore } from '../state/stores';

interface StoreListItemProps {
  idx: number;
  storeName: string;
  isOpen: boolean;
}

export function StoreListItem({ idx, storeName, isOpen }: StoreListItemProps) {
  return (
    <a
      classList={{
        'text-white bg-alpine-300 dark:text-gray-100 dark:bg-alpine-300': isOpen,
        'text-gray-600 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-500': !isOpen,
      }}
      class="block cursor-pointer rounded-sm"
      onClick={(_e) => {
        metric('store_selected');
        selectStore(storeName);
      }}
      data-testid="store-container"
    >
      <h5 class="flex items-center px-2 leading-7 font-mono whitespace-nowrap">
        <span class="opacity-25">$store{"['"}</span>
        <span data-testid="store-name" class="text-base">
          {storeName}
        </span>
        <span class="opacity-25">{"']"}</span>
        <div
          data-testid="console-global"
          class="text-gray pl-2 text-xs"
          data-tooltip={`Available as $s${idx} in the console`}
          data-align="center"
          data-side="bottom"
        >
          = <span>{`$s${idx}`}</span>
        </div>
      </h5>
    </a>
  );
}
