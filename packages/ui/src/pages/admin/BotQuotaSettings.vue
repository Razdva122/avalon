<template>
  <section class="quota-settings" aria-labelledby="quota-settings-title">
    <h2 id="quota-settings-title">{{ $t('aiArena.thresholdTitle') }}</h2>
    <p id="threshold-settings-hint" class="settings-hint">{{ $t('aiArena.thresholdHint') }}</p>
    <form @submit.prevent="submit">
      <fieldset :disabled="saving">
        <legend class="sr-only">{{ $t('aiArena.thresholdTitle') }}</legend>
        <div class="threshold-grid">
          <section v-for="mode in modes" :key="mode" class="mode-settings">
            <h3>{{ $t(`aiArena.dashboardMode${mode}`) }}</h3>
            <label v-for="window in windows" :key="window">
              <span>{{ $t(window === 'shortTerm' ? 'aiArena.codexShortTermLimit' : 'aiArena.codexWeeklyLimit') }}</span>
              <span class="threshold-input">
                <input
                  v-model.number="draft[mode][window]"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  inputmode="numeric"
                  :aria-label="`${$t(`aiArena.dashboardMode${mode}`)} · ${$t(window === 'shortTerm' ? 'aiArena.codexShortTermLimit' : 'aiArena.codexWeeklyLimit')} (%)`"
                  :aria-invalid="!validPercent(draft[mode][window])"
                  :aria-describedby="
                    !validPercent(draft[mode][window]) ? `threshold-error-${mode}` : 'threshold-settings-hint'
                  "
                />
                <span aria-hidden="true">%</span>
              </span>
            </label>
            <p
              v-if="windows.some((window) => !validPercent(draft[mode][window]))"
              :id="`threshold-error-${mode}`"
              class="field-error"
              role="alert"
            >
              {{ $t('aiArena.thresholdRangeError') }}
            </p>
          </section>
        </div>
      </fieldset>
      <div class="settings-actions">
        <v-btn type="submit" color="primary" variant="flat" :loading="saving" :disabled="!dirty || !valid || loading">
          {{ $t('aiArena.thresholdSave') }}
        </v-btn>
        <v-btn type="button" color="primary" variant="text" :disabled="!dirty || saving" @click="reset">
          {{ $t('aiArena.thresholdCancel') }}
        </v-btn>
        <p v-if="error" role="alert">{{ $t('aiArena.thresholdSaveError') }}</p>
        <p v-else-if="saved && !dirty" role="status">{{ $t('aiArena.thresholdSaved') }}</p>
        <p v-else-if="dirty" class="settings-hint" role="status">{{ $t('aiArena.thresholdUnsaved') }}</p>
      </div>
    </form>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BotQuotaThresholds } from '@avalon/types';
const props = defineProps<{
  thresholds: BotQuotaThresholds;
  initialDraft?: BotQuotaThresholds | null;
  saving: boolean;
  loading: boolean;
  error: boolean;
  saved: boolean;
}>();
const emit = defineEmits<{ save: [thresholds: BotQuotaThresholds]; draft: [thresholds: BotQuotaThresholds] }>();
const modes = ['smart', 'regular', 'beginner'] as const;
const windows = ['shortTerm', 'weekly'] as const;
const clone = (value: BotQuotaThresholds): BotQuotaThresholds => JSON.parse(JSON.stringify(value));
const draft = ref(clone(props.initialDraft || props.thresholds));
watch(draft, (value) => emit('draft', clone(value)), { deep: true, flush: 'sync' });
const dirty = computed(() =>
  modes.some((mode) => windows.some((window) => draft.value[mode][window] !== props.thresholds[mode][window])),
);
const validPercent = (value: number) => Number.isInteger(value) && value >= 0 && value <= 100;
const valid = computed(() => modes.every((mode) => windows.every((window) => validPercent(draft.value[mode][window]))));
watch(
  () => props.thresholds,
  (value, previous) => {
    // Polling must not replace a policy the administrator is still editing.
    if (modes.every((mode) => windows.every((window) => draft.value[mode][window] === previous[mode][window])))
      draft.value = clone(value);
  },
);
function reset() {
  draft.value = clone(props.thresholds);
}
function submit() {
  if (dirty.value && valid.value && !props.saving && !props.loading) emit('save', clone(draft.value));
}
</script>
<style scoped lang="scss">
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.quota-settings {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}
h2 {
  font-size: 20px;
  margin-bottom: 8px;
}
h3 {
  font-size: 16px;
  margin-bottom: 12px;
}
.settings-hint {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.72);
}
.field-error {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-primary));
}
input[aria-invalid='true'] {
  border-color: rgb(var(--v-theme-error));
}
fieldset {
  border: 0;
  min-width: 0;
  padding: 0;
  margin: 20px 0;
}
.threshold-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  margin: 12px 0;
}
.threshold-input {
  display: flex;
  align-items: center;
  gap: 6px;
}
input {
  width: 76px;
  min-height: 44px;
  padding: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.55);
  border-radius: 8px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
}
input:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.settings-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.settings-actions :deep(.v-btn) {
  min-height: 44px;
}
.settings-actions p {
  font-size: 13px;
}
@media (max-width: 900px) {
  .threshold-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .mode-settings + .mode-settings {
    padding-top: 12px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  }
}
</style>
