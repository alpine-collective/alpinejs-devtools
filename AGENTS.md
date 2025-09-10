# Alpine.js Devtools

The main application to work on is in `packages/browser-extension`. This is a Chrome/Firefox extension using Manifest v3. The panel is built with SolidJS.

We want to support Safari in the future.

## Coding style

You **MUST** leave signals outside of components.
Components **SHOULD** import signals directly, rather than receiving them as props.

## Styling

This project uses Tailwind CSS v4. You can find the configuration in `tailwind.config.js`.

We also use `basecoat-ui` for some base styles. You can find more information about it here: https://basecoatui.com/kitchen-sink/, based on possible elements you should look at the code on their individual documentation page eg. for Badge, use https://basecoatui.com/components/badge/ and so on.

## Required plan steps

As the last step of any plan, you **MUST** run the following checks and ensure they pass

- `pnpm run format` (run formatter)
- `pnpm run typecheck`
- `pnpm t` (unit tests)

When making changes to the UI, you **SHOULD** propose to run the cypress tests (see next section).

## Commit message

You **MUST** include the full user-provided prompt as part of commit messages.

## Running Cypress Tests

To run the Cypress tests for the `browser-extension` package, you **SHOULD** use the `jules-test` script. This script will start the development server and then run the tests.

To run the Cypress tests you **MUST** run from the root of the project (`/app` for Jules),

```bash
pnpm test:e2e
```

**Note for agent Jules:** You **SHOULD** be aware that when working in the shell, the current working directory is often `/app/packages/browser-extension`. If you are having trouble with file paths, you **SHOULD** run `pwd` to confirm your location.

This will run all the Cypress tests in headless mode.

**Note:** If you are running the tests in a headless environment, you **SHOULD** be aware that you may need to install `xvfb`. On Debian-based systems, you can install it with:

```bash
sudo apt-get update && sudo apt-get install -y xvfb
```
