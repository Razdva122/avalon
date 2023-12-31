<template>
  <v-btn v-if="isUserInGame" rounded="lg" variants="tonal" color="warning" @click="onJoinClick"> Leave Game </v-btn>
  <v-btn
    v-else
    rounded="lg"
    variants="tonal"
    color="info"
    :disabled="roomState.stage !== 'created'"
    @click="onJoinClick"
  >
    Join Game
  </v-btn>
  <template v-if="isUserLeader">
    <v-btn class="mt-2" rounded="lg" variants="tonal" color="info" @click="onLockClick">
      {{ roomState.stage === 'created' ? 'Lock Game' : 'Unlock game' }}
    </v-btn>
    <v-btn
      class="mt-2"
      rounded="lg"
      variants="tonal"
      color="success"
      :disabled="isStartGameDisabled"
      @click="onStartClick"
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

    const onJoinClick = () => {
      socket.emit(isUserInGame.value ? 'leaveGame' : 'joinGame', roomState.value.roomID);
    };

    const onLockClick = () => {
      socket.emit('lockRoom', roomState.value.roomID);
    };

    const onStartClick = () => {
      socket.emit('startGame', roomState.value.roomID);
    };

    return {
      roomState,

      isUserInGame,
      isUserLeader,
      isStartGameDisabled,

      onJoinClick,
      onLockClick,
      onStartClick,
    };
  },
});
</script>

<style scoped lang="scss"></style>
