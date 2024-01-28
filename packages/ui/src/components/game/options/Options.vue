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
          <Role class="role" :role="role.role" />
          <v-checkbox
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
        </div>
      </v-form>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Role from '@/components/game/information/Role.vue';
import type { TGameOptionsRoles, TGameOptionsAddons } from '@avalon/types';

export default defineComponent({
  components: {
    Role,
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
        { name: 'ladyOfLake', label: 'Lady of the lake' },
        { name: 'excalibur', label: 'Excalibur' },
      ] as const;
    },
  },
  methods: {
    removeMerlinAdditionalRoles() {
      this.roles.morgana = 0;
      this.roles.percival = 0;
    },
  },
  watch: {
    roles: {
      handler() {
        if (!this.roles.merlin && !this.roles.merlinPure) {
          this.removeMerlinAdditionalRoles();
        }

        if (!this.roles.percival) {
          this.roles.morgana = 0;
        }
      },
      deep: true,
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
