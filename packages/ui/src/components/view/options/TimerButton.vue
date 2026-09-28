<template>
  <v-btn color="info" class="mt-2" @click="overlay = true">
    <template #prepend><span class="material-icons" aria-hidden="true">timer</span></template
    >{{ $t('options.timer') }}
  </v-btn>
  <v-dialog v-model="overlay" :fullscreen="xs" max-width="600" :aria-label="$t('options.timerSettings')">
    <section class="timer-options">
      <header class="timer-header">
        <h2>{{ $t('options.timerSettings') }}</h2>
        <v-btn
          icon="close"
          color="text-primary"
          variant="text"
          :aria-label="$t('hostMenu.close')"
          @click="overlay = false"
        />
      </header>
      <div class="timer-options-body">
        <TimerTypeSelector :features="features" @update:features="updateFeatures" />
        <template v-if="isStageTimerEnabled">
          <div class="timer-section-header">
            <h3>{{ $t('options.mainTimers') }}</h3>
            <v-checkbox
              :model-value="allMainTimersEnabled"
              @update:model-value="(v) => v !== null && toggleAllMainTimers(v)"
              color="info"
              hide-details
              :label="$t('options.enableAll')"
            />
          </div>
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
          <v-expansion-panels v-model="stageTimersExpanded" class="stage-timer-panels" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>{{ $t('options.otherTimers') }}</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-checkbox
                  :model-value="allOtherTimersEnabled"
                  @update:model-value="(v) => v !== null && toggleAllOtherTimers(v)"
                  color="info"
                  hide-details
                  :label="$t('options.enableAll')"
                />
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
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
      </div>
      <footer class="timer-options-footer">
        <p>{{ $t('timerUi.savedImmediately') }}</p>
        <v-btn color="primary" min-height="44" @click="overlay = false">{{ $t('options.done') }}</v-btn>
      </footer>
    </section>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { useI18n } from 'vue-i18n';
import StageTimerCard from './StageTimerCard.vue';
import TimerTypeSelector from './TimerTypeSelector.vue';
import { STAGE_TIMER_DEFAULTS, DEFAULT_ENABLED_STAGES } from '@avalon/types/game/timer-defaults';
import type { GameOptionsFeatures, TimerConfig, TimerDurations } from '@avalon/types';

interface StageTimerSetting {
  name: keyof TimerDurations;
  label: string;
  default: number;
}

