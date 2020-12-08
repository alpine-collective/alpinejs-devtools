import { createComponentId, getComponentName } from '../packages/shell-chrome/src/utils'

test('getComponentName > can handle multiple scenarios to determine component name', async () => {
    window.myFn = () => {}
    document.body.innerHTML = `
        <div x-title="foo" x-id="bar" id="baz" name="qux" aria-label="quux" x-data="myFn(param)" role="quuz"></div>
    `

    const element = document.querySelector('[x-data]')

    expect(getComponentName(element)).toBe('foo')
    element.removeAttribute('x-title')
    expect(getComponentName(element)).toBe('bar')
    element.removeAttribute('x-id')
    expect(getComponentName(element)).toBe('baz')
    element.removeAttribute('id')
    expect(getComponentName(element)).toBe('qux')
    element.removeAttribute('name')
    expect(getComponentName(element)).toBe('quux')
    element.removeAttribute('aria-label')
    expect(getComponentName(element)).toBe('myFn')
    element.setAttribute('x-data', '{ foo: "bar" }')
    expect(getComponentName(element)).toBe('quuz')
    element.removeAttribute('role')
    expect(getComponentName(element)).toBe('div')
})
