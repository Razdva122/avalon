<template>
  <div>
    <h3 class="text-center mb-4">{{ title }}</h3>
    <div class="cards-container">
      <div class="card-container" v-for="(card, index) in cards" :key="index">
        <div @click="$emit('select', card)" class="card">
          <img class="card-image" />
          <div class="card-placeholder">{{ $t(`cardsInfo.${card}`) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
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
  width: 100px;
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
  background-image: getImagePathByID('core', 'player-frame');
  background-position: center;
  background-size: 100%;
}

.card-container {
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
