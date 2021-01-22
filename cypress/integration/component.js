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

it('should create globals + add annotation for each component', () => {
    let win
    cy.frameLoaded('#target').then(() => {
        win = cy.$$('#target').get(0).contentWindow
    })

    cy.iframe('#target')
        .find('[x-data]')
        .then((components) => {
            components.each((i, component) => {
                expect(win[`$x${i}`].$el).to.equal(component)
                expect(win[`$x${i}`]).to.equal(component.__x)
            })
            return components.length
        })
        .then((componentCount) => {
            cy.get('[data-testid="console-global"]')
                .should('contain.text', '= $x0')
                .should('have.attr', 'title', 'Available as $x0 in the console')
                .should('contain.text', '= $x1')
                .should('contain.text', '= $x2')
                .should('contain.text', '= $x3')
                .should('contain.text', '= $x4')
                .should('contain.text', `= $x${componentCount - 1}`)
        })
})

it('should handle adding and removing new components', () => {
    cy.visit('/')
        .get('[data-testid=component-name]')
        .should('have.length.above', 0)
        .then((components) => {
            const length = components.length
            cy.iframe('#target').find('[data-testid=add-component-button]').click()
            cy.get('[data-testid=component-name]').should('have.length', length + 1)
        })
        .then((components) => {
            cy.iframe('#target').find('[data-testid=delete-component-button]').click()
            cy.get('[data-testid=component-name]').should('have.length', components.length - 1)
        })
})

it('should handle replacing a component and keep its listed position', () => {
    let currentIndex = -1
    cy.visit('/')
        .get('[data-testid=component-name]')
        .should('have.length.above', 0)
        .then(() => cy.contains('Replaceable').invoke('index'))
        .then((index) => (currentIndex = index))
        .then(() => {
            cy.iframe('#target').find('[data-testid=replace-component-button]').click()
            cy.get('[data-testid=component-name]')
        })
        .then(() => cy.contains('Span').invoke('index'))
        .then((index) => expect(currentIndex).to.equal(index))
})

it('should add/remove hover overlay on component mouseenter/leave', () => {
    cy.visit('/')
    // check overlay works for first component
    cy.get('[data-testid=component-container]').first().should('be.visible')
    cy.get('[data-testid=component-container]').first().trigger('mouseenter')

    cy.iframe('#target').find('[data-testid=hover-element]').should('be.visible')

    cy.iframe('#target')
        .find('[data-testid=hover-element]')
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
    cy.get('[data-testid=component-container]').last().should('be.visible')

    cy.get('[data-testid=component-container]').last().trigger('mouseenter')

    cy.iframe('#target').find('[data-testid=hover-element]').should('be.visible')

    cy.iframe('#target')
        .find('[data-testid=hover-element]')
        .should(($el) => {
            expect($el.attr('style')).to.contain('position: absolute;')
            expect($el.attr('style')).to.contain('background-color: rgba(104, 182, 255, 0.35);')
            expect($el.attr('style')).to.contain('border-radius: 4px;')
            expect($el.attr('style')).to.contain('z-index: 9999;')
        })

    cy.get('[data-testid=component-container]').last().trigger('mouseleave')
    cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist')

    // check overlay disappears on `shutdown`
    cy.get('[data-testid=component-container]').first().should('be.visible')

    cy.get('[data-testid=component-container]').first().trigger('mouseenter')

    cy.iframe('#target').find('[data-testid=hover-element]').should('be.visible')

    cy.window().then((win) => {
        win.postMessage({
            source: 'alpineDevtool',
            payload: 'shutdown',
        })
    })
    cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist')
})

it('should support selecting/unselecting a component', () => {
    cy.visit('/')

    cy.get('[data-testid=component-container]').last().should('be.visible')
    cy.get('[data-testid=component-container]').last().click().should('have.class', 'text-white bg-alpine-300')

    cy.get('[data-testid=component-container]').first().click()

    cy.get('[data-testid=component-container]').first().should('have.class', 'text-white bg-alpine-300')
    cy.get('[data-testid=component-container]').last().should('not.have.class', 'text-white bg-alpine-300')
})

it('should display read-only function/HTMLElement attributes', () => {
    cy.get('[data-testid=data-property-name-myFunction]').should('be.visible').contains('myFunction')

    cy.get('[data-testid=data-property-value-myFunction]').should('contain.text', 'function')

    cy.get('[data-testid=data-property-name-el]').contains('el')

    cy.get('[data-testid=data-property-value-el]').should('contain.text', 'HTMLElement').as('elValue').click()

    // check nested attributes
    cy.get('[data-testid=data-property-name-name]').contains('name').should('be.visible')
    cy.get('[data-testid=data-property-value-name]').should('contain.text', 'div')

    cy.get('[data-testid=data-property-name-attributes]').contains('attributes').should('be.visible')
    cy.get('[data-testid=data-property-value-attributes]').should('contain.text', 'Array[1]')

    cy.get('[data-testid=data-property-name-children]').contains('children').should('be.visible')
    cy.get('[data-testid=data-property-value-children]').should('contain.text', 'Array[5]')

    // check they toggle off
    cy.get('[data-testid=data-property-value-el]').click()

    cy.get('[data-testid=data-property-value-name]').should('not.be.visible')

    cy.get('[data-testid=data-property-name-attributes]').should('not.be.visible')
    cy.get('[data-testid=data-property-name-children]').should('not.be.visible')
})

it('should allow editing of booleans, numbers and strings', () => {
    // booleans
    cy.get('[data-testid=data-property-name-bool]').should('be.visible').contains('bool')
    cy.get('[data-testid=data-property-value-bool]').should('contain.text', 'true')
    // checkbox is visibility is toggled using CSS click the hidden element
    cy.get('[data-testid=data-property-value-bool] [type=checkbox]').click({ force: true })
    // check the edit worked
    cy.get('[data-testid=data-property-name-bool]').should('be.visible').contains('bool')

    cy.get('[data-testid=data-property-value-bool]').should('contain.text', 'false')

    cy.iframe('#target').contains('Bool, type: "boolean", value: "false"')

    // numbers
    cy.get('[data-testid=data-property-name-num]').should('be.visible').contains('num')

    cy.get('[data-testid=data-property-value-num]').should('contain.text', '5')
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
    cy.get('[data-testid=data-property-name-str]').should('be.visible').contains('str')
    cy.get('[data-testid=data-property-value-str]').should('contain.text', 'string')
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

it('should display message with number of components watched', () => {
    cy.visit('/')
        .get('[data-testid=component-name]')
        .should('have.length.above', 0)
        .then((components) => {
            cy.get('[data-testid=footer-line]').then(($el) => {
                expect($el.text()).to.contain('Watching')
                expect($el.text()).to.contain(
                    `${components.length} ${components.length > 1 ? 'components' : 'component'}`,
                )
            })
        })
})
