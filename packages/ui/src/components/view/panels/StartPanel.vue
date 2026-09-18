<template>
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
  <template v-if="isUserLeader">
    <v-btn class="mt-2" color="info" @click="onLockClick">
      {{ roomState.stage === 'created' ? $t('startPanel.lockGame') : $t('startPanel.unlockGame') }}
    </v-btn>
    <v-btn class="mt-2 mb-4" color="success" :disabled="isStartGameDisabled" @click="onStartClick">
      {{ $t('startPanel.startGame') }}
    </v-btn>
    <div class="d-flex flex-column gap-2">
      <Options
        :roles="options.roles"
        :addons="options.addons"
        :features="options.features"
        :playerCount="roomState.players.length"
        :buttonText="$t('startPanel.options')"
        @apply="applyOptions"
      />
      <TimerButton :features="options.features" @update:features="updateFeatures" />
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
import Options from '@/components/view/options/Options.vue';
import TimerButton from '@/components/view/options/TimerButton.vue';
import { useRoomOptions } from '@/components/view/options/room-options';
import type { GameOptionsFeatures } from '@avalon/types';

export default defineComponent({
  name: 'StartPanel',
  components: {
    Options,
    TimerButton,
  },
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

    const { options, applyOptions } = useRoomOptions(
      () => roomState.value.options,
      (next) => socket.emit('updateOptions', roomState.value.roomID, next),
    );

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

    const onLockClick = () => {
      socket.emit('lockRoom', roomState.value.roomID);
    };

    const onStartClick = () => {
      socket.emit('startGame', roomState.value.roomID);
    };

    const onCopyClick = () => {
      navigator.clipboard.writeText(neutralRoomUrl(window.location.href));
      eventBus.emit('infoMessage', t('infoMessage.linkCopied'));
    };

    const updateFeatures = (newFeatures: GameOptionsFeatures) => {
      applyOptions({ ...options.value, features: newFeatures });
    };

    return {
      communityPath,
      roomState,
      options,

      isUserInGame,
      isUserLeader,
      isStartGameDisabled,

      onJoinClick,
      onLockClick,
      onStartClick,
      onCopyClick,
      updateFeatures,
      applyOptions,
    };
  },
});
</script>

<style scoped lang="scss"></style>
