<template>
  <div>
    <h3 class="text-center mb-4">{{ title }}</h3>
    <div class="cards-container">
      <div class="card-container" v-for="(card, index) in cards" :key="index">
        <div @click="$emit('select', card)" class="card">
          <PlotCard class="card-image" :cardName="card" />
          <div class="card-placeholder">{{ $t(`cardsInfo.${card}`) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlotCard from '@/components/view/information/PlotCard.vue';

export default defineComponent({
  components: {
    PlotCard,
  },
  props: {
    cards: {
      type: Array as PropType<string[]>,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  emits: ['select'],
});
</script>

<style lang="scss" scoped>
.cards-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
  justify-items: center;
}

.card {
  width: 110px;
  padding-top: 5px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.card-placeholder {
  text-align: center;
  padding: 10px;
  font-weight: bold;
}

.card-name {
  text-align: center;
  text-transform: capitalize;
  font-weight: bold;
  margin-bottom: 5px;
}

.card-image {
  width: 100px;
  min-height: 100px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(var(--v-theme-text-primary), 0.4);
}

.card-container {
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
