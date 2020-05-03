import Alpine from 'alpinejs';
import { waitFor, fireEvent } from '@testing-library/dom';
import { getPanelHtml, createComponent, mockDevtoolPostMessage, State } from './utils';

test('editing an array element works', async () => {
    const mockPostMessage = mockDevtoolPostMessage(window);
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { arr: ['foo'] })
    ]);

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(1);
    });

    document.querySelector('[data-testid=component-name]').click();

    fireEvent.click(document.querySelector('[data-testid=data-property]'));

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=data-property]')).toHaveLength(2);
        expect(document.querySelector('[data-testid=data-property-name]').innerText).toBeDefined();
        expect(document.querySelectorAll('[data-testid=edit-icon]')[1]).toBeVisible();
    });

    fireEvent.click(document.querySelectorAll('[data-testid=edit-icon]')[1]);

    const input = document.querySelectorAll('input')[1];

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('text');
        expect(input.value).toEqual('foo');
    });


    fireEvent.input(input, { target: { value: 'new-value' } });
    await waitFor(() => expect(input.value).toEqual('new-value'))

    const saveIcon = document.querySelectorAll('[data-testid=save-icon]')[1];
    expect(saveIcon).toBeVisible();
    fireEvent.click(saveIcon);

    await waitFor(() => expect(saveIcon).not.toBeVisible());

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
        action: "editAttribute",
        attributeSequence: "arr.0",
        attributeValue: "new-value",
        componentId: "component-id",
        source: "alpineDevtool",
    });
});
