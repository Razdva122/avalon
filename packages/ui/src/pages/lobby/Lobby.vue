<template>
  <div class="lobby">
    <v-btn @click="createRoom" size="x-large"> Create room </v-btn>

    <div v-if="roomsList && roomsList.length" class="text-white">
      <div class="list-header mb-5">Games list:</div>
      <div v-for="(game, index) in roomsList" class="game mb-1">
        <div class="mr-2">
          {{ index + 1 }}.HOST: <b>{{ game.host }}</b>
        </div>
        <v-btn
          :color="game.state === 'started' ? 'info' : undefined"
          @click="$router.push({ name: 'room', params: { uuid: game.uuid } })"
        >
          {{ game.state === 'started' ? 'Watch game' : 'Join game' }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TRoomsList } from '@avalon/types';
import { socket } from '@/api/socket';

export default defineComponent({
  async setup() {
    const router = useRouter();

    const roomsList = ref<TRoomsList>();

    const initState = async () => {
      const data = await socket.emitWithAck('getRoomsList');

      roomsList.value = data;
    };

    await initState();

    const createRoom = async () => {
      const uuid = await socket.emitWithAck('createRoom');
      router.push({ name: 'room', params: { uuid } });
    };

    socket.on('roomsListUpdated', (list) => {
      roomsList.value = list;
    });

    return {
      createRoom,
      roomsList,
    };
  },
});
</script>

<style scoped lang="scss">
.lobby {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  height: calc(100vh - 40px);
}

.list-header {
  font-size: 30px;
}

.game {
  padding: 5px;
  min-width: 50vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24px;
}
</style>
