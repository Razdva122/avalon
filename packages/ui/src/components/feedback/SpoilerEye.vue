<template>
  <v-btn
    density="comfortable"
    @click="toggleSpoilerStatus"
    :icon="iconName"
    variant="plain"
    color="text-primary"
  ></v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  computed: {
    iconName() {
      return this.$store.state.hideSpoilers ? 'visibility' : 'visibility_off';
    },
  },
  methods: {
    toggleSpoilerStatus() {
      this.$store.commit('updateHideSpoilers', !this.$store.state.hideSpoilers);
    },
  },
});
</script>

<style scoped lang="scss"></style>
