<template>
  <v-btn color="info" class="mt-2" @click="overlay = !overlay">
    <template v-slot:prepend>
      <span class="material-icons">timer</span>
    </template>
    {{ $t('options.timer') }}
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="timer-options pa-4 rounded-lg">
      <v-form>
        <div class="timer-header">
          <h3>{{ $t('options.timerSettings') }}</h3>
        </div>

        <!-- Default Enabled Timers (Always Visible) -->
        <div class="default-enabled-timers mb-4">
          <div class="timer-section-header">
            <h4 class="timer-section-title">{{ $t('options.mainTimers') }}</h4>
            <v-checkbox
              :model-value="allMainTimersEnabled"
              @update:model-value="(v: boolean | null) => v !== null && toggleAllMainTimers(v)"
              color="info"
              hide-details
              density="compact"
              :label="$t('options.enableAll')"
              class="enable-all-checkbox"
            />
          </div>
          <div class="stage-timer-list">
            <StageTimerCard
              v-for="stage in defaultEnabledTimers"
              :key="stage.name"
              :label="stage.label"
              :enabled="getStageTimerEnabled(stage.name)"
              :duration="getStageTimerDuration(stage.name)"
              :default-duration="stage.default"
              @update:enabled="setStageTimerEnabled(stage.name, $event)"
              @update:duration="setStageTimerDuration(stage.name, $event)"
              @reset="resetStageTimer(stage.name)"
            />
          </div>
        </div>

        <!-- Other Timer Settings (Collapsible) -->
        <template v-if="otherTimers.length > 0">
          <v-expansion-panels v-model="stageTimersExpanded" class="stage-timer-panels">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="stage-timer-header">
                  <div class="stage-timer-left">
                    <span class="material-icons">schedule</span>
                    <span class="stage-timer-title">{{ $t('options.otherTimers') }}</span>
                  </div>
                  <div class="stage-timer-right">
                    <v-chip size="small" color="info" class="enabled-count-chip">
                      {{ otherTimers.filter((stage: any) => getStageTimerEnabled(stage.name)).length }}
                      {{ $t('options.enabled') }}
                    </v-chip>
                    <v-checkbox
                      :model-value="allOtherTimersEnabled"
                      @update:model-value="(v: boolean | null) => v !== null && toggleAllOtherTimers(v)"
                      color="info"
                      hide-details
                      density="compact"
                      :label="$t('options.enableAll')"
                      class="enable-all-checkbox"
                      @click.stop
                    />
                  </div>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="stage-timer-list">
                  <StageTimerCard
                    v-for="stage in otherTimers"
                    :key="stage.name"
                    :label="stage.label"
                    :enabled="getStageTimerEnabled(stage.name)"
                    :duration="getStageTimerDuration(stage.name)"
                    :default-duration="stage.default"
                    @update:enabled="setStageTimerEnabled(stage.name, $event)"
                    @update:duration="setStageTimerDuration(stage.name, $event)"
                    @reset="resetStageTimer(stage.name)"
                  />
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
      </v-form>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StageTimerCard from './StageTimerCard.vue';
import { STAGE_TIMER_DEFAULTS, DEFAULT_ENABLED_STAGES } from '@avalon/types/game/timer-defaults';
import type { GameOptionsFeatures, TimerConfig, TimerDurations } from '@avalon/types';

interface StageTimerSetting {
  name: string;
  label: string;
  default: number;
}

