<template>
  <div :title="addon" class="addon-image" :class="'icon-' + addon"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TAddonsName } from '@/components/view/information/interface';

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
  background-image: url('@/assets/features/excalibur.webp');
  background-size: contain;
}

.icon-ladyOfLake {
  background-image: url('@/assets/features/lady_of_lake.webp');
  background-size: contain;
}

.icon-ladyOfSea {
  background-image: url('@/assets/features/lady_of_sea.webp');
  background-size: contain;
}
</style>
