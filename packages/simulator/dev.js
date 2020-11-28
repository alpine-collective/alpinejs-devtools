// dev-wrapper for component inspector panel
import { inject, injectPanel } from './utils'

let isInitialised = false
function initProxy(window, targetWindow) {
    window.addEventListener('message', async (event) => {
        if (event.data.source === 'alpine-devtools-backend') {
            const { init, handleMessage } = await import('../shell-chrome/src/devtools/app')
            // message from backend -> app
            if (!isInitialised) {
                console.log('initialising panel')
                init()
                isInitialised = true
            }
            handleMessage(event.data.payload, window)
            return
        }
        if (event.data.source === 'alpineDevtool') {
            // format as expected by backend.js
            targetWindow.postMessage(
                {
                    source: 'alpine-devtools-proxy',
                    payload: event.data,
                },
                '*'
            )
            return
        }
        console.log('no handler for message: ', event.data)
    })
}

async function main() {
    const target = document.getElementById('target')
    const targetWindow = target.contentWindow

    initProxy(window, targetWindow)

    await injectPanel(document.querySelector('#devtools-container'))

    // 1. load user app
    target.src = './example.html'
    target.onload = () => {
        // 1. inject backend script to "target" iframe
        inject('/backend.js', () => {
            // 2. init devtools
            targetWindow.postMessage({
                source: 'alpine-devtools-proxy',
                payload: 'init',
            })
            // 3. proxy messages from backend to `window`
            targetWindow.addEventListener('message', (event) => {
                if (event.data.source === 'alpine-devtools-backend') {
                    console.log('backend -> devtools', JSON.stringify(event.data))
                    window.postMessage(event.data, '*')
                }
            })
        })
    }
}

main()
