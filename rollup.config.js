import filesize from 'rollup-plugin-filesize'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import serve from 'rollup-plugin-serve'
import pkg from './package.json'
import { dependencies } from './package-lock.json'

import fs from 'fs'
import path from 'path'
import write from 'write'

import * as edge from 'edge.js'
edge.registerViews(path.join(__dirname, './packages/shell-chrome/views'))
const renderTemplate = () => {
    let template = edge.render('master')

    if (process.env.NODE_ENV === 'production') {
        return template.replace(/:data-testid="[^"]*"/g, '')
    }

    write.sync('./dist/chrome/panel.html', template)
}
renderTemplate()

const isWatch = process.env.ROLLUP_WATCH === 'true'
if (isWatch) {
    fs.watch('./packages/shell-chrome/assets', { recursive: true }, (_event, filename) => {
        try {
            console.info(`Copying asset "${filename}" to dist/chrome`)
            fs.copyFileSync(
                path.join('./packages/shell-chrome/assets/', filename),
                path.join('./dist/chrome', filename),
            )
        } catch (e) {
            console.error(e)
        }
    })

    fs.watch('./packages/shell-chrome/views', { recursive: true }, (_event, filename) => {
        try {
            console.info(`View "${filename}" updated. Rendering template to dist/chrome`)

            renderTemplate()
        } catch (e) {
            console.error(e)
        }
    })
}

const JS_INPUTS = [
    'packages/shell-chrome/src/backend.js',
    'packages/shell-chrome/src/background.js',
    'packages/shell-chrome/src/devtools-background.js',
    'packages/shell-chrome/src/proxy.js',
    'packages/shell-chrome/src/detector.js',
]

const MIXED_INPUT = ['packages/shell-chrome/src/devtools/panel.js']
if (isWatch) {
    MIXED_INPUT.push('packages/simulator/dev.js')
}

export default [
    // create standalone builds to avoid rollup creating a common "utils" chunk
    ...JS_INPUTS.map((input) => ({
        input,
        output: {
            dir: 'dist/chrome',
        },
        plugins: [
            replace({
                __alpine_version__: dependencies.alpinejs.version,
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
            resolve(),
            filesize(),
        ],
    })),
    ...MIXED_INPUT.map((input) => ({
        input,
        output: {
            dir: 'dist/chrome',
        },
        plugins: [
            replace({
                __alpine_version__: dependencies.alpinejs.version,
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
            resolve(),
            postcss({
                extract: 'styles.css',
            }),
            copy({
                targets: [
                    {
                        src: 'packages/shell-chrome/assets/**/*',
                        dest: 'dist/chrome',
                    },
                    {
                        src: 'packages/shell-chrome/assets/manifest.json',
                        dest: 'dist/chrome',
                        // inject version into manifest
                        transform(contents) {
                            return contents.toString().replace('__version__', pkg.version)
                        },
                    },
                ],
            }),
            filesize(),
            isWatch &&
                serve({
                    port: process.env.PORT || 8080,
                    contentBase: ['./dist/chrome', './packages/simulator', './node_modules/alpinejs/dist'],
                }),
        ],
    })),
]
