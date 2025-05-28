<template>
  <v-btn color="info" @click="overlay = !overlay">
    <template v-slot:prepend>
      <span class="material-icons"> settings </span>
    </template>
    {{ buttonText }}
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="options pa-4 rounded-lg">
      <v-form>
        <v-tabs v-model="type" class="tabs" color="text-primary">
          <v-tab value="roles">{{ $t('options.roles') }}</v-tab>
          <v-tab value="addons" v-if="addons">{{ $t('options.addons') }}</v-tab>
          <v-tab value="features" v-if="features">{{ $t('options.features') }}</v-tab>
        </v-tabs>
        <v-tabs v-if="type === 'roles'" v-model="roleTypes" color="text-primary">
          <v-tab value="core">{{ $t('options.coreRoles') }}</v-tab>
          <v-tab value="extra">{{ $t('options.extraRoles') }}</v-tab>
          <v-tab value="experimental">{{ $t('options.experimentalRoles') }}</v-tab>
        </v-tabs>
        <template v-if="type === 'roles'">
          <div class="option" v-for="role in rolesSettings">
            <PlayerIcon class="role" :icon="role.role" :class="rolesShortInfo[role.role].loyalty" />
            <v-checkbox
              @input="onRoleUpdate(role.role)"
              :disabled="role.disabled"
              v-model="roles[role.role]"
              :true-value="1"
              :false-value="0"
              :hide-details="true"
              :color="role.color"
              :label="role.label"
            >
            </v-checkbox>
            <HelpButton :route="'route' in role ? role.route : role.role" :content="rolesShortInfo[role.role].info" />
          </div>
        </template>
        <template v-if="type === 'addons' && addons">
          <div class="addon" v-for="addon in addonsSettings">
            <div :class="addon.name" class="addon-icon"></div>
            <v-checkbox
              @input="onAddonUpdate(addon.name)"
              v-model="addons[addon.name]"
              :label="addon.label"
              :hide-details="true"
              color="info"
            />
            <HelpButton :route="addon.route" :content="addon.hint" />
          </div>
        </template>
        <template v-if="type === 'features' && features">
          <div class="feature" v-for="feature in featuresSettings">
            <v-checkbox v-model="features[feature.name]" :label="feature.label" :hide-details="true" color="info" />
            <HelpButton :content="feature.hint" />
          </div>
        </template>

        <!-- Default Enabled Timers (Always Visible) -->
        <div class="default-enabled-timers mb-4" v-if="type === 'features' && features && features.timerEnabled">
          <div class="timer-section-header">
            <h4 class="timer-section-title">{{ $t('options.mainTimers') }}</h4>
            <v-checkbox
              :model-value="allMainTimersEnabled"
              @update:model-value="(v) => v !== null && toggleAllMainTimers(v)"
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
        <template v-if="type === 'features' && features && features.timerEnabled && otherTimers.length > 0">
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
                      {{ otherTimers.filter((stage) => getStageTimerEnabled(stage.name)).length }}
                      {{ $t('options.enabled') }}
                    </v-chip>
                    <v-checkbox
                      :model-value="allOtherTimersEnabled"
                      @update:model-value="(v) => v !== null && toggleAllOtherTimers(v)"
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
import { defineComponent, PropType } from 'vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import HelpButton from '@/components/feedback/HelpButton.vue';
import StageTimerCard from './StageTimerCard.vue';
import { rolesShortInfo } from '@/components/view/information/const';
import { STAGE_TIMER_DEFAULTS, DEFAULT_ENABLED_STAGES } from '@avalon/types/game/timer-defaults';
import type { GameOptionsRoles, GameOptionsAddons, GameOptionsFeatures, TRoles, TAddonsName } from '@avalon/types';

