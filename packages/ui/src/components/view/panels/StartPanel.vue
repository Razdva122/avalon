<template>
  <v-btn color="info" class="mb-4" @click="onCopyClick">
    <template v-slot:prepend>
      <span class="material-icons"> share </span>
    </template>
    {{ $t('startPanel.copyLink') }}
  </v-btn>
  <v-btn color="info" class="mb-4" @click="onDiscordClick">
    <template v-slot:prepend>
      <v-icon class="social-icon mr-1" size="large" icon="fa:fa-brands fa-discord" />
    </template>
    {{ $t('startPanel.discord') }}
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
    <Options
      :roles="options.roles"
      :addons="options.addons"
      :features="options.features"
      :buttonText="$t('startPanel.options')"
    />
  </template>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { TPageRoomState } from '@/helpers/game-state-manager';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import Options from '@/components/view/options/Options.vue';

export default defineComponent({
  name: 'StartPanel',
  components: {
    Options,
  },
  props: {
    roomState: {
      type: Object as PropType<TPageRoomState>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const { roomState } = toRefs(props);
    const store = useStore();

    const roles = computed(() => {
      return roomState.value.options.roles;
    });
    const addons = computed(() => {
      return roomState.value.options.addons;
    });
    const features = computed(() => {
      return roomState.value.options.features;
    });

    const options = ref({
      addons: addons.value,
      roles: roles.value,
      features: features.value,
    });

    watch(
      options,
      (options) => {
        socket.emit('updateOptions', roomState.value.roomID, options);
      },
      { deep: true },
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
      navigator.clipboard.writeText(window.location.href);
      eventBus.emit('infoMessage', t('infoMessage.linkCopied'));
    };

    const onDiscordClick = () => {
      window.open('https://discord.gg/DR9cEDDNdN', '_blank');
    };

    return {
      roomState,
      options,

      isUserInGame,
      isUserLeader,
      isStartGameDisabled,

      onJoinClick,
      onLockClick,
      onStartClick,
      onCopyClick,
      onDiscordClick,
    };
  },
});
</script>

<style scoped lang="scss"></style>
