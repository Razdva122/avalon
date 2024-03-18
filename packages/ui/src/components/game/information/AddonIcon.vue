<template>
  <div :title="addon" class="addon-image" :class="'icon-' + addon"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TAddonsName } from '@/components/game/information/interface';

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
  background-image: url('@/assets/features/excalibur.png');
  background-size: contain;
}

.icon-lady {
  background-image: url('@/assets/features/lady_of_lake.png');
  background-size: contain;
}
</style>
