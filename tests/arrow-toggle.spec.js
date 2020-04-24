import Alpine from 'alpinejs';
import { waitFor, fireEvent } from '@testing-library/dom';
import {
    getPanelHtml,
    createComponent,
    State,
} from './utils';

async function openSingleComponentWithNestedData(expectedPropertyCount) {
    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(1);
    });

    document.querySelector('[data-testid=component-name]').click();

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=data-property]')).toHaveLength(expectedPropertyCount);
        expect(document.querySelectorAll('[data-testid=data-property]')[0]).toBeVisible();
    });
}

test('when a property is a flat array it shows an arrow & is toggleable', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { arr: ['element-1', 'element-2'] })
    ]);

    await openSingleComponentWithNestedData(3);

    expect(document.querySelector('[data-testid=data-property-name]')).toBeVisible();
    expect(document.querySelector('[data-testid=data-property-name]').innerText).toEqual('arr');
    expect(document.querySelector('[data-testid=data-property-value]').innerText).toEqual('Array');
    expect(
        document
            .querySelectorAll('[data-testid=data-property]')[0]
            .querySelector('[data-testid=arrow-right]')
    ).toBeVisible();
    const editIcons = document.querySelectorAll('[data-testid=edit-icon]')
    expect(editIcons[0]).not.toBeVisible();
    expect(editIcons[1]).not.toBeVisible();
    expect(editIcons[2]).not.toBeVisible();

    fireEvent.click(document.querySelector('[data-testid=data-property]'));

    await waitFor(() => {
        const topProperty = document.querySelectorAll('[data-testid=data-property]')[0];
        expect(topProperty.querySelector('[data-testid=arrow-right]')).toBeFalsy();
        expect(topProperty.querySelector('[data-testid=arrow-down]')).toBeDefined();
    });

    expect(editIcons[1]).toBeVisible();
    expect(editIcons[2]).toBeVisible();

    fireEvent.click(document.querySelector('[data-testid=data-property]'));

    await waitFor(() => {
        const topProperty = document.querySelectorAll('[data-testid=data-property]')[0];
        expect(topProperty.querySelector('[data-testid=arrow-right]')).toBeDefined();
        expect(topProperty.querySelector('[data-testid=arrow-down]')).toBeFalsy();
    });
});

test('when a property is a flat object it shows an arrow & is toggleable', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { obj: { field1: 'value-1', field2: 'value-2' } })
    ]);

    await openSingleComponentWithNestedData(3);

    expect(document.querySelector('[data-testid=data-property-name]')).toBeVisible();
    expect(document.querySelector('[data-testid=data-property-name]').innerText).toEqual('obj');
    expect(document.querySelector('[data-testid=data-property-value]').innerText).toEqual('Object');
    expect(
        document
            .querySelectorAll('[data-testid=data-property]')[0]
            .querySelector('[data-testid=arrow-right]')
    ).toBeVisible();
    const editIcons = document.querySelectorAll('[data-testid=edit-icon]')
    expect(editIcons[0]).not.toBeVisible();
    expect(editIcons[1]).not.toBeVisible();
    expect(editIcons[2]).not.toBeVisible();

    fireEvent.click(document.querySelector('[data-testid=data-property]'));

    await waitFor(() => {
        const topProperty = document.querySelectorAll('[data-testid=data-property]')[0];
        expect(topProperty.querySelector('[data-testid=arrow-right]')).toBeFalsy();
        expect(topProperty.querySelector('[data-testid=arrow-down]')).toBeDefined();
    });

    expect(editIcons[1]).toBeVisible();
    expect(editIcons[2]).toBeVisible();

    fireEvent.click(document.querySelector('[data-testid=data-property]'));

    await waitFor(() => {
        const topProperty = document.querySelectorAll('[data-testid=data-property]')[0];
        expect(topProperty.querySelector('[data-testid=arrow-right]')).toBeDefined();
        expect(topProperty.querySelector('[data-testid=arrow-down]')).toBeFalsy();
    });
});

test.todo('when a property is an array of objects, both levels should be toggleable & show arrows')
test.todo('when a property is an object containing array properties, both levels should be toggleable & show arrows')
