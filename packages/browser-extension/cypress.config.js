import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  fixturesFolder: false,
  chromeWebSecurity: false,
  retries: {
    runMode: 2,
  },

  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:3000',
  },
});