export default defineComponent({
  components: {
    PlayerIcon,
    HelpButton,
    StageTimerCard,
  },
  props: {
    roles: {
      required: true,
      type: Object as PropType<GameOptionsRoles>,
    },
    addons: {
      type: Object as PropType<GameOptionsAddons>,
    },
    features: {
      type: Object as PropType<GameOptionsFeatures>,
    },
    buttonText: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      overlay: false,
      type: 'roles',
      roleTypes: 'core' as 'core' | 'extra' | 'experimental',
      rolesShortInfo,
      stageTimersExpanded: undefined as number | undefined,
    };
  },
  watch: {
    'features.timerEnabled': {
      handler(enabled: boolean) {
        if (enabled) {
          this.initializeAllTimerConfigs();
        }
      },
      immediate: true,
    },
  },
  mounted() {
    // Initialize timer configs if timer is enabled
    if (this.features?.timerEnabled) {
      this.initializeAllTimerConfigs();
    }
  },
  computed: {
    coreRolesSettings() {
      return [
        { role: 'merlin', label: this.$t('roles.merlin'), disabled: Boolean(this.roles.merlinPure), color: 'success' },
        {
          role: 'merlinPure',
          label: this.$t('roles.merlinPure'),
          disabled: Boolean(this.roles.merlin),
          color: 'success',
          route: 'merlin_pure',
        },
        {
          role: 'percival',
          label: this.$t('roles.percival'),
          disabled: !this.roles.merlin && !this.roles.merlinPure,
          color: 'success',
        },
        { role: 'cleric', label: this.$t('roles.cleric'), disabled: false, color: 'success', route: 'cleric' },
        {
          role: 'morgana',
          label: this.$t('roles.morgana'),
          disabled: (!this.roles.merlin && !this.roles.merlinPure) || !this.roles.percival,
          color: 'warning',
        },
        {
          role: 'mordred',
          label: this.$t('roles.mordred'),
          disabled: !this.roles.merlin && !this.roles.merlinPure,
          color: 'warning',
        },
        { role: 'oberon', label: this.$t('roles.oberon'), disabled: false, color: 'warning' },
      ] as const;
    },
    extraRolesSettings() {
      return [
        { role: 'troublemaker', label: this.$t('roles.troublemaker'), disabled: false, color: 'success' },
        { role: 'tristan', label: this.$t('roles.tristan'), disabled: false, color: 'success', route: 'lovers' },
        { role: 'isolde', label: this.$t('roles.isolde'), disabled: false, color: 'success', route: 'lovers' },
        {
          role: 'guinevere',
          label: this.$t('roles.guinevere'),
          disabled: !this.roles.goodLancelot,
          color: 'success',
          route: 'guinevere',
        },
        {
          role: 'goodLancelot',
          label: this.$t('roles.goodLancelot'),
          disabled: false,
          color: 'success',
          route: 'lancelots',
        },
        {
          role: 'evilLancelot',
          label: this.$t('roles.evilLancelot'),
          disabled: false,
          color: 'warning',
          route: 'lancelots',
        },
        { role: 'trickster', label: this.$t('roles.trickster'), disabled: false, color: 'warning', route: 'trickster' },
        { role: 'lunatic', label: this.$t('roles.lunatic'), disabled: false, color: 'warning', route: 'lunatic' },
        { role: 'brute', label: this.$t('roles.brute'), disabled: false, color: 'warning', route: 'brute' },
      ] as const;
    },
    experimentalRolesSettings() {
      return [
        { role: 'revealer', label: this.$t('roles.revealer'), disabled: false, color: 'warning', route: 'revealer' },
        { role: 'witch', label: this.$t('roles.witch'), disabled: false, color: 'warning', route: 'witch' },
        { role: 'wraith', label: this.$t('roles.wraith'), disabled: false, color: 'warning', route: 'oberon' },
      ] as const;
    },
    addonsSettings() {
      return [
        {
          name: 'ladyOfLake',
          label: this.$t('addons.ladyOfLake'),
          route: 'lady_of_lake',
          hint: this.$t('options.ladyHint'),
        },
        {
          name: 'ladyOfSea',
          label: this.$t('addons.ladyOfSea'),
          route: 'lady_of_sea',
          hint: this.$t('options.ladySeaHint'),
        },
        {
          name: 'excalibur',
          label: this.$t('addons.excalibur'),
          route: 'excalibur',
          hint: this.$t('options.excaliburHint'),
        },
        {
          name: 'plotCards',
          label: this.$t('addons.plotCards'),
          route: 'plot_cards',
          hint: this.$t('options.plotCardsHint'),
        },
      ] as const;
    },
    featuresSettings() {
      return [
        {
          name: 'lookingForPlayers',
          label: this.$t('mainPage.lookingForPlayers'),
          hint: this.$t('options.lookingForPlayersHint'),
        },
        {
          name: 'anonymousVoting',
          label: this.$t('options.anonymousVoting'),
          hint: this.$t('options.anonymousVotingHint'),
        },
        {
          name: 'hiddenHistory',
          label: this.$t('options.hiddenHistory'),
          hint: this.$t('options.hiddenHistoryHint'),
        },
        {
          name: 'displayIndex',
          label: this.$t('options.displayIndex'),
          hint: this.$t('options.displayIndexHint'),
        },
        {
          name: 'timerEnabled',
          label: this.$t('options.timerEnabled'),
          hint: this.$t('options.timerEnabledHint'),
        },
      ] as const;
    },
    rolesSettings() {
      return this[`${this.roleTypes}RolesSettings`];
    },
    stageTimerSettings() {
      return [
        { name: 'selectTeam', label: this.$t('options.stageSelectTeam'), default: STAGE_TIMER_DEFAULTS.selectTeam },
        {
          name: 'votingForTeam',
          label: this.$t('options.stageVotingForTeam'),
          default: STAGE_TIMER_DEFAULTS.votingForTeam,
        },
        { name: 'onMission', label: this.$t('options.stageOnMission'), default: STAGE_TIMER_DEFAULTS.onMission },
        { name: 'assassinate', label: this.$t('options.stageAssassinate'), default: STAGE_TIMER_DEFAULTS.assassinate },
        {
          name: 'checkLoyalty',
          label: this.$t('options.stageCheckLoyalty'),
          default: STAGE_TIMER_DEFAULTS.checkLoyalty,
        },
        {
          name: 'announceLoyalty',
          label: this.$t('options.stageAnnounceLoyalty'),
          default: STAGE_TIMER_DEFAULTS.announceLoyalty,
        },
        {
          name: 'revealLoyalty',
          label: this.$t('options.stageRevealLoyalty'),
          default: STAGE_TIMER_DEFAULTS.revealLoyalty,
        },
        {
          name: 'giveExcalibur',
          label: this.$t('options.stageGiveExcalibur'),
          default: STAGE_TIMER_DEFAULTS.giveExcalibur,
        },
        {
          name: 'useExcalibur',
          label: this.$t('options.stageUseExcalibur'),
          default: STAGE_TIMER_DEFAULTS.useExcalibur,
        },
        { name: 'giveCard', label: this.$t('options.stageGiveCard'), default: STAGE_TIMER_DEFAULTS.giveCard },
        {
          name: 'witchAbility',
          label: this.$t('options.stageWitchAbility'),
          default: STAGE_TIMER_DEFAULTS.witchAbility,
        },
      ] as const;
    },
    enabledStagesCount() {
      return this.stageTimerSettings.filter((stage) => this.getStageTimerEnabled(stage.name)).length;
    },
    defaultEnabledTimers() {
      return this.stageTimerSettings.filter((stage) => DEFAULT_ENABLED_STAGES.includes(stage.name));
    },
    otherTimers() {
      return this.stageTimerSettings.filter((stage) => !DEFAULT_ENABLED_STAGES.includes(stage.name));
    },
    allMainTimersEnabled() {
      return this.defaultEnabledTimers.every((stage) => this.getStageTimerEnabled(stage.name));
    },
    allOtherTimersEnabled() {
      return this.otherTimers.every((stage) => this.getStageTimerEnabled(stage.name));
    },
  },
  methods: {
    removeMerlinAdditionalRoles() {
      this.roles.morgana = 0;
      this.roles.percival = 0;
      this.roles.mordred = 0;
    },
    onRoleUpdate(roleName: TRoles) {
      if (roleName === 'isolde') {
        this.roles.tristan = this.roles.isolde;
      }

      if (roleName === 'tristan') {
        this.roles.isolde = this.roles.tristan;
      }

      if (roleName === 'evilLancelot') {
        if (!this.roles.evilLancelot) {
          this.roles.guinevere = 0;
        }

        this.roles.goodLancelot = this.roles.evilLancelot;
      }

      if (roleName === 'goodLancelot') {
        if (!this.roles.goodLancelot) {
          this.roles.guinevere = 0;
        }

        this.roles.evilLancelot = this.roles.goodLancelot;
      }

      if (roleName === 'percival' && !this.roles.percival) {
        this.roles.morgana = 0;
      }

      if ((roleName === 'merlin' || roleName === 'merlinPure') && !this.roles[roleName]) {
        this.removeMerlinAdditionalRoles();
      }
    },
    onAddonUpdate(addonName: TAddonsName) {
      if (this.addons) {
        if (addonName === 'ladyOfLake' && this.addons.ladyOfLake) {
          this.addons.ladyOfSea = false;
        }

        if (addonName === 'ladyOfSea' && this.addons.ladyOfSea) {
          this.addons.ladyOfLake = false;
        }
      }
    },
    getStageTimerDuration(stageName: string): number | undefined {
      const stageConfig = this.features?.timerDurations?.[stageName as keyof typeof this.features.timerDurations];
      if (typeof stageConfig === 'object' && stageConfig) {
        return stageConfig.duration;
      }
      return undefined;
    },
    getStageTimerEnabled(stageName: string): boolean {
      const stageConfig = this.features?.timerDurations?.[stageName as keyof typeof this.features.timerDurations];
      if (typeof stageConfig === 'object' && stageConfig) {
        return stageConfig.enabled !== false; // Default to true if not explicitly false
      }
      // If no explicit config, use default based on stage type
      return DEFAULT_ENABLED_STAGES.includes(stageName);
    },
    setStageTimerDuration(stageName: string, value: number | string | undefined | null) {
      if (!this.features?.timerDurations) return;

      const stageConfig = this.features.timerDurations[stageName as keyof typeof this.features.timerDurations] as any;

      if (!stageConfig) {
        // Config should be pre-initialized, but create if missing
        this.features.timerDurations[stageName as keyof typeof this.features.timerDurations] = {
          enabled: this.getDefaultEnabledState(stageName),
        } as any;
        return;
      }

      if (value === undefined || value === null || value === '') {
        if (typeof stageConfig === 'object') {
          delete stageConfig.duration;
        }
      } else {
        if (typeof stageConfig === 'object') {
          stageConfig.duration = Number(value);
        }
      }
    },
    setStageTimerEnabled(stageName: string, enabled: boolean) {
      if (!this.features?.timerDurations) return;

      const stageConfig = this.features.timerDurations[stageName as keyof typeof this.features.timerDurations] as any;

      if (!stageConfig) {
        // Config should be pre-initialized, but create if missing
        this.features.timerDurations[stageName as keyof typeof this.features.timerDurations] = {
          enabled: enabled,
        } as any;
        return;
      }

      if (typeof stageConfig === 'object') {
        stageConfig.enabled = enabled;
      }
    },
    initializeAllTimerConfigs() {
      if (!this.features || !this.features.timerEnabled) return;

      // Ensure timerDurations object exists
      if (!this.features.timerDurations) {
        this.features.timerDurations = {};
      }

      // Initialize all timer configs at once to avoid reactive overhead
      const timerDurations = this.features.timerDurations;
      const allStages = this.stageTimerSettings;

      // Batch initialize all configs
      allStages.forEach((stage) => {
        const stageName = stage.name as keyof typeof timerDurations;
        if (!timerDurations[stageName]) {
          timerDurations[stageName] = {
            enabled: this.getDefaultEnabledState(stage.name),
            // duration is optional, will use default if not set
          } as any;
        } else if (typeof timerDurations[stageName] === 'object' && !('enabled' in timerDurations[stageName])) {
          // Add missing enabled property to existing config
          (timerDurations[stageName] as any).enabled = this.getDefaultEnabledState(stage.name);
        }
      });
    },
    ensureTimerDurationsExists() {
      if (!this.features) return false;
      if (!this.features.timerDurations) {
        this.features.timerDurations = {};
      }
      return true;
    },
    getDefaultEnabledState(stageName: string): boolean {
      return DEFAULT_ENABLED_STAGES.includes(stageName);
    },
    resetStageTimer(stageName: string) {
      if (!this.features?.timerDurations) return;
      delete this.features.timerDurations[stageName as keyof typeof this.features.timerDurations];
    },
    toggleAllMainTimers(enabled: boolean) {
      // Configs are already initialized, just set enabled states
      this.defaultEnabledTimers.forEach((stage) => {
        this.setStageTimerEnabled(stage.name, enabled);
      });
    },
    toggleAllOtherTimers(enabled: boolean) {
      // Configs are already initialized, just set enabled states
      this.otherTimers.forEach((stage) => {
        this.setStageTimerEnabled(stage.name, enabled);
      });
    },
  },
});
</script>

