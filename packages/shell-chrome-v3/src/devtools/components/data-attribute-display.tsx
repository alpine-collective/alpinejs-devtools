import { createMemo, createSignal, Show } from 'solid-js';
import { isReadOnly } from '../state/version';
import { pinnedPrefix, setPinnedPrefix } from '../state/app';
import { saveComponentAttributeEdit, toggleComponentDataAttributeOpen } from '../state/components';
import { saveStoreAttributeEdit, toggleStoreDataAttributeOpen } from '../state/stores';
import { FlattenedComponentData, FlattenedStoreData } from '../types';
import { effect } from 'solid-js/web';
import { metric } from '../metrics';
import { isEarlyAccess } from '../../lib/isEarlyAccess';
import { DataAttrSource } from '../types';
import { ROOT_VALUE } from '../../lib/constants';

type DataDisplayProps =
  | {
      attributeData: FlattenedComponentData;
      type: Extract<DataAttrSource, 'component' | 'message'>;
    }
  | {
      attributeData: FlattenedStoreData;
      type: Extract<DataAttrSource, 'store'>;
    };

export function DataAttributeDisplay(props: DataDisplayProps) {
  const [inEditingMode, setInEditingMode] = createSignal(props.attributeData.inEditingMode);
  const editAttributeValue = createMemo(() => props.attributeData.editAttributeValue);
  const readonly = createMemo(() => isReadOnly() || props.type === 'message');
  const isRootValueAttr = createMemo(
    () => props.attributeData.attributeName === ROOT_VALUE && props.type === 'store',
  );

  const toggleDataAttributeOpened = () => {
    metric(`${props.type}_data_attr_opened`, {
      dataType:
        props.attributeData?.editAttributeValue === 'Array'
          ? 'array'
          : props.attributeData.dataType,
    });

    if (props.type === 'store') {
      toggleStoreDataAttributeOpen(props.attributeData);
    } else {
      toggleComponentDataAttributeOpen(props.attributeData, props.type);
    }
  };
  const [attrDirtyValue, setDirtyEditAttributeValue] = createSignal<string | boolean | undefined>(
    editAttributeValue(),
  );

  effect(() => {
    if (inEditingMode()) {
      setDirtyEditAttributeValue(editAttributeValue());
    }
  });
  const saveEditing = (newValue?: boolean) => {
    setInEditingMode(false);
    if (props.type === 'store') {
      saveStoreAttributeEdit({
        ...props.attributeData,
        editAttributeValue: typeof newValue === 'undefined' ? attrDirtyValue() : newValue,
      });
    } else if (props.type === 'component') {
      saveComponentAttributeEdit({
        ...props.attributeData,
        editAttributeValue: typeof newValue === 'undefined' ? attrDirtyValue() : newValue,
      });
    }
    metric(`${props.type}_data_attr_saved`, {
      instantToggle: typeof newValue !== 'undefined',
    });
  };

  const cancelEditing = () => {
    setInEditingMode(false);
  };

  return (
    <div class="group flex items-center">
      <Show when={props.attributeData.isOpened}>
        <a
          style={{ 'margin-left': `${props.attributeData.depth}px` }}
          onClick={toggleDataAttributeOpened}
          class="block px-1 rounded-sm hover:bg-blue-100 dark:hover:bg-blue-200"
          classList={{ 'cursor-pointer': props.attributeData.hasArrow }}
        >
          <h5 class="flex items-center relative pl-3 leading-6 text-sm whitespace-nowrap">
            <div class="absolute left-0 h-full flex items-center">
              <Show when={props.attributeData.hasArrow}>
                <span
                  class="arrow"
                  data-testid={props.attributeData.isArrowDown ? 'arrow-down' : 'arrow-right'}
                  classList={{
                    right: !props.attributeData.isArrowDown,
                    down: props.attributeData.isArrowDown,
                  }}
                ></span>
              </Show>
            </div>

            <span class="text-purple dark:brightness-150">
              <Show when={!isRootValueAttr()}>
                <span data-testid={`data-property-name-${props.attributeData.attributeName}`}>
                  {props.attributeData.attributeName}
                </span>
              </Show>

              <Show when={isEarlyAccess() && !isRootValueAttr()}>
                <button
                  data-testid={
                    pinnedPrefix() !== props.attributeData.id
                      ? `pin-${props.attributeData.id}`
                      : `unpin-${props.attributeData.id}`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (pinnedPrefix() !== props.attributeData.id) {
                      metric('set_prefix_on_pin', {
                        // *s to be backwards compatible to pre `props.type` existence
                        datasource: `${props.type}s`,
                      });
                      setPinnedPrefix(props.attributeData.id);
                    } else {
                      metric('set_prefix_on_unpin', {
                        // *s to be backwards compatible to pre `props.type` existence
                        datasource: `${props.type}s`,
                      });
                      setPinnedPrefix('');
                    }
                  }}
                  class="text-gray-500 cursor-pointer ml-1 text-xs"
                >
                  {pinnedPrefix() !== props.attributeData.id ? '(pin)' : '(unpin)'}
                </button>
              </Show>
            </span>

            <Show when={!isRootValueAttr()}>
              <span class="text-black dark:text-gray-100">:</span>
            </Show>

            <div
              data-testid={`data-property-value-${props.attributeData.attributeName}`}
              class="text-black dark:text-gray-100 ml-1"
            >
              <Show when={!inEditingMode() && props.attributeData.dataType === 'string'}>
                <div>
                  "
                  <span class="text-red-700 dark:text-red-500">
                    {props.attributeData.attributeValue}
                  </span>
                  "
                </div>
              </Show>
              <Show when={props.attributeData.dataType === 'boolean'}>
                <div class="flex items-center">
                  <span
                    class="block pr-1 text-blue-700 dark:text-blue-500"
                    classList={{
                      'cursor-pointer': !readonly(),
                    }}
                    onClick={() => {
                      if (!readonly()) {
                        saveEditing(!editAttributeValue());
                      }
                    }}
                  >
                    {String(props.attributeData.attributeValue)}
                  </span>
                  <Show when={!readonly()}>
                    <input
                      type="checkbox"
                      checked={!!editAttributeValue()}
                      onChange={() => {
                        saveEditing(!editAttributeValue());
                      }}
                      class="focus:ring-transparent h-4 w-4 text-blue-700 border-gray-300 cursor-pointer rounded-sm transition duration-150 ease-in-out opacity-0 group-hover:opacity-100"
                    />
                  </Show>
                </div>
              </Show>
              <Show
                when={
                  !inEditingMode() && !['string', 'boolean'].includes(props.attributeData.dataType)
                }
              >
                <a
                  href={
                    props.attributeData.attributeValue === 'Unserializable Value'
                      ? 'https://github.com/alpine-collective/alpinejs-devtools/issues/new/'
                      : undefined
                  }
                  title={
                    props.attributeData.attributeValue === 'Unserializable Value'
                      ? 'Click to report this unserializable value'
                      : undefined
                  }
                  data-testid={'attr-value' + props.attributeData.attributeName}
                >
                  {props.attributeData.attributeValue}
                </a>
              </Show>
            </div>
          </h5>
        </a>
      </Show>

      <Show
        when={
          !props.attributeData.hasArrow &&
          !props.attributeData.readOnly &&
          props.attributeData.isOpened
        }
      >
        <div class="flex flex-col">
          <Show
            when={!readonly() && !inEditingMode() && props.attributeData.dataType !== 'boolean'}
          >
            <svg
              fill="currentColor"
              data-testid={`edit-icon-${props.attributeData.attributeName}`}
              onClick={() => setInEditingMode(true)}
              viewBox="0 0 20 20"
              class="w-4 h-4 cursor-pointer opacity-0 group-hover:opacity-100 hover:opacity-75"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </Show>

          <Show when={inEditingMode() && props.attributeData.dataType !== 'boolean'}>
            <div class="flex flex-row items-center">
              <input
                data-testid={`input-${props.attributeData.attributeName}`}
                type={props.attributeData.inputType}
                class="flex text-gray-700 leading-tight focus:outline-hidden focus:ring-3 w-2/3 shadow appearance-none border rounded-sm py-1 px-1"
                // does having booleans cause issues?
                value={attrDirtyValue() as any}
                onInput={(e) => setDirtyEditAttributeValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing();
                  if (e.key === 'Escape') cancelEditing();
                }}
              />

              <svg
                fill="currentColor"
                data-testid="save-icon"
                onClick={() => saveEditing()}
                viewBox="0 0 20 20"
                class="flex w-5 h-5 cursor-pointer ml-2 hover:opacity-75"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>

              <svg
                fill="currentColor"
                data-testid="cancel-icon"
                onClick={() => cancelEditing()}
                viewBox="0 0 20 20"
                class="flex w-5 h-5 ml-1 cursor-pointer hover:opacity-75"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
