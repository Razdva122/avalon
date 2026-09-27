<template>
  <div v-if="data.targetID">
    <i18n-t keypath="switch.switchInfo" tag="span" scope="global">
      <template #switcher
        ><b>{{ playerNames[data.switcherID] }}</b></template
      >
      <template #target
        ><b>{{ playerNames[data.targetID] }}</b></template
      >
    </i18n-t>
    <span>&nbsp;</span>
    <template v-if="data.result">
      <span :class="data.result === 'fail' ? 'text-error' : 'text-success'"> {{ $t('inGame.' + data.result) }} </span>
    </template>
    <span v-else>???</span>
  </div>
  <div v-else>
    <b>{{ playerNames[data.switcherID] }}</b> {{ $t('switch.skip') }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { SwitchResult } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<SwitchResult>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
