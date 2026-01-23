import { createSignal } from 'solid-js';

export function DebugMenu() {
  let debugModalRef!: HTMLDialogElement;
  const [storageSyncData, setStorageSyncData] = createSignal(null);
  return (
    <>
      <button
        type="button"
        data-testid="debug-menu-button"
        onClick={() => debugModalRef?.showModal()}
      >
        Debug menu
      </button>

      <dialog
        ref={debugModalRef}
        class="dialog w-full sm:max-w-[425px] max-h-[612px]"
        aria-labelledby="debug-menu-title"
        // aria-describedby="demo-dialog-edit-profile-description"
        onClick={(e) => {
          if (e.target === debugModalRef) {
            debugModalRef.close();
          }
        }}
      >
        <article>
          <header>
            <h2 id="debug-menu-title">Debug Menu</h2>
          </header>

          <section>
            <div>
              <button
                class="btn"
                onClick={() => {
                  chrome.storage.sync.clear();
                  chrome.storage.local.clear();
                }}
              >
                Clear storage
              </button>
            </div>
            <div>
              <button
                class="btn"
                data-testid="expire-trial-button"
                onClick={() => chrome.storage.sync.set({ earlyAccess: { expiry: Date.now() - 1 } })}
              >
                Set expiry in past
              </button>
            </div>
            <div>
              <button
                class="btn"
                onClick={async () => {
                  const keys = await chrome.storage.sync.getKeys();
                  const storageValue = Object.fromEntries(
                    await Promise.all(
                      keys.map((k) => chrome.storage.sync.get(k).then((d) => [k, d])),
                    ),
                  );
                  setStorageSyncData(storageValue);
                }}
              >
                Dump storage.sync
              </button>
              <div>
                Data:
                <br />
                <pre>{JSON.stringify(storageSyncData(), null, 2)}</pre>
              </div>
            </div>
          </section>

          <footer>
            <button class="btn" onClick={() => debugModalRef.close()}>
              Save changes
            </button>
          </footer>

          <button type="button" aria-label="Close dialog" onClick={() => debugModalRef.close()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-x-icon lucide-x"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </article>
      </dialog>
    </>
  );
}
