<template>
  <v-btn v-if="isUserInGame" color="warning" @click="onJoinClick"> Leave Game </v-btn>
  <v-btn v-else color="info" :disabled="roomState.stage !== 'created'" @click="onJoinClick"> Join Game </v-btn>
  <template v-if="isUserLeader">
    <v-btn class="mt-2" color="info" @click="onLockClick">
      {{ roomState.stage === 'created' ? 'Lock Game' : 'Unlock game' }}
    </v-btn>
    <v-btn class="mt-2" color="success" :disabled="isStartGameDisabled" @click="onStartClick"> Start Game </v-btn>
    <Options :roles="roles" />
  </template>
</template>

<script lang="ts">
import { defineComponent, inject, computed, ref } from 'vue';
import { useStore } from '@/store';
import { roomStateKey } from '@/pages/room/const';
import { socket } from '@/api/socket';
import type { TRolesOptions } from '@/components/game/options/interface';
import type { IGameOptions, TOptionalRoles } from '@avalon/types';
import Options from '@/components/game/options/Options.vue';

export default defineComponent({
  name: 'StartPanel',
  components: {
    Options,
  },
  setup() {
    const roomState = inject(roomStateKey)!;
    const store = useStore();
    const roles = ref<TRolesOptions>({
      merlin: false,
      mordred: false,
      morgana: false,
      oberon: false,
      percival: false,
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
      const options = (<TOptionalRoles[]>Object.keys(roles.value)).reduce<IGameOptions>(
        (acc, key) => {
          acc.roles[key] = Number(roles.value[key]);

          return acc;
        },
        { roles: {}, addons: {} },
      );

      socket.emit('startGame', roomState.value.roomID, options);
    };

    return {
      roomState,
      roles,

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
