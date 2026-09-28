<template>
  <template v-if="!roomState.ai">
    <v-btn color="info" class="mb-4" @click="onCopyClick">
      <template v-slot:prepend>
        <span class="material-icons"> share </span>
      </template>
      {{ $t('startPanel.copyLink') }}
    </v-btn>
    <v-btn :to="communityPath" color="info" class="mb-4">
      <template v-slot:prepend>
        <span class="material-icons" aria-hidden="true">groups</span>
      </template>
      {{ $t('community.title') }}
    </v-btn>
    <v-btn v-if="isUserInGame" color="warning" @click="onJoinClick"> {{ $t('startPanel.leaveGame') }} </v-btn>
    <v-btn
      v-else-if="roomState.players.length < 10"
      color="info"
      :disabled="roomState.stage !== 'created'"
      @click="onJoinClick"
    >
      {{ $t('startPanel.joinGame') }}
    </v-btn>
    <div v-if="isUserLeader" class="lobby-host-actions">
      <v-btn color="info" class="lobby-lock" @click="onLockClick">
        <template #prepend
          ><span class="material-icons" aria-hidden="true">{{
            roomState.stage === 'locked' ? 'lock_open' : 'lock'
          }}</span></template
        >
        {{ $t(roomState.stage === 'locked' ? 'startPanel.unlockGame' : 'startPanel.lockGame') }}
      </v-btn>
      <v-btn class="lobby-start" color="success" :disabled="isStartGameDisabled" @click="onStartClick">
        <template #prepend><span class="material-icons" aria-hidden="true">play_arrow</span></template>
        {{ $t('startPanel.startGame') }}
      </v-btn>
      <p class="lobby-start-hint" role="status">{{ $t(startHint) }}</p>
      <HostPanel :roomState="roomState" />
    </div>
  </template>
</template>

<script lang="ts">
import { localizedPath, neutralRoomUrl } from '@/router/paths';
import { defineComponent, computed, PropType, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { TPageRoomState } from '@/helpers/game-state-manager';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import HostPanel from './HostPanel.vue';

export default defineComponent({
  name: 'StartPanel',
  components: { HostPanel },
  props: {
    roomState: {
      type: Object as PropType<TPageRoomState>,
      required: true,
    },
  },
  setup(props) {
    const { t, locale } = useI18n();
    const communityPath = computed(() => localizedPath('/community/', locale.value));
    const { roomState } = toRefs(props);
    const store = useStore();

    const isUserInGame = computed(() => {
      return roomState.value.players.some((player) => player.id === store.state.profile?.id);
    });

    const isUserLeader = computed(() => {
      return roomState.value.leaderID === store.state.profile?.id;
    });

    const isStartGameDisabled = computed(() => {
      return (
        roomState.value.stage !== 'locked' || roomState.value.players.length < 5 || roomState.value.players.length > 10
      );
    });

    const onJoinClick = () => {
      if (!store.state.profile) {
        eventBus.emit('openAuthModal');
        eventBus.emit('infoMessage', t('infoMessage.loginToJoin'));
        return;
      }

      socket.emit(isUserInGame.value ? 'leaveGame' : 'joinGame', roomState.value.roomID);
    };

    const startHint = computed(() =>
      roomState.value.players.length < 5 || roomState.value.players.length > 10
        ? 'hostMenu.needPlayers'
        : roomState.value.stage !== 'locked'
          ? 'hostMenu.lockBeforeStart'
          : 'hostMenu.ready',
    );
    const onLockClick = () => {
      if (isUserLeader.value && roomState.value.stage !== 'started') socket.emit('lockRoom', roomState.value.roomID);
    };
    const onStartClick = () => {
      if (!isUserLeader.value || isStartGameDisabled.value) return;
      socket.emit('startGame', roomState.value.roomID);
    };

    const onCopyClick = () => {
      navigator.clipboard.writeText(neutralRoomUrl(window.location.href));
      eventBus.emit('infoMessage', t('infoMessage.linkCopied'));
    };

    return {
      communityPath,
      roomState,

      isUserInGame,
      isUserLeader,
      isStartGameDisabled,

      onJoinClick,
      onStartClick,
      onLockClick,
      startHint,
      onCopyClick,
    };
  },
});
</script>

<style scoped lang="scss">
.lobby-host-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.lobby-start-hint {
  max-width: 240px;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  margin: 0;
}
</style>
