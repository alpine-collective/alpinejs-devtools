module.exports = {
    plugins: [
        require('tailwindcss'),
        require('@fullhuman/postcss-purgecss')({
            content: [
                './packages/shell-chrome/assets/*.html'
            ]
        })
    ]
}