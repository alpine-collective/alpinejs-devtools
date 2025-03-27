import { Component, hoverLeftComponent, hoverOnComponent, openComponentValue, selectComponent } from '../state';

export function ComponentListItem({ component }: { component: Component }) {
  return (
    <a
      classList={{
        'text-white bg-alpine-300': openComponentValue()?.id === component.id && openComponentValue()?.isOpened,
        'text-gray-600 hover:bg-blue-200': openComponentValue()?.id !== component.id || !openComponentValue()?.isOpened,
      }}
      class="block cursor-pointer rounded"
      style={`padding-left: ${component.depth * 20}px;`}
      onMouseEnter={(_e) => {
        hoverOnComponent(component);
      }}
      onMouseLeave={(_e) => {
        hoverLeftComponent(component);
      }}
      onClick={(_e) => {
        selectComponent(component);
      }}
      data-testid="component-container"
    >
      <h5 class="flex items-center px-2 leading-7 font-mono whitespace-nowrap">
        <span class="opacity-25">&lt;</span>
        <span data-testid="component-name" class="text-base">
          {component.name}
        </span>
        <span class="opacity-25">&gt;</span>
        <div
          data-testid="console-global"
          class="text-gray pl-2 text-xs"
          title={`Available as $x${component.id - 1} in the console`}
        >
          = <span>{`$x${component.id - 1}`}</span>
        </div>
      </h5>
    </a>
  );
}
