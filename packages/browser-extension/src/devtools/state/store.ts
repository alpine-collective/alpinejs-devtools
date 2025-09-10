import { createStore } from 'solid-js/store';
import type { Component, FlattenedComponentData, Store, FlattenedStoreData } from '../types';

export interface State {
  version: {
    detected?: string;
  };
  pageLoadCompleted: boolean;
  appUrl?: string;
  components: Record<number, Component>;
  selectedComponentId?: number;
  preloadedComponentData: Record<number, Array<FlattenedComponentData>>;
  stores: Record<string, Store>;
  selectedStoreName?: string;
  preloadedStoreData: Record<string, Array<FlattenedStoreData>>;
  errors: any[];
  componentFilter: string;
}

export const [state, setState] = createStore<State>({
  pageLoadCompleted: false,
  version: {},
  errors: [],
  components: {},
  preloadedComponentData: {},
  stores: {},
  preloadedStoreData: {},
  componentFilter: '',
});
