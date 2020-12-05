/* Devtools panel app */
import './styles.css'
import 'alpinejs'
import Split from 'split-grid'
import { fetchWithTimeout, isRequiredVersion } from '../utils'

const themes = {
    light: {
        'text-header': 'text-alpine-400',
        'bg-header': 'bg-white',
        'bg-logo-dark': 'text-alpine-400',
        'bg-logo-light': 'text-silver-600',
    },

    'dark-header': {
        'text-header': 'text-white',
        'bg-header': 'bg-alpine-400',
        'bg-logo-dark': 'text-ice-500',
        'bg-logo-light': 'text-silver-500',
    },
}

export default function devtools() {
    return {
        version: null,
        latest: null,
        components: [],
        showTools: false,
        showTimeout: 1500,
        activeTheme: 'dark-header',

        orientation: 'portrait',
        breakpoint: 640,
        split: null,

        themes: themes,

        get isLatest() {
            if (!this.version || !this.latest) return null
            return isRequiredVersion(this.latest, this.version)
        },

        get detected() {
            if (!this.showTools) {
                return 'Alpine.js tools loading'
            }

            return this.version ? `Alpine.js v${this.version} detected` : 'Alpine.js <v2.3.1 detected'
        },

        get openComponent() {
            return (
                this.components.filter((component) => {
                    return component.isOpened
                })[0] || {}
            )
        },

        get theme() {
            return this.themes[this.activeTheme]
        },

        updateOrientation() {
            this.orientation = window.innerWidth > this.breakpoint ? 'landscape' : 'portrait'
        },

        init() {
            return () => {
                this.initLayout()

                this.$watch('components', () => {
                    if (!this.showTools && this.components.length > 0) {
                        fetchWithTimeout('https://registry.npmjs.com/alpinejs', { timeout: this.showTimeout })
                            .then((data) => {
                                this.latest = data['dist-tags'].latest
                                this.showTools = true
                            })
                            .catch((_error) => {
                                console.error('Could not load Alpine.js version data from registry.npmjs.com')
                                // latest will be as defaulted in state.js
                                this.showTools = true
                            })
                    }
                })

                this.$watch('orientation', () => {
                    this.initSplitPanes()
                })
            }
        },

        initSplitPanes() {
            if (this.split) {
                this.split.destroy(true)
                this.$refs.panes.style.gridTemplateColumns = null
                this.$refs.panes.style.gridTemplateRows = null
            }

            const splitOptions = {
                minSize: window.innerWidth > this.breakpoint ? 250 : 150,
                snapOffset: 0,
            }
            const key = window.innerWidth > this.breakpoint ? 'columnGutters' : 'rowGutters'

            splitOptions[key] = [
                {
                    track: 1,
                    element: this.$refs.handle,
                },
            ]

            this.$nextTick(() => {
                this.split = Split(splitOptions)
            })
        },

        initLayout() {
            this.initSplitPanes()
            this.updateOrientation()
        },

        devtoolsRootDirectives() {
            return {
                ['@resize.window.debounce.100']: this.initLayout,
            }
        },
    }
}
