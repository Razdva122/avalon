<template>
  <div class="room d-flex align-center justify-space-around">
    <span class="online">{{ $t('mainPage.online', { count: online }) }}</span>
    <template v-if="errorMessage">
      <h1 class="mb-4">{{ $t('room.' + errorMessage.error) }}</h1>
      <v-btn size="x-large" @click="$router.push({ name: 'lobby' })">{{ $t('room.backToLobby') }}</v-btn>
    </template>
    <template v-else>
      <Board :room-state="roomState">
        <template v-slot:content>
          <RoomVote v-if="roomState.vote" :roomUuid="roomState.roomID" :vote="roomState.vote" />
        </template>
        <template v-slot:restart>
          <div class="d-flex flex-column align-center">
            <v-btn color="primary" v-if="displayRestartButton" @click="restartGame" class="restart-button">{{
              $t('room.restartGame')
            }}</v-btn>
          </div>
        </template>
      </Board>
      <div class="info-container">
        <RolesInfo
          v-if="roomState.stage === 'started'"
          :game-roles="game.settings.roles"
          :visible-roles="visibleRoles"
        />
        <CardsInfo
          v-if="roomState.stage === 'started' && game.addonsData.plotCards"
          :data="game.addonsData.plotCards.cardsState"
        />
      </div>
      <div class="right-info-container">
        <RatingChangesPanel
          v-if="roomState.stage === 'started' && game.stage === 'end'"
          :gameID="roomState.roomID"
          :gameState="game"
        />
        <HostPanel v-if="displayHostPanel" :roomUuid="roomState.roomID" :roomStage="roomState.stage" />
      </div>
      <Chat class="chat" :messages="roomState.chat" :roomUuid="roomState.roomID" />
    </template>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router';
import { defineComponent, ref, computed, watch } from 'vue';
import Board from '@/components/view/board/Board.vue';
import type { TVisibleRole, ISocketError } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { GameStateManager } from '@/helpers/game-state-manager';
import RolesInfo from '@/components/view/information/RolesInfo.vue';
import CardsInfo from '@/components/view/information/CardsInfo.vue';
import HostPanel from '@/components/view/panels/HostPanel.vue';
import RoomVote from '@/components/view/panels/RoomVote.vue';
import Chat from '@/components/feedback/Chat.vue';
import RatingChangesPanel from '@/components/stats/RatingChangesPanel.vue';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  name: 'Room',
  components: {
    Board,
    RolesInfo,
    CardsInfo,
    HostPanel,
    RoomVote,
    Chat,
    RatingChangesPanel,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const stateManager = new GameStateManager();
    const alert = ref<boolean>(true);
    const errorMessage = ref<ISocketError>();
    const store = useStore();
    const router = useRouter();
    const online = ref<number>();
    const userID = computed(() => store.state.profile?.id);

    const roomState = stateManager.state;
    const game = stateManager.game;

    const initState = async (uuid: string) => {
      const stateFromBackend = await socket.emitWithAck('joinRoom', uuid);

      if ('error' in stateFromBackend) {
        errorMessage.value = stateFromBackend;
      } else {
        stateManager.mutateRoomState({ newRoomState: stateFromBackend, userID: userID.value });
      }
    };

    await initState(props.uuid);

    socket.emitWithAck('getOnlineCounter', props.uuid).then((counter) => {
      online.value = counter;
    });

    socket.on('roomUpdated', (state) => {
      if (state.roomID === props.uuid) {
        stateManager.mutateRoomState({ newRoomState: state, userID: userID.value });
      }
    });

    socket.on('gameUpdated', (game) => {
      if (game.uuid === props.uuid && roomState.value.stage === 'started') {
        stateManager.mutateRoomState({ newGameState: game, userID: userID.value });
      }
    });

    socket.on('restartGame', (uuid) => {
      router.push({ name: 'room', params: { uuid } });
    });

    socket.on('destroyRoom', (gameUUID) => {
      if (gameUUID === props.uuid) {
        router.push({ name: 'lobby' });
      }
    });

    socket.on('roomOnlineUpdated', (counter) => {
      online.value = counter;
    });

    watch(
      () => props.uuid,
      (newUUID) => {
        initState(newUUID);
      },
    );

    watch(userID, () => {
      initState(props.uuid);
    });

    watch(
      () => game.value?.result?.winner,
      (newWinner, oldWinner) => {
        if (newWinner && !oldWinner) {
          setTimeout(() => {
            eventBus.emit('showRatingPanel');
          }, 1500);
        }
      },
    );

    const displayHostPanel = computed(() => {
      return roomState.value.leaderID === userID.value;
    });

    const displayRestartButton = computed(() => {
      return (
        roomState.value.stage === 'started' && game.value.stage === 'end' && roomState.value.leaderID === userID.value
      );
    });

    const restartGame = () => socket.emit('restartGame', roomState.value.roomID);

    const visibleRoles = computed(() => {
      if (roomState.value.stage === 'started') {
        return game.value.players.reduce<TVisibleRole[]>((acc, el) => {
          if (!acc.includes(el.role)) {
            acc.push(el.role);
          }

          return acc;
        }, []);
      }

      return [];
    });

    return {
      roomState,
      errorMessage,
      displayRestartButton,
      displayHostPanel,
      visibleRoles,
      alert,
      game,
      online,
      restartGame,
    };
  },

  beforeRouteLeave() {
    socket.emit('leaveRoom', this.$props.uuid);
  },

  beforeRouteUpdate() {
    socket.emit('leaveRoom', this.$props.uuid);
  },
});
</script>

<style lang="scss">
.online {
  opacity: 30%;
  font-size: large;
  position: fixed;
  top: 60px;
  right: 10px;
}

.game-stage {
  width: 500px;
  background-color: white;
  font-size: 18px;
}

.info-container {
  position: fixed;
  left: 0;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 60px;
  transform: translateY(-50%);
}

.right-info-container {
  position: fixed;
  right: 0;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 100px;
  transform: translateY(-50%);
}

.right-info-container > * {
  transform-origin: center right;
  transform: rotate(270deg) translateX(50%);
  margin-right: 10px;
}

.info-container > * {
  transform-origin: left center;
  transform: rotate(90deg) translateX(-50%);
  margin-left: 10px;
}

.restart-button {
  margin-top: 10px;
  z-index: 10;
}

.room {
  width: 100vw;
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
}

.chat {
  position: fixed;
  bottom: 30px;
  right: 5px;
}
</style>
