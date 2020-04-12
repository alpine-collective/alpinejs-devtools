const mix = require("laravel-mix");
const glob = require("glob-all");
const purgecss = require("purgecss-webpack-plugin");
/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix
  .js("packages/shell-chrome/src/background.js", "dist/chrome/background.js")
  .js("packages/shell-chrome/src/devtools-background.js", "dist/chrome/devtools-background.js")
  .js("packages/shell-chrome/src/backend.js", "dist/chrome/backend.js")
  .js("packages/shell-chrome/src/panel.js", "dist/chrome/panel.js")
  .js("packages/shell-chrome/src/proxy.js", "dist/chrome/proxy.js")
  .js("packages/shell-chrome/src/detector.js", "dist/chrome/detector.js");

  mix.postCss('packages/shell-chrome/src/style.css', 'dist/chrome/style.css', [
    require('tailwindcss'),
  ])

if (mix.inProduction()) {
  mix.webpackConfig({
      plugins: [
          new purgecss({
              paths: glob.sync([
                path.join(__dirname, "packages/shell-chrome/assets/*.html"),
              ]),
              extractors: [
                  {
                      extractor: content => content.match(/[A-z0-9-:\/]+/g),
                      extensions: ["html"]
                  }
              ]
          })
      ]
  });
}

mix.copy('packages/shell-chrome/assets', 'dist/chrome');

mix.disableNotifications();
