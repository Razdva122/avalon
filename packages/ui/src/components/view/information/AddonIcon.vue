<template>
  <div :title="addon" class="addon-image" :class="'icon-' + addon"></div>
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
.icon-excalibur {
  background-image: getImagePathByID('features', 'excalibur');
  background-size: contain;
}

.icon-ladyOfLake {
  background-image: getImagePathByID('features', 'lady_of_lake');
  background-size: contain;
}

.icon-ladyOfSea {
  background-image: getImagePathByID('features', 'lady_of_sea');
  background-size: contain;
}

.icon-plotCards {
  background-image: getImagePathByID('features', 'plot_cards');
  background-size: contain;
}
</style>
