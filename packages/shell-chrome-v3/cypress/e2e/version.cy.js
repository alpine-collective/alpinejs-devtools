const { AlpineVersion } = require('../support/e2e');

function overrideAlpineVersion(win, versionToOverride = undefined) {
  const postMessage = win.postMessage.bind(win);
  win.postMessage = (...args) => {
    const [message, ...rest] = args;
    // intercept "set-version"
    if (message.payload && message.payload.type === 'set-version') {
      message.payload.version = versionToOverride;
      postMessage(message, ...rest);
      return;
    }
    postMessage(...args);
  };
}

it.skip('should display link + message for undefined outdated Alpine version (pre 2.3.1)', () => {
  cy.visit('/simulator', {
    onBeforeLoad(win) {
      overrideAlpineVersion(win, undefined);
    },
  })
    .window()
    .its('Alpine.version')
    .should('equal', AlpineVersion)
    .get('[data-testid=version-line]')
    .should('have.attr', 'title', `Latest Version: ${AlpineVersion}`)
    .should('contain', '<v2.3.1')
    .get('[data-testid=version-line] a')
    .should('have.attr', 'href', 'https://github.com/alpinejs/alpine/releases');
});

it.skip('should display link + message for outdated version', () => {
  cy.visit('/simulator', {
    onBeforeLoad(win) {
      overrideAlpineVersion(win, '2.6.0');
    },
  })
    .window()
    .its('Alpine.version')
    .should('equal', AlpineVersion)
    .get('[data-testid=version-line]')
    .should('have.attr', 'title', `Latest Version: ${AlpineVersion}`)
    .should('contain', 'v2.6.0')
    .get('[data-testid=version-line] a')
    .should('have.attr', 'href', 'https://github.com/alpinejs/alpine/releases');
});

it.skip('should display message for up to date version of Alpine.version', () => {
  cy.visit('/simulator', {
    onBeforeLoad(win) {
      overrideAlpineVersion(win, AlpineVersion);
    },
  })
    .window()
    .its('Alpine.version')
    .should('equal', AlpineVersion)
    .get('[data-testid=version-line]')
    .should('have.attr', 'title', `Latest Version`)
    .should('contain', `v${AlpineVersion}`)
    .get('[data-testid=version-line] a')
    .should('have.attr', 'href', '#');
});

it.skip('should display message for future Alpine versions', () => {
  cy.visit('/simulator', {
    onBeforeLoad(win) {
      overrideAlpineVersion(win, '4.0.0');
    },
  })
    .window()
    .its('Alpine.version')
    .should('equal', AlpineVersion)
    .get('[data-testid=version-line]')
    .should('have.attr', 'title', `Latest Version`)
    .should('contain', 'v4.0.0')
    .get('[data-testid=version-line] a')
    .should('have.attr', 'href', '#');
});

it.skip('should display message with latest Alpine version from npm registry', () => {
  cy.visit('/simulator', {
    onBeforeLoad(win) {
      overrideAlpineVersion(win, '4.0.0');
    },
  })
    .intercept('GET', 'https://registry.npmjs.com/alpinejs', {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:8080',
      },
      body: {
        'dist-tags': {
          latest: '5.0.0',
        },
      },
    })
    .as('registryRequest')
    .window()
    .its('Alpine.version')
    .should('equal', AlpineVersion)
    .wait('@registryRequest')
    .get('[data-testid=version-line]')
    .should('have.attr', 'title', `Latest Version: 5.0.0`)
    .should('contain', 'v4.0.0')
    .get('[data-testid=version-line] a')
    .should('have.attr', 'href', 'https://github.com/alpinejs/alpine/releases');
});
