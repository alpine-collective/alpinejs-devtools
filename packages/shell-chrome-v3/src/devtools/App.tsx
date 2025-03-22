import { createSignal, onCleanup, onMount, Show, type Component } from 'solid-js';
import '../../../../dist/chrome/styles.css';

import { Header } from './components/header';
import { ComponentGrid } from './components/component-grid';
import { Footer } from './components/footer';
import { render } from 'solid-js/web';
import { handleResize, orientation } from './theme';
import { StoreGrid } from './components/store-grid';
import { TabValues } from './types';

const App: Component = () => {
  onMount(() => {
    window.addEventListener('resize', handleResize);
  });
  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });
  const showTools = true;
  const [activeTab, setActiveTab] = createSignal<TabValues>('components');
  return (
    <div class="h-full">
      <div class="bg-white flex flex-col relative h-full w-full mx-auto">
        <div
          class="flex-1 min-h-0 flex"
          classList={{
            'flex-col': orientation() === 'portrait',
          }}
        >
          <Header showTools={showTools} activeTab={activeTab} setActiveTab={setActiveTab} />
          <div class="flex-1 overflow-hidden">
            <Show when={activeTab() === 'components'}>
              <ComponentGrid showTools={showTools} />
            </Show>
            <Show when={activeTab() === 'stores'}>
              <StoreGrid />
            </Show>
          </div>
        </div>
        <Show when={showTools}>
          <Footer setActiveTab={setActiveTab} />
        </Show>
      </div>
    </div>
  );
};

export default App;

export function renderApp(root: HTMLElement) {
  return render(() => <App />, root);
}
