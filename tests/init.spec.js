import Alpine from 'alpinejs';
import { getPanelHtml } from './utils';
import State from '../packages/shell-chrome/src/state';

test('initialisation, the "panel" Alpine app launches without error', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    expect(document.querySelector('[x-data]')).toBeTruthy();
    Alpine.start();
    expect(document.querySelector('[x-data]').__x).toBeTruthy();
});
