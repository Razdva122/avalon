<template>
  <v-btn color="info" @click="overlay = !overlay" class="mt-4">
    <template v-slot:prepend>
      <span class="material-icons"> settings </span>
    </template>
    Options
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="options pa-4 rounded-lg">
      <v-form>
        <h2>Roles</h2>
        <div class="option" v-for="role in rolesSettings">
          <PlayerIcon class="role" :icon="role.role" />
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
        </div>
        <h2>Addons</h2>
        <div class="addon" v-for="addon in addonsSettings">
          <div :class="addon.name" class="addon-icon"></div>
          <v-checkbox v-model="addons[addon.name]" :label="addon.label" :hide-details="true" color="info" />
          <HelpButton :route="addon.route" :content="addon.hint" />
        </div>
      </v-form>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlayerIcon from '@/components/game/information/PlayerIcon.vue';
import HelpButton from '@/components/feedback/HelpButton.vue';
import type { TGameOptionsRoles, TGameOptionsAddons } from '@avalon/types';

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
      required: true,
      type: Object as PropType<TGameOptionsAddons>,
    },
  },
  data() {
    return {
      overlay: false,
    };
  },
  computed: {
    rolesSettings() {
      return [
        { role: 'merlin', label: 'Merlin', disabled: Boolean(this.roles.merlinPure), color: 'success' },
        { role: 'merlinPure', label: 'Merlin Pure', disabled: Boolean(this.roles.merlin), color: 'success' },
        {
          role: 'percival',
          label: 'Percival',
          disabled: !this.roles.merlin && !this.roles.merlinPure,
          color: 'success',
        },
        { role: 'tristan', label: 'Tristan', disabled: false, color: 'success' },
        { role: 'isolde', label: 'Isolde', disabled: false, color: 'success' },
        {
          role: 'morgana',
          label: 'Morgana',
          disabled: (!this.roles.merlin && !this.roles.merlinPure) || !this.roles.percival,
          color: 'warning',
        },
        { role: 'oberon', label: 'Oberon', disabled: false, color: 'warning' },
        { role: 'mordred', label: 'Mordred', disabled: false, color: 'warning' },
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
  width: 300px;
}

.role,
.addon-icon {
  width: 40px;
  height: 40px;
  border: 1px solid black;
}

.option,
.addon {
  display: flex;
  align-items: center;
}

.ladyOfLake {
  background-image: url('@/assets/features/lady_of_lake.png');
  background-size: contain;
}

.excalibur {
  background-image: url('@/assets/features/excalibur.png');
  background-size: contain;
}
</style>
