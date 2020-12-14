module.exports = {
    purge: {
        content: ['./packages/**/*.{html,edge}', './packages/shell-chrome/src/devtools/devtools.js'],
    },
    theme: {
        fontSize: {
            xs: '.75rem',
            sm: '.83333rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '4rem',
        },
        extend: {
            colors: {
                alpine: {
                    100: '#7C87A2',
                    200: '#616D89',
                    300: '#4C556B',
                    400: '#373D4E',
                    500: '#222630',
                    600: '#0D0E12',
                    700: '#000000',
                    800: '#000000',
                    900: '#000000',
                },
                ice: {
                    200: '#E2EFF3',
                    300: '#BFDCE3',
                    400: '#9BC8D4',
                    500: '#77B4C5',
                    600: '#54A0B6',
                    700: '#408396',
                    800: '#316472',
                    900: '#22454F',
                },
                silver: {
                    400: '#EFF1F6',
                    500: '#CED5E3',
                    600: '#ADB9D1',
                    700: '#8D9DBF',
                    800: '#6C82AC',
                    900: '#536893',
                },
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            cursor: {
                'row-resize': 'row-resize',
                'col-resize': 'col-resize',
            },
            gridTemplateRows: {
                panes: '1fr 1px 1fr',
            },
            gridTemplateColumns: {
                panes: '1fr 1px 1fr',
            },
            zIndex: {
                max: '2147483647',
            },
        },
    },
    variants: {
        opacity: ['responsive', 'hover', 'focus', 'group-hover'],
    },
    plugins: [require('@tailwindcss/forms')],
}
