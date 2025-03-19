it('should be able to open and close the settings modal', () => {
    cy.visit('/')
        .get('[data-testid=component-name]')
        .get('[data-testid=settings-panel-open-button')
        .should('be.visible')
        .click()
        .get('[data-testid=settings-panel')
        .should('be.visible')
        .get('[data-testid=settings-panel-close-button')
        .click({ force: true }) // Have to force it because of the absolute positioning
        .get('[data-testid=settings-panel')
        .should('not.be.visible')
})
