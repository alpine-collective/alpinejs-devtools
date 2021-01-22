it('should display message with number of warnings', () => {
    cy.visit('/').get('[data-testid=component-name]').should('have.length.above', 0)

    cy.get('[data-testid=footer-line]').should(($el) => {
        expect($el.text()).to.contain('0 warnings')
    })
})
it('should display "No Warnings" found', () => {
    cy.get('[data-testid=tab-link-warnings').should('be.visible').click()
    cy.get('[data-testid=warnings-tab-content]').should('be.visible').should('contain.text', 'No warnings found')
})
it('should catch component initialisation errors', () => {
    cy.iframe('#target').find('[data-testid=inject-broken]').click()

    cy.get('[data-testid=footer-line]').should(($el) => {
        expect($el.text()).to.contain('1 warning')
    })

    cy.get('[data-testid=warnings-tab-content]').should('be.visible').should('not.contain.text', 'No warnings found')

    cy.get('[data-testid=eval-error-div]')
        .should('have.length', 1)
        .should(($el) => {
            const text = $el.text().replace(/\n/g, '')
            expect(text).to.contain(`Error evaluating`)
            expect(text).to.contain(`"{ foo: 'aaa' "`)
            expect(text).to.contain(`SyntaxError: Unexpected token ')'`)
        })
})
it('should catch x-on errors', () => {
    cy.iframe('#target').find('[data-testid=broken-click]').click()

    cy.get('[data-testid=eval-error-button]').should('have.length', 1)

    cy.get('[data-testid=footer-line]').should(($el) => {
        expect($el.text()).to.contain('2 warnings')
    })

    cy.get('[data-testid=warnings-tab-content]').should('be.visible').should('not.contain.text', 'No warnings found')

    cy.get('[data-testid=eval-error-button]').should(($el) => {
        const text = $el.text().replace(/\n/g, '')
        expect(text).to.contain(`Error evaluating`)
        expect(text).to.contain(`"foo.bar.baz"`)
        expect(text).to.contain(`ReferenceError: foo is not defined`)
    })
})
it('should scroll to newest error when warnings tab is open', () => {
    cy.iframe('#target').find('[data-testid=broken-click]').click()
    cy.iframe('#target').find('[data-testid=broken-click]').click()
    cy.iframe('#target').find('[data-testid=broken-click]').click()

    cy.get('[data-testid=eval-error-button').should('have.length', 4)

    cy.get('[data-testid=footer-line]').should(($el) => {
        expect($el.text()).to.contain('5 warnings')
    })

    cy.get('[data-testid=warnings-scroll-container]').should(($el) => {
        expect($el.scrollTop()).not.to.equal(0)
    })
})

it('should scroll to newest error when switching from components to warnings tab', () => {
    cy.get('[data-testid=warnings-scroll-container]').scrollTo('top')
    cy.get('[data-testid=warnings-scroll-container]').should(($el) => {
        expect($el.scrollTop()).to.equal(0)
    })

    cy.get('[data-testid=tab-link-components]').click()
    cy.get('[data-testid=warnings-tab-content]').should('not.be.visible')

    cy.get('[data-testid=tab-link-warnings]').click()
    cy.get('[data-testid=warnings-tab-content]').should('be.visible')

    cy.get('[data-testid=warnings-scroll-container]').should(($el) => {
        expect($el.scrollTop()).not.to.equal(0)
    })
})

it('footer links should toggle between components and warnings tab', () => {
    cy.get('[data-testid=warnings-tab-content]').should('be.visible')
    cy.get('[data-testid=footer-components-link').click()
    cy.get('[data-testid=warnings-tab-content]').should('not.be.visible')
    cy.get('[data-testid=footer-warnings-link').click()
    cy.get('[data-testid=warnings-tab-content]').should('be.visible')

    cy.get('[data-testid=warnings-scroll-container]').should(($el) => {
        expect($el.scrollTop()).not.to.equal(0)
    })
})
