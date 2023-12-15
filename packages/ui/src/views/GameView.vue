<template>
  <div class="game">
    <h1>This is game page</h1>
		<div class="board-container">
			<img class="game-board" alt="board" src="../assets/board.jpeg">
			<div class="player-container" 
				v-for="n in 10" 
				:style="{ 'transform': 'rotate(' + (360 / 10 * (n - 1) + 180) + 'deg)' }"
			>
				<img
					class="player-frame" 
					alt="frame" 
					src="../assets/player-frame.png"
					:style="{ 'transform': 'translate(-50%, -50%) rotate(-' + (360 / 10 * (n - 1) + 180) + 'deg)' }"
				>
			</div>
		</div>
  </div>
</template>

<style lang="scss">
.board-container {
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

.player-frame {
	position: absolute;
	width: 115px;
}
</style>
