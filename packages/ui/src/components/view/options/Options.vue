<template>
  <v-btn color="info" @click="openOptions">
    <template #prepend><span class="material-icons" aria-hidden="true">settings</span></template>
    {{ buttonText }}
  </v-btn>
  <v-dialog v-model="overlay" max-width="620" :aria-label="$t('options.title')">
    <v-card class="options">
      <header class="options-header">
        <h2>{{ $t('options.title') }}</h2>
        <v-btn
          icon="close"
          variant="text"
          color="text-primary"
          :aria-label="$t('options.done')"
          @click="overlay = false"
        />
      </header>
      <v-tabs
        v-if="settings.addons || settings.features"
        v-model="type"
        class="options-tabs"
        color="text-primary"
        height="40"
        grow
      >
        <v-tab value="roles">{{ $t('options.roles') }}</v-tab>
        <v-tab v-if="settings.addons" value="addons">{{ $t('options.addons') }}</v-tab>
        <v-tab v-if="settings.features" value="features">{{ $t('options.features') }}</v-tab>
      </v-tabs>
      <div class="options-body">
        <div v-if="autoChanged.length" class="settings-notice" role="status">
          <p>
            {{ $t('options.relatedChanged', { roles: autoChanged.map((role) => $t(`roles.${role}`)).join(', ') }) }}
          </p>
          <v-btn variant="text" color="text-primary" @click="undoRoleChange">{{ $t('options.undo') }}</v-btn>
        </div>
        <template v-if="type === 'roles'">
          <div class="role-filters" :aria-label="$t('options.roles')">
            <button
              v-for="category in categories"
              :key="category.value"
              type="button"
              :class="{ active: roleTypes === category.value }"
              :aria-pressed="roleTypes === category.value"
              :aria-label="$t(category.label)"
              @click="roleTypes = category.value"
            >
              <span class="category-full">{{ $t(category.label) }}</span>
              <span class="category-short">{{ $t(category.shortLabel) }}</span>
            </button>
          </div>
          <div class="roles-grid" :class="{ 'with-counters': settings.features?.wtfMode }">
            <div
              v-for="role in rolesSettings"
              :key="role.role"
              class="option-row"
              :class="{ selected: settings.roles[role.role] }"
              :title="requirement(role.role) ? $t(`options.${requirement(role.role)}`) : undefined"
            >
              <OptionHelp
                :label="role.label"
                :route="'route' in role ? role.route : role.role"
                :content="rolesShortInfo[role.role].info"
                :hint="requirement(role.role) ? $t(`options.${requirement(role.role)}`) : undefined"
              >
                <PlayerIcon class="role-portrait" :icon="role.role" :class="rolesShortInfo[role.role].loyalty" />
              </OptionHelp>
              <v-checkbox
                :model-value="Boolean(settings.roles[role.role])"
                :disabled="Boolean(requirement(role.role))"
                :color="role.color"
                hide-details
                density="compact"
                :aria-describedby="requirement(role.role) ? `requirement-${role.role}` : undefined"
                @update:model-value="changeRole(role.role, $event ? 1 : 0)"
              >
                <template #label>
                  <span
                    >{{ role.label
                    }}<span class="sr-only"> — {{ $t(`game.${rolesShortInfo[role.role].loyalty}`) }}</span></span
                  >
                </template>
              </v-checkbox>
              <span v-if="requirement(role.role)" :id="`requirement-${role.role}`" class="sr-only">{{
                $t(`options.${requirement(role.role)}`)
              }}</span>
              <div
                v-if="
                  settings.features?.wtfMode && !disabledForDuplication.includes(role.role) && settings.roles[role.role]
                "
                class="role-counter"
                :aria-label="role.label"
              >
                <v-btn
                  icon="remove"
                  variant="text"
                  color="text-primary"
                  size="small"
                  :aria-label="$t('options.decreaseRole', { role: role.label })"
                  @click="changeRole(role.role, (settings.roles[role.role] || 0) - 1)"
                />
                <span class="role-count" aria-live="polite">{{ settings.roles[role.role] }}</span>
                <v-btn
                  icon="add"
                  variant="text"
                  color="text-primary"
                  size="small"
                  :aria-label="$t('options.increaseRole', { role: role.label })"
                  @click="changeRole(role.role, (settings.roles[role.role] || 0) + 1)"
                />
              </div>
            </div>
          </div>
          <p class="help-hint">{{ $t('options.portraitHelp') }}</p>
        </template>
        <template v-if="type === 'addons' && settings.addons">
          <div
            v-for="addon in addonsSettings"
            :key="addon.name"
            class="option-row"
            :class="{ selected: settings.addons[addon.name] }"
          >
            <OptionHelp
              :label="addon.label"
              :route="addon.route"
              :content="addon.hint"
              :hint="
                addon.name === 'ladyOfLake' || addon.name === 'ladyOfSea' ? $t('options.ladyExclusive') : undefined
              "
            >
              <span class="addon-icon" :class="addon.name" aria-hidden="true"></span>
            </OptionHelp>
            <v-checkbox
              :model-value="settings.addons[addon.name]"
              :label="addon.label"
              hide-details
              color="info"
              density="compact"
              @update:model-value="changeAddon(addon.name, Boolean($event))"
            />
          </div>
        </template>
        <template v-if="type === 'features' && settings.features">
          <div
            v-for="feature in featuresSettings"
            :key="feature.name"
            class="option-row feature-row"
            :class="{ selected: settings.features[feature.name] }"
          >
            <v-checkbox
              :model-value="settings.features[feature.name]"
              @update:model-value="changeFeature(feature.name, Boolean($event))"
              :label="feature.label"
              hide-details
              color="info"
              density="compact"
            />
            <OptionHelp :label="feature.label" :content="feature.hint" />
          </div>
        </template>
      </div>
      <footer class="options-footer">
        <span
          class="selection-count"
          role="status"
          :aria-label="`${$t('options.selectedRoles')}: ${selectedCount}`"
          :title="selectedRoles.map((role) => `${$t(`roles.${role.name}`)} ×${role.count}`).join(', ')"
          >{{ $t('options.roles') }}: {{ selectedCount }}</span
        >
        <div class="footer-actions">
          <v-btn color="primary" @click="overlay = false">{{ $t('options.done') }}</v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import OptionHelp from './OptionHelp.vue';
