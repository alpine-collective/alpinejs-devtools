import { isRequiredVersion, getComponentName } from '../packages/shell-chrome/src/utils'

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

describe('isRequiredVersion', () => {
    test('works for major', () => {
        expect(isRequiredVersion('1.11.0', '2.1.1')).toBe(true)
        expect(isRequiredVersion('2.11.0', '0.1.1')).toBe(false)
    })
    test('works for minor', () => {
        expect(isRequiredVersion('1.1.1', '1.11.0')).toBe(true)
        expect(isRequiredVersion('1.11.0', '1.1.1')).toBe(false)
    })
    test('works for patch', () => {
        expect(isRequiredVersion('0.11.0', '0.11.1')).toBe(true)
        expect(isRequiredVersion('0.1.1', '0.1.0')).toBe(false)
    })
    test('works for equal', () => {
        expect(isRequiredVersion('2.8.0', '2.8.0')).toBe(true)
        expect(isRequiredVersion('1.1.0', '1.1.0')).toBe(true)
    })
})
