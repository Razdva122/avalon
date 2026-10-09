<template>
  <div class="room d-flex align-center justify-space-around">
    <span class="online">{{ $t('mainPage.online', { count: online }) }}</span>
    <template v-if="errorMessage">
      <h1 class="mb-4">{{ $t('room.' + errorMessage.error) }}</h1>
      <LocaleLink :to="{ name: 'lobby' }"
        ><v-btn size="x-large">{{ $t('room.backToLobby') }}</v-btn></LocaleLink
      >
    </template>
    <template v-else-if="roomState">
      <AiRoomPanel
        v-if="roomState.ai"
        class="ai-room-status"
        :ai="roomState.ai"
        :roomID="roomState.roomID"
        :player-count="roomState.players.length"
        :is-human-player="roomState.ai?.humanPlayerID === userID"
        :canReveal="canRevealRoles"
        :canJoin="canJoinAi"
        :rolesShown="rolesShown"
        @roles="spectatorRoles = $event"
        @decisions="spectatorDecisions = $event"
      />
      <Board
        :key="uuid"
        :room-state="roomState"
        :spectator-roles="rolesShown ? spectatorRoles : {}"
        :spectator-decisions="rolesShown ? spectatorDecisions : []"
        @assassination-active="assassinationActive = $event"
      >
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
        <div class="room-side-tools">
          <RolesInfo
            v-if="roomState.stage === 'started'"
            :game-roles="game.settings.roles"
            :visible-roles="visibleRoles"
          />
          <HostPanel
            v-if="displayHostPanel && roomState.stage === 'started'"
            :roomState="roomState"
            :gameEnded="game.stage === 'end'"
          />
        </div>
        <CardsInfo
          v-if="roomState.stage === 'started' && game.addonsData.plotCards"
          :data="game.addonsData.plotCards.cardsState"
        />
      </div>
      <div class="right-info-container">
        <RatingChangesPanel
          v-if="!roomState.ai && !assassinationActive && roomState.stage === 'started' && game.stage === 'end'"
          :gameID="roomState.roomID"
          :gameState="game"
        />
      </div>
      <Chat v-model:open="chatOpen" :messages="roomState.chat" :roomUuid="roomState.roomID" :seats="chatSeats">
        <template #stickers>
          <StickerPicker :roomID="roomState.roomID" @hide-on-board="hideStickers = $event" />
        </template>
      </Chat>
      <VoicePanel
        v-if="userID && !roomState.archived"
        :roomUuid="uuid"
        :seatIds="roomState.players.map((player) => player.id).join(',')"
      />
    </template>
    <p v-else role="status">{{ $t('mainPage.loading') }}</p>
  </div>
</template>

