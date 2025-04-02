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
- [x] select ~~1~~ ~~12~~ ~~17~~ ~~25~~ ~~29~~ 34 (**all**) Cypress scenarios and get them working
  - content runs on page and has access to Chrome Ext APIs, it injects detector
  - background = service worker
- [x] detection popup
- [x] disable things that aren't implemented (eg. warnings tab, "latest version" loading)
- [x] tab links/switching between tabs (components vs warnings, stores)
- [x] stores
- [x] look into component refresh issues (find a repro)
  - fixed issue with port disconnection
  - fixed issue with backend.js re-injection
    - 1. open page 2. open devtools 3. **dont select a component** 4. reload page (with devtools still open) 4. select a component -> didn't load data, now fixed
- [x] go to elements tab at root element from component
- [x] reinstate warnings (display v3 warnings works v3.5.0 onwards)
- [x] fix performance issue with large $data (eg. nested object yielding 11k data properties)

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

Builds the app for production to the root `dist` folder.
