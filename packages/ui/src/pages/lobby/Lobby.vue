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
          <div>{{ index + 1 }}.</div>
          <div class="game-container">
            <div class="game-left">
              <div class="mr-2 game-name">
                <b>{{ game.host }}</b>
              </div>
              <div class="game-options">
                <div v-for="(amount, role) of game.options.roles">
                  <div v-if="amount" class="mr-1 d-flex">
                    <PreviewLink :target="role" text="" />
                  </div>
                </div>
                <div v-for="(amount, addon) of game.options.addons">
                  <div v-if="amount" class="mr-1 d-flex">
                    <PreviewLink :target="addon" text="" />
                  </div>
                </div>
              </div>
            </div>
            <div class="game-right">
              <div class="players-amount mr-2" v-if="game.state === 'created'">{{ game.players }} / 10</div>
              <v-btn
                :color="game.state === 'created' ? undefined : 'info'"
                @click="$router.push({ name: 'room', params: { uuid: game.uuid } })"
              >
                {{ game.state === 'created' ? 'Join' : 'Watch' }}
              </v-btn>
            </div>
          </div>
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
import PreviewLink from '@/components/view/information/PreviewLink.vue';

export default defineComponent({
  components: {
    TemporaryAlert,
    PreviewLink,
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
  align-items: center;
  font-size: 24px;
}

.game-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.game-right,
.game-left {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.game-name {
  @include text-overflow(1);
}

.game-options {
  display: flex;
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
