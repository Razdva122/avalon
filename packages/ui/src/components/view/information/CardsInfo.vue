<template>
  <v-btn class="cards" color="info" @click="overlay = !overlay"> {{ $t('cardsInfo.cards') }} </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="cards-info d-flex flex-column align-center pa-4 rounded-lg">
      <div class="d-flex flex-row align-center">
        <h2 class="title">{{ selectedCard ? $t(`cardsInfo.${selectedCard}`) : $t('cardsInfo.cards') }}</h2>
      </div>
      <v-divider :thickness="3" class="mt-1 mb-1 w-100"></v-divider>
      <template v-if="selectedCard">
        <PlotCard class="card-image mt-4 mb-4" :cardName="selectedCard" />
        <div class="card-info">{{ $t(`cardsInfo.${selectedCard}Hint`) }}</div>
      </template>
      <template v-else>
        <template v-if="data.usedCards.length">
          <CardsList :cards="data.usedCards" :title="$t('cardsInfo.usedCards')" @select="selectCard" />
          <v-divider :thickness="3" class="mt-4 mb-4 w-100"></v-divider>
        </template>
        <CardsList :cards="data.remainingCards" :title="$t('cardsInfo.remainingCards')" @select="selectCard" />
      </template>
      <v-btn
        size="x-large"
        v-if="selectedCard"
        @click="selectedCard = undefined"
        class="back"
        color="text-primary"
        icon="arrow_back"
        variant="text"
        density="compact"
      />
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import CardsList from '@/components/view/information/CardsList.vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import type { CardsState, TPlotCardNames } from '@avalon/types';

export default defineComponent({
  components: {
    CardsList,
    PlotCard,
  },
  props: {
    data: {
      required: true,
      type: Object as PropType<CardsState>,
    },
  },
  data: () => ({
    overlay: false,
    selectedCard: undefined as TPlotCardNames | undefined,
  }),
  methods: {
    selectCard(card: TPlotCardNames) {
      this.selectedCard = card;
    },
  },
  watch: {
    overlay(value: boolean) {
      if (value === true) {
        this.selectedCard = undefined;
      }
    },
  },
});
</script>

<style scoped lang="scss">
.cards-info {
  background-color: rgb(var(--v-theme-surface));
  width: 400px;
  min-height: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.title {
  text-align: center;
  text-transform: capitalize;
}

.card {
  width: 100px;
  height: 140px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-placeholder {
  text-align: center;
  padding: 10px;
  font-weight: bold;
}

.card-image {
  width: 350px;
  height: 350px;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(var(--v-theme-text-primary), 0.4);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-info {
  font-size: 24px;
  text-align: center;
  margin-top: 20px;
}

.cards-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.back {
  font-size: 28px;
  position: absolute;
  top: 12px;
  left: 18px;
}

.card-name {
  text-align: center;
  text-transform: capitalize;
  font-weight: bold;
  margin-bottom: 5px;
}

.card-container {
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
