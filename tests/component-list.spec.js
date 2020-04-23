import Alpine from 'alpinejs';
import { waitFor } from '@testing-library/dom';
import { getPanelHtml, createComponent, State } from './utils';

test('component list > single component', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();

    expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(0);

    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { property: 'some-value' })
    ]);

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(1);
    });

    expect(document.querySelector('[data-testid=component-name]').innerText).toEqual('DIV');
});

test('component list > clicking on the component opens the data tab', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { property: 'some-value' })
    ]);

    await waitFor(() => {

        expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(1);
    });

    expect(document.querySelector('[data-testid=data-property]')).not.toBeVisible();

    document.querySelector('[data-testid=component-name]').click()

    await waitFor(() => {
        expect(document.querySelector('[data-testid=data-property]')).toBeVisible();
    });

    expect(document.querySelector('[data-testid=data-property-name]').innerText).toEqual('property');
    expect(document.querySelector('[data-testid=data-property-value]').innerText).toEqual('some-value');
});
