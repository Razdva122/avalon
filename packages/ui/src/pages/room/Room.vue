<template>
  <div class="room">
    <template v-if="!isValidUuid">
      <h1>This is wrong uuid</h1>
    </template>

    <template v-else>
      <h1>This is game page</h1>
      <div class="board-container">
        <img class="game-board" alt="board" src="../../assets/board.jpeg" />
        <v-alert color="info" variant="tonal" class="game-stage rounded-xl" :text="currentGameStage"></v-alert>
        <div class="player-container" v-for="(player, i) in players" :style="{ transform: calculateRotate(i) }">
          <player :player="player" :style="{ transform: 'translateY(-50%) ' + calculateRotate(i, true) }" />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import '@/socket';
import { defineComponent, ref, computed } from 'vue';
import Player from '@/components/Player.vue';
import { players as playersMock } from '@/mocks/players';
import type { TGameStage } from '@avalon/types';
import axios from 'axios';

export default defineComponent({
  name: 'Room',
  components: {
    Player,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const players = ref(playersMock);
    const stage = ref<TGameStage>('selectMerlin');

    const data = (await axios.get<boolean>(`http://localhost:3000/api/check_room/${props.uuid}`)).data;

    const isValidUuid = ref<boolean>(data);

    const currentGameStage = computed(() => {
      const stages = {
        initialization: 'The game is being initialized...',
        selectTeam: 'The leader chooses the team.',
        votingForTeam: 'The round table votes for the selected team.',
        onMission: 'The selected team is on a mission.',
        selectMerlin: "Mordred's minions are trying to figure out Merlin.",
        end: 'The game is over.',
      } as const;

      return stages[stage.value];
    });

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / players.value.length) * i + 180}deg)`;
    };

    return { players, stage, currentGameStage, calculateRotate, isValidUuid };
  },
});
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

.game-stage {
  position: absolute;
  top: 20%;
  width: 300px;
  background-color: white;
  font-size: 18px;
}
</style>
