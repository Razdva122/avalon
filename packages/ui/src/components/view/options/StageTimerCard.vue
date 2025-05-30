<template>
  <div class="stage-timer-card" :class="{ disabled: !enabled }">
    <div class="stage-timer-row">
      <div class="stage-info">
        <v-checkbox
          :model-value="enabled"
          @update:model-value="(v) => v !== null && $emit('update:enabled', v)"
          color="info"
          hide-details
          density="compact"
          class="stage-checkbox"
        />
        <div class="stage-label">
          {{ label }}
        </div>
      </div>

      <div class="stage-controls">
        <div class="duration-input-group">
          <v-text-field
            :model-value="duration"
            @update:model-value="(v) => $emit('update:duration', v)"
            type="number"
            :min="minDuration"
            :max="maxDuration"
            :placeholder="defaultDuration.toString()"
            density="compact"
            hide-details
            :disabled="!enabled"
            class="duration-field"
          />
          <span class="duration-unit">s</span>
        </div>

        <v-tooltip location="top">
          <template #activator="{ props }">
            <v-btn icon v-bind="props" @click="$emit('reset')" size="small" variant="text" class="reset-btn">
              <span class="material-icons">restore</span>
            </v-btn>
          </template>
          <span>{{ $t('options.reset') }}</span>
        </v-tooltip>
      </div>
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
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  margin-bottom: 8px;
  padding: 12px;
  background-color: rgba(var(--v-theme-surface), 0.8);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.3);
    background-color: rgba(var(--v-theme-surface), 1);
  }

  &.disabled {
    opacity: 0.6;
    background-color: rgba(var(--v-theme-surface), 0.4);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.stage-timer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.stage-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.stage-checkbox {
  flex-shrink: 0;
}

.stage-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.duration-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.duration-field {
  width: 60px;
  min-width: 50px;
}

.duration-unit {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
  font-weight: 500;
}

.duration-field {
  :deep(input[type='number']) {
    -moz-appearance: textfield;
    padding-left: 8px !important;
    padding-right: 8px !important;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

.reset-btn {
  color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.1) !important;

  &:hover {
    color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.2) !important;
  }
}

@media (max-width: 600px) {
  .stage-timer-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .stage-info {
    justify-content: flex-start;
  }

  .stage-controls {
    justify-content: space-between;
    width: 100%;
  }

  .duration-field {
    width: auto;
    flex: 1;
    min-width: 0;
  }
}
</style>
