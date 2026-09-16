<template>
  <main class="lobby">
    <section class="lobby-hero" aria-labelledby="lobby-title">
      <div class="hero-copy">
        <div class="hero-eyebrow">
          <span class="brand-name">AVALON</span>
          <span v-if="online !== undefined" class="online">{{ $t('mainPage.online', { count: online }) }}</span>
        </div>
        <h1 id="lobby-title">{{ $t('mainPage.header') }}</h1>
        <p class="lobby-intro">{{ $t('mainPage.intro') }}</p>
        <div class="lobby-actions">
          <v-btn class="create-room" color="primary" size="large" elevation="0" @click="createRoom">
            <span class="material-icons" aria-hidden="true">add</span>
            {{ $t('mainPage.createRoom') }}
          </v-btn>
          <nav class="lobby-links" :aria-label="$t('menu.wiki')">
            <LocaleLink :to="{ name: 'rules' }"
              ><span class="link-label">{{ $t('wiki.rules') }}</span
              ><span aria-hidden="true">↗</span></LocaleLink
            >
            <LocaleLink :to="{ name: 'roles' }"
              ><span class="link-label">{{ $t('wiki.roles') }}</span
              ><span aria-hidden="true">↗</span></LocaleLink
            >
          </nav>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="hero-orbit"></div>
        <div class="character-card character-card--morgana"><span>II</span></div>
        <div class="character-card character-card--merlin"><span>I</span></div>
        <div class="art-caption">{{ $t('mainPage.heroCaption') }}</div>
      </div>
    </section>

    <div class="lobby-content">
      <aside class="lobby-sidebar">
        <a class="discord-card" href="https://discord.gg/Xdu7ByqQtt" target="_blank" rel="noopener noreferrer">
          <span class="discord-icon" aria-hidden="true"><v-icon icon="fa:fa-brands fa-discord" size="22" /></span>
          <div>
            <h2>{{ $t('mainPage.findPlayers') }}</h2>
            <p>{{ $t('mainPage.discordHint') }}</p>
          </div>
          <span class="discord-arrow" aria-hidden="true">↗</span>
        </a>
        <!-- Enable the support banner after production payment verification. -->
        <LocaleLink v-if="false" class="support-card" :to="{ name: 'support' }">
          <span class="support-card__icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="m5 10 6 5 5-9 5 9 6-5-3 14H8L5 10Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
              <path d="M10 28h12M11 20h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              <circle cx="16" cy="4" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <div class="support-card__copy">
            <h2>{{ $t('support.bannerTitle') }}</h2>
            <p>{{ $t('support.bannerText') }}</p>
            <span class="support-card__link">{{ $t('support.bannerLink') }} <span aria-hidden="true">→</span></span>
          </div>
        </LocaleLink>
        <div class="leaderboard-panel">
          <RotatingTopPlayer />
          <LocaleLink class="leaderboard-link" :to="{ name: 'leaderboard' }"
            >{{ $t('mainPage.leaderboard') }} <span aria-hidden="true">→</span></LocaleLink
          >
        </div>
      </aside>
      <section class="rooms-panel" aria-labelledby="games-title">
        <div class="rooms-heading">
          <h2 id="games-title">{{ $t('mainPage.gamesList') }}</h2>
          <span v-if="roomsList" class="room-count">{{ roomsList.length }}</span>
        </div>
        <div class="room-filters" role="group" :aria-label="$t('mainPage.filterLabel')">
          <button
            v-for="item in filters"
            :key="item"
            type="button"
            :aria-pressed="filter === item"
            :class="{ selected: filter === item }"
            @click="filter = item"
          >
            {{ $t(`mainPage.filter${item}`) }}
            <span v-if="roomsList">{{ filterCount(item) }}</span>
          </button>
        </div>
        <p v-if="!roomsList" class="rooms-message" role="status">{{ $t('mainPage.loading') }}</p>
        <div v-else-if="!visibleRooms.length" class="rooms-message" role="status">
          <span class="material-icons empty-icon" aria-hidden="true">meeting_room</span>
          <p>{{ $t(roomsList.length ? 'mainPage.noMatchingRooms' : 'mainPage.noRooms') }}</p>
          <button v-if="filter !== 'all'" class="reset-filter" @click="filter = 'all'">
            {{ $t('mainPage.showAll') }}
          </button>
        </div>
        <div v-else class="games-list">
          <LobbyRoom v-for="game in visibleRooms.slice(0, visibleLimit)" :key="game.uuid" :game="game" />
          <button v-if="visibleRooms.length > visibleLimit" class="show-more" @click="visibleLimit += 8">
            {{ $t('mainPage.showMore') }} <span aria-hidden="true">↓</span>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import type { TRoomsList } from '@avalon/types';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import LobbyRoom from './LobbyRoom.vue';
