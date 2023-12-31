<template>
  <v-btn v-if="isUserInGame" rounded="lg" variants="tonal" color="warning" @click="joinClick"> Leave Game </v-btn>
  <v-btn v-else rounded="lg" variants="tonal" color="info" :disabled="roomState.stage !== 'created'" @click="joinClick">
    Join Game
  </v-btn>
  <template v-if="isUserLeader">
    <v-btn class="mt-2" rounded="lg" variants="tonal" color="info" @click="lockClick">
      {{ roomState.stage === 'created' ? 'Lock Game' : 'Unlock game' }}
    </v-btn>
    <v-btn
      class="mt-2"
      rounded="lg"
      variants="tonal"
      color="success"
      :disabled="isStartGameDisabled"
      @click="startClick"
    >
      Start Game
    </v-btn>
  </template>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { useStore } from '@/store';
import { roomStateKey } from '@/pages/room/const';
import { socket } from '@/api/socket';

export default defineComponent({
  name: 'StartPanel',
  setup() {
    const roomState = inject(roomStateKey)!;
    const store = useStore();

    const isUserInGame = computed(() => {
      return roomState.value.players.some((player) => player.id === store.state.user?.id);
    });

    const isUserLeader = computed(() => {
      return roomState.value.leaderID === store.state.user?.id;
    });

    const isStartGameDisabled = computed(() => {
      return (
        roomState.value.stage !== 'locked' || roomState.value.players.length < 5 || roomState.value.players.length > 10
      );
    });

    const joinClick = () => {
      socket.emit(isUserInGame.value ? 'leaveGame' : 'joinGame', roomState.value.roomID);
    };

    const lockClick = () => {
      socket.emit('lockRoom', roomState.value.roomID);
    };

    const startClick = () => {
      socket.emit('startGame', roomState.value.roomID);
    };

    return {
      roomState,

      isUserInGame,
      isUserLeader,
      isStartGameDisabled,

      joinClick,
      lockClick,
      startClick,
    };
  },
});
</script>

<style scoped lang="scss">
.mission {
  width: 64px;
  height: 64px;
}
</style>
