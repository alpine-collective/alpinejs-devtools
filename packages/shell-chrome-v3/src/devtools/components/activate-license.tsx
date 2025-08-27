import { Show } from 'solid-js';
import { activateLicense } from '../../lib/isEarlyAccess';
import { createStore } from 'solid-js/store';

const [state, setState] = createStore({
  licenseKey: '',
  error: null as string | null,
  loading: false,
});

export function ActivateLicense() {
  let modalRef!: HTMLDialogElement;

  async function handleActivate() {
    setState('loading', true);
    setState('error', null);
    const result = await activateLicense(state.licenseKey);
    if (result.success) {
      handleClose();
    } else {
      setState('error', result.message ?? 'An unknown error occurred');
    }
    setState('loading', false);
  }

  function handleClose() {
    modalRef.close();
    setState({
      licenseKey: '',
      error: null,
      loading: false,
    });
  }

  return (
    <>
      <div class="text-center text-xs text-gray-500 dark:text-gray-400">
        Already have a license?{' '}
        <button
          class="underline cursor-pointer"
          onClick={() => modalRef.showModal()}
          data-testid="activate-license-button"
        >
          Activate it
        </button>
      </div>
      <dialog
        ref={modalRef}
        class="dialog w-full sm:max-w-[425px] max-h-[612px]"
        aria-labelledby="activate-license-title"
        onClick={(e) => {
          if (e.target === modalRef) {
            handleClose();
          }
        }}
      >
        <article>
          <header>
            <h2 id="activate-license-title">Activate License</h2>
          </header>

          <section class="grid gap-3">
            <label for="license-key-input" class="label">
              License Key
            </label>
            <input
              id="license-key-input"
              type="text"
              class="input"
              value={state.licenseKey}
              placeholder="xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx"
              onInput={(e) => {
                setState({
                  licenseKey: e.currentTarget.value,
                  error: null,
                });
              }}
              data-testid="license-key-input"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You can find your license key in your receipt email. For any issues, email{' '}
              <a class="underline" href="mailto:support@alpinedevtools.com">
                support@alpinedevtools.com
              </a>
            </p>
            <div class="text-red-500 text-sm mt-1 h-6">
              <Show when={state.error}>
                <span data-testid="license-error-message">{state.error}</span>
              </Show>
            </div>
          </section>

          <footer>
            <button
              class="bg-ice-700 hover:bg-ice-900 border-transparent text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
              onClick={handleActivate}
              disabled={state.loading || !state.licenseKey.trim()}
              data-testid="activate-button"
            >
              {state.loading ? 'Activating...' : 'Activate'}
            </button>
          </footer>

          <button type="button" aria-label="Close dialog" onClick={handleClose}>
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
