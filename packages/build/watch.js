import fs from 'fs'
import path from 'path'
import { renderPanel } from './edge/render'

export function watch({ assetsDir, viewsDir, outputDir }) {
    fs.watch(assetsDir, { recursive: true }, (_event, filename) => {
        try {
            console.info(`Copying asset "${filename}" to dist/chrome`)
            fs.copyFileSync(path.join(assetsDir, filename), path.join(outputDir, filename))
        } catch (e) {
            console.error(e)
        }
    })

    fs.watch(viewsDir, { recursive: true }, (_event, filename) => {
        try {
            console.info(`View "${filename}" updated. Rendering panel to dist/chrome`)

            renderPanel()
        } catch (e) {
            console.error(e)
        }
    })
}
