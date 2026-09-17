<template>
  <img :src="srcPath" :alt="avatarID" />
</template>

<script lang="ts">
import { getImagePathByID } from '@/helpers/images';
import { defineComponent } from 'vue';
import { PREMIUM_COSMETICS_ENABLED } from '@avalon/types/user/premium-cosmetics';
const premiumAvatars: Record<string, string> = {
  'premium/puppeteer': require('@/assets/images/premium/puppeteer.png'),
  'premium/eclipse-queen': require('@/assets/images/premium/eclipse-queen.png'),
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
        return PREMIUM_COSMETICS_ENABLED ? premiumAvatars[this.avatarID] : getImagePathByID('roles', 'servant');
      }
      if (this.avatarID === 'evil') {
        return getImagePathByID('core', 'red_team_no_background');
      }

      if (this.avatarID === 'good') {
        return getImagePathByID('core', 'blue_team_no_background');
      }

      if (['lady_of_lake', 'lady_of_sea', 'excalibur'].includes(this.avatarID)) {
        return getImagePathByID('features', this.avatarID);
      }

      return getImagePathByID('roles', this.avatarID);
    },
  },
});
</script>
