module.exports = {
    plugins: [
        require('tailwindcss'),
        process.env.NODE_ENV === 'production' && require('@fullhuman/postcss-purgecss')({
            content: [
                './packages/shell-chrome/assets/*.html'
            ],
            whitelistPatterns: [
                /[\w-/.:]+(?<!:)/g,
            ]
        })
    ]
}
