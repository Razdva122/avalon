<template>
  <v-btn color="info" @click="overlay = !overlay" class="mt-4">
    <template v-slot:prepend>
      <span class="material-icons"> settings </span>
    </template>
    Options
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="options pa-4 rounded-lg">
      <h2>Roles</h2>
      <v-form>
        <div class="option" v-for="option in options">
          <Role class="role" :role="option.role" />
          <v-checkbox
            :disabled="option.disabled"
            v-model="roles[option.role]"
            :hide-details="true"
            :color="option.color"
            :label="option.label"
          >
          </v-checkbox>
        </div>
      </v-form>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Role from '@/components/game/information/Role.vue';
import type { TRolesOptions } from '@/components/game/options/interface';

export default defineComponent({
  components: {
    Role,
  },
  props: {
    roles: {
      required: true,
      type: Object as PropType<TRolesOptions>,
    },
  },
  data() {
    return {
      overlay: false,
    };
  },
  computed: {
    options() {
      return [
        { role: 'merlin', label: 'Merlin', disabled: this.roles.merlinPure, color: 'success' },
        { role: 'merlinPure', label: 'Merlin Pure', disabled: this.roles.merlin, color: 'success' },
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
  },
  methods: {
    removeMerlinAdditionalRoles() {
      this.roles.morgana = false;
      this.roles.percival = false;
    },
  },
  watch: {
    roles: {
      handler() {
        if (!this.roles.merlin && !this.roles.merlinPure) {
          this.removeMerlinAdditionalRoles();
        }

        if (!this.roles.percival) {
          this.roles.morgana = false;
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

.role {
  width: 40px;
  height: 40px;
}

.option {
  display: flex;
  align-items: center;
}
</style>
