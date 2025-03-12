<template>
  <img class="addon-image" :src="srcPath" alt="lady" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Avatar',
  props: {
    avatarID: {
      type: String,
      required: true,
    },
  },
  computed: {
    srcPath() {
      const paths: { [key: string]: string } = {
        lady_of_lake: 'https://storage.yandexcloud.net/avalon-game/images/features/lady_of_lake.webp',
        servant: 'https://storage.yandexcloud.net/avalon-game/images/roles/servant.webp',
      };

      return paths[this.avatarID];
    },
  },
});
</script>
