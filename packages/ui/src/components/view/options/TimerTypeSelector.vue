<template>
  <v-radio-group
    :model-value="timerType"
    @update:model-value="updateTimerType"
    hide-details
    class="timer-type-selector"
    :label="$t('options.timerType')"
  >
    <div v-for="mode in ['stage', 'custom']" :key="mode" class="timer-mode" :class="{ selected: timerType === mode }">
      <v-radio :value="mode" :label="$t(mode === 'stage' ? 'timerUi.stage' : 'timerUi.manual')" color="primary" />
      <p>{{ $t(mode === 'stage' ? 'timerUi.stageHint' : 'timerUi.manualHint') }}</p>
    </div>
  </v-radio-group>
</template>
<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { GameOptionsFeatures } from '@avalon/types';
export default defineComponent({
  props: { features: { type: Object as PropType<GameOptionsFeatures>, required: true } },
  emits: ['update:features'],
  setup(props, { emit }) {
    const timerType = computed(() => (props.features.useCustomTimer ? 'custom' : 'stage'));
    function updateTimerType(value: string | null) {
      if (value !== 'stage' && value !== 'custom') return;
      emit('update:features', {
        ...props.features,
        useCustomTimer: value === 'custom',
        timerDurations: props.features.timerDurations || {},
      });
    }
    return { timerType, updateTimerType };
  },
});
</script>
<style scoped lang="scss">
.timer-mode {
  border: 1px solid rgb(var(--v-theme-inset-hover));
  border-radius: 6px;
  padding: 4px 12px 12px;
  margin-top: 8px;
}
.timer-mode.selected {
  border-color: rgb(var(--v-theme-primary));
}
.timer-mode p {
  margin-left: 40px;
  font-size: 13px;
  line-height: 1.5;
}
</style>
