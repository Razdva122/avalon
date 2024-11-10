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
        <v-tabs v-model="type" class="tabs">
          <v-tab value="roles">{{ $t('options.roles') }}</v-tab>
          <v-tab value="extraRoles">{{ $t('options.extraRoles') }}</v-tab>
          <v-tab value="addons" v-if="addons">{{ $t('options.addons') }}</v-tab>
          <v-tab value="features" v-if="features">{{ $t('options.features') }}</v-tab>
        </v-tabs>
        <template v-if="type === 'roles' || type === 'extraRoles'">
          <div class="option" v-for="role in type === 'roles' ? rolesSettings : extraRolesSettings">
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
            <v-checkbox v-model="addons[addon.name]" :label="addon.label" :hide-details="true" color="info" />
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
import type { TGameOptionsRoles, TGameOptionsAddons, TGameOptionsFeatures } from '@avalon/types';

export default defineComponent({
  components: {
    PlayerIcon,
    HelpButton,
  },
  props: {
    roles: {
      required: true,
      type: Object as PropType<TGameOptionsRoles>,
    },
    addons: {
      type: Object as PropType<TGameOptionsAddons>,
    },
    features: {
      type: Object as PropType<TGameOptionsFeatures>,
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
      rolesShortInfo,
    };
  },
  computed: {
    rolesSettings() {
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
        { role: 'tristan', label: this.$t('roles.tristan'), disabled: false, color: 'success', route: 'lovers' },
        { role: 'isolde', label: this.$t('roles.isolde'), disabled: false, color: 'success', route: 'lovers' },
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
        { role: 'witch', label: this.$t('roles.witch'), disabled: false, color: 'warning', route: 'witch' },
      ] as const;
    },
    addonsSettings() {
      return [
        {
          name: 'ladyOfLake',
          label: this.$t('addons.ladyOfLake'),
          route: 'ladyOfLake',
          hint: this.$t('options.ladyHint'),
        },
        {
          name: 'excalibur',
          label: this.$t('addons.excalibur'),
          route: 'excalibur',
          hint: this.$t('options.excaliburHint'),
        },
      ] as const;
    },
    featuresSettings() {
      return [
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
      ] as const;
    },
  },
  methods: {
    removeMerlinAdditionalRoles() {
      this.roles.morgana = 0;
      this.roles.percival = 0;
      this.roles.mordred = 0;
    },
    onRoleUpdate(roleName: string) {
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
  },
});
</script>

<style scoped lang="scss">
.options {
  background-color: rgb(var(--v-theme-surface));
  width: 100%;
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
  background-image: url('@/assets/features/lady_of_lake.webp');
  background-size: contain;
}

.excalibur {
  background-image: url('@/assets/features/excalibur.webp');
  background-size: contain;
}

.tabs {
  border-radius: 8px;
}
</style>
