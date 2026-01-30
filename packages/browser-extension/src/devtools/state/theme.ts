import { createEffect, createSignal } from 'solid-js';

type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'alpine-devtools-theme';

const themes = ['light', 'dark', 'system'];

const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme && themes.includes(storedTheme)) {
    return storedTheme as Theme;
  }
  return 'system';
};

const [theme, _setTheme] = createSignal<Theme>(getInitialTheme());

const setTheme = (newTheme: Theme) => {
  _setTheme(newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
};

createEffect(() => {
  const currentTheme = theme();
  if (currentTheme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }
});

const getNextTheme = (currentTheme: Theme): Theme => {
  switch (currentTheme) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
    case 'system':
      return 'light';
  }
};

export { theme, setTheme, getNextTheme, type Theme };
