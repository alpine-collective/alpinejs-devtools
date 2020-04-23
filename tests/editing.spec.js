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

async function saveSingleProperty(document) {
    const saveIcon = document.querySelector('[data-testid=save-icon]');
    expect(saveIcon).toBeVisible();
    fireEvent.click(saveIcon);

    await waitFor(() => expect(saveIcon).not.toBeVisible());
}

test('editing a string', async () => {
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

    await saveSingleProperty(document);

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
        action: "editAttribute",
        attributeSequence: "str",
        attributeValue: "new-string",
        componentId: "component-id",
        source: "alpineDevtool",
    });
});
test('editing a number', async () => {
    const mockPostMessage = mockDevtoolPostMessage(window);
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { num: 15 })
    ]);

    await openSingleComponentWithEditableField();

    fireEvent.click(document.querySelector('[data-testid=edit-icon]'));

    const input = document.querySelector('input');

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('number');
        expect(input.value).toEqual('15');
    });


    fireEvent.input(input, { target: { value: 22 } });
    await waitFor(() => expect(input.value).toEqual('22'))

    await saveSingleProperty(document);

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
        action: "editAttribute",
        attributeSequence: "num",
        attributeValue: 22,
        componentId: "component-id",
        source: "alpineDevtool",
    });
});
test('editing a boolean', async () => {
    const mockPostMessage = mockDevtoolPostMessage(window);
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { bool: false })
    ]);

    await openSingleComponentWithEditableField();

    fireEvent.click(document.querySelector('[data-testid=edit-icon]'));

    const input = document.querySelector('input');

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('checkbox');
        expect(input.checked).toEqual(false);
    });


    fireEvent.click(input);
    await waitFor(() => expect(input.checked).toEqual(true))

    await saveSingleProperty(document);

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
        action: "editAttribute",
        attributeSequence: "bool",
        attributeValue: true,
        componentId: "component-id",
        source: "alpineDevtool",
    });
});
test('function properties are read-only', async () => {
    const alpineState = new State();
    window.alpineState = alpineState;
    document.body.innerHTML = getPanelHtml();

    Alpine.start();
    alpineState.renderComponentsFromBackend([
        createComponent('DIV', { myFn() { /* do something */ } })
    ]);

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=component-name]')).toHaveLength(1);
    });

    document.querySelector('[data-testid=component-name]').click();

    await waitFor(() => {
        expect(document.querySelectorAll('[data-testid=data-property]')).toHaveLength(1);
        expect(document.querySelector('[data-testid=data-property-name]').innerText).toBeDefined();
    });

    expect(document.querySelector('[data-testid=data-property-name]').innerText).toEqual('myFn');
    expect(document.querySelector('[data-testid=data-property-value]').innerText).toEqual('function');
    expect(document.querySelector('[data-testid=edit-icon]')).not.toBeVisible();
});

test('cancelling editing', async () => {
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

    const cancelIcon = document.querySelector('[data-testid=cancel-icon]');
    expect(cancelIcon).toBeVisible();
    fireEvent.click(cancelIcon);

    await waitFor(() => expect(cancelIcon).not.toBeVisible());

    expect(input).not.toBeVisible();
    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid=edit-icon]')).toBeVisible();
    expect(document.querySelectorAll('[data-testid=data-property]')).toHaveLength(1);
    expect(document.querySelector('[data-testid=data-property-name]').innerText).toEqual('str');
    expect(document.querySelector('[data-testid=data-property-value]').innerText).toEqual('initial-string');

    fireEvent.click(document.querySelector('[data-testid=edit-icon]'));

    await waitFor(() => {
        expect(input).toBeVisible();
        expect(input.type).toEqual('text');
        expect(input.value).toEqual('initial-string');
    });
});
