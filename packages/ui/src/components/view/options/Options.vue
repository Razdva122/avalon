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
          <div class="feature stage-timers" v-if="features.timerEnabled">
            <v-data-table
              :headers="stageTimerHeaders"
              :items="stageTimerSettings"
              class="stage-timer-table"
              hide-default-footer
              dense
            >
              <template #item.enabled="{ item }">
                <v-checkbox
                  :model-value="getStageTimerEnabled(item.name)"
                  @update:model-value="(v) => setStageTimerEnabled(item.name, v)"
                  color="info"
                  hide-details
                  density="compact"
                />
              </template>
              <template #item.duration="{ item }">
                <v-text-field
                  :model-value="getStageTimerDuration(item.name)"
                  @update:model-value="(v) => setStageTimerDuration(item.name, v)"
                  type="number"
                  :min="10"
                  :max="600"
                  :suffix="$t('options.seconds')"
                  :placeholder="item.default.toString()"
                  density="compact"
                  hide-details
                  :disabled="!getStageTimerEnabled(item.name)"
                />
              </template>
              <template #item.actions="{ item }">
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-btn icon v-bind="props" @click="resetStageTimer(item.name)">
                      <span class="material-icons">restore</span>
                    </v-btn>
                  </template>
                  <span>{{ $t('options.reset') }}</span>
                </v-tooltip>
              </template>
            </v-data-table>
          </div>
        </template>
      </v-form>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import HelpButton from '@/components/feedback/HelpButton.vue';
import { rolesShortInfo } from '@/components/view/information/const';
import type { GameOptionsRoles, GameOptionsAddons, GameOptionsFeatures, TRoles, TAddonsName } from '@avalon/types';

export default defineComponent({
  components: {
    PlayerIcon,
    HelpButton,
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
  watch: {},
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
    stageTimerHeaders() {
      return [
        { text: this.$t('options.stage'), value: 'label' },
        { text: this.$t('options.enabled'), value: 'enabled', align: 'center' },
        { text: this.$t('options.duration'), value: 'duration' },
        { text: this.$t('options.actions'), value: 'actions', align: 'center' },
      ];
    },
    rolesSettings() {
      return this[`${this.roleTypes}RolesSettings`];
    },
    stageTimerSettings() {
      return [
        { name: 'selectTeam', label: this.$t('options.stageSelectTeam'), default: 90 },
        { name: 'votingForTeam', label: this.$t('options.stageVotingForTeam'), default: 30 },
        { name: 'onMission', label: this.$t('options.stageOnMission'), default: 60 },
        { name: 'assassinate', label: this.$t('options.stageAssassinate'), default: 120 },
        { name: 'checkLoyalty', label: this.$t('options.stageCheckLoyalty'), default: 45 },
        { name: 'announceLoyalty', label: this.$t('options.stageAnnounceLoyalty'), default: 30 },
        { name: 'revealLoyalty', label: this.$t('options.stageRevealLoyalty'), default: 45 },
        { name: 'giveExcalibur', label: this.$t('options.stageGiveExcalibur'), default: 30 },
        { name: 'useExcalibur', label: this.$t('options.stageUseExcalibur'), default: 30 },
        { name: 'giveCard', label: this.$t('options.stageGiveCard'), default: 30 },
        { name: 'switchLancelots', label: this.$t('options.stageSwitchLancelots'), default: 60 },
        { name: 'witchAbility', label: this.$t('options.stageWitchAbility'), default: 45 },
      ] as const;
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
      // Handle legacy format
      if (typeof stageConfig === 'number') {
        return stageConfig;
      }
      return undefined;
    },
    getStageTimerEnabled(stageName: string): boolean {
      const stageConfig = this.features?.timerDurations?.[stageName as keyof typeof this.features.timerDurations];
      if (typeof stageConfig === 'object' && stageConfig) {
        return stageConfig.enabled !== false; // Default to true if not explicitly false
      }
      // For legacy format, default to enabled
      return true;
    },
    setStageTimerDuration(stageName: string, value: number | string | undefined | null) {
      if (!this.features) return;

      this.ensureStageTimerConfig(stageName);
      const stageConfig = this.features.timerDurations![stageName as keyof typeof this.features.timerDurations] as any;

      if (value === undefined || value === null || value === '') {
        if (typeof stageConfig === 'object') {
          delete stageConfig.duration;
          // If no properties left, remove the whole config
          if (Object.keys(stageConfig).length === 0) {
            delete this.features.timerDurations![stageName as keyof typeof this.features.timerDurations];
          }
        }
      } else {
        if (typeof stageConfig === 'object') {
          stageConfig.duration = Number(value);
        }
      }
    },
    setStageTimerEnabled(stageName: string, enabled: boolean) {
      if (!this.features) return;

      this.ensureStageTimerConfig(stageName);
      const stageConfig = this.features.timerDurations![stageName as keyof typeof this.features.timerDurations] as any;

      if (typeof stageConfig === 'object') {
        stageConfig.enabled = enabled;
      }
    },
    ensureStageTimerConfig(stageName: string) {
      if (!this.features || !this.features.timerDurations) {
        if (this.features) {
          this.features.timerDurations = {};
        }
        return;
      }

      const currentConfig = this.features.timerDurations[stageName as keyof typeof this.features.timerDurations];

      // Convert legacy format to new format
      if (typeof currentConfig === 'number') {
        this.features.timerDurations[stageName as keyof typeof this.features.timerDurations] = {
          duration: currentConfig,
          enabled: true,
        } as any;
      } else if (!currentConfig) {
        this.features.timerDurations[stageName as keyof typeof this.features.timerDurations] = {} as any;
      }
    },
    resetStageTimer(stageName: string) {
      if (!this.features?.timerDurations) return;
      delete this.features.timerDurations[stageName as keyof typeof this.features.timerDurations];
    },
  },
});
</script>

<style scoped lang="scss">
.options {
  background-color: rgb(var(--v-theme-surface));
  width: 100%;
  max-width: 100vw;
  min-height: 530px;
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

  ::v-deep .v-data-table__wrapper {
    max-height: 400px;
    overflow-y: auto;
  }

  ::v-deep td {
    padding: 4px 8px !important;
  }

  ::v-deep th {
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
