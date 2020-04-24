import filesize from 'rollup-plugin-filesize'
import copy from 'rollup-plugin-copy'
import { terser } from 'rollup-plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import pkg from './package.json'

export default {
    input: [
        'packages/shell-chrome/src/background.js',
        'packages/shell-chrome/src/devtools-background.js',
        'packages/shell-chrome/src/backend.js',
        'packages/shell-chrome/src/panel.js',
        'packages/shell-chrome/src/proxy.js',
        'packages/shell-chrome/src/detector.js',
    ],
    output: {
        dir: 'dist/chrome'
    },
    plugins: [
        resolve(),
        terser({
            exclude: ['proxy.js']
        }),
        postcss(),
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
}