import { rolesShortInfo } from '@/components/view/information/const';
import { copyOptions, setRoleCount, roleRequirement } from './options-state';
import type { OptionsDraft } from './options-state';
import type { GameOptionsRoles, GameOptionsAddons, GameOptionsFeatures, TAddonsName } from '@avalon/types';
type RoleName = keyof GameOptionsRoles;

export default defineComponent({
  components: { PlayerIcon, OptionHelp },
  emits: { apply: (_options: OptionsDraft) => true },
  props: {
    roles: { required: true, type: Object as PropType<GameOptionsRoles> },
    addons: { type: Object as PropType<GameOptionsAddons> },
    features: { type: Object as PropType<GameOptionsFeatures> },
    playerCount: { type: Number },
    buttonText: { required: true, type: String },
  },
  data() {
    return {
      overlay: false,
      type: 'roles',
      roleTypes: 'core' as 'core' | 'extra' | 'experimental',
      settings: { roles: {} } as OptionsDraft,
      previousRoles: null as GameOptionsRoles | null,
      autoChanged: [] as RoleName[],
      rolesShortInfo,
      disabledForDuplication: ['witch', 'goodLancelot', 'evilLancelot'] as RoleName[],
      categories: [
        { value: 'core', label: 'options.coreRoles', shortLabel: 'options.coreRoles' },
        { value: 'extra', label: 'options.extraRoles', shortLabel: 'options.extraRolesShort' },
        { value: 'experimental', label: 'options.experimentalRoles', shortLabel: 'options.experimentalRolesShort' },
      ] as const,
    };
  },
  computed: {
    currentOptions(): OptionsDraft {
      return { roles: this.roles, addons: this.addons, features: this.features };
    },
    selectedRoles() {
      return (Object.keys(this.settings.roles) as RoleName[])
        .filter((name) => (this.settings.roles[name] || 0) > 0)
        .map((name) => ({ name, count: this.settings.roles[name] || 0 }));
    },
    selectedCount(): number {
      return this.selectedRoles.reduce((total, role) => total + role.count, 0);
    },
    coreRolesSettings() {
      return [
        {
          role: 'merlin',
          label: this.$t('roles.merlin'),

          color: 'info',
        },
        {
          role: 'merlinPure',
          label: this.$t('roles.merlinPure'),

          color: 'info',
          route: 'merlin_pure',
        },
        {
          role: 'percival',
          label: this.$t('roles.percival'),

          color: 'info',
        },
        { role: 'cleric', label: this.$t('roles.cleric'), color: 'info', route: 'cleric' },
        {
          role: 'morgana',
          label: this.$t('roles.morgana'),

          color: 'error',
        },
        {
          role: 'mordred',
          label: this.$t('roles.mordred'),

          color: 'error',
        },
        { role: 'oberon', label: this.$t('roles.oberon'), color: 'error' },
      ] as const;
    },
    extraRolesSettings() {
      return [
        { role: 'troublemaker', label: this.$t('roles.troublemaker'), color: 'info' },
        { role: 'tristan', label: this.$t('roles.tristan'), color: 'info', route: 'lovers' },
        { role: 'isolde', label: this.$t('roles.isolde'), color: 'info', route: 'lovers' },
        {
          role: 'guinevere',
          label: this.$t('roles.guinevere'),

          color: 'info',
          route: 'guinevere',
        },
        {
          role: 'goodLancelot',
          label: this.$t('roles.goodLancelot'),

          color: 'info',
          route: 'lancelots',
        },
        {
          role: 'evilLancelot',
          label: this.$t('roles.evilLancelot'),

          color: 'error',
          route: 'lancelots',
        },
        { role: 'trickster', label: this.$t('roles.trickster'), color: 'error', route: 'trickster' },
        { role: 'lunatic', label: this.$t('roles.lunatic'), color: 'error', route: 'lunatic' },
        { role: 'brute', label: this.$t('roles.brute'), color: 'error', route: 'brute' },
        { role: 'witch', label: this.$t('roles.witch'), color: 'error', route: 'witch' },
      ] as const;
    },
    experimentalRolesSettings() {
      return [
        { role: 'revealer', label: this.$t('roles.revealer'), color: 'error', route: 'revealer' },
        { role: 'wraith', label: this.$t('roles.wraith'), color: 'error', route: 'oberon' },
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
        {
          name: 'ladyOfSea',
          label: this.$t('addons.ladyOfSea'),
          route: 'lady_of_sea',
          hint: this.$t('options.ladySeaHint'),
        },
      ] as const;
    },
    featuresSettings() {
      return [
        {
          name: 'displayIndex',
          label: this.$t('options.displayIndex'),
          hint: this.$t('options.displayIndexHint'),
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
          name: 'lookingForPlayers',
          label: this.$t('mainPage.lookingForPlayers'),
          hint: this.$t('options.lookingForPlayersHint'),
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
  watch: {
    currentOptions: {
      deep: true,
      handler(value: OptionsDraft) {
        // Own updates are echoed by the parent. Only replace local state for a different external update.
        if (JSON.stringify(value) === JSON.stringify(this.settings)) return;
        this.settings = copyOptions(value);
        this.previousRoles = null;
        this.autoChanged = [];
      },
    },
  },
  methods: {
    openOptions() {
      this.settings = copyOptions(this.currentOptions);
      this.previousRoles = null;
      this.autoChanged = [];
      this.overlay = true;
    },
    publishChanges() {
      this.$emit('apply', copyOptions(this.settings));
    },
    requirement(role: RoleName) {
      return roleRequirement(role, this.settings.roles);
    },
    changeRole(role: RoleName, count: number) {
      this.previousRoles = copyOptions(this.settings.roles);
      setRoleCount(this.settings.roles, role, count);
      this.autoChanged = (Object.keys(this.settings.roles) as RoleName[]).filter(
        (name) => name !== role && (this.previousRoles![name] || 0) !== (this.settings.roles[name] || 0),
      );
      this.publishChanges();
    },
    undoRoleChange() {
      if (!this.previousRoles) return;
      this.settings.roles = this.previousRoles;
      this.previousRoles = null;
      this.autoChanged = [];
      this.publishChanges();
    },
    changeFeature(name: keyof Omit<GameOptionsFeatures, 'timerDurations'>, enabled: boolean) {
      if (!this.settings.features) return;
      this.settings.features[name] = enabled;
      this.publishChanges();
    },
    changeAddon(name: TAddonsName, enabled: boolean) {
      if (!this.settings.addons) return;
      this.settings.addons[name] = enabled;
      if (enabled && name === 'ladyOfLake') this.settings.addons.ladyOfSea = false;
      if (enabled && name === 'ladyOfSea') this.settings.addons.ladyOfLake = false;
      this.publishChanges();
    },
  },
});
</script>

<style scoped lang="scss">
.options {
  color: rgb(var(--v-theme-text-primary));
}
.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px 2px 16px;
}
.options-header h2 {
  font-size: 20px;
  line-height: 1.3;
}
.options-tabs {
  flex: 0 0 auto;
  border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.12);
}
.options-tabs :deep(.v-btn) {
  font-size: 13px;
  letter-spacing: 0;
  text-transform: none;
}
.options-body {
  padding: 8px 12px;
}
.role-filters {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.role-filters button {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 4px;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  line-height: 1.25;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.category-short {
  display: none;
}
.role-filters button:hover,
.role-filters button.active {
  background: rgb(var(--v-theme-inset));
}
.role-filters button.active {
  font-weight: 600;
  box-shadow: inset 0 -2px rgb(var(--v-theme-primary));
}
.role-filters button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
.roles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 12px;
}
.roles-grid.with-counters {
  grid-template-columns: minmax(0, 1fr);
}
.option-row {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  border-radius: 5px;
}
.option-row.selected {
  background: rgba(var(--v-theme-info), 0.06);
}
.option-row :deep(.v-input) {
  flex: 1;
  min-width: 0;
}
.option-row :deep(.v-label) {
  font-size: 14px;
  line-height: 1.3;
  opacity: 1;
  white-space: normal;
}
.option-row :deep(.v-selection-control) {
  min-height: 44px;
}
.role-portrait,
.addon-icon {
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 4px;
}
.role-portrait {
  border: 2px solid rgb(var(--v-theme-info));
}
.role-portrait.evil {
  border-color: rgb(var(--v-theme-error));
}
.addon-icon {
  background-size: contain;
  background-repeat: no-repeat;
}
.role-counter {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.role-counter :deep(.v-btn) {
  width: 44px;
  height: 44px;
}
.role-count {
  min-width: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.help-hint {
  margin: 8px 4px 0;
  font-size: 12px;
  line-height: 1.4;
}
.settings-notice {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: rgb(var(--v-theme-inset));
  border-radius: 5px;
  font-size: 13px;
}
.settings-notice p {
  flex: 1;
  margin: 0;
}
.options-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.12);
}
.selection-count {
  font-size: 13px;
  white-space: nowrap;
}
.footer-actions {
  display: flex;
  gap: 4px;
}
.footer-actions :deep(.v-btn) {
  min-height: 40px;
  text-transform: none;
  letter-spacing: 0;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.ladyOfLake {
  background-image: getImagePathByID('features', 'lady_of_lake');
}
.ladyOfSea {
  background-image: getImagePathByID('features', 'lady_of_sea');
}
.excalibur {
  background-image: getImagePathByID('features', 'excalibur');
}
.plotCards {
  background-image: getImagePathByID('features', 'plot_cards');
}
@media (max-width: 599px) {
  .category-full {
    display: none;
  }
  .category-short {
    display: inline;
  }
  .roles-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .options-body {
    padding: 4px 8px 8px;
  }
  .options-header {
    padding-left: 12px;
  }
  .options-header h2 {
    font-size: 18px;
  }
  .options-footer {
    padding: 8px;
  }
  .role-filters button {
    font-size: 12px;
  }
}
</style>
