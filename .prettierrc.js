module.exports = {
    semi: false,
    printWidth: 120,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    overrides: [
        {
            files: '*.edge',
            options: { parser: 'html' },
        },
    ],
}
