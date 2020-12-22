export function inject(src, done) {
    if (!src || src === 'false') {
        return done()
    }
    const script = target.contentDocument.createElement('script')
    script.src = src
    script.onload = done
    target.contentDocument.body.appendChild(script)
}

export async function injectPanel(containerNode) {
    // inject Panel HTML
    const rawPanelHtml = await fetch('/panel.html').then((res) => res.text())

    // this contains all sorts of CSS tags etc
    containerNode.innerHTML = rawPanelHtml
    // keep only the Alpine components in the panel
    const panelAppHtml = Array.from(containerNode.querySelectorAll('[data-testid="panel-root"]'))
        .map((el) => el.outerHTML)
        .join('\n')

    containerNode.innerHTML = panelAppHtml
}
