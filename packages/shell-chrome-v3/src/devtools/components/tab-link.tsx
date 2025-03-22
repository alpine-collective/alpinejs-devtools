import type { Accessor, JSX } from 'solid-js';
import { orientation } from '../theme';
import { TabValues } from '../types';

export interface TabLinkProps {
  label?: string;
  tab: string;
  activeTab: Accessor<TabValues>;
  setActiveTab: Function;
  children: JSX.Element;
}

export function TabLink({ label, tab, children, activeTab, setActiveTab }: TabLinkProps) {
  return (
    <a
      href="#"
      title={label || tab}
      classList={{
        'text-white border-ice-500 cursor-default': activeTab() === tab,
        'border-transparent hover:text-white hover:border-ice-700': activeTab() !== tab,
        'px-5 border-r-3': orientation() === 'landscape',
        'bg-white bg-opacity-5': activeTab() === tab && orientation() === 'landscape',
        'px-4 border-b-3 xs:pl-2 xs:pr-3': orientation() === 'portrait',
      }}
      class="capitalize"
      data-testid={'tab-link-' + tab}
      onClick={(e) => {
        e.preventDefault();
        setActiveTab(tab);
      }}
    >
      {children}
      <span class="hidden xs:inline-block">{label || tab}</span>
    </a>
  );
}
