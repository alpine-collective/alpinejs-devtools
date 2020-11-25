export function flattenData(data) {
    let flattenedData = [];

    for (var key in data) {
        flattenSingleAttribute(flattenedData, key, data[key].value, data[key].type);
    }

    return flattenedData;
}

/**
* Loose port of Lodash#set with "." as the delimiter, see https://lodash.com/docs#set
*
* @param {object} object - object to update
* @param {string} path - path to set in the form `a.0.b.c`
* @param {any} value - value to set to
*/
export function set(object, path, value) {
    const [nextProperty, ...rest] = path.split('.');
    if (rest.length === 0) {
        object[nextProperty] = value;
        return object;
    }
    set(object[nextProperty], rest.join('.'), value);
    return object
}

export function waitForAlpine(cb, {maxAttempts = 3, interval = 500, delayFirstAttempt = false } = {}) {
    let attempts = delayFirstAttempt ? 0 : 1;
    if (!delayFirstAttempt && window.Alpine) {
        console.info(`waitForAlpine, attempts: ${attempts}/${maxAttempts}`);
        cb();
        return;
    }
    const timer = setInterval(wait, interval);
    function wait() {
        attempts++;
        console.info(`waitForAlpine, attempts: ${attempts}/${maxAttempts}`);
        if (attempts >= maxAttempts || window.Alpine) {
            clearInterval(timer);
        }
        if (window.Alpine) {
            cb();
        }
    }
}

function mapDataTypeToInputType(dataType) {
    switch (dataType) {
        case 'boolean':
            return 'checkbox';
        case 'number':
            return 'number';
        // strings will fall through to "text"
        default:
            return 'text';
    }
}

export function convertInputDataToType(inputType, value) {
    switch (inputType) {
        case 'number':
            return parseFloat(value);
        // checkbox and text are already the right type
        default:
            return value;
    }
}

export function flattenSingleAttribute(
    flattenedData,
    attributeName,
    value,
    type,
    margin = 0,
    id = "",
    directParentId = '',
) {
    const generatedId = id ? id : attributeName;

    flattenedData.push({
        attributeName: attributeName,
        attributeValue: Array.isArray(value)
            ? `Array[${value.length}]`
            : value instanceof Object
                ? "Object"
                : value,
        editAttributeValue: Array.isArray(value)
            ? "Array"
            : value instanceof Object
                ? "Object"
                : value,
        depth: margin,
        hasArrow: value instanceof Object,
        readOnly: type === 'function',
        dataType: type,
        inputType: mapDataTypeToInputType(type),
        id: generatedId,
        inEditingMode: false,
        isOpened: id.length == 0,
        isArrowDown: false,
        directParentId: directParentId
    });

    if (Array.isArray(value)) {
        value.forEach((val, index) => {
            const elementId = id ? id : attributeName;
            flattenSingleAttribute(
                flattenedData,
                index,
                val,
                typeof val,
                margin + 10,
                `${elementId}.${index}`,
                elementId
            );
        });
    } else if (value instanceof Object) {
        Object.entries(value).forEach(([objectKey, objectValue]) => {
            const elementId = id ? id : attributeName;
            flattenSingleAttribute(
                flattenedData,
                objectKey,
                objectValue,
                typeof objectValue,
                margin + 10,
                `${elementId}.${objectKey}`,
                elementId
            );
        });
    }
}
