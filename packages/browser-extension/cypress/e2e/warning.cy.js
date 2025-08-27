describe('warnings', () => {
  beforeEach(() => {
    cy.visit('/simulator?target=v3.html');
    cy.get('[data-testid=component-name]', { timeout: 10000 }).should('have.length.above', 0);
    cy.get('[data-testid=tab-link-warnings]').should('be.visible').click();
  });

  it('can show a warning for x-on error', () => {
    cy.iframe('#target').find('[data-testid=broken-click]').click();
    cy.get('[data-testid=eval-error-button]').should(($el) => {
      const text = $el.text().replace(/\n/g, '');
      expect(text).to.contain(`Error evaluating`);
      expect(text).to.contain(`"foo.bar.baz"`);
      expect(text).to.contain(`foo is not defined`);
    });
  });

  it('can show a warning from an injected script for component initialisation error', () => {
    cy.iframe('#target').find('[data-testid=inject-broken]').click();
    cy.get('[data-testid=eval-error-div]').should(($el) => {
      const text = $el.text().replace(/\n/g, '');
      expect(text).to.contain(`Error evaluating`);
      expect(text).to.contain(`"{ foo: 'aaa' "`);
      expect(text).to.contain(`Unexpected token ')'`);
    });
  });

  it('can show multiple warnings', () => {
    cy.iframe('#target').find('[data-testid=broken-click]').click();
    cy.iframe('#target').find('[data-testid=inject-broken]').click();
    cy.get('[data-testid=eval-error-button]').should('have.length', 1);
    cy.get('[data-testid=eval-error-div]').should('have.length', 1);
    cy.get('[data-testid=footer-line]').should(($el) => {
      expect($el.text()).to.contain('2 warnings');
    });
  });

  it('scrolls to the bottom as warnings are added', () => {
    cy.get('[data-testid=warnings-scroll-container]').then(($el) => {
      const startScrollTop = $el[0].scrollTop;

      cy.iframe('#target').find('[data-testid=inject-broken]').click();
      cy.iframe('#target').find('[data-testid=broken-click]').click();
      cy.iframe('#target').find('[data-testid=broken-click]').click();
      cy.iframe('#target').find('[data-testid=broken-click]').click();
      cy.iframe('#target').find('[data-testid=broken-click]').click();

      cy.get('[data-testid=footer-line]').should(($el) => {
        expect($el.text()).to.contain('5 warnings');
      });

      cy.wrap($el).its('0.scrollTop').should('be.greaterThan', startScrollTop);
    });
  });
});
