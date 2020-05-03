import Alpine from 'alpinejs';
import { waitFor, fireEvent } from '@testing-library/dom';
import { getPanelHtml, createComponent, mockDevtoolPostMessage, State } from './utils';

async function openSingleComponentWithEditableField() {
    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(1);
    });

    document.querySelector('[data-testid=component-name]').click();

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=data-property]')).toHaveLength(1);
        expect(document.querySelector('[data-testid=data-property-name]').innerText).toBeDefined();
        expect(document.querySelector('[data-testid=edit-icon]')).toBeVisible();
    });
}

test('pressing ENTER while editing saves the new value ', async () => {
    const mockPostMessage = mockDevtoolPostMessage(window);
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { str: 'initial-string' })
    ]);

    await openSingleComponentWithEditableField();

    fireEvent.click(document.querySelector('[data-testid=edit-icon]'));

    const input = document.querySelector('input');

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('text');
        expect(input.value).toEqual('initial-string');
    });

    fireEvent.input(input, { target: { value: 'new-string' } });
    await waitFor(() => expect(input.value).toEqual('new-string'))

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(input.value).toEqual('new-string'));

    expect(mockPostMessage).toHaveBeenCalledWith({
        action: "editAttribute",
        attributeSequence: "str",
        attributeValue: "new-string",
        componentId: "component-id",
        source: "alpineDevtool",
    });
})

test('pressing ESC while editing resets the value (cancels editing)', async () => {
    const mockPostMessage = mockDevtoolPostMessage(window);
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { str: 'initial-string' })
    ]);

    await openSingleComponentWithEditableField();

    fireEvent.click(document.querySelector('[data-testid=edit-icon]'));

    const input = document.querySelector('input');

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('text');
        expect(input.value).toEqual('initial-string');
    });

    fireEvent.input(input, { target: { value: 'new-string' } });
    await waitFor(() => expect(input.value).toEqual('new-string'))

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    await waitFor(() => expect(input.value).toEqual('initial-string'));
    expect(mockPostMessage).not.toHaveBeenCalled();
})

test('blurring a field while editing resets the value (cancels editing)', async () => {
    const mockPostMessage = mockDevtoolPostMessage(window);
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { str: 'initial-string' })
    ]);

    await openSingleComponentWithEditableField();

    fireEvent.click(document.querySelector('[data-testid=edit-icon]'));

    const input = document.querySelector('input');

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('text');
        expect(input.value).toEqual('initial-string');
    });

    fireEvent.input(input, { target: { value: 'new-string' } });
    await waitFor(() => expect(input.value).toEqual('new-string'))

    fireEvent.blur(input);
    await waitFor(() => expect(input.value).toEqual('initial-string'));
    expect(mockPostMessage).not.toHaveBeenCalled();
});