import RotatingTopPlayer from '@/components/stats/RotatingTopPlayer.vue';

export default defineComponent({
  components: {
    LobbyRoom,
    RotatingTopPlayer,
  },
  setup() {
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

    void initState();

    const createRoom = async () => {
      if (!store.state.profile) {
        eventBus.emit('openAuthModal');
        eventBus.emit('infoMessage', t('infoMessage.loginToCreate'));
        return;
      }

      const uuid = await socket.emitWithAck('createRoom');
      router.push({ name: 'room', params: { uuid } });
    };

    const updateRooms = (list: TRoomsList) => {
      roomsList.value = list;
    };
    socket.on('roomsListUpdated', updateRooms);

    const filter = ref('all');
    const visibleLimit = ref(8);
    watch(filter, () => {
      visibleLimit.value = 8;
    });
    const filters = ['all', 'open', 'playing', 'finished'];
    const roomCategory = (room: TRoomsList[number]) =>
      room.result ? 'finished' : room.state === 'created' ? (room.players < 10 ? 'open' : 'full') : 'playing';
    const roomPriority = (room: TRoomsList[number]) => {
      if (roomCategory(room) === 'open') return room.options.features?.lookingForPlayers ? 0 : 1;
      return room.result ? 3 : 2;
    };
    const visibleRooms = computed(() =>
      [...(roomsList.value || [])]
        .filter((room) => filter.value === 'all' || roomCategory(room) === filter.value)
        .sort((a, b) => roomPriority(a) - roomPriority(b)),
    );
    const filterCount = (value: string) =>
      (roomsList.value || []).filter((room) => value === 'all' || roomCategory(room) === value).length;

    const updateOnline = (counter: number) => {
      online.value = counter;
    };
    socket.on('onlineCounterUpdated', updateOnline);
    onBeforeUnmount(() => {
      socket.off('roomsListUpdated', updateRooms);
      socket.off('onlineCounterUpdated', updateOnline);
    });

    return {
      createRoom,
      filter,
      visibleLimit,
      filters,
      visibleRooms,
      filterCount,
      online,
      roomsList,
    };
  },
});
</script>

