const { AlpineVersion } = require('../support/index')
it('should load devtools', () => {
    cy.visit('/')
        // panel pre-Alpine loaded state
        .get('#devtools-container .preload')
        .should('be.visible')
        .contains('Devtools loading...')
        // Devtools initialising
        .get('#devtools-container .preload')
        .should('not.be.visible')
        .get('[data-testid=status-line]')
        .contains('Alpine.js tools loading')
        .window()
        .its('Alpine.version')
        .should('equal', AlpineVersion)

    // Devtools initialised
    cy.get('[data-testid=status-line]')
        .should('have.attr', 'title', 'Latest Version')
        .contains(`Alpine.js v${AlpineVersion} detected`)

    cy.get('[data-testid=component-name]').should('have.length', 6)
})
