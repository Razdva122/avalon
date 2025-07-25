<template>
  <v-btn color="info" @click="overlay = !overlay">
    <template v-slot:prepend>
      <span class="material-icons"> settings </span>
    </template>
    {{ buttonText }}
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="options pa-4 rounded-lg">
      <v-btn
        @click="overlay = false"
        class="close"
        icon="close"
        color="text-primary"
        variant="text"
        density="compact"
      />
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
            <div class="role-controls">
              <v-checkbox
                @change="onRoleCheckboxChange(role.role)"
                :disabled="role.disabled"
                :model-value="(roles[role.role] || 0) > 0"
                :hide-details="true"
                :color="role.color"
                :label="role.label"
              >
              </v-checkbox>

              <div
                v-if="features?.wtfMode && !disabledForDuplication.includes(role.role) && roles[role.role]"
                class="role-counter"
              >
                <v-btn
                  size="small"
                  icon="remove"
                  variant="text"
                  density="compact"
                  @click="decreaseRoleCount(role.role)"
                ></v-btn>
                <span class="role-count">{{ roles[role.role] }}</span>
                <v-btn
                  size="small"
                  icon="add"
                  variant="text"
                  density="compact"
                  @click="increaseRoleCount(role.role)"
                ></v-btn>
              </div>
            </div>
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
      disabledForDuplication: ['witch', 'goodLancelot', 'evilLancelot'] as TRoles[],
    };
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
          name: 'wtfMode',
          label: this.$t('options.wtfMode'),
          hint: this.$t('options.wtfModeHint'),
        },
      ] as const;
    },
    rolesSettings() {
      return this[`${this.roleTypes}RolesSettings`];
    },
  },
  methods: {
    removeMerlinAdditionalRoles() {
      this.roles.morgana = 0;
      this.roles.percival = 0;
      this.roles.mordred = 0;
    },
    increaseRoleCount(role: keyof GameOptionsRoles) {
      this.roles[role] = (this.roles[role] || 0) + 1;
    },
    decreaseRoleCount(role: keyof GameOptionsRoles) {
      this.roles[role] = (this.roles[role] || 0) - 1;
    },
    onRoleCheckboxChange(roleName: keyof GameOptionsRoles) {
      this.roles[roleName] = this.roles[roleName] ? 0 : 1;

      this.handleRoleDependencies(roleName);
    },
    handleRoleDependencies(roleName: TRoles) {
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
  },
});
</script>

<style scoped lang="scss">
.close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

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

.role-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.role-counter {
  display: flex;
  align-items: center;
  background-color: rgba(var(--v-theme-text-primary), 0.4);
  border-radius: 4px;
  padding: 4px 6px;
  margin-left: 8px;
}

.role-count {
  min-width: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
}
</style>