<style scoped lang="scss">
.lobby {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 74px 28px 48px;
}
.lobby-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 28px;
  padding: 28px 32px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.08);
  border-radius: 20px;
  background: linear-gradient(115deg, rgb(var(--v-theme-inset)) 55%, rgba(var(--v-theme-primary), 0.08));
}
.hero-eyebrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 12px;
}
.brand-name {
  font-weight: 800;
  letter-spacing: 0.22em;
  color: rgb(var(--v-theme-text-primary));
}
.online {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(var(--v-theme-text-primary), 0.7);
}
.online::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
}
h1 {
  font-size: clamp(27px, 3.2vw, 36px);
  line-height: 1.2;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
.lobby-intro {
  max-width: 690px;
  margin-top: 12px;
  font-size: 15px;
  line-height: 1.65;
  color: rgba(var(--v-theme-text-primary), 0.75);
}
.lobby-actions,
.lobby-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
}
.lobby-actions {
  margin-top: 20px;
}
.create-room {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.create-room .material-icons {
  margin-right: 6px;
  font-size: 20px;
}
.lobby-links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 14px;
  text-decoration: none;
}
.lobby-links .link-label {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.hero-art {
  position: relative;
  min-height: 200px;
  align-self: center;
}
.hero-orbit {
  position: absolute;
  width: 220px;
  height: 220px;
  top: -10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 50%;
}
.character-card {
  position: absolute;
  width: 104px;
  height: 150px;
  border: 3px solid #b9a276;
  border-radius: 12px;
  background-color: #25334b;
  background-size: cover;
  box-shadow: 0 12px 24px #101c3433;
}
.character-card span {
  position: absolute;
  bottom: 7px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff0cb;
  background: #172135dd;
  border: 1px solid #b9a276;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  text-align: center;
  font-family: Georgia, serif;
}
.character-card--morgana {
  top: 12px;
  right: 15px;
  transform: rotate(14deg);
  background-image: getImagePathByID('roles', 'morgana');
  background-position: center;
}
.character-card--merlin {
  top: 0;
  left: 18px;
  transform: rotate(-12deg);
  background-image: getImagePathByID('roles', 'merlin');
  background-position: center;
}
.art-caption {
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  font-family: Georgia, serif;
  font-size: 13px;
  font-style: italic;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.lobby-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  grid-template-areas: 'rooms community';
  align-items: start;
  gap: 28px;
  margin-top: 28px;
}
.rooms-panel,
.lobby-sidebar {
  min-width: 0;
}
.rooms-panel {
  grid-area: rooms;
}
.rooms-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.rooms-heading h2 {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.room-count {
  font-size: 13px;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.room-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
}
.room-filters button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: rgba(var(--v-theme-text-primary), 0.7);
}
.room-filters button.selected {
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  box-shadow: 0 1px 3px #00000010;
  font-weight: 600;
}
.room-filters button:hover {
  background: rgba(var(--v-theme-inset), 0.6);
}
.room-filters button span {
  font-size: 11px;
  opacity: 0.65;
}
.games-list {
  display: grid;
  gap: 8px;
}
.show-more {
  min-height: 44px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.15);
  border-radius: 10px;
  font-size: 13px;
}
.show-more:hover {
  background: rgb(var(--v-theme-inset));
}
.rooms-message {
  padding: 32px 20px;
  border: 1px dashed rgba(var(--v-theme-text-primary), 0.2);
  border-radius: 14px;
  text-align: center;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(var(--v-theme-text-primary), 0.7);
}
.empty-icon {
  font-size: 30px;
  margin-bottom: 10px;
  opacity: 0.5;
}
.reset-filter {
  margin-top: 12px;
  text-decoration: underline;
  text-underline-offset: 4px;
  min-height: 44px;
}
.lobby-sidebar {
  grid-area: community;
  position: sticky;
  top: 74px;
  padding-top: 2px;
  display: grid;
  gap: 20px;
}
.discord-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.08);
  border-radius: 14px;
  background: rgba(var(--v-theme-inset), 0.65);
}
.support-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 18px;
  border: 1px solid rgba(181, 148, 85, 0.3);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(181, 148, 85, 0.1), rgba(var(--v-theme-inset), 0.45));
  color: rgb(var(--v-theme-text-primary));
  transition:
    border-color 0.18s,
    background 0.18s;
}
.support-card:hover {
  border-color: rgba(181, 148, 85, 0.7);
  background: rgba(181, 148, 85, 0.13);
}
.support-card:focus-visible {
  outline: 2px solid #b59455;
  outline-offset: 4px;
}
.support-card__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 48px;
  color: #b59455;
  border: 1px solid rgba(181, 148, 85, 0.25);
  border-radius: 12px 12px 18px 18px;
  background: rgba(181, 148, 85, 0.08);
}
.support-card__icon svg {
  width: 29px;
  height: 29px;
}
.support-card__copy {
  min-width: 0;
}
.support-card h2 {
  font-size: 15px;
  line-height: 1.4;
  font-weight: 650;
}
.support-card p {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.support-card__link {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  margin-top: 13px;
  font-size: 12px;
  font-weight: 600;
}
.support-card__link span {
  color: #b59455;
}
.discord-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #5865f2;
  color: white;
  font-size: 20px;
}
.discord-card h2 {
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
}
.discord-card p {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.discord-arrow {
  margin-left: auto;
  opacity: 0.6;
}
.discord-card:hover {
  background: rgb(var(--v-theme-inset));
}
.leaderboard-panel {
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.08);
  border-radius: 14px;
  background: rgba(var(--v-theme-inset), 0.4);
}
.leaderboard-panel :deep(.rotating-top-player) {
  margin: 0;
}
.leaderboard-panel :deep(.top-player-title) {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}
.leaderboard-panel :deep(.top-player-card) {
  box-shadow: none;
  height: auto;
  min-height: 140px;
  background: transparent;
}
.leaderboard-panel :deep(.top-player-card:hover) {
  transform: none;
}
.leaderboard-panel :deep(.top-player-card > .pa-3) {
  padding: 0 !important;
}
.leaderboard-panel :deep(.role-name) {
  font-size: 15px;
}
.leaderboard-panel :deep(.rating-value) {
  font-size: 20px;
}
.leaderboard-panel :deep(.games-count) {
  font-size: 12px;
}
.leaderboard-panel :deep(.crown-icon) {
  display: none;
}
.leaderboard-panel :deep(.stats-container) {
  min-width: 80px;
}
.leaderboard-panel :deep(.winrate-container) {
  transform: none;
}
.leaderboard-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.1);
  padding-top: 12px;
  min-height: 44px;
  margin-top: 8px;
  font-size: 13px;
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid rgb(var(--v-theme-text-primary));
  outline-offset: 3px;
}
@media (max-width: 1000px) {
  .hero-art {
    display: none;
  }
  .lobby-hero {
    grid-template-columns: minmax(0, 1fr);
  }
  .lobby-content {
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 20px;
  }
}
@media (max-width: 760px) {
  .lobby-content {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'community' 'rooms';
  }
  .lobby-sidebar {
    position: static;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
@media (max-width: 600px) {
  .lobby {
    padding: 66px 12px 40px;
  }
  .lobby-hero {
    padding: 20px;
    border-radius: 16px;
  }
  .lobby-intro {
    font-size: 14px;
    line-height: 1.6;
  }
  .lobby-actions {
    gap: 8px 20px;
    margin-top: 16px;
  }
  .lobby-actions > .v-btn {
    width: 100%;
  }
  .lobby-links {
    width: 100%;
    justify-content: center;
  }
  .lobby-content {
    margin-top: 24px;
  }
  .room-filters {
    gap: 2px;
  }
  .room-filters button {
    padding: 8px;
    gap: 5px;
    font-size: 12px;
  }
  .lobby-sidebar {
    grid-template-columns: minmax(0, 1fr);
  }
  .discord-card {
    padding: 12px 16px;
  }
  .leaderboard-panel {
    padding: 12px 16px;
  }
  .leaderboard-panel :deep(.top-player-title) {
    margin-bottom: 8px;
  }
  .leaderboard-panel :deep(.top-player-card) {
    min-height: 0;
  }
  .leaderboard-panel :deep(.role-header) {
    margin-bottom: 8px !important;
    padding-bottom: 6px;
  }
  .leaderboard-panel :deep(.role-icon) {
    width: 28px;
    height: 28px;
  }
  .leaderboard-panel :deep(.stats-container) {
    height: auto;
  }
  .leaderboard-link {
    margin-top: 4px;
    padding-top: 8px;
  }
}
</style>
