<template>
  <div
    v-if="hideSpoilers"
    class="text-white rounded-lg bg-blue-grey-darken-1 spoiler"
    :style="size ? `width: ${size.width}; height: ${size.height}` : ''"
  >
    Spoiler
  </div>
  <slot v-else></slot>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    size: {
      type: Object as PropType<{ width?: string; height?: string }>,
    },
  },
  computed: {
    hideSpoilers() {
      return this.$store.state.hideSpoilers;
    },
  },
});
</script>

<style scoped lang="scss">
.spoiler {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
