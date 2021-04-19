import fs from 'fs'
import path from 'path'
import { renderPanel } from './edge/render'

const inputPath = './packages/shell-chrome'
export function watch() {
    fs.watch(`${inputPath}/assets`, { recursive: true }, (_event, filename) => {
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

    fs.watch(`${inputPath}/views`, { recursive: true }, (_event, filename) => {
        try {
            console.info(`View "${filename}" updated. Rendering panel to dist/chrome`)

            renderPanel()
        } catch (e) {
            console.error(e)
        }
    })
}
