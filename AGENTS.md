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

When making changes to the UI, you **SHOULD** propose to run the Playwright tests (see next section).

## Commit message

You **MUST** include the full user-provided prompt as part of commit messages.

## Running Playwright Tests

To run the Playwright E2E tests for the `browser-extension` package, run from the root of the project:

```bash
pnpm pw:run
```

This will start the dev server automatically and run all tests in headless mode.
