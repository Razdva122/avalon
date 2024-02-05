<template>
  <v-btn v-if="isUserInGame" color="warning" @click="onJoinClick"> Leave Game </v-btn>
  <v-btn
    v-else-if="roomState.players.length < 10"
    color="info"
    :disabled="roomState.stage !== 'created'"
    @click="onJoinClick"
  >
    Join Game
  </v-btn>
  <template v-if="isUserLeader">
    <v-btn class="mt-2" color="info" @click="onLockClick">
      {{ roomState.stage === 'created' ? 'Lock Game' : 'Unlock game' }}
    </v-btn>
    <v-btn class="mt-2" color="success" :disabled="isStartGameDisabled" @click="onStartClick"> Start Game </v-btn>
    <Options :roles="roles" :addons="addons" />
  </template>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, toRefs } from 'vue';
import { useStore } from '@/store';
import { TAvailableRoomStateRef } from '@/pages/room/const';
import { socket } from '@/api/socket';
import type { TGameOptionsRoles, TGameOptionsAddons } from '@avalon/types';
import Options from '@/components/game/options/Options.vue';

export default defineComponent({
  name: 'StartPanel',
  components: {
    Options,
  },
  props: {
    roomState: {
      type: Object as PropType<TAvailableRoomStateRef>,
      required: true,
    },
  },
  setup(props) {
    const { roomState } = toRefs(props);
    const store = useStore();
    const roles = ref<TGameOptionsRoles>({
      merlinPure: 0,
      merlin: 0,
      mordred: 0,
      morgana: 0,
      oberon: 0,
      percival: 0,
    });

    const addons = ref<TGameOptionsAddons>({
      ladyOfLake: false,
      excalibur: false,
    });

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
      socket.emit('startGame', roomState.value.roomID, { roles: roles.value, addons: addons.value });
    };

    return {
      roomState,
      roles,
      addons,

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
