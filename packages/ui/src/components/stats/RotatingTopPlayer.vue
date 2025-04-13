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
        @click="navigateToPlayerStats"
      >
        <div class="d-flex flex-column pa-3">
          <div class="role-header d-flex align-center mb-3">
            <div class="d-flex align-center">
              <PlayerIcon :icon="currentRole" class="role-icon mr-2" />
              <div class="role-name">
                {{ $t(`roles.${currentRole}`) }}
              </div>
            </div>

            <v-spacer></v-spacer>

            <div class="rating-value">{{ topPlayer.rating }}</div>
          </div>

          <div class="d-flex align-center">
            <div class="crown-icon mr-2">🏆</div>

            <div class="teammate-profile-container">
              <TeammateProfile :teammateID="topPlayer.userID" />
            </div>

            <v-spacer></v-spacer>

            <div class="stats-container">
              <div class="winrate-container">
                <WinrateDisplay :winrate="topPlayer.winrate.toFixed(2)" />
              </div>
              <div class="games-count">
                {{ $t('stats.gamesPlayed', { count: topPlayer.gamesCount }) }}
              </div>
            </div>
          </div>
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
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import { shuffle } from 'lodash';
import { TRoles } from '@avalon/types';

export default defineComponent({
  name: 'RotatingTopPlayer',
  components: {
    TeammateProfile,
    WinrateDisplay,
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
    const router = useRouter();
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

    const navigateToPlayerStats = () => {
      if (topPlayer.value) {
        router.push({ name: 'user_stats', params: { uuid: topPlayer.value.userID } });
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
      navigateToPlayerStats,
    };
  },
});
</script>

<style scoped lang="scss">
.rotating-top-player {
  margin: 16px 0;
  width: 100%;
  max-width: 100%;
}

.top-player-title {
  margin-bottom: 8px;
  font-size: 1.2rem;
  font-weight: 500;
}

.top-player-card {
  cursor: pointer;
  border-radius: 12px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background-color: rgb(var(--v-theme-surface-light));
  width: 100%;
  max-width: 100%;
  height: 160px; /* Increased height to fit all content */

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: rgb(var(--v-theme-inset-hover));
  }
}

.crown-icon {
  font-size: 1.5rem;
}

.role-header {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  padding-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.role-icon {
  width: 40px;
  height: 40px;
}

.role-name {
  font-weight: bold;
  color: var(--v-primary-base);
  font-size: 1.2rem;
}

.teammate-profile-container {
  flex-grow: 1;
  min-width: 0; /* Allow container to shrink below min-content */
  max-width: 100%; /* Prevent overflow */
  overflow: hidden; /* Hide overflow text */
}

/* Add text truncation to the teammate profile */
:deep(.teammate-name) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* Make it responsive */
}

.stats-container {
  text-align: right;
  min-width: 100px; /* Slightly reduced min-width for better responsiveness */
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 80px; /* Fixed height to ensure all content is visible */
  margin-left: 8px; /* Add some spacing from the username */
}

.rating-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--v-primary-base);
}

.winrate-container {
  margin: 4px 0;
  transform: scale(1.2); /* Make the winrate chip slightly larger */
  transform-origin: right center;
}

.games-count {
  font-size: 1rem; /* Increased font size */
  opacity: 0.8; /* Slightly more visible */
  font-weight: 500;
}

.top-player-skeleton {
  height: 160px; /* Match the card height */
  width: 100%;
  max-width: 100%;
}

:deep(.v-skeleton-loader__image) {
  margin: 0px;
  border-radius: 8px;
  height: 160px !important; /* Match the card height */
  min-height: 160px !important;
  width: 100%;
  max-width: 100%;
}

.no-data-card {
  cursor: default;
  height: 160px; /* Match the card height */
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.no-data-text {
  font-style: italic;
  opacity: 0.7;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
