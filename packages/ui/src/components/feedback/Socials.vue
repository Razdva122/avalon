<template>
  <div>
    <v-btn density="comfortable" variant="plain" class="mr-2" icon>
      <a href="https://discord.gg/DR9cEDDNdN" target="_blank" class="social-icon discord-icon"></a>
    </v-btn>
    <v-btn density="comfortable" variant="plain" icon>
      <a href="https://github.com/Razdva122/avalon" target="_blank" class="social-icon github-icon"></a>
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
  height: 32px;
  mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
}

.discord-icon {
  mask-image: getIconPathByName('discord.png');
  background-color: rgb(var(--v-theme-text-primary));
}

.github-icon {
  mask-size: 115%;
  mask-image: getIconPathByName('github.png');
  background-color: rgb(var(--v-theme-text-primary));
}
</style>
