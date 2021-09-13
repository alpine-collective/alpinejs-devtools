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
