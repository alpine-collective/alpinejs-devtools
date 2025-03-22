# Manifest v3 compatible devtools

Todo:

- [x] switch to Preact or other signal-supporting system ~~(Vue?)~~ Solid
  - [x] update build pipeline
- [x] setup manifest.json v3
- [x] get a simulator running
- [x] messaging
- [x] detector -> content
  - [x] content -> background (service_worker)
  - [x] panel -> background connection
- [ ] select 1 Cypress scenario and get it working
  - content runs on page and has access to Chrome Ext APIs, it injects detector
  - background = service worker
- [x] detection popup
- [ ] disable things that aren't implemented (eg. warnings tab, "latest version" loading)
- [ ] Tab links/switching between tabs (components vs warnings, stores)

Using [Solid](https://solidjs.com) since Alpine.js is disallowed (unsafe eval is not allowed in panels in Manifest v3).

```bash
$ npm install
```

## Available Scripts

In the project directory, you can run:

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run build`

Builds the app for production to the roo `dist` folder.
