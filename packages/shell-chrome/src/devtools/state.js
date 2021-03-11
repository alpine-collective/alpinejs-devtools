import { flattenData, convertInputDataToType } from '../utils'
import { PANEL_TO_BACKEND_MESSAGES } from '../constants'

const ALPINE_DEVTOOL_SOURCE = 'alpineDevtool'

const unavailablePortShim = {
    unavailable: true,
    postMessage(message) {
        console.warn(`No devtools available to post message ${JSON.stringify(message)}`)
    },
}

export default class State {
    constructor() {
        this.components = {}
        this.errors = []
        this.allDataAttributes = {}
        this.selectedComponentId = null
        this.selectedComponentFlattenedData = null
        this.preloadedComponentData = {}
        this.version = {
            detected: null,
            latest: '__alpine_version__',
        }
    }

    get _port() {
        return window.__alpineDevtool.port || unavailablePortShim
    }

    setComponentsList(components) {
        this.checkForRemovedComponents(components)
        components.forEach((component, index) => {
            component.index = index
            component.isOpened = this.selectedComponentId === component.id
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

        this.preloadedComponentData[componentId] = flattenedData
        this.updateDevtoolsXData()
    }

    setAlpineVersionFromBackend(version) {
        this.version.detected = version
        this.updateDevtoolsXData()
    }

    renderComponentData(component) {
        this.closeOpenedComponent()

        this.selectedComponentId = component.id
        this.components[component.id].isOpened = true

        if (!this.preloadedComponentData[component.id]) {
            // preload didn't happen for whatever reason
            this.triggerComponentDataLoad(component.id)
        }

        this.updateDevtoolsXData()
    }

    renderError(error) {
        this.errors.push(error)
        this.updateDevtoolsXData()
    }

    closeOpenedComponent() {
        if (this.selectedComponentId) {
            this.components[this.selectedComponentId].isOpened = false
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

        if (this.selectedComponentId && this.preloadedComponentData[this.selectedComponentId]) {
            this.selectedComponentFlattenedData = this.preloadedComponentData[this.selectedComponentId]

            appData.selectedComponentFlattenedData = this.selectedComponentFlattenedData
            appData.openComponent = this.components[this.selectedComponentId] || null
        }
    }

    showErrorSource(errorId) {
        this._port.postMessage({
            errorId,
            action: PANEL_TO_BACKEND_MESSAGES.SHOW_ERROR_SOURCE,
            source: ALPINE_DEVTOOL_SOURCE,
        })
    }

    hideErrorSource(errorId) {
        this._port.postMessage({
            errorId,
            action: PANEL_TO_BACKEND_MESSAGES.HIDE_ERROR_SOURCE,
            source: ALPINE_DEVTOOL_SOURCE,
        })
    }

    triggerComponentDataLoad(componentId) {
        this._port.postMessage({
            componentId,
            action: PANEL_TO_BACKEND_MESSAGES.GET_DATA,
            source: ALPINE_DEVTOOL_SOURCE,
        })
    }

    hoverOnComponent(component) {
        this._port.postMessage({
            componentId: component.id,
            action: PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT,
            source: ALPINE_DEVTOOL_SOURCE,
        })

        // pre-load component
        this.triggerComponentDataLoad(component.id)
    }

    hoverLeftComponent(component) {
        this._port.postMessage({
            componentId: component.id,
            action: PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER,
            source: ALPINE_DEVTOOL_SOURCE,
        })
    }

    editAttribute(clickedAttribute) {
        clickedAttribute.inEditingMode = true
    }

    saveEditing(clickedAttribute) {
        if (this._port.unavailable) return
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

        this._port.postMessage({
            componentId: clickedAttribute.parentComponentId,
            attributeSequence: clickedAttribute.id,
            attributeValue: clickedAttribute.attributeValue,
            action: PANEL_TO_BACKEND_MESSAGES.EDIT_ATTRIBUTE,
            source: ALPINE_DEVTOOL_SOURCE,
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
                if (this.selectedComponentId === c) {
                    this.selectedComponentId = null
                }
                delete this.components[c]
            })
    }
}
