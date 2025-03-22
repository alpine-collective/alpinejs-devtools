import { ADDED_ATTRIBUTES } from './constants';

export function fetchWithTimeout(resource, options) {
  const { timeout = 3000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).then((res) => {
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error('Request not ok');
    }
    return res.json();
  });
}

/**
 * Semver version check
 *
 * @param {string} required
 * @param {string} actual
 * @returns {boolean}
 */
export function isRequiredVersion(required, actual) {
  if (required === actual) return true;
  const requiredArray = required.split('.').map((v) => parseInt(v, 10));
  const currentArray = actual.split('.').map((v) => parseInt(v, 10));
  for (let i = 0; i < requiredArray.length; i++) {
    if (currentArray[i] < requiredArray[i]) {
      return false;
    }
    if (currentArray[i] > requiredArray[i]) {
      return true;
    }
  }
  return true;
}

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
    return;
  }
  set(object[nextProperty], rest.join('.'), value);
}

// with default options, will run 3 attempts, 1 at 0s, 1 at 500ms, 1 at 1000ms
// so should hook into Alpine.js if it loads within 1s of the script triggering
export function waitForAlpine(cb, { maxAttempts = 3, interval = 500, delayFirstAttempt = false } = {}) {
  let attempts = delayFirstAttempt ? 0 : 1;
  if (!delayFirstAttempt && window.Alpine) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`waitForAlpine, attempts: ${attempts}/${maxAttempts}`);
    }
    cb();
    return;
  }
  if (attempts >= maxAttempts) return;
  const timer = setInterval(wait, interval);
  function wait() {
    attempts++;
    if (process.env.NODE_ENV !== 'production') {
      console.info(`waitForAlpine, attempts: ${attempts}/${maxAttempts}`);
    }
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

/**
 * Check that a value can be stringified.
 * @param {unknown} value
 * @return {Boolean}
 */
export function isSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch (_e) {
    return false;
  }
}

const TYPE_TO_VALUE_OVERRIDES = {
  function: 'function',
  HTMLElement: 'HTMLElement',
  Unserializable: 'Unserializable Value',
  undefined: 'undefined',
};

function getAttributeValue(value, type) {
  if (TYPE_TO_VALUE_OVERRIDES[type]) return TYPE_TO_VALUE_OVERRIDES[type];
  if (Array.isArray(value)) return `Array[${value.length}]`;
  if (value instanceof Object) return 'Object';
  return value;
}

function isReadyOnlyType(type) {
  return Boolean(TYPE_TO_VALUE_OVERRIDES[type]);
}

/**
 *
 * Serialize HTMLElement to an object with name, attributes & direct descendents
 *
 * @param {HTMLElement} element
 * @param {object} options
 * @param {Array<'attributes'|'children'>} options.include
 * @returns {{name: string, attributes?: Array<string>, children?: Array<string>}}
 */
export function serializeHTMLElement(element, { include = [] } = {}) {
  let object = { name: element.localName };
  if (include.includes('attributes')) {
    object.attributes = Array.from(element.attributes)
      .filter((attribute) => !ADDED_ATTRIBUTES.includes(attribute.name))
      .map((attribute) => attribute.name);
  }
  // `include` is used to avoid getting the children of children.
  // For the top-level iteration, children are included,
  // in the recursive case they're not
  if (include.includes('children')) {
    object.children = Array.from(element.children).map((child) => serializeHTMLElement(child).name);
  }

  return object;
}

export function flattenSingleAttribute(
  flattenedData,
  attributeName,
  value,
  type,
  margin = 0,
  id = '',
  directParentId = '',
  readOnlyChildren = type === 'HTMLElement',
) {
  const generatedId = id ? id : attributeName;

  flattenedData.push({
    attributeName: attributeName,
    attributeValue: getAttributeValue(value, type),
    editAttributeValue: Array.isArray(value) ? 'Array' : value instanceof Object ? 'Object' : value,
    depth: margin,
    hasArrow: value instanceof Object,
    readOnly: readOnlyChildren || isReadyOnlyType(type),
    dataType: type,
    inputType: mapDataTypeToInputType(type),
    id: generatedId,
    inEditingMode: false,
    isOpened: id.length === 0,
    isArrowDown: false,
    directParentId: directParentId,
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
        elementId,
        readOnlyChildren,
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
        elementId,
        readOnlyChildren,
      );
    });
  }
}

export function getComponentName(element) {
  return (
    element.getAttribute('x-title') ||
    element.getAttribute('x-id') ||
    element.id ||
    element.getAttribute('name') ||
    findWireID(element.getAttribute('wire:id')) ||
    findLiveViewName(element) ||
    element.getAttribute('aria-label') ||
    extractFunctionName(element.getAttribute('x-data')) ||
    element.getAttribute('role') ||
    element.tagName.toLowerCase()
  );
}

// TODO: Not sure how to test this
function findWireID(wireId) {
  if (wireId && window.livewire) {
    try {
      const wire = window.livewire.find(wireId);

      if (wire.__instance) {
        return 'livewire:' + wire.__instance.fingerprint.name;
      }
    } catch (e) {}
  }
}

function findLiveViewName(alpineEl) {
  const phxEl = alpineEl.closest('[data-phx-view]');
  if (phxEl) {
    // pretty sure we could do the following instead
    // return phxEl.dataset.phxView;
    if (!window.liveSocket.getViewByEl) return;
    const view = window.liveSocket.getViewByEl(phxEl);
    return view && view.name;
  }
}

function extractFunctionName(functionName) {
  if (functionName.startsWith('{')) return;
  return functionName
    .replace(/\(([^\)]+)\)/, '') // Handles myFunction(param)
    .replace('()', '');
}
