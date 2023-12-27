<template>
  <div class="player-container" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="../assets/player-frame.png" />
    <div class="player-icon" :class="iconClasses"></div>
    <span class="player-name">{{ player.name }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IPlayer, TRoomPlayer } from '@avalon/types';

export default defineComponent({
  props: {
    player: {
      type: Object as PropType<IPlayer | TRoomPlayer>,
      required: true,
    },
  },
  computed: {
    iconClasses() {
      if ('features' in this.player) {
        return { 'player-active': this.player.features.waitForAction };
      }

      return {};
    },
  },
});
</script>

<style scoped lang="scss">
.player-container {
  width: 115px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: all;
}

.player-frame,
.player-name {
  width: 115px;
}

.player-name {
  @include text-overflow(1);
  background-image: url('../assets/name-frame.png');
  background-size: contain;
  color: white;
}

.player-icon {
  position: absolute;
  top: 8px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border-width: 6px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0);
}

.player-active {
  border-color: rgba(173, 255, 47, 0.6);
}
</style>
