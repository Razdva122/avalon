<template>
  <div class="game">
    <h1>This is game page</h1>
		<div class="board-container">
			<img class="game-board" alt="board" src="../assets/board.jpeg">
			<div class="player-container" 
				v-for="n in 10" 
				:style="{ 'transform': calculateRotate(n) }"
			>
				<Player :style="{ 'transform': 'translateY(-50%)' + calculateRotate(n, true) }"/>
			</div>
		</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Player from '@/components/Player.vue';

export default defineComponent({
  components: {
    Player
  },
	methods: {
    calculateRotate(n: number, negative: boolean = false): string {
      return `rotate(${negative ? '-' : ''}${360 / 10 * (n - 1) + 180}deg)`;
    }
  }
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
	position: absolute;
	top: 0;
	width: 600px;
	height: 600px;
}
</style>
