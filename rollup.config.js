import filesize from 'rollup-plugin-filesize'
import copy from 'rollup-plugin-copy'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import pkg from './package.json'

import fs from 'fs';
import path from 'path';

if (process.env.ROLLUP_WATCH === 'true') {
    fs.watch('./packages/shell-chrome/assets', { recursive: true }, (_event, filename) => {
        try {
            console.info(`Copying asset "${filename}" to dist/chrome`);
            fs.copyFileSync(path.join('./packages/shell-chrome/assets/', filename), path.join('./dist/chrome', filename));
        } catch (e) {
            console.error(e);
        }
    });
}

const JS_INPUTS = [
    'packages/shell-chrome/src/background.js',
    'packages/shell-chrome/src/devtools-background.js',
    'packages/shell-chrome/src/proxy.js',
    'packages/shell-chrome/src/detector.js',
]

const MIXED_INPUT = [
    'packages/shell-chrome/src/panel.js',
]

export default [
    // create standalone builds to avoid rollup creating a common "utils" chunk
    ...JS_INPUTS.map((input) => ({
        input,
        output: {
            dir: 'dist/chrome'
        },
        plugins: [
            resolve(),
            filesize()
        ]
    })),
    ...MIXED_INPUT.map((input) => ({
        input,
        output: {
            dir: 'dist/chrome'
        },
        plugins: [
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
                        }
                    }
                ]
            }),
            filesize(),
        ],
    }))
]
