module.exports = {
    purge: {
        content: ['./packages/**/*.html'],
    },
    theme: {
        fontSize: {
            'xs': '.75rem',
            'sm': '.83333rem',
            'base': '1rem',
            'lg': '1.125rem',
            'xl': '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '4rem',
        },

        extend: {
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    variants: {
        opacity: ['responsive', 'hover', 'focus', 'group-hover'],
    },
    plugins: [
        require('@tailwindcss/ui'),
    ],
}
