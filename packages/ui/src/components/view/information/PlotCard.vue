<template>
  <div
    class="plot-card"
    :title="$t(`cardsInfo.${cardName}`)"
    :style="{ backgroundImage: `url(${cardImageUrl})` }"
  ></div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { getIconPathByName } from '@/helpers/images';
import { TPlotCardNames } from '@avalon/types';

export default defineComponent({
  name: 'PlotCard',
  props: {
    cardName: {
      type: String as PropType<TPlotCardNames>,
      required: true,
    },
  },
  setup(props) {
    const cardImageUrl = computed(() => {
      return getIconPathByName(`plot-cards/${props.cardName}`);
    });

    return {
      cardImageUrl,
    };
  },
});
</script>

<style scoped lang="scss">
.plot-card {
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 4px 8px rgba(var(--v-theme-text-primary), 0.4);
}
</style>
