<template>
  <div class="d-flex">
    <v-btn density="comfortable" variant="plain" class="social-button mr-2" size="x-small">
      <a href="https://discord.gg/DR9cEDDNdN" target="_blank" class="social-icon discord-icon"></a>
    </v-btn>
    <v-btn density="comfortable" variant="plain" class="social-button" size="x-small">
      <a href="https://github.com/Razdva122/avalon" target="_blank" class="social-icon github-icon"></a>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped lang="scss">
.v-btn.social-button {
  padding: 0px;
  width: 32px;
  height: 32px;
}

.social-icon {
  width: 36px;
  height: 32px;
  background-position: center;
  background-size: contain;
}

.discord-icon {
  background-image: getIconPathByName('discord.png');
  filter: invert(var(--v-icon-invert));
}

.github-icon {
  background-size: 115%;
  background-image: getIconPathByName('github.png');
  filter: invert(var(--v-icon-invert));
}
</style>
