import { Accessor, createMemo, For } from 'solid-js';
import { setPinnedPrefix } from '../state/app';
import { metric } from '../metrics';

function getPathSegments(pinnedPrefix: string) {
  console.log('pathSegs', pinnedPrefix);
  const subPaths: { idx: number; subPath: string; display: string }[] = [];
  let prevPart = '';
  pinnedPrefix.split('.').forEach((part, i) => {
    if (prevPart.length > 0) {
      prevPart += '.';
    }
    prevPart += part;
    subPaths.push({ idx: i, subPath: prevPart, display: part });
  });
  console.log(subPaths);
  return subPaths;
}
export function PinnedPrefixPath({ pinnedPrefix }: { pinnedPrefix: Accessor<string> }) {
  const pathSegs = createMemo(() => getPathSegments(pinnedPrefix()));
  return (
    <span data-testid="pinned-path">
      <For each={pathSegs()}>
        {(seg) => {
          return (
            <>
              <button
                data-testid={`pinned-path-${seg.display}`}
                class="text-purple dark:brightness-150 hover:underline cursor-pointer"
                onClick={() => {
                  metric('set_prefix_from_path', {
                    pathDepth: seg.subPath.split('.').length,
                  });
                  if (seg.subPath === pinnedPrefix()) {
                    setPinnedPrefix('');
                  } else {
                    setPinnedPrefix(seg.subPath);
                  }
                }}
              >
                {seg.display}
              </button>
              {seg.idx !== pathSegs().length - 1 ? <span class="mx-2 opacity-50">&gt;</span> : ''}
            </>
          );
        }}
      </For>
    </span>
  );
}
