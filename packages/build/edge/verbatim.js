/**
 * Turn the contents of the tag into a verbatim string
 * @param {import("edge.js").TagTokenContract} token
 * @returns
 */
function processTokenVerbatim(token) {
    switch (token.type) {
        case 'tag': {
            const tagName = token.properties.name
            const call = token.properties.jsArg ? `(${token.properties.jsArg})` : ''
            const output = [`@${tagName}${call}`]
            token.children.forEach((child) => {
                output.push(processTokenVerbatim(child))
            })
            if (!token.properties.selfclosed) {
                output.push(`@end${tagName}`)
            }
            return output.join('\n')
        }
        case 'newline':
            return '\n'
        default: {
            return token.value
        }
    }
}

/** @type {import("edge.js").TagContract} */
export const verbatimTag = {
    block: true,
    seekable: false,
    tagName: 'verbatim',

    compile(_parser, buffer, { children }) {
        children.forEach((child) => buffer.outputRaw(processTokenVerbatim(child)))
    },
}
