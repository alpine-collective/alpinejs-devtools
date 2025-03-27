const { AlpineVersion } = require('../support/e2e');
it('should load devtools', () => {
  cy.visit('/simulator');
  // // panel pre-Alpine loaded state
  // .get('#devtools-container .preload')
  // .contains('Devtools loading...')
  // // Devtools initialising
  // .get('#devtools-container .preload')
  // .should('not.be.visible')
  // .get('[data-testid=status-line]')
  // .contains('Alpine.js tools loading')
  // .window()
  // .its('Alpine.version')
  // .should('equal', AlpineVersion)

  // Devtools initialised
  // cy.get('[data-testid=version-line]').should('have.attr', 'title', 'Latest Version').contains(`v${AlpineVersion}`)

  cy.get('[data-testid=component-name]').should('have.length.above', 0);
  cy.get('[data-testid=select-component-message]').should(
    'have.text',
    'Select a component to view',
  );
  cy.get('[data-testid=no-components-message]').should('not.exist');
});

it('should load devtools when no components found', () => {
  cy.visit('/simulator?target=no-components.html');
  // // panel pre-Alpine loaded state
  // .get('#devtools-container .preload')
  // .contains('Devtools loading...')
  // // Devtools initialising
  // .get('#devtools-container .preload')
  // .should('not.be.visible')
  // .get('[data-testid=status-line]')
  // .contains('Alpine.js tools loading')
  // .window()
  // .its('Alpine.version')
  // .should('equal', AlpineVersion)

  // Devtools initialised
  // cy.get('[data-testid=version-line]').should('have.attr', 'title', 'Latest Version').contains(`v${AlpineVersion}`)

  cy.get('[data-testid=component-name]').should('have.length', 0);
  cy.get('[data-testid=no-components-message]')
    .should('be.visible')
    .should('contain.text', 'No components found');
  cy.get('[data-testid=select-component-message]').should(
    'not.contain.text',
    'Select a component to view',
  );
});
