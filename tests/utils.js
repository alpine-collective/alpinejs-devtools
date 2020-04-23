import '@testing-library/jest-dom';
import fs from 'fs';

export { default as State } from '../packages/shell-chrome/src/state';

const bodyContentRegex = /(?<=(\<body\>)).*(?=(<\/body>))/gms
let panelHtml = '';

export function getPanelHtml() {
    if (panelHtml) {
        return panelHtml;
    }
    const panelMarkup = fs.readFileSync(`${__dirname}/../packages/shell-chrome/assets/panel.html`, 'utf-8');
    const noPanelScript = panelMarkup.replace('<script src="./panel.js"></script>', '');
    const [bodyHtml] = noPanelScript.match(bodyContentRegex);

    panelHtml = bodyHtml;
    return panelHtml;
}

export function createComponent(tagName = 'DIV', data = {}, { id = 'component-id', index = 0, depth = 0 } = {}) {
    return {
        index,
        depth,
        id,
        tagName: tagName.toUpperCase(),
        data: Object.entries(data).reduce((acc, [property, value]) => {
            acc[property] = {
                value: typeof value === 'function' ? 'function' : value,
                type: typeof value
            }
            return acc;
        }, {})
    }
}
