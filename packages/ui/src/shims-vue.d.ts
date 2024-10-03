/* eslint-disable */
import { ComponentCustomProperties } from 'vue';
import { I18n, Composer } from 'vue-i18n';

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, ...args: any[]) => string;
    $i18n: Composer;
  }
}
