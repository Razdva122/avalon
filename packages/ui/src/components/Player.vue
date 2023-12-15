<template>
	<div>
		<img
			class="player-frame" 
			alt="frame" 
			src="../assets/player-frame.png"
		>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { IPlayer } from '@avlaon/types';

export default defineComponent({
  data() {
    return {
      player: {
        id: 'random-id',
        name: 'Dmitrii',
        role: 'merlin'
      } as IPlayer
    }
  }
})
</script>

<style scoped lang="scss">
.player-frame {
	width: 115px;
}
</style>
