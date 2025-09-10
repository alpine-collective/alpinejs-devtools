/// <reference types="cypress" />
/// <reference types="cypress-iframe" />

describe('Trial Mode', () => {
  it('should handle the stores trial mode flow correctly', () => {
    cy.visit('/simulator?sa-enabled=true');

    cy.get('[data-testid="tab-link-stores"]').click();

    cy.get('.grid').should('contain.text', 'The Stores feature is part of our');
    cy.get('[data-testid="start-trial-button"]')
      .should('exist')
      .scrollIntoView()
      .should('be.visible');

    cy.get('[data-testid="start-trial-button"]').should('have.text', 'Start 7 day trial');
    cy.get('[data-testid="start-trial-button"]').click();
    cy.get('[data-testid="start-trial-button"]').should('not.exist');

    cy.get('[data-testid="tab-link-stores"]').click();
    cy.get('[data-testid=store-name]').should('have.length', 2);
    cy.get('[data-testid=store-name]').contains('sampleStore').should('be.visible');
    cy.get('[data-testid=store-name]').contains('primitiveVal').should('be.visible');
    cy.get('[data-testid="start-trial-button"]').should('not.exist');

    cy.get('[data-testid="footer-left"]')
      .contains('Trial expires in: 7.0 days')
      .should('be.visible');

    // Expire trial via debug menu
    cy.get('[data-testid="debug-menu-button"]').click();
    cy.get('[data-testid="expire-trial-button"]').click();

    cy.reload();
    // After trial expires
    cy.get('[data-testid="footer-left"]').contains('Trial expired').should('be.visible');

    cy.get('[data-testid="tab-link-stores"]').click();
    cy.get('[data-testid=get-access-button]').should('exist').scrollIntoView().should('be.visible');
  });

  it('should handle the warnings trial mode flow correctly', () => {
    cy.visit('/simulator?sa-enabled=true');

    cy.get('[data-testid="tab-link-warnings"]').should('be.visible').click();
    cy.iframe('#target')
      .find('[data-testid="broken-click"')
      .click()
      .click()
      .click()
      .click()
      .click();

    cy.get('[data-testid="eval-error-button"]').last().click();
    cy.get('[data-testid="eval-error-button"]').should('not.be.visible');
    cy.get('.grid').should('contain.text', 'The Warnings feature is part of our');

    cy.get('[data-testid="start-trial-button"]')
      .should('exist')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-testid="start-trial-button"]').should('have.text', 'Start 7 day trial');
    cy.get('[data-testid="start-trial-button"]').click();

    cy.get('[data-testid="eval-error-button"]').last().click();
    cy.get('[data-testid="eval-error-button"]').should('have.length', 5);

    cy.get('[data-testid="footer-left"]')
      .contains('Trial expires in: 7.0 days')
      .should('be.visible');

    // Expire trial via debug menu
    cy.get('[data-testid="debug-menu-button"]').click();
    cy.get('[data-testid="expire-trial-button"]').click();

    cy.reload();

    cy.get('[data-testid="tab-link-warnings"]').should('be.visible').click();
    cy.iframe('#target')
      .find('[data-testid="broken-click"')
      .click()
      .click()
      .click()
      .click()
      .click();

    // After trial expires
    cy.get('[data-testid="footer-left"]').contains('Trial expired').should('be.visible');

    cy.get('[data-testid="eval-error-button"]').last().click();
    cy.get('[data-testid="eval-error-button"]').should('not.be.visible');
    cy.get('[data-testid=get-access-button]').should('exist').scrollIntoView().should('be.visible');
  });

  it('should handle the history flyout trial mode flow correctly', () => {
    cy.visit('/simulator?sa-enabled=true&target=v3.html');

    // Setup
    cy.get('[data-testid=component-name]').contains('model-no-render').click();
    cy.get('[data-testid=history-flyout]').contains('History').click();

    // Interact with the page to generate history
    cy.iframe('#target').find('[data-testid=model-no-render]').should('be.visible').type('new');

    cy.get('[data-testid=history-flyout] li').should('have.length', 3);

    // First entry should be enabled
    cy.get('[data-testid=history-message-0]').click();
    cy.get('[data-testid=attr-list-header]').should('be.visible');

    // Subsequent entries should be disabled
    cy.get('[data-testid=history-message-1]').click();
    cy.get('[data-testid=early-access-notice]').should('be.visible');
    cy.get('[data-testid=early-access-notice]').should(
      'contain.text',
      'The Time Travel Debugging feature is part of our',
    );

    // Start trial
    cy.get('[data-testid="start-trial-button"]').click();

    // Entries should be unlocked
    cy.get('[data-testid=history-message-1]').click();
    cy.get('[data-testid=attr-list-header]').should('be.visible');
    cy.get('[data-testid=early-access-notice]').should('not.exist');

    // Expire trial
    cy.get('[data-testid="debug-menu-button"]').click();
    cy.get('[data-testid="expire-trial-button"]').click();

    cy.reload();

    cy.get('[data-testid=component-name]').contains('model-no-render').should('be.visible');

    // Interact with the page to generate history
    cy.iframe('#target').find('[data-testid=model-no-render]').should('be.visible').type('new');

    // Entries should be locked again
    cy.get('[data-testid=component-name]').contains('model-no-render').click();
    cy.get('[data-testid=history-flyout]').contains('History').click();
    cy.get('[data-testid=history-message-1]').click();
    cy.get('[data-testid=early-access-notice]').should('be.visible');
    cy.get('[data-testid=early-access-notice]').should('contain.text', 'Your trial has expired');
    cy.get('[data-testid=get-access-button]').should('exist').scrollIntoView().should('be.visible');
  });
});
