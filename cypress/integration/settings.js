it('should be able to open and close the settings modal', () => {
    cy.visit('/')
        .get('[data-testid=component-name]')
        .get('#settingsPanelOpenButton')
        .click()
        .get('#settingsPanel')
        .should('be.visible')
        .get('#settingsPanelCloseButton')
        .click({ force: true }) // Have to force it because of the absolute positioning
        .get('#settingsPanel')
        .should('not.be.visible')
})
