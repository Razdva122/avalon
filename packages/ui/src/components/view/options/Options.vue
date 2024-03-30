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
          <v-tab value="roles">Roles</v-tab>
          <v-tab value="addons" v-if="addons">Addons</v-tab>
          <v-tab value="features" v-if="features">Features</v-tab>
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
      default: 'Options',
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
        { role: 'merlin', label: 'Merlin', disabled: Boolean(this.roles.merlinPure), color: 'success' },
        {
          role: 'merlinPure',
          label: 'Merlin Pure',
          disabled: Boolean(this.roles.merlin),
          color: 'success',
          route: 'merlin_pure',
        },
        {
          role: 'percival',
          label: 'Percival',
          disabled: !this.roles.merlin && !this.roles.merlinPure,
          color: 'success',
        },
        { role: 'tristan', label: 'Tristan', disabled: false, color: 'success', route: 'lovers' },
        { role: 'isolde', label: 'Isolde', disabled: false, color: 'success', route: 'lovers' },
        { role: 'goodLancelot', label: 'Good Lancelot', disabled: false, color: 'success' },
        { role: 'evilLancelot', label: 'Evil Lancelot', disabled: false, color: 'warning' },
        {
          role: 'morgana',
          label: 'Morgana',
          disabled: (!this.roles.merlin && !this.roles.merlinPure) || !this.roles.percival,
          color: 'warning',
        },
        { role: 'mordred', label: 'Mordred', disabled: false, color: 'warning' },
        { role: 'oberon', label: 'Oberon', disabled: false, color: 'warning' },
      ] as const;
    },
    addonsSettings() {
      return [
        {
          name: 'ladyOfLake',
          label: 'Lady of the lake',
          route: 'lady',
          hint: 'The lady allows you to find out the loyalty of another player',
        },
        {
          name: 'excalibur',
          label: 'Excalibur',
          route: 'excalibur',
          hint: 'Excalibur allows you to change the decision of one of the participants of the mission',
        },
      ] as const;
    },
    featuresSettings() {
      return [
        {
          name: 'anonymousVoting',
          label: 'Anonymous voting',
          hint: "With anonymous voting, you don't know who approves the mission and who rejects it",
        },
        {
          name: 'hiddenHistory',
          label: 'Hidden history',
          hint: 'With a hidden history, past actions in the game are hidden',
        },
      ] as const;
    },
  },
  methods: {
    removeMerlinAdditionalRoles() {
      this.roles.morgana = 0;
      this.roles.percival = 0;
    },
    onRoleUpdate(roleName: string) {
      if (roleName === 'isolde') {
        this.roles.tristan = this.roles.isolde;
      }

      if (roleName === 'tristan') {
        this.roles.isolde = this.roles.tristan;
      }

      if (roleName === 'evilLancelot') {
        this.roles.goodLancelot = this.roles.evilLancelot;
      }

      if (roleName === 'goodLancelot') {
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
  background-color: white;
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
