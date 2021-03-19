import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { parseHTML } from 'linkedom'
import { isRequiredVersion, getComponentName } from '../packages/shell-chrome/src/utils'

const ComponentNameTest = suite('getComponentName')

ComponentNameTest('can handle multiple scenarios to determine component name', async () => {
    const { document, window } = parseHTML(
        `<div x-title="foo" x-id="bar" id="baz" name="qux" aria-label="quux" x-data="myFn(param)" role="quuz"></div>`,
    )
    window.myFn = () => {}

    const element = document.querySelector('[x-data]')

    assert.equal(getComponentName(element), 'foo')
    element.removeAttribute('x-title')
    assert.equal(getComponentName(element), 'bar')
    element.removeAttribute('x-id')
    assert.equal(getComponentName(element), 'baz')
    element.removeAttribute('id')
    assert.equal(getComponentName(element), 'qux')
    element.removeAttribute('name')
    assert.equal(getComponentName(element), 'quux')
    element.removeAttribute('aria-label')
    assert.equal(getComponentName(element), 'myFn')
    element.setAttribute('x-data', '{ foo: "bar" }')
    assert.equal(getComponentName(element), 'quuz')
    element.removeAttribute('role')
    assert.equal(getComponentName(element), 'div')
})

ComponentNameTest.run()

const RequiredVersionTest = suite('isRequiredVersion')

RequiredVersionTest('works for major', () => {
    assert.equal(isRequiredVersion('1.11.0', '2.1.1'), true)
    assert.equal(isRequiredVersion('2.11.0', '0.1.1'), false)
})
RequiredVersionTest('works for minor', () => {
    assert.equal(isRequiredVersion('1.1.1', '1.11.0'), true)
    assert.equal(isRequiredVersion('1.11.0', '1.1.1'), false)
})
RequiredVersionTest('works for patch', () => {
    assert.equal(isRequiredVersion('0.11.0', '0.11.1'), true)
    assert.equal(isRequiredVersion('0.1.1', '0.1.0'), false)
})
RequiredVersionTest('works for equal', () => {
    assert.equal(isRequiredVersion('2.8.0', '2.8.0'), true)
    assert.equal(isRequiredVersion('1.1.0', '1.1.0'), true)
})

RequiredVersionTest.run()
