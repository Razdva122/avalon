<template>
  <v-breadcrumbs :items="items"></v-breadcrumbs>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  computed: {
    items() {
      return new URL(window.location.href).pathname
        .split('/')
        .slice(1)
        .map((el) => ({
          to: { name: el },
          title: el,
        }));
    },
  },
});
</script>

<style lang="scss">
.v-breadcrumbs-item {
  font-size: 22px;
  text-transform: capitalize;
}
</style>
