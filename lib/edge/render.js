import fs from 'fs'
import path from 'path'
import { Edge } from 'edge.js'
import { verbatimTag } from './verbatim'

const edge = new Edge({ cache: false })

const viewData = {
    devOnly: process.env.NODE_ENV !== 'production',
}

edge.registerTag(verbatimTag)
edge.mount(path.join(__dirname, './packages/shell-chrome/views'))

export function renderView(view, outputFilename, outputPath) {
    let contents = edge.render(view, viewData)
    let dir = outputPath || path.join(__dirname, './dist/chrome')

    if (process.env.NODE_ENV === 'production') {
        contents = contents.replace(/:data-testid="[^"]*"/g, '')
    }

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(path.join(dir, './', outputFilename || `${view}.html`), contents)
}

export function renderPanel() {
    return renderView('panel')
}
