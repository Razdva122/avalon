import type { Store } from 'vuex';
import type { IState } from './store';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<IState>;
  }
}
