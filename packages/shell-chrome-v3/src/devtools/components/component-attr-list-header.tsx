import { Show } from 'solid-js';
import {
  pinnedPrefix,
  getSelectedMessage,
  openComponentValue,
  setDataFromSnapshot,
} from '../state';
import { PinnedPrefixPath } from './pinned-prefix-path';
import { metric } from '../metrics';

function MaybeApplySnapshotButton() {
  return (
    <Show when={getSelectedMessage()}>
      <button
        data-testid="apply-snapshot"
        onClick={() => {
          metric('history_apply_snapshot');
          setDataFromSnapshot(getSelectedMessage()!, openComponentValue()?.id!);
        }}
        class="flex ml-auto cursor-pointer font-sans border-2 border-gray-500 px-1 text-xs font-bold"
      >
        Apply Snapshot
      </button>
    </Show>
  );
}

export function ComponentAttrListHeader() {
  return (
    <>
      <Show when={pinnedPrefix()}>
        <>
          <PinnedPrefixPath pinnedPrefix={pinnedPrefix} />
          <MaybeApplySnapshotButton />
        </>
      </Show>
      <Show when={!pinnedPrefix() && getSelectedMessage()}>
        <>
          {getSelectedMessage()?.receivedAt.toLocaleTimeString(window.navigator.language, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
          })}{' '}
          <MaybeApplySnapshotButton />
        </>
      </Show>
      <Show when={!pinnedPrefix() && !getSelectedMessage()}>
        <>
          <span class="opacity-25">&lt;</span>
          <span>{openComponentValue()?.name}</span>
          <span class="opacity-25">&gt;</span>
          <MaybeApplySnapshotButton />
        </>
      </Show>
    </>
  );
}