export default defineComponent({
  name: 'TimerButton',
  components: {
    StageTimerCard,
  },
  props: {
    features: {
      type: Object as PropType<GameOptionsFeatures>,
      required: true,
    },
  },
  emits: ['update:features'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const overlay = ref(false);
    const stageTimersExpanded = ref<number | undefined>(undefined);

    const updateTimerEnabled = (enabled: boolean | null) => {
      if (enabled === null) return;

      const updatedFeatures = { ...props.features, timerEnabled: enabled };

      // Initialize timer durations if enabling timer
      if (enabled && (!updatedFeatures.timerDurations || Object.keys(updatedFeatures.timerDurations).length === 0)) {
        updatedFeatures.timerDurations = {} as TimerDurations;
        stageTimerSettings.value.forEach((stage) => {
          const stageName = stage.name as keyof TimerDurations;
          if (updatedFeatures.timerDurations) {
            (updatedFeatures.timerDurations as any)[stageName] = {
              enabled: DEFAULT_ENABLED_STAGES.includes(stage.name),
            };
          }
        });
      }

      emit('update:features', updatedFeatures);
    };

    const stageTimerSettings = computed<StageTimerSetting[]>(() => [
      { name: 'selectTeam', label: t('options.stageSelectTeam'), default: STAGE_TIMER_DEFAULTS.selectTeam },
      { name: 'votingForTeam', label: t('options.stageVotingForTeam'), default: STAGE_TIMER_DEFAULTS.votingForTeam },
      { name: 'onMission', label: t('options.stageOnMission'), default: STAGE_TIMER_DEFAULTS.onMission },
      { name: 'assassinate', label: t('options.stageAssassinate'), default: STAGE_TIMER_DEFAULTS.assassinate },
      { name: 'checkLoyalty', label: t('options.stageCheckLoyalty'), default: STAGE_TIMER_DEFAULTS.checkLoyalty },
      {
        name: 'announceLoyalty',
        label: t('options.stageAnnounceLoyalty'),
        default: STAGE_TIMER_DEFAULTS.announceLoyalty,
      },
      { name: 'revealLoyalty', label: t('options.stageRevealLoyalty'), default: STAGE_TIMER_DEFAULTS.revealLoyalty },
      { name: 'giveExcalibur', label: t('options.stageGiveExcalibur'), default: STAGE_TIMER_DEFAULTS.giveExcalibur },
      { name: 'useExcalibur', label: t('options.stageUseExcalibur'), default: STAGE_TIMER_DEFAULTS.useExcalibur },
      { name: 'giveCard', label: t('options.stageGiveCard'), default: STAGE_TIMER_DEFAULTS.giveCard },
      { name: 'witchAbility', label: t('options.stageWitchAbility'), default: STAGE_TIMER_DEFAULTS.witchAbility },
    ]);

    const defaultEnabledTimers = computed(() =>
      stageTimerSettings.value.filter((stage) => DEFAULT_ENABLED_STAGES.includes(stage.name)),
    );

    const otherTimers = computed(() =>
      stageTimerSettings.value.filter((stage) => !DEFAULT_ENABLED_STAGES.includes(stage.name)),
    );

    const allMainTimersEnabled = computed(() =>
      defaultEnabledTimers.value.every((stage) => getStageTimerEnabled(stage.name)),
    );

    const allOtherTimersEnabled = computed(() => otherTimers.value.every((stage) => getStageTimerEnabled(stage.name)));

    const getStageTimerDuration = (stageName: string): number | undefined => {
      const stageConfig = props.features?.timerDurations?.[stageName as keyof TimerDurations];
      if (typeof stageConfig === 'object' && stageConfig) {
        return stageConfig.duration;
      }
      return undefined;
    };

    const getStageTimerEnabled = (stageName: string): boolean => {
      const stageConfig = props.features?.timerDurations?.[stageName as keyof TimerDurations];
      if (typeof stageConfig === 'object' && stageConfig) {
        return stageConfig.enabled !== false; // Default to true if not explicitly false
      }
      // If no explicit config, use default based on stage type
      return DEFAULT_ENABLED_STAGES.includes(stageName);
    };

    const setStageTimerDuration = (stageName: string, value: number | string | undefined | null) => {
      if (!props.features) return;

      const updatedFeatures = { ...props.features };
      if (!updatedFeatures.timerDurations) {
        updatedFeatures.timerDurations = {} as TimerDurations;
      }

      const timerDurations = { ...updatedFeatures.timerDurations };
      const stageName_key = stageName as keyof TimerDurations;
      const stageConfig = (timerDurations as any)[stageName_key] || ({} as TimerConfig);

      if (value === undefined || value === null || value === '') {
        delete stageConfig.duration;
      } else {
        stageConfig.duration = Number(value);
      }

      (timerDurations as any)[stageName_key] = stageConfig;
      updatedFeatures.timerDurations = timerDurations;

      emit('update:features', updatedFeatures);
    };

    const setStageTimerEnabled = (stageName: string, enabled: boolean) => {
      if (!props.features) return;

      const updatedFeatures = { ...props.features };

      if (!updatedFeatures.timerDurations) {
        updatedFeatures.timerDurations = {} as TimerDurations;
      }

      const timerDurations = { ...updatedFeatures.timerDurations };
      const stageName_key = stageName as keyof TimerDurations;
      const stageConfig = (timerDurations as any)[stageName_key] || ({} as TimerConfig);

      stageConfig.enabled = enabled;
      (timerDurations as any)[stageName_key] = stageConfig;
      updatedFeatures.timerDurations = timerDurations;

      emit('update:features', updatedFeatures);
    };

    const resetStageTimer = (stageName: string) => {
      if (!props.features) return;

      const updatedFeatures = { ...props.features };
      if (!updatedFeatures.timerDurations) return;

      const timerDurations = { ...updatedFeatures.timerDurations };
      const stageName_key = stageName as keyof TimerDurations;

      delete (timerDurations as any)[stageName_key];
      updatedFeatures.timerDurations = timerDurations;

      emit('update:features', updatedFeatures);
    };

    const toggleAllMainTimers = (enabled: boolean) => {
      defaultEnabledTimers.value.forEach((stage) => {
        setStageTimerEnabled(stage.name, enabled);
      });
    };

    const toggleAllOtherTimers = (enabled: boolean) => {
      otherTimers.value.forEach((stage) => {
        setStageTimerEnabled(stage.name, enabled);
      });
    };

    // Initialize timer configs if timer is enabled
    watch(
      () => props.features?.timerEnabled,
      (enabled) => {
        if (enabled && (!props.features.timerDurations || Object.keys(props.features.timerDurations).length === 0)) {
          const updatedFeatures = { ...props.features, timerDurations: {} as TimerDurations };

          stageTimerSettings.value.forEach((stage) => {
            const stageName = stage.name as keyof TimerDurations;
            if (updatedFeatures.timerDurations) {
              (updatedFeatures.timerDurations as any)[stageName] = {
                enabled: DEFAULT_ENABLED_STAGES.includes(stage.name),
              };
            }
          });

          emit('update:features', updatedFeatures);
        }
      },
      { immediate: true },
    );

    return {
      overlay,
      stageTimersExpanded,
      stageTimerSettings,
      defaultEnabledTimers,
      otherTimers,
      allMainTimersEnabled,
      allOtherTimersEnabled,
      getStageTimerDuration,
      getStageTimerEnabled,
      setStageTimerDuration,
      setStageTimerEnabled,
      resetStageTimer,
      toggleAllMainTimers,
      toggleAllOtherTimers,
      updateTimerEnabled,
    };
  },
});
</script>

<style scoped lang="scss">
.timer-options {
  background-color: rgb(var(--v-theme-surface));
  width: 100%;
  max-width: 100vw;
  max-height: 90vh;
  min-height: 530px;
  overflow-y: auto;
}

.timer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    margin-bottom: 0;
    color: rgb(var(--v-theme-primary));
  }
}

.timer-enabled-checkbox {
  flex-shrink: 0;
}

.default-enabled-timers {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
}

.timer-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.timer-section-title {
  margin-bottom: 0;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.enable-all-checkbox {
  flex-shrink: 0;
}

.stage-timer-panels {
  margin-top: 16px;
}

.stage-timer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.stage-timer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.stage-timer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stage-timer-title {
  font-weight: 500;
}

.enabled-count-chip {
  flex-shrink: 0;
}

.stage-timer-list {
  padding: 8px 0;
}

.stage-timer-panels .stage-timer-list {
  padding-bottom: 24px;
}

@media (max-width: 600px) {
  .timer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .timer-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .stage-timer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .enabled-count-chip {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>
