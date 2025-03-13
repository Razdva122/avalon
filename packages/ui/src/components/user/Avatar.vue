<template>
  <img :src="srcPath" :alt="avatarID" />
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
      if (['lady_of_lake', 'lady_of_sea', 'excailbur'].includes(this.avatarID)) {
        return getImagePathByID('features', this.avatarID);
      }

      return getImagePathByID('roles', this.avatarID);
    },
  },
});
</script>
