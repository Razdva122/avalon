<template>
  <div class="lobby">
    <div class="alert-container">
      <TemporaryAlert id="discordchat">
        <div v-html="$t('alert.contentdiscordchat')"></div>
      </TemporaryAlert>
    </div>

    <span class="online">{{ $t('mainPage.online', { count: online }) }}</span>

    <h1 class="lobby-header">{{ $t('mainPage.header') }}</h1>

    <div class="top-player-container">
      <RotatingTopPlayer />
    </div>

    <v-btn class="mb-5" @click="createRoom" size="x-large"> {{ $t('mainPage.createRoom') }} </v-btn>

    <div>
      <template v-if="roomsList && roomsList.length">
        <div class="list-header mb-5">{{ $t('mainPage.gamesList') }}:</div>
        <div
          v-for="(game, index) in roomsList"
          class="game mb-1"
          @click="$router.push({ name: 'room', params: { uuid: game.uuid } })"
        >
          <div>{{ index + 1 }}.</div>
          <div class="game-container">
            <div class="game-left">
              <div class="mr-2 game-name">
                <span v-if="game.result?.winner" :class="`${game.result.winner}-loyalty-icon`" class="mr-1"></span>
                <b>{{ roomsListHosts?.[index] }}</b>
              </div>
              <OptionsPreview
                v-if="displayOptions(game.options.roles, game.options.addons)"
                :roles="game.options.roles"
                :addons="game.options.addons"
              />
            </div>
            <div class="game-right">
              <div class="game-right-content">
                <v-chip
                  v-if="game.state === 'created' && game.options.features && game.options.features.lookingForPlayers"
                  color="green"
                  variant="flat"
                >
                  {{ $t('mainPage.lookingForPlayers') }}
                </v-chip>
                <div class="players-amount mr-2">
                  {{ game.state === 'created' ? `${game.players}/10` : `${game.players} ${$t('mainPage.players')}` }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import type { TRoomsList } from '@avalon/types';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import TemporaryAlert from '@/components/feedback/TemporaryAlert.vue';
import OptionsPreview from '@/components/view/information/OptionsPreview.vue';
import RotatingTopPlayer from '@/components/stats/RotatingTopPlayer.vue'; // Import the new component
import type { GameOptionsRoles, GameOptionsAddons } from '@avalon/types';
import { useUserProfile } from '@/helpers/composables';

export default defineComponent({
  components: {
    TemporaryAlert,
    OptionsPreview,
    RotatingTopPlayer,
  },
  async setup() {
    const { t } = useI18n();
    const router = useRouter();
    const store = useStore();

    const roomsList = ref<TRoomsList>();
    const online = ref<number>();

    socket.emitWithAck('getOnlineCounter', 'lobby').then((counter) => {
      online.value = counter;
    });

    const initState = async () => {
      const data = await socket.emitWithAck('getRoomsList');

      roomsList.value = data;
    };

    await initState();

    const createRoom = async () => {
      if (!store.state.profile) {
        eventBus.emit('openAuthModal');
        eventBus.emit('infoMessage', t('infoMessage.loginToCreate'));
        return;
      }

      const uuid = await socket.emitWithAck('createRoom');
      router.push({ name: 'room', params: { uuid } });
    };

    socket.on('roomsListUpdated', (list) => {
      roomsList.value = list;
    });

    const displayOptions = (roles: GameOptionsRoles, addons: GameOptionsAddons) => {
      return [...Object.values(roles), ...Object.values(addons)].some((el) => Boolean(el));
    };

    const roomsListHosts = computed(() => {
      return (roomsList.value || []).map((room) => {
        const { userName } = useUserProfile(room.hostID);
        return userName;
      });
    });

    socket.on('onlineCounterUpdated', (counter) => {
      online.value = counter;
    });

    return {
      createRoom,
      displayOptions,
      online,
      roomsList,
      roomsListHosts,
    };
  },
});
</script>

<style scoped lang="scss">
.online {
  opacity: 30%;
  font-size: large;
  position: fixed;
  top: 60px;
  right: 10px;
}

.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: calc(100vh - 50px);
}

.lobby-header {
  text-align: center;
  margin: 10px;
}

.top-player-container {
  margin-bottom: 20px;
  width: 100%;
  max-width: 500px;
  display: flex;
  justify-content: center;
  align-self: center; /* Ensure container is centered in the flex column */
  padding: 0 16px; /* Add padding for smaller screens */
}

.list-header {
  font-size: 30px;
}

.game {
  background-color: rgb(var(--v-theme-surface-light));
  border-radius: 12px;
  padding: 5px 10px;
  min-width: 50vw;
  display: flex;
  align-items: center;
  font-size: 24px;
  border: 1px solid rgba(255, 255, 255, 0);
}

.game:hover {
  background-color: rgb(var(--v-theme-inset-hover));
  cursor: pointer;
  border: 1px solid;
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

.game-right-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-name {
  @include text-overflow(1);
  display: flex;
  align-items: center;
}

.players-amount {
  align-self: center;
}

.alert-container {
  margin-top: 20px;
  margin-left: 10px;
  margin-right: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90%;
  max-width: 800px;
}

@import '@/styles/loyalty-icons.scss';

.evil-loyalty-icon,
.good-loyalty-icon {
  width: 25px;
  height: 25px;
}
</style>
