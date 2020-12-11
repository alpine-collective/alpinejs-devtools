import fs from 'fs'
import path from 'path'
import * as edge from 'edge.js'
import VerbatimTag from './VerbatimTag'

edge.registerViews(path.join(__dirname, './packages/shell-chrome/views'))
edge.tag(new VerbatimTag())

export function renderView(view, outputFilename, outputPath) {
    let contents = edge.render(view)
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
