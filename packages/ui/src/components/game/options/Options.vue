<template>
  <v-btn color="info" @click="overlay = !overlay" class="mt-4">
    <template v-slot:prepend>
      <span class="material-icons"> settings </span>
    </template>
    Options
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="options pa-4 rounded-lg">
      Roles
      <v-form>
        <v-checkbox v-model="roles.merlin" color="success" :hide-details="true" label="Merlin"></v-checkbox>
        <v-checkbox v-model="roles.morgana" color="warning" :hide-details="true" label="Morgana"></v-checkbox>
        <v-checkbox v-model="roles.percival" color="success" :hide-details="true" label="Percival"></v-checkbox>
        <v-checkbox v-model="roles.oberon" color="warning" :hide-details="true" label="Oberon"></v-checkbox>
        <v-checkbox v-model="roles.mordred" color="warning" :hide-details="true" label="Mordred"></v-checkbox>
      </v-form>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { TRolesOptions } from '@/components/game/options/interface';

export default defineComponent({
  props: {
    roles: {
      required: true,
      type: Object as PropType<TRolesOptions>,
    },
  },
  data: () => ({
    overlay: false,
  }),
});
</script>

<style scoped lang="scss">
.options {
  background-color: white;
  width: 300px;
}
</style>
