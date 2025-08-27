it('should show "no stores" messages when none detected', () => {
  cy.visit('/simulator?target=no-stores.html');
  cy.get('[data-testid=tab-link-stores]').click();
  cy.contains('No stores found').should('be.visible');
});

it('should populate stores list when present', () => {
  cy.visit('/simulator?target=v3.html');
  cy.get('[data-testid=tab-link-stores]').click();
  cy.get('[data-testid=store-name]').should('have.length', 2);
  cy.get('[data-testid=store-name]').contains('sampleStore').should('be.visible');
  cy.get('[data-testid=store-name]').contains('primitiveVal').should('be.visible');
});
it('primitive store - should populate data, allow edits and receive state updates when selected', () => {
  cy.visit('/simulator?target=v3.html');
  cy.get('[data-testid=tab-link-stores]').click();
  cy.get('[data-testid=store-name]').contains('primitiveVal').click();
  cy.get('[data-testid=data-property-name-__root_value]').should('not.exist');
  cy.get('[data-testid=data-property-value-__root_value]').should('contain.text', 'true');
  cy.get('[data-testid=data-property-value-__root_value] [type=checkbox]').click({ force: true });
  cy.get('[data-testid=data-property-value-__root_value]').should('contain.text', 'false');
  cy.iframe('#target').contains('primitiveVal false');
  cy.iframe('#target').find('[data-testid=reset-primitive-store]').click();
  cy.get('[data-testid=data-property-value-__root_value]').should('contain.text', 'false');
});
it('object store - should populate data, allow edits and receive state updates when selected', () => {
  cy.visit('/simulator?target=v3.html');
  cy.get('[data-testid=tab-link-stores]').click();
  cy.get('[data-testid=store-name]').contains('sampleStore').click();
  cy.get('[data-testid=data-property-name-nested]').should('be.visible');
  cy.get('[data-testid=data-property-value-nested]').should('contain.text', 'Object');
  cy.get('[data-testid=data-property-value-nested]').click();
  cy.get('[data-testid=data-property-name-array]').should('be.visible');
  cy.get('[data-testid=data-property-value-array]').should('contain.text', 'Array[2]');
  cy.get('[data-testid=data-property-name-on]').should('be.visible');
  cy.get('[data-testid=data-property-value-on]').should('contain.text', 'false');
  cy.get('[data-testid=data-property-value-on] [type=checkbox]').click({ force: true });
  cy.get('[data-testid=data-property-value-on]').should('contain.text', 'true');
  cy.iframe('#target').contains('sampleStore.on true');
  cy.iframe('#target').find('[data-testid=reset-nested-store]').click();
  cy.get('[data-testid=data-property-value-nested]').should('contain.text', 'Array[0]');
});
