<template>
  <div class="game">
    <h1>This is game page</h1>
    <div class="board-container">
      <img class="game-board" alt="board" src="../assets/board.jpeg" />
      <div class="player-container" v-for="(player, i) in players" :style="{ transform: calculateRotate(i) }">
        <Player :player="player" :style="{ transform: 'translateY(-50%) ' + calculateRotate(i, true) }" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Player from '@/components/Player.vue'
import { players } from '@/mocks/players'

export default defineComponent({
  data() {
    return {
      players: players,
    }
  },
  components: {
    Player,
  },
  methods: {
    calculateRotate(i: number, negative: boolean = false): string {
      return `rotate(${negative ? '-' : ''}${(360 / this.players.length) * i + 180}deg)`
    },
  },
})
</script>

<style lang="scss">
.board-container {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100vw;
}

.game-board {
  width: 800px;
}

.player-container {
  display: flex;
  justify-content: center;
  position: absolute;
  top: 0;
  width: 600px;
  height: 600px;
}
</style>
