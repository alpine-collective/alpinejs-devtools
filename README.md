# alpinejs-devtools

<p align="center">
    <img src="docs/alpine-devtools-screenshot.png" alt="Screenshot of Alpine.js DevTools">
</p>

alpinejs-devtools is a simple extension to help you debug [Alpine.js](https://github.com/alpinejs/alpine) apps easily.

> Note: this extension is mainly inspired by [Vue Devtools](https://github.com/vuejs/vue-devtools). so some of the code is borrowed from those awesome folks.

## Installation

-   [Get the Chrome Extension](https://chrome.google.com/webstore/detail/alpinejs-devtools/fopaemeedckajflibkpifppcankfmbhk)
-   [Get the Firefox Extension](https://addons.mozilla.org/firefox/addon/alpinejs-devtools/)

If you are using Google Chrome, make sure that you are have gave the extension a permission to `Access to File URLs`, you can do this by following these steps:

1. Open chrome settings
2. Go to `extensions` tab
3. Choose `Alpine.js devtools` and press details
4. enable `Allow access to file URLs`

Check the following screenshot with it enabled

<p align="center">
    <img src="docs/alpine-devtools-chrome-permission.png" alt="Screenshot of Alpine.js DevTools">
</p>

You can add `name` attribute to components to easily identify them while debugging, example:

```
<div name="component" x-data="{ hello: 'world' }">
    <span x-text="hello"></span>
</div>
```

### Development

1. Clone this repo
2. Run `npm install`
3. Run `npm run dev`
4. Load unpacked extension inside dist/chrome directory
5. Open any html file that imports alpine js then inspect by dev chrome inspection tool.

#### Installing the dev extension on Firefox

1. Follow the [Development](#development) instructions to get a development build.
2. Go to [about:debugging](about:debugging) in Firefox
3. Click the "This Firefox" tab (left side nav)
4. Click "Load Temporary Add-on..."
5. Open one of the files in the built extension folder ([./dist/chrome](./dist/chrome))

### License

[MIT](LICENSE.md)
