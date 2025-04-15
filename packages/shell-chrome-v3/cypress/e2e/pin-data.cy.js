it('should display (pin) and filter/toggle to (unpin) when clicked', () => {
  cy.visit('/simulator?target=v3.html').get('[data-testid=component-name]').should('be.visible');

  // Setup
  cy.get('[data-testid=component-name]').first().click();

  cy.get('[data-testid="data-property-name-el"]').click();
  cy.get('[data-testid="data-property-name-children"]').should('be.visible');
  cy.get('[data-testid="data-property-name-children"]').click();
  // End setup

  cy.get('[data-testid="pin-el.children"]').should('be.visible');
  cy.get('[data-testid="pin-el.children"]').should('have.text', '(pin)');

  // Pre-condition, this will get filtered out
  cy.get('[data-testid="data-property-name-myFunction"]').should('exist');

  cy.get('[data-testid="pin-el.children"]').click();

  // Assertions
  cy.get('[data-testid="pin-el.children"]').should('not.exist');
  cy.get('[data-testid="unpin-el.children"]').should('be.visible');
  cy.get('[data-testid="unpin-el.children"]').should('have.text', '(unpin)');

  cy.get('[data-testid="data-property-name-myFunction"]').should('not.exist');

  cy.get('[data-testid="data-property-name-0"]').should('be.visible');
  cy.get('[data-testid="data-property-name-1"]').should('be.visible');
  cy.get('[data-testid="pin-el.children.2"]').click();
  cy.get('[data-testid="data-property-name-0"]').should('not.exist');
  cy.get('[data-testid="data-property-name-1"]').should('not.exist');

  // Unpin
  cy.get('[data-testid="unpin-el.children.2"]').should('have.text', '(unpin)');
  cy.get('[data-testid="unpin-el.children.2"]').click();

  // Assert that we reset correctly
  cy.get('[data-testid="pin-el.children"]').should('be.visible');
  cy.get('[data-testid="pin-el.children"]').should('have.text', '(pin)');
  cy.get('[data-testid="unpin-el.children"]').should('not.exist');
  cy.get('[data-testid="data-property-name-myFunction"]').should('exist');
});

it('displays pinned path, clicking on path loosens the filtering', () => {
  cy.visit('/simulator?target=v3.html').get('[data-testid=component-name]').should('be.visible');

  // Setup
  cy.get('[data-testid=component-name]').first().click();

  cy.get('[data-testid="data-property-name-el"]').click();
  cy.get('[data-testid="data-property-name-children"]').should('be.visible');
  cy.get('[data-testid="data-property-name-children"]').click();
  // End setup

  cy.get('[data-testid="pinned-path"').should('not.exist');

  cy.get('[data-testid="pin-el.children"]').click();

  // Assertions
  cy.get('[data-testid="data-property-name-myFunction"]').should('not.exist');
  cy.get('[data-testid="pinned-path"').should('be.visible');
  cy.get('[data-testid="pinned-path"').should('have.text', 'el>children');

  cy.get('[data-testid="pinned-path-children"')
    .should('be.visible')
    .should('have.text', 'children');
  cy.get('[data-testid="pinned-path-el"').click();
  cy.get('[data-testid="pinned-path-children"').should('not.exist');

  cy.get('[data-testid="pinned-path-el"').click();

  cy.get('[data-testid="pinned-path"').should('not.exist');
  cy.get('[data-testid="data-property-name-myFunction"]').should('exist');
});
