import { onCleanup, onMount, Show, type Component } from 'solid-js';
import '../../../../dist/chrome/styles.css';

import { Header } from './components/header';
import { ComponentGrid } from './components/component-grid';
import { Footer } from './components/footer';
import { render } from 'solid-js/web';
import { handleResize, orientation } from './theme';

const App: Component = () => {
  onMount(() => {
    window.addEventListener('resize', handleResize);
  });
  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });
  const showTools = true;
  return (
    <div class="h-full">
      <div class="bg-white flex flex-col relative h-full w-full mx-auto">
        <div
          class="flex-1 min-h-0 flex"
          classList={{
            'flex-col': orientation() === 'portrait',
          }}
        >
          <Header showTools={showTools} />
          <div class="flex-1 overflow-hidden">
            <ComponentGrid showTools={showTools} />
            {/* TODO: add more tabs here, control activeTab too */}
          </div>
        </div>
        <Show when={showTools}>
          <Footer />
        </Show>
      </div>
    </div>
  );
};

export default App;

export function renderApp(root: HTMLElement) {
  render(() => <App />, root);
}
