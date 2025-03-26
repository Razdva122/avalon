<template>
  <div class="plot-cards-view">
    <PlotCard
      :display-tooltip="true"
      class="plot-card"
      v-for="card in data"
      :card-name="card.name"
      :class="`plot-card-${card.stage}`"
    ></PlotCard>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import type { ActiveCard } from '@avalon/types';

export default defineComponent({
  components: {
    PlotCard,
  },
  props: {
    data: {
      required: true,
      type: Array as PropType<ActiveCard[]>,
    },
  },
});
</script>

<style scoped lang="scss">
.plot-cards-view {
  display: flex;
  gap: 10px;
}

.plot-card {
  width: 60px;
  height: 60px;
}

.plot-card-selectionInProgress {
  border: 2px solid rgb(var(--v-theme-info));
}

.plot-card-active {
  border: 2px solid white;
}

.plot-card-used {
  opacity: 50%;
}
</style>