<script lang="ts">
import { localizedPath } from '@/router/paths';
import { i18n } from '@/plugins/i18n';
import { useRouter } from 'vue-router';
import { defineComponent, ref, computed, watch, provide, shallowRef, onUnmounted } from 'vue';
import { createRoomSession } from '@/helpers/room-session';
import Board from '@/components/view/board/Board.vue';
import type { TVisibleRole, AiSpectatorDecision, TRoles, ISocketError } from '@avalon/types';
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
import { roomVoiceKey } from '@/helpers/room-voice-context';
import type { createRoomVoice } from '@/helpers/composables/useRoomVoice';
import VoicePanel from '@/components/voice/VoicePanel.vue';
import eventBus from '@/helpers/event-bus';
import { ASSASSINATION_REVEAL_DURATION } from '@/components/view/board/animations/render';
import { assassinationReveal } from '@/components/view/board/helpers';

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
    VoicePanel,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const voiceContext = shallowRef<ReturnType<typeof createRoomVoice>>();
    provide(roomVoiceKey, voiceContext);
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
    const assassinationActive = ref(false);
    const spectatorDecisions = ref<AiSpectatorDecision[]>([]);
    const spectatorRoles = ref<Record<string, TRoles>>({});
    const canJoinAi = computed(() =>
      Boolean(
        roomState.value?.leaderID === userID.value &&
        roomState.value?.ai?.status === 'ready' &&
        !roomState.value.ai.humanPlayerID,
      ),
    );
    const canRevealRoles = computed(() =>
      Boolean(
        roomState.value?.ai &&
        !roomState.value.ai.humanPlayerID &&
        roomState.value.stage === 'started' &&
        game.value.stage !== 'end' &&
        !game.value.players.some((p) => p.id === userID.value),
      ),
    );
    const rolesShown = computed(() => canRevealRoles.value && Object.keys(spectatorRoles.value).length > 0);
    watch([() => props.uuid, userID], () => {
      spectatorRoles.value = {};
    });

    const session = createRoomSession(
      socket,
      () => props.uuid,
      (stateFromBackend, source) => {
        errorMessage.value = undefined;
        stateManager.mutateRoomState({
          newRoomState: stateFromBackend,
          userID: userID.value,
          isLiveUpdate: source === 'update',
        });
      },
      (error) => {
        errorMessage.value = error;
      },
      () => {
        router.push(localizedPath('/', i18n.global.locale.value));
      },
      (messages) => {
        if (roomState.value?.roomID === props.uuid) roomState.value.chat = messages;
      },
    );
    const initState = session.load;
    onUnmounted(session.dispose);

    await initState(props.uuid);

    socket
      .timeout(10000)
      .emitWithAck('getOnlineCounter', props.uuid)
      .then((counter) => {
        if (typeof counter === 'number') online.value = counter;
      })
      .catch(() => {});

    socket.on('gameUpdated', (game) => {
      if (!session.isLoading() && game.uuid === props.uuid && roomState.value?.stage === 'started') {
        stateManager.mutateRoomState({ newGameState: game, userID: userID.value });
      }
    });

    socket.on('restartGame', (uuid) => {
      router.push({ name: 'room', params: { uuid } });
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

    let freshFinalGame: string | undefined;
    let ratingTimeout: ReturnType<typeof setTimeout> | undefined;
    const clearRatingTimer = () => {
      if (ratingTimeout) clearTimeout(ratingTimeout);
      ratingTimeout = undefined;
      freshFinalGame = undefined;
    };
    onUnmounted(clearRatingTimer);
    const showRatingAfterReveal = () => {
      if (!freshFinalGame || game.value?.stage !== 'end' || stateManager.viewMode.value !== 'live') return;
      const uuid = freshFinalGame;
      freshFinalGame = undefined;
      const delay = assassinationReveal(game.value) ? ASSASSINATION_REVEAL_DURATION + 200 : 1500;
      ratingTimeout = setTimeout(() => {
        ratingTimeout = undefined;
        if (game.value?.uuid === uuid && stateManager.viewMode.value === 'live') eventBus.emit('showRatingPanel');
      }, delay);
    };
    watch(
      [() => (roomState.value?.stage === 'started' ? roomState.value.game : undefined), stateManager.snapshotRevision],
      ([current, revision], [previous, oldRevision]) => {
        if (revision !== oldRevision || current?.uuid !== previous?.uuid) {
          clearRatingTimer();
          return;
        }
        if (
          current?.stage === 'end' &&
          previous?.stage !== 'end' &&
          current.result?.winner &&
          !roomState.value.ai &&
          stateManager.viewMode.value === 'live'
        ) {
          freshFinalGame = current.uuid;
          showRatingAfterReveal();
        }
      },
    );
    watch([game, stateManager.viewMode], () => {
      if (stateManager.viewMode.value !== 'live') clearRatingTimer();
      else showRatingAfterReveal();
    });

    const displayHostPanel = computed(() => {
      return !roomState.value.ai && !roomState.value.archived && roomState.value.leaderID === userID.value;
    });

    const displayRestartButton = computed(() => {
      return (
        !roomState.value.ai &&
        !roomState.value.archived &&
        roomState.value.stage === 'started' &&
        game.value.stage === 'end' &&
        roomState.value.leaderID === userID.value
      );
    });

    const restartGame = () => socket.emit('restartGame', roomState.value.roomID);

    const visibleRoles = computed(() => {
      if (roomState.value.stage === 'started') {
        return game.value.players.reduce<TVisibleRole[]>((acc, el) => {
          const role = rolesShown.value ? spectatorRoles.value[el.id] || el.role : el.role;
          if (!acc.includes(role)) {
            acc.push(role);
          }

          return acc;
        }, []);
      }

      return [];
    });

    const chatSeats = computed(() =>
      roomState.value?.stage === 'started' && roomState.value.game.features.displayIndex
        ? Object.fromEntries(roomState.value.game.players.map((player) => [player.id, player.index]))
        : undefined,
    );
    return {
      chatSeats,
      spectatorRoles,
      spectatorDecisions,
      canRevealRoles,
      canJoinAi,
      rolesShown,
      hideStickers,
      chatOpen,
      roomState,
      errorMessage,
      displayRestartButton,
      displayHostPanel,
      visibleRoles,
      alert,
      game,
      assassinationActive,
      online,
      userID,
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
    left: 8px;
    max-width: calc(100vw - 16px);
    font-size: 12px;
  }
}

.room > .online {
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

.info-container > :not(.room-side-tools) {
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
  height: 100dvh;
  padding-top: 50px;
  box-sizing: border-box;
  overflow: clip;
}
</style>

<style lang="scss">
.room-side-tools {
  margin-left: -8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.room-side-tools .roles {
  writing-mode: vertical-rl;
  min-width: 44px;
  width: 44px;
  height: 88px;
  padding: 8px 0;
  border-radius: 0 6px 0 0;
}
.room-side-tools .host-trigger--game {
  border-radius: 0 0 6px 0;
  background: rgb(var(--v-theme-info));
  color: white !important;
}
</style>
