const { AlpineVersion } = require('../support/index')

function overrideVersion(win, versionToOverride = undefined) {
    const postMessage = win.postMessage.bind(win)
    win.postMessage = (...args) => {
        const [message, ...rest] = args
        // intercept "set-version"
        if (message.payload && message.payload.type === 'set-version') {
            message.payload.version = versionToOverride
            postMessage(message, ...rest)
            return
        }
        postMessage(...args)
    }
}

it('should display link + message for undefined outdated Alpine version (pre 2.3.1)', () => {
    cy.visit('/', {
        onBeforeLoad(win) {
            overrideVersion(win, undefined)
        },
    })
        .window()
        .its('Alpine.version')
        .should('equal', AlpineVersion)
        .get('#devtools-container')
        .get('.preload')
        .should('not.be.visible')
        .get('[data-testid=status-line]')
        .should('have.attr', 'title', `Latest Version: ${AlpineVersion}`)
        .should('contain', 'Alpine.js <v2.3.1 detected')
        .get('a')
        .should('have.attr', 'href', 'https://github.com/alpinejs/alpine/releases')
})

it('should display link + message for outdated version', () => {
    cy.visit('/', {
        onBeforeLoad(win) {
            overrideVersion(win, '2.6.0')
        },
    })
        .window()
        .its('Alpine.version')
        .should('equal', AlpineVersion)
        .get('#devtools-container')
        .get('.preload')
        .should('not.be.visible')
        .get('[data-testid=status-line]')
        .should('have.attr', 'title', `Latest Version: ${AlpineVersion}`)
        .should('contain', 'Alpine.js v2.6.0 detected')
        .get('a')
        .should('have.attr', 'href', 'https://github.com/alpinejs/alpine/releases')
})

it('should display message for up to date version of Alpine.version', () => {
    cy.visit('/', {
        onBeforeLoad(win) {
            overrideVersion(win, AlpineVersion)
        },
    })
        .window()
        .its('Alpine.version')
        .should('equal', AlpineVersion)
        .get('#devtools-container')
        .get('.preload')
        .should('not.be.visible')
        .get('[data-testid=status-line]')
        .should('have.attr', 'title', `Latest Version`)
        .should('contain', `Alpine.js v${AlpineVersion} detected`)
        .get('a')
        .should('have.attr', 'href', '#')
})

it('should display message for future Alpine versions', () => {
    cy.visit('/', {
        onBeforeLoad(win) {
            overrideVersion(win, '4.0.0')
        },
    })
        .window()
        .its('Alpine.version')
        .should('equal', AlpineVersion)
        .get('#devtools-container')
        .get('.preload')
        .should('not.be.visible')
        .get('[data-testid=status-line]')
        .should('have.attr', 'title', `Latest Version`)
        .should('contain', `Alpine.js v4.0.0 detected`)
        .get('a')
        .should('have.attr', 'href', '#')
})

it('should display message with latest Alpine version from npm registry', () => {
    cy.visit('/', {
        onBeforeLoad(win) {
            overrideVersion(win, '4.0.0')
        },
    })
        .intercept('https://registry.npmjs.com/alpinejs', {
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
        .get('#devtools-container')
        .get('.preload')
        .should('not.be.visible')
        .get('[data-testid=status-line]')
        .should('have.attr', 'title', `Latest Version: 5.0.0`)
        .should('contain', `Alpine.js v4.0.0 detected`)
        .get('a')
        .should('have.attr', 'href', 'https://github.com/alpinejs/alpine/releases')
})
