<template>
  <img :src="srcPath" :alt="avatarID" />
</template>

<script lang="ts">
import { getAvatarPathByID } from '@/helpers/images';
import { defineComponent } from 'vue';
const premiumAvatars: Record<string, string> = {
  'premium/puppeteer': getAvatarPathByID('premium', 'puppeteer'),
  'premium/eclipse-queen': getAvatarPathByID('premium', 'eclipse-queen'),
};

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
      if (premiumAvatars[this.avatarID]) {
        return premiumAvatars[this.avatarID];
      }
      if (this.avatarID === 'evil') {
        return getAvatarPathByID('core', 'red_team_no_background');
      }

      if (this.avatarID === 'good') {
        return getAvatarPathByID('core', 'blue_team_no_background');
      }

      if (['lady_of_lake', 'lady_of_sea', 'excalibur'].includes(this.avatarID)) {
        return getAvatarPathByID('features', this.avatarID);
      }

      return getAvatarPathByID('roles', this.avatarID);
    },
  },
});
</script>
