<template>
  <div class="lobby">
    <div class="alert-container">
      <TemporaryAlert title="Discord" id="discord">
        Looking for fellow players to delve into 'Avalon'? Join our
        <b><a href="https://discord.gg/DR9cEDDNdN" target="_blank">Discord</a></b> community!
      </TemporaryAlert>
    </div>

    <v-btn @click="createRoom" size="x-large"> Create room </v-btn>

    <div>
      <template v-if="roomsList && roomsList.length">
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
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import type { TRoomsList } from '@avalon/types';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import TemporaryAlert from '@/components/feedback/TemporaryAlert.vue';

export default defineComponent({
  components: {
    TemporaryAlert,
  },
  async setup() {
    const router = useRouter();
    const store = useStore();

    const roomsList = ref<TRoomsList>();

    const initState = async () => {
      const data = await socket.emitWithAck('getRoomsList');

      roomsList.value = data;
    };

    await initState();

    const createRoom = async () => {
      if (!store.state.user) {
        eventBus.emit('openSettings');
        eventBus.emit('infoMessage', 'Log in to create a game');
        return;
      }

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: calc(100vh - 50px);
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

.alert-container {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .text-primary {
    color: white !important;
  }
}
</style>
