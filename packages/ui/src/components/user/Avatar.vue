<template>
  <img class="addon-image" :src="srcPath" alt="lady" />
</template>

<script lang="ts">
import { getImagePathByID } from '@/helpers/images';
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
        lady_of_lake: getImagePathByID('features', 'lady_of_lake'),
        servant: getImagePathByID('roles', 'servant'),
      };

      return paths[this.avatarID];
    },
  },
});
</script>
