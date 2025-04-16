import { createSignal, onCleanup, onMount, Show, type Component } from 'solid-js';
import './styles.css';

import { Header } from './components/header';
import { ComponentGrid } from './components/component-grid';
import { Footer } from './components/footer';
import { effect, render } from 'solid-js/web';
import { handleResize, orientation } from './theme';
import { StoreGrid } from './components/store-grid';
import { TabValues } from './types';
import { Warnings } from './components/warnings';
import { view } from './metrics';

const App: Component = () => {
  onMount(() => {
    window.addEventListener('resize', handleResize);
  });
  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });
  const [activeTab, setActiveTab] = createSignal<TabValues>('components');

  effect(() => {
    if (activeTab()) {
      view(`/${activeTab()}`);
    }
  });
  return (
    <div class="h-full">
      <div class="bg-white dark:bg-alpine-400 flex flex-col relative h-full w-full mx-auto">
        <div
          class="flex-1 min-h-0 flex"
          classList={{
            'flex-col': orientation() === 'portrait',
          }}
        >
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <div class="flex-1 overflow-hidden">
            <Show when={activeTab() === 'components'}>
              <ComponentGrid />
            </Show>
            <Show when={activeTab() === 'warnings'}>
              <Warnings />
            </Show>
            <Show when={activeTab() === 'stores'}>
              <StoreGrid />
            </Show>
          </div>
        </div>
        <Footer setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default App;

export function renderApp(root: HTMLElement) {
  return render(() => <App />, root);
}
