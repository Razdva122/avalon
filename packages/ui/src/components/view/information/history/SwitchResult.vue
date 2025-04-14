<template>
  <div v-if="data.targetID">
    <span
      v-html="
        $t('switch.switchInfo', {
          switcher: playerNames[data.switcherID],
          target: playerNames[data.targetID],
        })
      "
    ></span>
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
