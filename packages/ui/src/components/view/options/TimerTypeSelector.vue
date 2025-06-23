<template>
  <div class="timer-type-selector">
    <v-radio-group v-model="timerType" @update:model-value="updateTimerType" density="compact" :hide-details="true">
      <v-radio value="stage" :label="$t('options.stageTimer')" color="primary"></v-radio>
      <v-radio value="custom" :label="$t('options.customTimer')" color="primary"></v-radio>
    </v-radio-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';
import type { GameOptionsFeatures } from '@avalon/types';

export default defineComponent({
  name: 'TimerTypeSelector',
  props: {
    features: {
      type: Object as PropType<GameOptionsFeatures>,
      required: true,
    },
  },
  emits: ['update:features'],
  setup(props, { emit }) {
    // Определяем тип таймера на основе настроек
    const timerType = ref(
      props.features.useCustomTimer
        ? 'custom'
        : props.features.timerDurations && Object.keys(props.features.timerDurations).length
          ? 'stage'
          : undefined,
    );

    // Обновляем тип таймера при изменении
    const updateTimerType = (value: string | null) => {
      if (value === null) return;
      const updatedFeatures = { ...props.features } as GameOptionsFeatures;

      if (value === 'custom') {
        updatedFeatures.useCustomTimer = true;
        updatedFeatures.timerDurations = {};
      } else if (value === 'stage') {
        updatedFeatures.useCustomTimer = false;
        updatedFeatures.timerDurations = updatedFeatures.timerDurations || {};
      }

      emit('update:features', updatedFeatures);
    };

    // Следим за изменениями в props
    watch(
      [() => props.features.useCustomTimer, () => props.features.timerDurations],
      ([useCustomTimer, timerDurations]) => {
        if (useCustomTimer) {
          timerType.value = 'custom';
        } else if (timerDurations && Object.keys(timerDurations).length) {
          timerType.value = 'stage';
        }
      },
    );

    return {
      timerType,
      updateTimerType,
    };
  },
});
</script>

<style scoped lang="scss">
.timer-type-selector {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
}
</style>
