/* Devtools panel app */
import './styles.css'
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

const breakpoints = {
    md: 640,
    lg: 960,
}

let width = window.innerWidth
const isLargerThanBreakpoint = (minWidth) => {
    const newWidth = window.innerWidth
    // when hiding the devtools tab, innerWidth goes to 0
    // resume using last known size
    width = newWidth === 0 ? width : newWidth
    return width > minWidth
}

const getOrientation = () => (isLargerThanBreakpoint(breakpoints.lg) ? 'landscape' : 'portrait')
const getBreakpoint = () => {
    if (isLargerThanBreakpoint(breakpoints.lg)) {
        return 'lg'
    }

    if (isLargerThanBreakpoint(breakpoints.md)) {
        return 'md'
    }

    return 'sm'
}

export default function devtools() {
    return {
        version: null,
        latest: null,
        selectedComponentFlattenedData: null,
        openComponent: null,
        components: [],
        errors: [],
        showTools: false,
        showTimeout: 1500,
        activeTheme: 'dark-header',
        loadingText: 'Alpine.js tools loading',

        orientation: getOrientation(),
        breakpoint: getBreakpoint(),
        split: null,

        themes: themes,

        settingsPanelEnabled: process.env.NODE_ENV !== 'production',
        settingsPanelOpen: false,

        activeTab: 'components',

        get isLatest() {
            if (!this.version || !this.latest) return null
            return isRequiredVersion(this.latest, this.version)
        },

        get canCollectErrors() {
            if (!this.version || !this.latest) return null
            return isRequiredVersion('2.8.0', this.version)
        },

        get isLandscape() {
            return this.orientation === 'landscape'
        },

        get detected() {
            return this.version ? `v${this.version}` : '<v2.3.1'
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
                if (!this.showTools) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn('Ignore following CORS error in simulator')
                    }
                    fetchWithTimeout('https://registry.npmjs.com/alpinejs', { timeout: this.showTimeout })
                        .then((data) => {
                            this.latest = data['dist-tags'].latest
                            this.showTools = true
                        })
                        .catch((_error) => {
                            if (process.env.NODE_ENV === 'production') {
                                console.error('Could not load Alpine.js version data from registry.npmjs.com')
                            }
                            // latest will be as defaulted in state.js
                            this.showTools = true
                        })
                }
            })

            this.$watch('orientation', () => {
                this.$nextTick(this.initSplitPanes())
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
            const key = this.breakpoint !== 'sm' ? 'columnGutters' : 'rowGutters'

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
                    this.breakpoint = getBreakpoint()
                },
            }
        },
    }
}
