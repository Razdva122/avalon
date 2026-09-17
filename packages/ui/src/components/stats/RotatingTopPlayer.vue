<template>
  <div class="rotating-top-player">
    <h3 class="top-player-title">
      {{ $t('stats.topPlayerTitle') }}
    </h3>

    <transition name="fade" mode="out-in">
      <v-card
        v-if="currentRole && topPlayer && !loading"
        :key="currentRole"
        class="top-player-card"
        :to="{ name: 'user_stats', params: { uuid: topPlayer.userID } }"
      >
        <TeammateProfile :teammateID="topPlayer.userID" class="featured-player" />
        <div class="featured-role">
          <PlayerIcon :icon="currentRole" class="role-card-image" aria-hidden="true" />
          <div class="role-details">
            <span class="role-label">{{ $t('stats.role') }}</span>
            <strong class="role-name">{{ $t(`roles.${currentRole}`) }}</strong>
          </div>
        </div>
        <div class="player-summary">
          <span>{{ $t('stats.winPercentage', { percent: Math.round(topPlayer.winrate) }) }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ $t('stats.gamesPlayed', { count: topPlayer.gamesCount }) }}</span>
        </div>
      </v-card>

      <v-skeleton-loader v-else-if="loading" type="image" class="top-player-skeleton" />

      <v-card v-else class="top-player-card no-data-card">
        <div class="d-flex align-center pa-3">
          <div class="no-data-icon mr-2">🏆</div>
          <div class="no-data-text">
            {{ $t('stats.noTopPlayerData') }}
          </div>
        </div>
      </v-card>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { socket } from '@/api/socket';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import shuffle from 'lodash/shuffle';
import { TRoles } from '@avalon/types';

export default defineComponent({
  name: 'RotatingTopPlayer',
  components: {
    TeammateProfile,
    PlayerIcon,
  },
  props: {
    minPlayers: {
      type: Number,
      default: 5,
    },
    rotationInterval: {
      type: Number,
      default: 10000, // 10 seconds
    },
  },
  setup(props) {
    const topPlayersData = ref<{ role: TRoles; topPlayer: any }[]>([]);
    const currentRole = ref<TRoles | null>(null);
    const remainingRoles = ref<TRoles[]>([]);
    const loading = ref(true);
    const topPlayer = ref<any>(null);
    let rotationTimer: number | null = null;

    const fetchTopPlayersForPopularRoles = () => {
      loading.value = true;

      socket.emit('getTopPlayersForPopularRoles', props.minPlayers, (response) => {
        if ('error' in response) {
          console.error('Error fetching top players for popular roles:', response.error);
          topPlayersData.value = [];
        } else {
          topPlayersData.value = response.filter((item) => item.topPlayer !== null);

          if (topPlayersData.value.length > 0) {
            const roles = topPlayersData.value.map((item) => item.role);

            remainingRoles.value = shuffle([...roles]);
            rotateRole();
          }
        }

        loading.value = false;
      });
    };

    const rotateRole = () => {
      if (topPlayersData.value.length === 0) return;

      if (remainingRoles.value.length === 0) {
        const roles = topPlayersData.value.map((item) => item.role);
        remainingRoles.value = shuffle([...roles]);
      }

      const nextRole = remainingRoles.value.shift();
      if (nextRole) {
        currentRole.value = nextRole;

        const roleData = topPlayersData.value.find((item) => item.role === nextRole);
        topPlayer.value = roleData ? roleData.topPlayer : null;

        loading.value = false;
      }
    };

    const startRotation = () => {
      if (rotationTimer) clearInterval(rotationTimer);

      if (topPlayersData.value.length > 1) {
        rotationTimer = window.setInterval(rotateRole, props.rotationInterval);
      }
    };

    onMounted(() => {
      fetchTopPlayersForPopularRoles();
    });

    watch(currentRole, () => {
      startRotation();
    });

    onBeforeUnmount(() => {
      if (rotationTimer) clearInterval(rotationTimer);
    });

    return {
      currentRole,
      topPlayer,
      loading,
    };
  },
});
</script>

<style scoped lang="scss">
.rotating-top-player {
  margin: 16px 0;
  width: 100%;
}
.top-player-title {
  margin-bottom: 12px;
  font-size: 1.2rem;
  font-weight: 500;
}
.top-player-card {
  display: block;
  padding: 12px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-light));
  transition: background-color 0.2s ease;
}
.top-player-card[href]:hover {
  background: rgb(var(--v-theme-inset-hover));
}
.top-player-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.featured-player {
  display: grid !important;
  grid-template-columns: 52px minmax(0, 1fr);
  column-gap: 12px;
  row-gap: 4px;
  padding: 0;
  margin: 0 !important;
}
.featured-player :deep(.teammate-avatar-container) {
  width: 52px;
  min-width: 52px;
}
.featured-player :deep(.teammate-avatar) {
  width: 52px;
  height: 52px;
}
.featured-player :deep(.teammate-name) {
  align-self: center;
  margin: 0;
  max-width: 100%;
  font-size: 17px;
  line-height: 1.3;
}
.featured-player :deep(.loader) {
  grid-column: 1 / -1;
}
.featured-role {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-text-primary), 0.04);
}
.featured-role .role-card-image {
  flex: 0 0 28px;
  width: 28px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.16);
}
.role-details {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.role-label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-text-primary), 0.6);
}
.role-name {
  font-size: 14px;
  line-height: 1.3;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.player-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.top-player-skeleton,
.no-data-card {
  min-height: 100px;
}
.no-data-card {
  display: flex;
  align-items: center;
}
.no-data-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}
.no-data-text {
  font-size: 13px;
  opacity: 0.7;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .top-player-card {
    transition: none;
  }
}
</style>
