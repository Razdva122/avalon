<template>
  <span :title="icon" class="player-icon-image" :class="[classes, { thumbnail }]" :style="imageStyle"></span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { calculateRoleIconStyle } from '@/helpers/styles';

import type { TPlayerIcon } from '@/components/view/information/interface';

export default defineComponent({
  props: {
    thumbnail: Boolean,
    icon: {
      required: true,
      type: String as PropType<TPlayerIcon>,
    },
  },
  computed: {
    imageStyle() {
      return calculateRoleIconStyle(this.icon, this.thumbnail);
    },
    classes() {
      return `icon-${this.icon} style-${this.$store.state.settings?.style}`;
    },
  },
});
</script>

<style scoped lang="scss">
// Keep full artwork for cards; only small inline icons opt into thumbnails.
@mixin player-image($type, $id) {
  background-image: getImagePathByID($type, $id);

  &.thumbnail {
    background-image: getThumbnailPathByID($type, $id);
  }
}

.player-icon-image {
  display: block;
  border-radius: 50%;
  background-size: 160%;
}

.icon-evil {
  @include player-image('core', 'red_team_no_background');
  background-position: 50% 52%;
  background-size: 135%;
}

.icon-good {
  @include player-image('core', 'blue_team_no_background');
  background-position: 50% 52%;
  background-size: 100%;
}

.icon-unknown {
  @include player-image('core', 'player-frame');
  background-position: center;
  background-size: 135%;
}

.icon-excalibur {
  @include player-image('features', 'excalibur');
  background-position: center;
  background-size: 100%;
}
</style>
