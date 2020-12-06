it('should get names of components', () => {
    cy.visit('/')
        .get('[data-testid=component-name]')
        .should('be.visible')
        .should('contain.text', 'div')
        .should('contain.text', 'app')
        .should('contain.text', 'myFn')
        .should('contain.text', 'component')
        .should('contain.text', 'combobox')
})

it('should add/remove hover overlay on component mouseenter/leave', () => {
    // check overlay works for first component
    cy.get('[data-testid=component-container]').first().should('be.visible').trigger('mouseenter')

    cy.iframe('#target')
        .find('[data-testid=hover-element]')
        .should('be.visible')
        .should(($el) => {
            expect($el.attr('style')).to.contain('position: absolute;')
            expect($el.attr('style')).to.contain('background-color: rgba(104, 182, 255, 0.35);')
            expect($el.attr('style')).to.contain('border-radius: 4px;')
            expect($el.attr('style')).to.contain('z-index: 9999;')
        })
        .then(($el) => {
            cy.iframe('#target')
                .find('[x-data]')
                .first()
                .then(($appEl) => {
                    const { left, top, width, height } = $appEl[0].getClientRects()[0]

                    expect($el.attr('style')).to.contain(`width: ${width}px;`)
                    expect($el.attr('style')).to.contain(`height: ${height}px;`)
                    expect($el.attr('style')).to.contain(`top: ${top}px;`)
                    expect($el.attr('style')).to.contain(`left: ${left}px;`)
                })
        })

    // check overlay works for last component
    cy.get('[data-testid=component-container]').last().trigger('mouseleave')
    cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist')

    cy.get('[data-testid=component-container]').last().should('be.visible').trigger('mouseenter')

    cy.iframe('#target')
        .find('[data-testid=hover-element]')
        .should('be.visible')
        .should(($el) => {
            expect($el.attr('style')).to.contain('position: absolute;')
            expect($el.attr('style')).to.contain('background-color: rgba(104, 182, 255, 0.35);')
            expect($el.attr('style')).to.contain('border-radius: 4px;')
            expect($el.attr('style')).to.contain('z-index: 9999;')
        })
        .then(($el) => {
            cy.iframe('#target')
                .find('[x-data]')
                .last()
                .then(($appEl) => {
                    const { left, top, width, height } = $appEl[0].getClientRects()[0]

                    expect($el.attr('style')).to.contain(`width: ${width}px;`)
                    expect($el.attr('style')).to.contain(`height: ${height}px;`)
                    expect($el.attr('style')).to.contain(`top: ${top}px;`)
                    expect($el.attr('style')).to.contain(`left: ${left}px;`)
                })
        })

    cy.get('[data-testid=component-container]').last().trigger('mouseleave')
    cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist')

    // check overlay disappears on `shutdown`
    cy.get('[data-testid=component-container]')
        .first()
        .should('be.visible')
        .trigger('mouseenter')
        .iframe('#target')
        .find('[data-testid=hover-element]')
        .should('be.visible')
    cy.window().then((win) => {
        win.postMessage({
            source: 'alpineDevtool',
            payload: 'shutdown',
        })
    })
    cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist')
})
it('should support selecting a component', () => {
    cy.visit('/').get('[data-testid=component-container]').first().should('be.visible').click()
})

it('should display read-only function/HTMLElement attributes', () => {
    cy.get('[data-testid=data-property-name]')
        .should('be.visible')
        .contains('myFunction')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'function')

    cy.get('[data-testid=data-property-name]')
        .contains('el')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'HTMLElement')
        .as('elValue')
        .click()

    // check nested attributes
    cy.get('[data-testid=data-property-name]')
        .contains('name')
        .as('elName')
        .should('be.visible')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'div')
    cy.get('[data-testid=data-property-name]')
        .contains('attributes')
        .as('elAttributes')
        .should('be.visible')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'Array[1]')
    cy.get('[data-testid=data-property-name]')
        .contains('children')
        .as('elChildren')
        .should('be.visible')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'Array[5]')

    // check they toggle off
    cy.get('@elValue').click()

    cy.get('@elName')
        .should('not.be.visible')
        .get('@elAttributes')
        .should('not.be.visible')
        .get('@elChildren')
        .should('not.be.visible')
})

it('should allow editing of booleans, numbers and strings', () => {
    // booleans
    cy.get('[data-testid=data-property-name]')
        .should('be.visible')
        .contains('bool')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'true')
    // checkbox is visibility is toggled using CSS click the hidden element
    cy.get('[type=checkbox]').click({ force: true })
    // check the edit worked
    cy.get('[data-testid=data-property-name]')
        .should('be.visible')
        .contains('bool')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'false')
    cy.iframe('#target').contains('Bool, type: "boolean", value: "false"')

    // numbers
    cy.get('[data-testid=data-property-name]')
        .should('be.visible')
        .contains('num')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', '5')
    // edit icon visibility is toggled using CSS, force-click
    cy.get('[data-testid=edit-icon-num]').click({ force: true })
    // editing toggles window.alpineState, causes issues with visibility/re-rendering
    // force all interactions
    cy.get('[data-testid=input-num]')
        .clear({ force: true })
        .type('20', { force: true })
        .siblings('[data-testid=save-icon]')
        .click({ force: true })

    cy.iframe('#target').contains('Num, type: "number", value: "20"')

    // strings
    cy.get('[data-testid=data-property-name]')
        .should('be.visible')
        .contains('str')
        .siblings('[data-testid=data-property-value-container]')
        .should('contain.text', 'string')
    // edit icon visibility is toggled using CSS, force-click
    cy.get('[data-testid=edit-icon-str]').click({ force: true })
    // editing toggles window.alpineState, causes issues with visibility/re-rendering
    // force all interactions
    cy.get('[data-testid=input-str]')
        .clear({ force: true })
        .type('devtools', { force: true })
        .siblings('[data-testid=save-icon]')
        .click({ force: true })

    cy.iframe('#target').contains('Str, type: "string", value: "devtools"')
})
