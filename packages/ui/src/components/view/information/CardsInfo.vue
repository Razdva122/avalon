<template>
  <v-btn class="cards" color="info" @click="overlay = !overlay"> {{ $t('cardsInfo.cards') }} </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="cards-info d-flex flex-column align-center pa-4 rounded-lg">
      <div class="d-flex flex-row align-center">
        <h2 class="title">{{ selectedCard ? $t(`cardsInfo.${selectedCard}`) : $t('cardsInfo.cards') }}</h2>
      </div>
      <v-divider :thickness="3" class="mt-1 mb-1 w-100"></v-divider>
      <template v-if="selectedCard">
        <div class="card-image mt-4 mb-4">
          <div class="card-placeholder">{{ $t(`cardsInfo.${selectedCard}`) }}</div>
        </div>
        <div class="card-info">{{ $t(`cardsInfo.${selectedCard}Hint`) }}</div>
      </template>
      <template v-else>
        <div class="cards-container">
          <div class="card-container" v-for="(card, index) in data.usedCards" :key="index">
            <div class="card-name">{{ $t(`cardsInfo.${card}`) }}</div>
            <div @click="selectCard(card)" class="card">
              <div class="card-placeholder">{{ $t(`cardsInfo.${card}`) }}</div>
            </div>
          </div>
        </div>
        <div class="cards-container">
          <div class="card-container" v-for="(card, index) in data.remainingCards" :key="index">
            <div class="card-name">{{ $t(`cardsInfo.${card}`) }}</div>
            <div @click="selectCard(card)" class="card">
              <div class="card-placeholder">{{ $t(`cardsInfo.${card}`) }}</div>
            </div>
          </div>
        </div>
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
import type { CardsState } from '@avalon/types';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<CardsState>,
    },
  },
  data: () => ({
    overlay: false,
    selectedCard: undefined as string | undefined,
  }),
  methods: {
    selectCard(card: string) {
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
  width: 250px;
  height: 350px;
  border-radius: 12px;
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

.icon-type-common,
.icon-type-special,
.icon-type-rare {
  position: absolute;
  right: 100px;
  top: 250px;
  width: 75px;
  height: 75px;
  border-radius: 50%;
  background-size: contain;
}

.icon-type-common {
  border: 2px solid rgb(var(--v-theme-info));
}

.icon-type-special {
  border: 2px solid rgb(var(--v-theme-warning));
}

.icon-type-rare {
  border: 2px solid rgb(var(--v-theme-error));
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
