export function flattenData(data) {
    let flattenedData = [];

    console.log(data);
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
            ? "Array"
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
        Object.keys(value).forEach((objectKey) => {
            const elementId = id ? id : attributeName;
            flattenSingleAttribute(
                flattenedData,
                objectKey,
                value[objectKey],
                typeof value[objectKey],
                margin + 10,
                `${elementId}.${objectKey}`,
                elementId
            );
        });
    }
}
