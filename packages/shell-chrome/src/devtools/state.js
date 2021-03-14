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
        this.appUrl = null
        this.components = {}
        this.errors = []
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

    setComponentsList(components, appUrl) {
        this.checkForRemovedComponents(components)
        components.forEach((component, index) => {
            component.index = index
            component.isOpened = this.selectedComponentId === component.id
            this.components[component.id] = component
        })

        if (appUrl !== this.appUrl || !components.find((c) => c.id === this.selectedComponentId)) {
            this.selectedComponentId = null
            this.preloadedComponentData = {}
            this.selectedComponentFlattenedData = null
            this.appUrl = appUrl
        }

        this.updateDevtoolsXData()
    }

    setComponentData(componentId, data) {
        const flattenedData = flattenData(data).map((d) => {
            const prevDataAttributeState = this.selectedComponentFlattenedData
                ? this.selectedComponentFlattenedData.reduce((acc, curr) => {
                      if (!acc[curr.parentComponentId]) {
                          acc[curr.parentComponentId] = {}
                      }
                      acc[curr.parentComponentId][curr.id] = curr
                      return acc
                  }, {})
                : {}

            let isOpened = false
            if (
                (prevDataAttributeState[componentId] &&
                    prevDataAttributeState[componentId][d.id] &&
                    prevDataAttributeState[componentId][d.id].isOpened) ||
                (d.directParentId &&
                    prevDataAttributeState[componentId] &&
                    prevDataAttributeState[componentId][d.directParentId] &&
                    prevDataAttributeState[componentId][d.directParentId].isArrowDown)
            ) {
                isOpened = true
            }

            let isArrowDown = false
            if (
                prevDataAttributeState[componentId] &&
                prevDataAttributeState[componentId][d.id] &&
                prevDataAttributeState[componentId][d.id].hasArrow
            ) {
                isArrowDown = prevDataAttributeState[componentId][d.id].isArrowDown
            }

            return {
                ...d,
                isOpened,
                isArrowDown,
                parentComponentId: componentId,
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
            const childrenIdLength = attribute.id.split('.').length + 1

            // this code generate something like that \\w+\\.\\w+\\.\\w+$
            let closeRegexStr = ''

            for (let i = 0; i < childrenIdLength - 1; i++) {
                closeRegexStr += String.raw`\w+\.`
            }

            closeRegexStr += String.raw`\w+$`

            const closeRegex = new RegExp(closeRegexStr)

            const childrenAttributesIds = this.selectedComponentFlattenedData
                .filter((attr) => {
                    const { id } = attr
                    if (attribute.isArrowDown) {
                        return id.startsWith(attribute.id) && id !== attribute.id && closeRegex.test(id)
                    }
                    return id.startsWith(`${attribute.id}.`) && id.split('.').length === childrenIdLength
                })
                .map((attr) => attr.id)

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
                if (d.hasArrow && d.id === attribute.id) {
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
        }

        appData.selectedComponentFlattenedData = this.selectedComponentFlattenedData
        appData.openComponent = this.components[this.selectedComponentId] || null
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

        if (this.selectedComponentId && component.id !== this.selectedComponentId) {
            // undo component preload when hovering away without clicking
            this.triggerComponentDataLoad(this.selectedComponentId)
        }
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
