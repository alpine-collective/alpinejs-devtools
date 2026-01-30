import { Component, Show } from 'solid-js';
import { theme, setTheme, getNextTheme } from '../state/theme';
import { breakpoint } from '../theme';

export const ThemeToggle: Component = () => {
  const cycleTheme = () => {
    setTheme(getNextTheme(theme()));
  };

  return (
    <button
      onClick={cycleTheme}
      class="flex absolute right-2 min-[961px]:left-4 min-[961px]:bottom-2 items-center justify-center w-10 h-10 text-white rounded-full hover:bg-alpine-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-alpine-400 focus:ring-white leading-4"
      aria-label="Toggle theme"
      data-tooltip={`Theme: ${theme()}`}
      data-side={breakpoint() === 'lg' ? 'right' : 'left'}
    >
      <Show when={theme() === 'light'}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </Show>
      <Show when={theme() === 'dark'}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </Show>
      <Show when={theme() === 'system'}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </Show>
    </button>
  );
};
