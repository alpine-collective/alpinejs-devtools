import { flattenData, convertInputDataToType } from '../utils'

export default class State {
    constructor() {
        this.components = {}
        this.errors = []
        this.allDataAttributes = {}
        this.renderedComponentId = null
        this.version = {
            detected: null,
            latest: '__alpine_version__',
        }
    }

    setComponentsList(components) {
        this.checkForRemovedComponents(components)
        components.forEach((component, index) => {
            component.index = index
            component.isOpened = this.renderedComponentId === component.id
            this.components[component.id] = component
        })

        this.updateDevtoolsXData()
    }

    setComponentData(componentId, data) {
        const flattenedData = flattenData(data).map((d) => {
            let isOpened = false
            if (
                (this.allDataAttributes[componentId] &&
                    this.allDataAttributes[componentId][d.id] &&
                    this.allDataAttributes[componentId][d.id].isOpened) ||
                (d.directParentId.length &&
                    this.allDataAttributes[componentId][d.directParentId] &&
                    this.allDataAttributes[componentId][d.directParentId].isArrowDown)
            ) {
                isOpened = true
            }

            let isArrowDown = false
            if (
                this.allDataAttributes[componentId] &&
                this.allDataAttributes[componentId][d.id] &&
                this.allDataAttributes[componentId][d.id].hasArrow
            ) {
                isArrowDown = this.allDataAttributes[componentId][d.id].isArrowDown
            }

            const parentComponentId = componentId

            if (!this.allDataAttributes[componentId]) {
                this.allDataAttributes[componentId] = {}
            }

            this.allDataAttributes[componentId][d.id] = {
                ...d,
                isOpened,
                isArrowDown,
                parentComponentId,
            }

            return {
                ...d,
                isOpened,
                isArrowDown,
                parentComponentId,
            }
        })

        this.selectedComponentFlattenedData = flattenedData
        this.renderedComponentId = componentId
        this.updateDevtoolsXData()
    }

    setAlpineVersionFromBackend(version) {
        this.version.detected = version
        this.updateDevtoolsXData()
    }

    renderComponentData(component) {
        this.closeOpenedComponent()
        this.renderedComponentId = component.id
        this.components[component.id].isOpened = true
        this.selectedComponentFlattenedData = null
        if (!this._hasNoDevtools('renderComponentData')) {
            window.__alpineDevtool.port.postMessage({
                componentId: component.id,
                action: 'get-data',
                source: 'alpineDevtool',
            })
        }

        this.updateDevtoolsXData()
    }

    renderError(error) {
        this.errors.push(error)
        this.updateDevtoolsXData()
    }

    closeOpenedComponent() {
        if (this.renderedComponentId) {
            this.components[this.renderedComponentId].isOpened = false
        }
    }

    toggleDataAttribute(attribute) {
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
                this.selectedComponentFlattenedData.forEach((d) => {
                    if (d.id === childId) {
                        d.isOpened = !attribute.isArrowDown

                        if (d.hasArrow && attribute.isArrowDown) {
                            d.isArrowDown = false
                        }
                    }
                })
            })

            this.selectedComponentFlattenedData.forEach((d) => {
                if (d.hasArrow && d.id == attribute.id) {
                    d.isArrowDown = !d.isArrowDown
                }
            })

            this.updateDevtoolsXData()
        }
    }

    updateDevtoolsXData() {
        let appData = document.getElementById('app').__x.$data

        appData.version = this.version.detected
        appData.latest = this.version.latest

        appData.errors = [...this.errors]

        appData.components = Object.values(this.components).sort(function (a, b) {
            return a.index - b.index
        })
        appData.selectedComponentFlattenedData = this.selectedComponentFlattenedData
        appData.openComponent = (this.components && this.components[this.renderedComponentId]) || null
    }

    _hasNoDevtools(methodName) {
        if (!window.__alpineDevtool.port) {
            console.warn(`${methodName} no devtools available`)
            return true
        }
        return false
    }

    showErrorSource(errorId) {
        if (this._hasNoDevtools('showErrorSource')) return
        window.__alpineDevtool.port.postMessage({
            errorId,
            action: 'show-error-source',
            source: 'alpineDevtool',
        })
    }

    hideErrorSource(errorId) {
        if (this._hasNoDevtools('hideErrorSource')) return
        window.__alpineDevtool.port.postMessage({
            errorId,
            action: 'hide-error-source',
            source: 'alpineDevtool',
        })
    }

    hoverOnComponent(component) {
        if (this._hasNoDevtools('hoverOnComponent')) return
        window.__alpineDevtool.port.postMessage({
            componentId: component.id,
            action: 'hover',
            source: 'alpineDevtool',
        })

        // pre-load component
        // window.__alpineDevtool.port.postMessage({
        //     componentId: component.id,
        //     action: 'get-data',
        //     source: 'alpineDevtool',
        // })
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
            clickedAttribute.editAttributeValue,
        )
        clickedAttribute.inEditingMode = false

        this.selectedComponentFlattenedData.forEach((f) => {
            if (f.id === clickedAttribute.id) {
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

    checkForRemovedComponents(components) {
        const incomingComponentIds = components.map((c) => c.id)
        const componentsToRemove = Object.values(this.components).filter((c) => !incomingComponentIds.includes(c.id))

        if (!componentsToRemove.length) {
            return
        }

        componentsToRemove
            .map((c) => c.id)
            .forEach((c) => {
                if (this.renderedComponentId === c) {
                    this.renderedComponentId = null
                }
                delete this.components[c]
            })
    }
}
