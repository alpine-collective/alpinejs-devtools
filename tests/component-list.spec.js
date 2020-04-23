import '@testing-library/jest-dom';
import Alpine from 'alpinejs';
import { waitFor, queryAllByTestId, getAllByTestId, getByTestId, getNodeText } from '@testing-library/dom';
import { getPanelHtml, createComponent } from './utils';
import State from '../packages/shell-chrome/src/state';

test('component list > single component', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();

    expect(queryAllByTestId(document.body, 'component-name')).toHaveLength(0);

    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { bool: false })
    ]);

    await waitFor(() => {
        expect(getAllByTestId(document.body, 'component-name')).toHaveLength(1);
    });

    expect(getByTestId(document.body, 'component-name').innerText).toEqual('DIV');
});

test('component list > clicking on the component opens the data tab', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { bool: false })
    ]);

    await waitFor(() => {
        expect(getAllByTestId(document.body, 'component-name')).toHaveLength(1);
    });

    expect(getByTestId(document.body, 'data-property')).not.toBeVisible();

    getByTestId(document.body, 'component-name').click();

    await waitFor(() => {
        expect(getByTestId(document.body, 'data-property')).toBeVisible();
    });

    expect(getByTestId(document.body, 'data-property-name').innerText).toEqual('bool');
    expect(getByTestId(document.body, 'data-property-value').innerText).toEqual(false);
});
