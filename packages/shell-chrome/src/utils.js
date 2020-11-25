export function fetchWithTimeout(resource, options) {
    const { timeout = 3000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, {...options, signal: controller.signal}).then((res) => {
        clearTimeout(timer);
        if (!res.ok) {
            throw new Error('Request not ok');
        }
        return res.json();
    });
}

export function flattenData(data) {
    let flattenedData = [];

    for (var key in data) {
        flattenSingleAttribute(flattenedData, key, data[key].value, data[key].type);
    }

    return flattenedData;
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
