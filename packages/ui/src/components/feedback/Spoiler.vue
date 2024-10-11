<template>
  <div
    v-if="hideSpoilers"
    class="rounded-lg bg-blue-grey-darken-1 spoiler"
    :title="$t('spoiler.spoilerHint')"
    :style="size ? `width: ${size.width}; height: ${size.height}` : ''"
    @click="clickOnSpoiler"
  >
    {{ $t('spoiler.spoiler') }}
  </div>
  <slot v-else></slot>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import eventBus from '@/helpers/event-bus';

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
  methods: {
    clickOnSpoiler() {
      eventBus.emit('infoMessage', this.$t('infoMessage.disableSpoilers'));
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
  cursor: pointer;
}
</style>
