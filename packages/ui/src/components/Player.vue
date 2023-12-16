<template>
  <div class="player-container">
    <img class="player-frame" alt="frame" src="../assets/player-frame.png" />
    <span class="player-name">{{ player.name }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { IPlayer } from '@avalon/types'

export default defineComponent({
  props: {
    player: {
      type: Object as PropType<IPlayer>,
      required: true,
    },
  },
})
</script>

<style scoped lang="scss">
.player-container {
  width: 115px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
</style>
