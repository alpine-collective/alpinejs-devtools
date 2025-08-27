/// <reference types="cypress" />
/// <reference types="cypress-iframe" />

describe('License Activation', () => {
  it('should handle the license activation flow successfully', () => {
    cy.visit('/simulator?sa-enabled=true');

    // Expire trial via debug menu
    cy.get('[data-testid="debug-menu-button"]').click();
    cy.get('[data-testid="expire-trial-button"]').click();
    cy.reload();

    // After trial expires
    cy.get('[data-testid="footer-left"]').contains('Trial expired').should('be.visible');

    // Go to the stores tab to find the activation button
    cy.get('[data-testid="tab-link-stores"]').click();

    // Activate license
    cy.get('[data-testid="activate-license-button"]').click();
    cy.get('[data-testid="license-key-input"]').type('VALID-LICENSE-KEY');
    cy.get('[data-testid="activate-button"]').click();

    // Check that stores are now visible
    cy.get('[data-testid="tab-link-stores"]').click();
    cy.get('[data-testid=store-name]').should('have.length', 2);
    cy.get('[data-testid=store-name]').contains('sampleStore').should('be.visible');
    cy.get('[data-testid=store-name]').contains('primitiveVal').should('be.visible');
    cy.get('[data-testid="footer-left"]').should('not.contain.text', 'Trial');
  });

  it('should handle an invalid license key error during activation', () => {
    cy.visit('/simulator?sa-enabled=true');

    // Expire trial via debug menu
    cy.get('[data-testid="debug-menu-button"]').click();
    cy.get('[data-testid="expire-trial-button"]').click();
    cy.reload();

    // After trial expires
    cy.get('[data-testid="footer-left"]').contains('Trial expired').should('be.visible');

    // Go to the stores tab to find the activation button
    cy.get('[data-testid="tab-link-stores"]').click();

    // Attempt to activate with an invalid license
    cy.get('[data-testid="activate-license-button"]').click();
    cy.get('[data-testid="license-key-input"]').type('INVALID-LICENSE-KEY');
    cy.get('[data-testid="activate-button"]').click();

    // Check for error message
    cy.get('[data-testid="license-error-message"]')
      .should('be.visible')
      .and('contain.text', 'This license key is not valid.');

    // Close the dialog by clicking the close button
    cy.get('dialog[open] [aria-label="Close dialog"]').click();

    // Check that stores are still not visible
    cy.get('[data-testid="tab-link-stores"]').click();
    cy.get('[data-testid="get-access-button"]').should('exist');
    cy.get('[data-testid="footer-left"]').contains('Trial expired').should('be.visible');
  });
});