<style scoped lang="scss">
.options {
  background-color: rgb(var(--v-theme-surface));
  width: 100%;
  max-width: 100vw;
  max-height: 90vh;
  min-height: 530px;
  overflow-y: auto;
}

.role,
.addon-icon {
  width: 40px;
  height: 40px;
  border: 2px solid black;
}

.role.good {
  border-color: rgb(var(--v-theme-info));
}

.role.evil {
  border-color: rgb(var(--v-theme-error));
}

.option,
.addon,
.feature {
  display: flex;
  align-items: center;
}

.ladyOfLake {
  background-image: getImagePathByID('features', 'lady_of_lake');
  background-size: contain;
}

// Timer configuration styles
.default-enabled-timers {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
}

.stage-timer-config {
  margin-top: 16px;
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

.default-timer-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.default-duration-field {
  max-width: 150px;
  min-width: 120px;
}

.apply-default-btn,
.enable-recommended-btn {
  white-space: nowrap;
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

// Stage timer card styles moved to StageTimerCard.vue component

@media (max-width: 600px) {
  .default-timer-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .default-duration-field {
    max-width: none;
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

  // Stage timer card responsive styles moved to StageTimerCard.vue component
}

.ladyOfSea {
  background-image: getImagePathByID('features', 'lady_of_sea');
  background-size: contain;
}

.excalibur {
  background-image: getImagePathByID('features', 'excalibur');
  background-size: contain;
}

.plotCards {
  background-image: getImagePathByID('features', 'plot_cards');
  background-size: contain;
}

.tabs {
  border-radius: 8px;
}

.stage-timers {
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  margin-top: 12px;
}

.stage-timer-table {
  background-color: transparent;
  width: 100%;
  margin-top: 16px;

  :deep(.v-data-table__wrapper) {
    max-height: 400px;
    overflow-y: auto;
  }

  :deep(td) {
    padding: 4px 8px !important;
  }

  :deep(th) {
    background-color: rgba(var(--v-theme-primary), 0.1);
    font-weight: 600;
    text-align: left;
    color: rgb(var(--v-theme-on-surface));
  }

  td {
    padding: 8px 0;
  }
}

// hide native spinner controls on number inputs
.stage-timer-table input[type='number']::-webkit-outer-spin-button,
.stage-timer-table input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stage-timer-table input[type='number'] {
  -moz-appearance: textfield;
}
</style>
