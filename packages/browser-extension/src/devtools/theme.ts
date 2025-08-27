import { createSignal } from 'solid-js';
import { debounce } from '../lib/debounce';

const themes = {
  light: {
    'text-header': 'text-alpine-400',
    'bg-header': 'bg-white',
    'bg-logo-dark': 'text-alpine-400',
    'bg-logo-light': 'text-silver-600',
  },

  'dark-header': {
    'text-header': 'text-white',
    'bg-header': 'bg-alpine-400',
    'bg-logo-dark': 'text-ice-500',
    'bg-logo-light': 'text-silver-500',
  },
};

const breakpoints = {
  md: 640,
  lg: 960,
};

let width = window.innerWidth;
const isLargerThanBreakpoint = (minWidth: number) => {
  const newWidth = window.innerWidth;
  // when hiding the devtools tab, innerWidth goes to 0
  // resume using last known size
  width = newWidth === 0 ? width : newWidth;
  return width > minWidth;
};

const getOrientation = () => (isLargerThanBreakpoint(breakpoints.lg) ? 'landscape' : 'portrait');
const getBreakpoint = () => {
  if (isLargerThanBreakpoint(breakpoints.lg)) {
    return 'lg';
  }

  if (isLargerThanBreakpoint(breakpoints.md)) {
    return 'md';
  }

  return 'sm';
};

// TODO: createStore(themes.light)
export const theme = themes['dark-header'];

const [orientation, setOrientation] = createSignal<'portrait' | 'landscape'>(getOrientation());
const [breakpoint, setBreakpoint] = createSignal<'lg' | 'md' | 'sm'>(getBreakpoint());

export { orientation, breakpoint };

function _handleResize() {
  setOrientation(getOrientation());
  setBreakpoint(getBreakpoint());
}
export const handleResize = debounce(_handleResize, () => '_resize', 100);
