module.exports = {
    presets: process.env.NODE_ENV === 'test' ? [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                },
            },
        ],
    ] : []
};
