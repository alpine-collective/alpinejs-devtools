/// <reference types="cypress" />
/// <reference types="cypress-iframe" />

describe('Trial Mode', () => {
  it('should handle the trial mode flow correctly', () => {
    cy.visit('/simulator?sa-enabled=true');

    // After trial starts
    cy.get('[data-testid="tab-link-stores"]').click();

    cy.get('.grid').should('contain.text', 'The Stores feature is part of our');
    cy.get('[data-testid="start-trial-button"]')
      .should('exist')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[data-testid="start-trial-button"]').should('have.text', 'Start 7 day trial');

    // cy.get('[data-testid="tab-link-warnings"]').click();
    // cy.get('[data-testid="no-warnings-message"]').should('not.exist');
    // cy.get('[data-testid="start-trial-button"]')
    //   .should('exist')
    //   .scrollIntoView()
    //   .should('be.visible');
    // cy.get('[data-testid="start-trial-button"]').should('have.text', 'Start 7 day trial');

    cy.get('[data-testid="start-trial-button"]').click();
    cy.get('[data-testid="start-trial-button"]').should('not.exist');
    // cy.get('[data-testid="no-warnings-message"]').should('be.visible');

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
    cy.get('[data-testid="get-access-button"]').should('exist');

    // cy.get('[data-testid="tab-link-warnings"]').click();
    // cy.get('[data-testid="get-access-button"]').should('exist');
  });
});
