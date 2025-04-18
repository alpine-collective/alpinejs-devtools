const { defineConfig } = require('cypress')

module.exports = defineConfig({
    video: false,
    fixturesFolder: false,
    chromeWebSecurity: false,
    retries: {
        runMode: 1,
    },

    e2e: {
        experimentalRunAllSpecs: true,
        // TODO: when reworking the tests, we should do 1 test -> multiple assertions
        testIsolation: false,
        setupNodeEvents(on, config) {},
        baseUrl: 'http://localhost:8080',
    },
})
