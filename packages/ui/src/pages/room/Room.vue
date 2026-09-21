<template>
  <div class="room d-flex align-center justify-space-around">
    <span class="online">{{ $t('mainPage.online', { count: online }) }}</span>
    <template v-if="errorMessage">
      <h1 class="mb-4">{{ $t('room.' + errorMessage.error) }}</h1>
      <LocaleLink :to="{ name: 'lobby' }"
        ><v-btn size="x-large">{{ $t('room.backToLobby') }}</v-btn></LocaleLink
      >
    </template>
    <template v-else>
      <AiRoomPanel v-if="roomState.ai" class="ai-room-status" :ai="roomState.ai" :roomID="roomState.roomID" />
      <Board :room-state="roomState">
        <template v-if="roomState.vote" v-slot:content>
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
          v-if="!roomState.ai && roomState.stage === 'started' && game.stage === 'end'"
          :gameID="roomState.roomID"
          :gameState="game"
        />
        <HostPanel v-if="displayHostPanel" :roomUuid="roomState.roomID" :roomStage="roomState.stage" />
      </div>
      <Chat v-model:open="chatOpen" :messages="roomState.chat" :roomUuid="roomState.roomID">
        <template #stickers>
          <StickerPicker :roomID="roomState.roomID" @hide-on-board="hideStickers = $event" />
        </template>
      </Chat>
    </template>
  </div>
</template>

<script lang="ts">
import { localizedPath } from '@/router/paths';
import { i18n } from '@/plugins/i18n';
import { useRouter } from 'vue-router';
import { defineComponent, ref, computed, watch, provide } from 'vue';
import Board from '@/components/view/board/Board.vue';
import type { TVisibleRole, ISocketError } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { GameStateManager } from '@/helpers/game-state-manager';
import RolesInfo from '@/components/view/information/RolesInfo.vue';
import CardsInfo from '@/components/view/information/CardsInfo.vue';
import AiRoomPanel from '@/components/view/panels/AiRoomPanel.vue';
import HostPanel from '@/components/view/panels/HostPanel.vue';
import RoomVote from '@/components/view/panels/RoomVote.vue';
import StickerPicker from '@/components/stickers/StickerPicker.vue';
import { roomChatKey } from '@/helpers/room-chat-context';
import { useRoomStickers } from '@/helpers/composables/useRoomStickers';
import Chat from '@/components/feedback/Chat.vue';
import RatingChangesPanel from '@/components/stats/RatingChangesPanel.vue';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  name: 'Room',
  components: {
    Board,
    AiRoomPanel,
    RolesInfo,
    CardsInfo,
    HostPanel,
    RoomVote,
    Chat,
    StickerPicker,
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
    const hideStickers = ref(false);
    const chatOpen = ref(false);
    provide(roomChatKey, { open: chatOpen, roomID: () => props.uuid });
    watch(
      () => props.uuid,
      () => {
        chatOpen.value = false;
      },
    );
    useRoomStickers(
      () => props.uuid,
      roomState,
      () => hideStickers.value,
    );
    const game = stateManager.game;

    const initState = async (uuid: string) => {
      const stateFromBackend = await socket.emitWithAck('joinRoom', uuid);

      if ('error' in stateFromBackend) {
        errorMessage.value = stateFromBackend;
      } else {
        stateManager.mutateRoomState({ newRoomState: stateFromBackend, userID: userID.value });
        if (stateFromBackend.ai) chatOpen.value = true;
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
        router.push(localizedPath('/', i18n.global.locale.value));
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
        if (newWinner && !oldWinner && !roomState.value.ai) {
          setTimeout(() => {
            eventBus.emit('showRatingPanel');
          }, 1500);
        }
      },
    );

    const displayHostPanel = computed(() => {
      return !roomState.value.ai && roomState.value.leaderID === userID.value;
    });

    const displayRestartButton = computed(() => {
      return (
        !roomState.value.ai &&
        roomState.value.stage === 'started' &&
        game.value.stage === 'end' &&
        roomState.value.leaderID === userID.value
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
      hideStickers,
      chatOpen,
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
.ai-room-status {
  position: fixed;
  top: 65px;
  left: 12px;
  z-index: 12;
  max-width: 330px;
}
@media (max-width: 600px) {
  .ai-room-status {
    top: 55px;
    left: 4px;
    max-width: calc(100vw - 24px);
    font-size: 12px;
  }
}

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
</style>
