it('v3 -  should get names of components from data-x-data attributes', () => {
  cy.visit('/simulator?target=v3-data-attribute.html')
    .get('[data-testid=component-name]')
    .should('be.visible')
    .should('have.length', 2)
    .should('contain.text', 'component1')
    .should('contain.text', 'component2');
});
