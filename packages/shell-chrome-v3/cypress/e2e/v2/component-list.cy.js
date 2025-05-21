it('v2 - should get names of components', () => {
  cy.visit('/simulator?target=example.html')
    .get('[data-testid=component-name]')
    .should('be.visible')
    .should('contain.text', 'div')
    .should('contain.text', 'app')
    .should('contain.text', 'myFn')
    .should('contain.text', 'component')
    .should('contain.text', 'combobox');
});

it('v2 - should create globals + add annotation for each component', () => {
  cy.visit('/simulator?target=example.html')
    .get('[data-testid=component-name]')
    .should('be.visible');

  let win;
  cy.frameLoaded('#target').then(() => {
    win = cy.$$('#target').get(0).contentWindow;
  });

  cy.iframe('#target')
    .find('[x-data]')
    .then((components) => {
      components.each((i, component) => {
        expect(win[`$x${i}`].$el).to.equal(component);
        expect(win[`$x${i}`]).to.equal(component.__x);
      });
      return components.length;
    })
    .then((componentCount) => {
      cy.get('[data-testid="console-global"]')
        .should('contain.text', '= $x0')
        .should('have.attr', 'data-tooltip', 'Available as $x0 in the console')
        .should('contain.text', '= $x1')
        .should('contain.text', '= $x2')
        .should('contain.text', '= $x3')
        .should('contain.text', '= $x4')
        .should('contain.text', `= $x${componentCount - 1}`);
    });
});

it('v2 - should handle adding and removing new components', () => {
  cy.visit('/simulator?target=example.html')
    .get('[data-testid=component-name]')
    .should('have.length.above', 0)
    .then((components) => {
      const length = components.length;
      cy.iframe('#target').find('[data-testid=add-component-button]').click();
      cy.get('[data-testid=component-name]').should('have.length', length + 1);
    })
    .then((components) => {
      cy.iframe('#target').find('[data-testid=delete-component-button]').click();
      cy.get('[data-testid=component-name]').should('have.length', components.length - 1);
    });
});

it('v2 - should handle replacing a component and keep its listed position', () => {
  let currentIndex = -1;
  cy.visit('/simulator?target=example.html')
    .get('[data-testid=component-name]')
    .should('have.length.above', 0)
    .then(() => cy.contains('Replaceable').invoke('index'))
    .then((index) => (currentIndex = index))
    .then(() => {
      cy.iframe('#target').find('[data-testid=replace-component-button]').click();
      cy.get('[data-testid=component-name]');
    })
    .then(() => cy.contains('Span').invoke('index'))
    .then((index) => expect(currentIndex).to.equal(index));
});

it('v2 - should add/remove hover overlay on component mouseenter/leave', () => {
  cy.visit('/simulator?target=example.html');
  // check overlay works for first component
  cy.get('[data-testid=component-container]').first().should('be.visible');
  cy.get('[data-testid=component-container]').first().trigger('mouseenter');

  cy.iframe('#target').find('[data-testid=hover-element]').should('be.visible');

  cy.iframe('#target')
    .find('[data-testid=hover-element]')
    .should(($el) => {
      expect($el.attr('style')).to.contain('position: absolute;');
      expect($el.attr('style')).to.contain('background-color: rgba(104, 182, 255, 0.35);');
      expect($el.attr('style')).to.contain('border-radius: 4px;');
      expect($el.attr('style')).to.contain('z-index: 9999;');
    })
    .then(($el) => {
      cy.iframe('#target')
        .find('[x-data]')
        .first()
        .then(($appEl) => {
          const { left, top, width, height } = $appEl[0].getClientRects()[0];

          expect($el.attr('style')).to.contain(`width: ${width}px;`);
          expect($el.attr('style')).to.contain(`height: ${height}px;`);
          expect($el.attr('style')).to.contain(`top: ${top}px;`);
          expect($el.attr('style')).to.contain(`left: ${left}px;`);
        });
    });

  // check overlay works for last component
  cy.get('[data-testid=component-container]').last().trigger('mouseleave');

  cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist');

  cy.get('[data-testid=component-container]').last().trigger('mouseenter');

  cy.iframe('#target').find('[data-testid=hover-element]').should('be.visible');

  cy.iframe('#target')
    .find('[data-testid=hover-element]')
    .should(($el) => {
      expect($el.attr('style')).to.contain('position: absolute;');
      expect($el.attr('style')).to.contain('background-color: rgba(104, 182, 255, 0.35);');
      expect($el.attr('style')).to.contain('border-radius: 4px;');
      expect($el.attr('style')).to.contain('z-index: 9999;');
    });

  cy.get('[data-testid=component-container]').last().trigger('mouseleave');
  cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist');

  // check overlay disappears on `shutdown`
  // cy.get('[data-testid=component-container]').first().trigger('mouseenter');
  //
  // cy.iframe('#target').find('[data-testid=hover-element]').should('be.visible');
  //
  // cy.window().then((win) => {
  //   win.postMessage({
  //     source: 'alpine-devtools-proxy', // keep in sync with ALPINE_DEVTOOLS_PROXY_SOURCE
  //     payload: 'shutdown',
  //   });
  // });
  // cy.iframe('#target').find('[data-testid=hover-element]').should('not.exist');
});

it('v2 - should support selecting/unselecting a component', () => {
  cy.visit('/simulator?target=example.html');

  cy.get('[data-testid=component-container]').last().click();
  cy.get('[data-testid=component-container]').should('have.class', 'text-white bg-alpine-300');

  cy.get('[data-testid=component-container]').first().click();

  cy.get('[data-testid=component-container]')
    .first()
    .should('have.class', 'text-white bg-alpine-300');
  cy.get('[data-testid=component-container]')
    .last()
    .should('not.have.class', 'text-white bg-alpine-300');
});

it('v2 - should display message with number of components watched', () => {
  cy.visit('/simulator?target=example.html')
    .get('[data-testid=component-name]')
    .should('have.length.above', 0)
    .then((components) => {
      cy.get('[data-testid=footer-line]').then(($el) => {
        expect($el.text()).to.contain('Watching');
        expect($el.text()).to.contain(
          `${components.length} ${components.length > 1 ? 'components' : 'component'}`,
        );
      });
    });
});
