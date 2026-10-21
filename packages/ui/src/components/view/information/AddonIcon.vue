<template>
  <span v-if="addon === 'trapper'" class="material-icons trapper-icon" :title="$t('trapper.name')">layers</span>
  <span v-else :title="addon" class="addon-image" :class="'icon-' + addon"></span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TAddonsName } from '@avalon/types';

export default defineComponent({
  props: {
    addon: {
      required: true,
      type: String as PropType<TAddonsName>,
    },
  },
});
</script>

<style scoped lang="scss">
.trapper-icon {
  font-size: 22px;
  text-align: center;
}
.addon-image {
  display: block;
}

.icon-excalibur {
  background-image: getThumbnailPathByID('features', 'excalibur');
  background-size: contain;
}

.icon-ladyOfLake {
  background-image: getThumbnailPathByID('features', 'lady_of_lake');
  background-size: contain;
}

.icon-ladyOfSea {
  background-image: getThumbnailPathByID('features', 'lady_of_sea');
  background-size: contain;
}

.icon-plotCards {
  background-image: getThumbnailPathByID('features', 'plot_cards');
  background-size: contain;
}
</style>
