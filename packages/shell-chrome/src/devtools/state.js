import { flattenData, convertInputDataToType } from '../utils'

export default class State {
    constructor() {
        this.components = {}
        this.allDataAttributes = {}
        this.renderedComponentId = null
        this.version = {
            detected: null,
            latest: '__alpine_version__',
        }
    }

    renderComponentsFromBackend(components) {
        components.forEach((component, index) => {
            component.index = index
            component.isOpened = this.renderedComponentId == component.id

            component.flattenedData = flattenData(component.data)

            component.flattenedData.forEach((d) => {
                if (
                    (this.allDataAttributes[component.id] &&
                        this.allDataAttributes[component.id][d.id] &&
                        this.allDataAttributes[component.id][d.id].isOpened) ||
                    (d.directParentId.length &&
                        this.allDataAttributes[component.id][d.directParentId] &&
                        this.allDataAttributes[component.id][d.directParentId].isArrowDown)
                ) {
                    d.isOpened = true
                }

                if (
                    this.allDataAttributes[component.id] &&
                    this.allDataAttributes[component.id][d.id] &&
                    this.allDataAttributes[component.id][d.id].hasArrow
                ) {
                    d.isArrowDown = this.allDataAttributes[component.id][d.id].isArrowDown
                }

                d.parentComponentId = component.id

                if (!this.allDataAttributes[component.id]) {
                    this.allDataAttributes[component.id] = {}
                }

                this.allDataAttributes[component.id][d.id] = d
            })

            this.components[component.id] = component
        })

        this.updateXdata()
    }

    setAlpineVersionFromBackend(version) {
        this.version.detected = version
        this.updateXdata()
    }

    renderComponentData(component) {
        this.closeOpenedComponent()
        this.renderedComponentId = component.id
        this.components[component.id].isOpened = true
        this.updateXdata()
    }

    closeOpenedComponent() {
        if (this.renderedComponentId) {
            this.components[this.renderedComponentId].isOpened = false
        }
    }

    toggleDataAttribute(attribute) {
        // don't toggle anything if the attribute is read-only
        if (attribute.readOnly) return
        if (attribute.hasArrow) {
            let childrenIdLength = attribute.id.split('.').length + 1

            // this code generate something like that \\w+\\.\\w+\\.\\w+$
            let closeRegexStr = ''

            for (let i = 0; i < childrenIdLength - 1; i++) {
                closeRegexStr += String.raw`\w+\.`
            }

            closeRegexStr += String.raw`\w+$`

            let closeRegex = new RegExp(closeRegexStr)

            let childrenAttributesIds = Object.keys(this.allDataAttributes[attribute.parentComponentId]).filter((a) => {
                if (attribute.isArrowDown) {
                    return a.startsWith(attribute.id) && a != attribute.id && closeRegex.test(a)
                }

                return a.startsWith(`${attribute.id}.`) && a.split('.').length === childrenIdLength
            })

            childrenAttributesIds.forEach((childId) => {
                this.components[attribute.parentComponentId].flattenedData.forEach((d) => {
                    if (d.id === childId) {
                        d.isOpened = !attribute.isArrowDown

                        if (d.hasArrow && attribute.isArrowDown) {
                            d.isArrowDown = false
                        }
                    }
                })
            })

            this.components[attribute.parentComponentId].flattenedData.forEach((d) => {
                if (d.hasArrow && d.id == attribute.id) {
                    d.isArrowDown = !d.isArrowDown
                }
            })

            this.updateXdata()
        }
    }

    updateXdata() {
        let appData = document.getElementById('app').__x.$data

        appData.version = this.version.detected
        appData.latest = this.version.latest

        appData.components = Object.values(this.components).sort(function (a, b) {
            return a.index - b.index
        })
    }

    _hasNoDevtools(methodName) {
        if (!window.__alpineDevtool.port) {
            console.warn(`${methodName} no devtools available`)
            return true
        }
        return false
    }

    hoverOnComponent(component) {
        if (this._hasNoDevtools('hoverOnComponent')) return
        window.__alpineDevtool.port.postMessage({
            componentId: component.id,
            action: 'hover',
            source: 'alpineDevtool',
        })
    }

    hoverLeftComponent(component) {
        if (this._hasNoDevtools('hoverLeftComponent')) return
        window.__alpineDevtool.port.postMessage({
            componentId: component.id,
            action: 'hoverLeft',
            source: 'alpineDevtool',
        })
    }

    editAttribute(clickedAttribute) {
        clickedAttribute.inEditingMode = true
    }

    saveEditing(clickedAttribute) {
        if (this._hasNoDevtools('saveEditing')) return
        clickedAttribute.attributeValue = convertInputDataToType(
            clickedAttribute.inputType,
            clickedAttribute.editAttributeValue
        )
        clickedAttribute.inEditingMode = false

        this.components[clickedAttribute.parentComponentId].flattenedData.forEach((f) => {
            if (f.id == clickedAttribute.id) {
                f.attributeValue = clickedAttribute.attributeValue
                f.editAttributeValue = clickedAttribute.editAttributeValue
            }
        })

        window.__alpineDevtool.port.postMessage({
            componentId: clickedAttribute.parentComponentId,
            attributeSequence: clickedAttribute.id,
            attributeValue: clickedAttribute.attributeValue,
            action: 'editAttribute',
            source: 'alpineDevtool',
        })
    }

    cancelEditing(clickedAttribute) {
        clickedAttribute.editAttributeValue = clickedAttribute.attributeValue
        clickedAttribute.inEditingMode = false
    }
}
