<template>
  <div class="stage-timer-card">
    <v-switch
      :model-value="enabled"
      @update:model-value="(v) => v !== null && $emit('update:enabled', v)"
      :label="label"
      color="info"
      hide-details
      inset
      class="stage-switch"
    />
    <div class="stage-controls">
      <v-text-field
        :model-value="duration ?? defaultDuration"
        @update:model-value="(v) => $emit('update:duration', v)"
        type="number"
        inputmode="numeric"
        :min="minDuration"
        :max="maxDuration"
        :label="$t('timerUi.seconds')"
        :aria-label="`${label}: ${$t('timerUi.seconds')}`"
        variant="outlined"
        density="compact"
        hide-details="auto"
        :rules="[
          (v) =>
            v === '' ||
            (Number.isInteger(Number(v)) && Number(v) >= minDuration && Number(v) <= maxDuration) ||
            $t('timerUi.range'),
        ]"
        :disabled="!enabled"
        class="duration-field"
      />
      <v-btn
        icon="restore"
        :aria-label="`${$t('options.reset')}: ${label}`"
        :title="$t('options.reset')"
        @click="$emit('reset')"
        :disabled="!enabled"
        variant="text"
        color="primary"
        class="reset-btn"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StageTimerCard',
  props: {
    label: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
    },
    duration: {
      type: Number,
    },
    defaultDuration: {
      type: Number,
      required: true,
    },
    minDuration: {
      type: Number,
      default: 10,
    },
    maxDuration: {
      type: Number,
      default: 600,
    },
  },
  emits: ['update:enabled', 'update:duration', 'reset'],
});
</script>

<style scoped lang="scss">
.stage-timer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgb(var(--v-theme-inset-hover));
}
.stage-switch {
  flex: 1;
  min-width: 0;
}
.stage-switch :deep(.v-label) {
  opacity: 1;
  white-space: normal;
  font-size: 14px;
  line-height: 1.4;
}
.stage-controls {
  display: flex;
  gap: 4px;
  align-items: center;
  width: 152px;
  flex-shrink: 0;
}
.duration-field {
  min-width: 0;
}
@media (max-width: 450px) {
  .stage-timer-card {
    flex-wrap: wrap;
    gap: 4px;
  }
  .stage-switch {
    flex-basis: 100%;
  }
  .stage-controls {
    margin-left: auto;
    width: 190px;
  }
}
</style>
