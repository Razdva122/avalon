<template>
  <div class="mission">
    <div>
      <span :class="data.result && (data.result === 'fail' ? 'text-error' : 'text-success')">
        {{ $t('mission.indexMission', { index: data.index + 1 }) }}
      </span>
      <template v-if="data.result === undefined">
        <span> / {{ $t('mission.hidden') }} </span>
      </template>
      <template v-else>
        <span> / {{ $t('mission.failsCount', { count: data.fails }) }} </span>
      </template>
    </div>
    <div v-if="data.actions">
      {{ $t('mission.team') }}
      <template v-for="(el, index) in data.actions">
        <span :class="{ fail: 'text-error', success: 'text-success' }[(el as IActionWithResult).value]">
          {{ playerNames[el.playerID] }}
        </span>
        <span>
          {{ index !== data.actions.length - 1 ? ', ' : '' }}
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { THistoryMission, IActionWithResult } from '@avalon/types';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<THistoryMission>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<Record<string, string>>,
    },
  },
});
</script>

<style scoped lang="scss">
.mission {
  font-size: x-large;
}
</style>
