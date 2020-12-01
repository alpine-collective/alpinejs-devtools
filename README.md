# Alpine.js Devtools

![Screenshot of Alpine.js DevTools](docs/alpine-devtools-screenshot.png)

Alpine.js Devtools is a simple extension to help you debug [Alpine.js](https://github.com/alpinejs/alpine) apps easily.

> Note: this extension is heavily inspired by [Vue Devtools](https://github.com/vuejs/vue-devtools), some of the setup/code is borrowed from those awesome folks.

## Installation

-   [Get the Chrome Extension](https://chrome.google.com/webstore/detail/alpinejs-devtools/fopaemeedckajflibkpifppcankfmbhk)
-   [Get the Firefox Extension](https://addons.mozilla.org/firefox/addon/alpinejs-devtools/)

**Note:** if you are using Google Chrome, Alpine Devtools won't work with local files unless you configure the extension to be allowed `Access to File URLs`. You can allow it by following these steps:

1. Open chrome settings
2. Go to `extensions` tab
3. Choose `Alpine.js devtools` and press details
4. Enable `Allow access to file URLs`

Check the following screenshot with it enabled:

![Allow access to file URLs permission](docs/alpine-devtools-chrome-permission.png)

## Identifying Components

Unlike other frameworks, Alpine doesn't include named components. Therefore by default, Alpine DevTools will attempt to identify component names from the following attributes, in order: `id`, `name`, `aria-label`, `x-data` (the function name), `role`, and finally the `tagName`.

> You may also override these with either `x-title` or `x-id`.

## Development

### Chrome

1. Clone this repo
2. Run `npm install`
3. Run `npm run build:dev` (or `npm run build` to test a production build)
4. Load unpacked extension inside [dist/chrome](./dist/chrome) directory
5. Open any html file that imports Alpine.js then inspect with Chrome Devtools, you'll have an Alpine.js panel available.

### Firefox

1. Follow the [Development](#development) instructions to get a development build.
2. Go to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) in Firefox
3. Ensure you're on the "This Firefox" tab (see the left side nav)
4. Click "Load Temporary Add-on..."
5. Open any of the files in the built extension folder ([./dist/chrome](./dist/chrome))
6. Open any html file that imports Alpine.js then inspect with Firefox Devtools, you'll have an Alpine.js panel available.

#### Running the Alpine.js Devtools Simulator

A devtools simulator is provided in order to run tests and have an easier development workflow.

Note that when using the simulator all Chrome/Firefox Devtools/Extension APIs are faked so it's useful if working on the Extension Backend (which runs in the end user's window, see `packages/shell-chrome/src/backend.js`) or the Alpine.js app which runs in the Devtools Panel (entrypoint: `packages/shell-chrome/src/devtools/app.js`).

1. Clone this repo
2. Run `npm install`
3. Run `npm start`
4. Open [http://locahost:8080](http://locahost:8080) (default port is 8080, you can override the port using the `PORT` environment variable eg. `PORT=5000 npm start` will start the simulator on [http://localhost:5000](http://localhost:5000))
5. You'll see a page with our sample Alpine.js app, [example.html](./packages/simulator/example.html), running in the top half of the screen and the [devtools simulator](./packages/simulator/dev.js) running in the bottom half of the screen.

#### Testing

We have 2 levels of tests in the project:

-   unit tests in [./tests](./tests), written and run with [Jest](https://jestjs.io)
    -   The command to run them is `npm test`.
-   E2E tests that run against the Devtools simulator, in [./cypress](./cypress), using [Cypress](https://cypress.io).
    -   The command to run Cypress tests is `npm run cy:run`
    -   The command to open the Cypress UI is `npm run cy:open`
    -   **Note** in order to run any Cypress tests, you'll need the simulator running (see [Running the Alpine.js Devtools Simulator](#running-the-alpinejs-devtools-simulator)).

#### Formatting/Linting

Code is auto-formatted using Prettier, see the config at [.prettierrc.js](./.prettierrc.js).

On push, a GitHub Action will auto-format your changes.

On commit, there's a husky + lint-staged hook that runs and auto-formats your changes (unless you disable pre-commit hooks).

## License

[MIT](LICENSE.md)
