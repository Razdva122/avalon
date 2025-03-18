<template>
  <div class="d-flex align-center">
    <v-btn
      class="mr-1"
      href="https://discord.gg/DR9cEDDNdN"
      target="_blank"
      density="comfortable"
      variant="plain"
      color="invert"
      size="large"
      icon
    >
      <v-icon class="social-icon" size="large" icon="fa:fa-brands fa-discord" />
    </v-btn>
    <v-btn
      density="comfortable"
      href="https://github.com/Razdva122/avalon"
      target="_blank"
      variant="plain"
      color="invert"
      size="large"
      icon
    >
      <v-icon class="social-icon" size="large" icon="fa:fa-brands fa-github" />
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped lang="scss">
.social-icon {
  width: 36px;
}
</style>
