describe('Nested Getters', () => {
  it('should display getters using parent component data correctly', () => {
    cy.visit('/simulator?target=nested-getters.html')
      .get('[data-testid=component-name]')
      .should('be.visible');

    // Select the child component
    cy.get('[data-testid=component-name]').contains('child').click();

    // Check that the "doubledCount" getter is displayed correctly
    cy.get('[data-testid=data-property-name-doubledCount]')
      .should('be.visible')
      .should('have.text', 'doubledCount');

    cy.get('[data-testid=data-property-value-doubledCount]')
      .should('be.visible')
      .should('have.text', '0');

    // Check that the "doubledHello" getter is displayed, confirming the fix
    cy.get('[data-testid=data-property-name-doubledHello]')
      .should('be.visible')
      .should('have.text', 'doubledHello');

    cy.get('[data-testid=data-property-value-doubledHello]')
      .should('be.visible')
      .should('have.text', '"one, two, three"');
  });

  it('should display update getter values when parent component data changes', () => {
    cy.visit('/simulator?target=nested-getters.html')
      .get('[data-testid=component-name]')
      .should('be.visible');

    // Select the child component
    cy.get('[data-testid=component-name]').contains('child').click();

    cy.get('[data-testid=data-property-name-doubledCount]')
      .should('be.visible')
      .should('have.text', 'doubledCount');

    cy.get('[data-testid=data-property-value-doubledCount]')
      .should('be.visible')
      .should('have.text', '0');

    cy.get('[data-testid=data-property-name-doubledHello]')
      .should('be.visible')
      .should('have.text', 'doubledHello');

    cy.get('[data-testid=data-property-value-doubledHello]')
      .should('be.visible')
      .should('have.text', '"one, two, three"');

    // Click
    cy.iframe('#target').find('[data-testid=click-target]').click();

    cy.get('[data-testid=data-property-value-doubledCount]')
      .should('be.visible')
      .should('have.text', '2');

    cy.get('[data-testid=data-property-value-doubledHello]')
      .should('be.visible')
      .should('have.text', '"one, two, three, new"');
  });
});
