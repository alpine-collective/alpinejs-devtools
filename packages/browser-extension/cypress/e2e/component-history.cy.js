describe('History', () => {
  it('should display "history", open the flyout and display messages when clicked', () => {
    cy.visit('/simulator?target=v3.html', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'language', { value: 'en-US' });
      },
    })
      .get('[data-testid=component-name]')
      .should('be.visible');
    const now = new Date();
    const formattedHourMinute = now.toLocaleTimeString('en-US').split(':').slice(0, 2).join(':');

    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Setup
    cy.get('[data-testid=component-name]').contains('model-no-render').click();

    cy.get('[data-testid=history-flyout]').contains('History').should('be.visible');

    cy.get('[data-testid=history-flyout]').contains('History').click();

    // Message is visible and displays information as expected
    cy.get('[data-testid=history-message-0]').should('be.visible');
    cy.get('[data-testid=history-message-0]').contains('+0ms').should('be.visible');
    cy.get('[data-testid=history-message-0]').contains(formattedHourMinute).should('be.visible');

    cy.iframe('#target').find('[data-testid=model-no-render]').should('be.visible').clear();

    cy.get('[data-testid=history-flyout] li').should('have.length', 2);

    cy.iframe('#target')
      .find('[data-testid=model-no-render]')
      .should('be.visible')
      .type('new', { delay: 20 });

    cy.get('[data-testid=history-flyout] li').should('have.length', 5);

    // selecting a snapshot displays right info
    cy.get('[data-testid=history-message-3]').click();

    cy.get('[data-testid=attr-list-header]')
      .should('be.visible')
      .should('contain.text', formattedDate)
      .should('contain.text', formattedHourMinute);
    cy.get('[data-testid=data-property-name-text]')
      .should('be.visible')
      .should('have.text', 'text');
    cy.get('[data-testid=data-property-value-text]')
      .should('be.visible')
      .should('have.text', '"ne"');

    // unselecting a snapshot reverts
    cy.get('[data-testid=history-message-3]').click();

    cy.get('[data-testid=data-property-name-text]')
      .should('be.visible')
      .should('have.text', 'text');
    cy.get('[data-testid=data-property-value-text]')
      .should('be.visible')
      .should('have.text', '"new"');

    cy.get('[data-testid=apply-snapshot]').should('not.exist');

    // Apply snapshot
    cy.get('[data-testid=history-message-3]').click();

    cy.get('[data-testid=apply-snapshot]').should('be.visible');
    cy.get('[data-testid=apply-snapshot]').click();

    cy.iframe('#target')
      .find('[data-testid=model-no-render]')
      .should('be.visible')
      .should('have.value', 'ne');
  });

  it('pinning a field works across messages', () => {
    cy.visit('/simulator?target=v3.html').get('[data-testid=component-name]').should('be.visible');

    // Setup
    cy.get('[data-testid=component-name]').contains('model-no-render').click();

    cy.get('[data-testid=history-flyout]').contains('History').should('be.visible');

    cy.get('[data-testid=history-flyout]').contains('History').click();

    cy.iframe('#target')
      .find('[data-testid=nested-model-no-render]')
      .should('be.visible')
      .clear()
      .type('new', { delay: 0 });

    cy.get('[data-testid=history-flyout] li').should('have.length', 3);

    // Setup the "pin"
    cy.get('[data-testid=history-message-0]').click();

    cy.get('[data-testid=data-property-name-model]').click();
    cy.get('[data-testid=data-property-name-nested')
      .should('be.visible')
      .should('have.text', 'nested');
    cy.get('[data-testid=data-property-value-nested')
      .should('be.visible')
      .should('have.text', '"nested-initial"');

    cy.get('[data-testid="pin-model.nested"]').should('be.visible').should('have.text', '(pin)');
    cy.get('[data-testid="pin-model.nested"]').click();

    cy.get('[data-testid=data-property-name-text').should('not.exist');
    cy.get('[data-testid=apply-snapshot]').should('be.visible');

    cy.get('[data-testid=history-message-1]').click();
    cy.get('[data-testid=data-property-name-text').should('not.exist');
    cy.get('[data-testid=data-property-name-nested')
      .should('be.visible')
      .should('have.text', 'nested');
    cy.get('[data-testid=data-property-value-nested')
      .should('be.visible')
      .should('have.text', '""');

    cy.get('[data-testid="unpin-model.nested"]').click();

    cy.get('[data-testid=data-property-name-text').should('be.visible');
  });

  it('opening attributes syncs across live component data and messages', () => {
    cy.visit('/simulator?target=v3.html').get('[data-testid=component-name]').should('be.visible');

    // Setup
    cy.get('[data-testid=component-name]').contains('model-no-render').click();

    cy.get('[data-testid=history-flyout]').contains('History').should('be.visible');

    cy.get('[data-testid=history-flyout]').contains('History').click();

    cy.iframe('#target')
      .find('[data-testid=nested-model-no-render]')
      .should('be.visible')
      .clear()
      .type('new', { delay: 0 });

    cy.get('[data-testid=history-flyout] li').should('have.length', 3);

    // open attr in "component live data view"
    cy.get('[data-testid=data-property-name-model]').click();
    cy.get('[data-testid=data-property-name-nested')
      .should('be.visible')
      .should('have.text', 'nested');

    // select a message
    cy.get('[data-testid=history-message-2]').click();

    cy.get('[data-testid=data-property-name-nested')
      .should('be.visible')
      .should('have.text', 'nested');
    // opened attr is maintained
    cy.get('[data-testid=data-property-value-nested')
      .should('be.visible')
      .should('have.text', '"new"');

    // close attr from "message view"
    cy.get('[data-testid=data-property-name-model').click();
    cy.get('[data-testid=data-property-name-nested').should('not.exist');

    // TODO: syncing message "open" state back to "component view" doesn't work
    // would need refactoring to maintain accurate "openAttrs" globally for messages
    // and component.

    // // unselect message
    // cy.get('[data-testid=history-message-2]').click();

    // // should be "live data view"
    // cy.get('[data-testid=apply-snapshot]').should('not.exist');
    // // close should have synced
    // cy.get('[data-testid=data-property-name-nested').should('not.exist');
  });
});