export default defineComponent({
  name: 'TimerButton',
  components: {
    StageTimerCard,
    TimerTypeSelector,
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
    const { xs } = useDisplay();

    // Проверяем, включен ли таймер
    const isStageTimerEnabled = computed(() => {
      return !props.features.useCustomTimer;
    });
    const overlay = ref(false);
    const stageTimersExpanded = ref<number | undefined>(undefined);

    const updateFeatures = (updatedFeatures: GameOptionsFeatures) => {
      emit('update:features', updatedFeatures);
    };

    const stageTimerSettings = computed<StageTimerSetting[]>(() => [
      { name: 'selectTeam', label: t('options.stageSelectTeam'), default: STAGE_TIMER_DEFAULTS.selectTeam },
      {
        name: 'firstSelectTeam',
        label: t('options.stageFirstSelectTeam'),
        default: STAGE_TIMER_DEFAULTS.firstSelectTeam,
      },
      { name: 'votingForTeam', label: t('options.stageVotingForTeam'), default: STAGE_TIMER_DEFAULTS.votingForTeam },
      { name: 'onMission', label: t('options.stageOnMission'), default: STAGE_TIMER_DEFAULTS.onMission },
      { name: 'assassinate', label: t('options.stageAssassinate'), default: STAGE_TIMER_DEFAULTS.assassinate },
      { name: 'checkLoyalty', label: t('options.stageCheckLoyalty'), default: STAGE_TIMER_DEFAULTS.checkLoyalty },
      {
        name: 'announceLoyalty',
        label: t('options.stageAnnounceLoyalty'),
        default: STAGE_TIMER_DEFAULTS.announceLoyalty,
      },
      { name: 'giveExcalibur', label: t('options.stageGiveExcalibur'), default: STAGE_TIMER_DEFAULTS.giveExcalibur },
      { name: 'useExcalibur', label: t('options.stageUseExcalibur'), default: STAGE_TIMER_DEFAULTS.useExcalibur },
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

    const getStageTimerDuration = (stageName: keyof TimerDurations): number | undefined => {
      return props.features?.timerDurations?.[stageName]?.duration;
    };

    const getStageTimerEnabled = (stageName: keyof TimerDurations): boolean => {
      return Boolean(props.features?.timerDurations?.[stageName]?.enabled);
    };

    const setStageTimerDuration = (stageName: keyof TimerDurations, value: number | string | undefined | null) => {
      if (!props.features) return;

      const updatedFeatures = { ...props.features };
      if (!updatedFeatures.timerDurations) {
        updatedFeatures.timerDurations = {} as TimerDurations;
      }

      const timerDurations = { ...updatedFeatures.timerDurations };
      const stageConfig = { ...timerDurations[stageName] } as TimerConfig;

      if (value === undefined || value === null || value === '') {
        delete stageConfig.duration;
      } else {
        const duration = Number(value);
        if (!Number.isInteger(duration) || duration < 10 || duration > 600) return;
        stageConfig.duration = duration;
      }

      timerDurations[stageName] = stageConfig;
      updatedFeatures.timerDurations = timerDurations;

      emit('update:features', updatedFeatures);
    };

    const setStageTimerEnabled = (stageName: keyof TimerDurations | (keyof TimerDurations)[], enabled: boolean) => {
      if (!props.features) return;

      const updatedFeatures = { ...props.features };

      if (!updatedFeatures.timerDurations) {
        updatedFeatures.timerDurations = {} as TimerDurations;
      }

      const stageNames = Array.isArray(stageName) ? stageName : [stageName];

      const timerDurations = { ...updatedFeatures.timerDurations };

      stageNames.forEach((el) => {
        const stageConfig = { ...timerDurations[el] } as TimerConfig;

        stageConfig.enabled = enabled;
        timerDurations[el] = stageConfig;
        updatedFeatures.timerDurations = timerDurations;
      });

      emit('update:features', updatedFeatures);
    };

    const resetStageTimer = (stageName: keyof TimerDurations) => {
      if (!props.features) return;

      const updatedFeatures = { ...props.features };
      if (!updatedFeatures.timerDurations) return;

      const timerDurations = { ...updatedFeatures.timerDurations };

      timerDurations[stageName] = { ...timerDurations[stageName], duration: STAGE_TIMER_DEFAULTS[stageName] };
      updatedFeatures.timerDurations = timerDurations;

      emit('update:features', updatedFeatures);
    };

    const toggleAllMainTimers = (enabled: boolean) => {
      setStageTimerEnabled(
        defaultEnabledTimers.value.map((el) => el.name),
        enabled,
      );
    };

    const toggleAllOtherTimers = (enabled: boolean) => {
      setStageTimerEnabled(
        otherTimers.value.map((el) => el.name),
        enabled,
      );
    };

    return {
      overlay,
      xs,
      isStageTimerEnabled,
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
      updateFeatures,
    };
  },
});
</script>

<style scoped lang="scss">
.timer-options {
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  border-radius: 8px;
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.timer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-inset-hover));
}
.timer-header h2 {
  font-size: 20px;
}
.timer-options-body {
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
}
.timer-section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
}
.timer-section-header h3 {
  font-size: 16px;
}
.timer-section-header :deep(.v-input) {
  flex: 0 0 auto;
}
.stage-timer-panels {
  margin-top: 16px;
}
.timer-options-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid rgb(var(--v-theme-inset-hover));
}
.timer-options-footer p {
  font-size: 12px;
}
@media (max-width: 599px) {
  .timer-options {
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
  .timer-options-body {
    flex: 1;
    padding: 16px;
  }
  .timer-header {
    padding-top: max(12px, env(safe-area-inset-top));
  }
  .timer-options-footer {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
</style>
