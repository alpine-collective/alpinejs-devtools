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

const breakpoint = 640

let width = window.innerWidth
const isLargerThanBreakpoint = (minWidth) => {
    const newWidth = window.innerWidth
    // when hiding the devtools tab, innerWidth goes to 0
    // resume using last known size
    width = newWidth === 0 ? width : newWidth
    return width > minWidth
}

const getOrientation = () => (isLargerThanBreakpoint(breakpoint) ? 'landscape' : 'portrait')

export default function devtools() {
    return {
        version: null,
        latest: null,
        components: [],
        errors: [],
        showTimeout: 1500,
        activeTheme: 'dark-header',
        loadingText: 'Alpine.js tools loading',

        orientation: getOrientation(),
        split: null,

        themes: themes,

        settingsPanelOpen: false,
        settings: {
            ignoreSelector: '',
        },

        tabsEnabled: process.env.NODE_ENV !== 'production',
        activeTab: 'components',

        get ready() {
            return this.settings.loaded && this.latest
        },

        get isLatest() {
            if (!this.version || !this.latest) return null
            return isRequiredVersion(this.latest, this.version)
        },

        get isLandscape() {
            return this.orientation === 'landscape'
        },

        get detected() {
            return this.version ? `v${this.version}` : '<v2.3.1'
        },

        get openComponent() {
            return (
                this.components.filter((component) => {
                    return component.isOpened
                })[0] || {}
            )
        },

        get isWarningsOverflowing() {
            return this.$refs.warnings.scrollHeight > this.$refs.warnings.clientHeight
        },

        get theme() {
            return this.themes[this.activeTheme]
        },

        scrollToLastError() {
            // @todo add debounce
            this.$nextTick(() => {
                if (this.$refs.last_error) {
                    this.$refs.last_error.scrollIntoView({
                        behavior: 'smooth',
                    })
                }
            })
        },

        init() {
            try {
                chrome.storage.sync.get(['alpine-devtools-settings'], (result) => {
                    result.loaded = true
                    result.error = ''
                    Object.assign(this.settings, result)
                    console.log(this.settings)
                })
            } catch (error) {
                this.settings = {
                    loaded: true,
                    error: error.message,
                }
                console.warn(error.message, this.settings)
            }
            this.initSplitPanes()

            this.$watch('activeTab', (value) => {
                if (value === 'warnings') {
                    this.scrollToLastError()
                }
            })
            this.$watch('errors', () => {
                this.scrollToLastError()
            })

            this.$watch('components', () => {
                if (!this.latest) {
                    fetchWithTimeout('https://registry.npmjs.com/alpinejs', { timeout: this.showTimeout })
                        .then((data) => {
                            this.latest = data['dist-tags'].latest
                        })
                        .catch((_error) => {
                            console.error('Could not load Alpine.js version data from registry.npmjs.com')
                        })
                }
            })

            this.$watch('orientation', () => {
                this.initSplitPanes()
            })
        },

        initSplitPanes() {
            if (this.split) {
                this.split.destroy(true)
                this.$refs.panes.style.gridTemplateColumns = null
                this.$refs.panes.style.gridTemplateRows = null
            }

            const splitOptions = {
                minSize: this.isLandscape ? 250 : 150,
                snapOffset: 0,
            }
            const key = this.isLandscape ? 'columnGutters' : 'rowGutters'

            this.$nextTick(() => {
                splitOptions[key] = [
                    {
                        track: 1,
                        element: this.$refs.handle,
                    },
                ]

                this.split = Split(splitOptions)
            })
        },

        devtoolsRootDirectives() {
            return {
                ['@resize.window.debounce.100']() {
                    this.orientation = getOrientation()
                },
            }
        },
    }
}
