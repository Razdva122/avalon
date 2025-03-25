<template>
  <div>
    <v-tooltip :disabled="!displayTooltip" location="top center" origin="auto" no-click-animation>
      <template v-slot:activator="{ props: tooltip }">
        <div v-bind="tooltip" class="plot-card" :style="{ backgroundImage: `url(${cardImageUrl})` }"></div>
      </template>

      <div class="card-info d-flex flex-column justify-center">
        <div class="card-info-title">
          {{ $t(`cardsInfo.${cardName}`) }}
        </div>
        <div class="card-info-description">
          {{ $t(`cardsInfo.${cardName}Hint`) }}
        </div>
      </div>
    </v-tooltip>
  </div>
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
    displayTooltip: {
      type: Boolean,
      default: false,
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
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.card-info-title {
  text-align: center;
  font-size: 18px;
}

.card-info-description {
  font-size: 12px;
}
</style>
