// fixes https://github.com/alpine-collective/alpinejs-devtools/issues/165
it('v3 - should update the devtools when an array item is added or removed', () => {
  cy.visit('/simulator?target=bug-array-mutation.html')
    .get('[data-testid=component-name]')
    .should('be.visible');

  cy.get('[data-testid=component-container]').eq(1).click();

  cy.get('[data-testid=data-property-name-alternatives]')
    .should('be.visible')
    .contains('alternatives');
  cy.get('[data-testid=data-property-value-alternatives]').should('contain.text', 'Array[1]');

  // Add an item to the array
  cy.iframe('#target').find('button').contains('+').click({ force: true });

  // The devtools should update to show the new item
  cy.get('[data-testid=data-property-value-alternatives]').should('contain.text', 'Array[2]');

  // Remove an item from the array
  cy.iframe('#target').find('button').contains('-').click({ force: true });

  // The devtools should update to show the removal
  cy.get('[data-testid=data-property-value-alternatives]').should('contain.text', 'Array[1]');
});
