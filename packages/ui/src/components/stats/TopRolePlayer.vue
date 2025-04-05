<template>
  <div class="top-role-player">
    <h3 class="top-player-title">
      {{ $t('stats.topPlayerTitle') }}
      <PreviewLink v-if="displayRole" :target="role" />
    </h3>

    <v-card v-if="topPlayer" class="top-player-card" @click="navigateToPlayerStats">
      <div class="d-flex align-center pa-3">
        <div class="crown-icon mr-2">🏆</div>

        <div class="teammate-profile-container">
          <TeammateProfile :teammateID="topPlayer.userID" />
        </div>

        <v-spacer></v-spacer>

        <div class="stats-container">
          <div class="rating-value">{{ topPlayer.rating }}</div>
          <div class="winrate-container">
            <WinrateDisplay :winrate="topPlayer.winrate.toFixed(2)" />
          </div>
          <div class="games-count">
            {{ $t('stats.gamesPlayed', { count: topPlayer.gamesCount }) }}
          </div>
        </div>
      </div>
    </v-card>

    <v-skeleton-loader v-else-if="loading" type="card" class="top-player-skeleton"></v-skeleton-loader>

    <v-card v-else class="top-player-card no-data-card">
      <div class="d-flex align-center pa-3">
        <div class="no-data-icon mr-2">🏆</div>
        <div class="no-data-text">
          {{ $t('stats.noTopPlayerData') }}
        </div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { TRoles } from '@avalon/types';

export default defineComponent({
  name: 'TopRolePlayer',
  components: {
    TeammateProfile,
    WinrateDisplay,
    PreviewLink,
  },
  props: {
    role: {
      type: String as PropType<TRoles>,
      required: true,
    },
    displayRole: {
      type: Boolean,
    },
  },
  setup(props) {
    const router = useRouter();

    interface TopPlayerData {
      rank: number;
      userID: string;
      winrate: number;
      gamesCount: number;
      rating: number;
    }

    const topPlayer = ref<TopPlayerData | null>(null);
    const loading = ref(true);

    const fetchTopPlayer = () => {
      loading.value = true;

      socket.emit('getRoleLeaderboard', props.role, (response) => {
        if ('error' in response) {
          console.error('Error fetching top player:', response.error);
          topPlayer.value = null;
        } else {
          // Filter players with rating > 0 and get the top one (rank 1)
          const validPlayers = response.filter((player) => player.rating > 0);
          topPlayer.value = validPlayers.length > 0 ? validPlayers[0] : null;
        }

        loading.value = false;
      });
    };

    const navigateToPlayerStats = () => {
      if (topPlayer.value) {
        router.push({ name: 'user_stats', params: { uuid: topPlayer.value.userID } });
      }
    };

    onMounted(() => {
      fetchTopPlayer();
    });

    return {
      topPlayer,
      loading,
      navigateToPlayerStats,
    };
  },
});
</script>

<style scoped lang="scss">
.top-role-player {
  margin: 16px 0;
  max-width: 500px;
}

.top-player-title {
  margin-bottom: 8px;
  font-size: 1.2rem;
  font-weight: 500;
}

.top-player-card {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background-color: rgb(var(--v-theme-surface-light));

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: rgb(var(--v-theme-inset-hover));
  }
}

.crown-icon {
  font-size: 1.5rem;
}

.teammate-profile-container {
  flex-grow: 1;
}

.stats-container {
  text-align: right;
  min-width: 100px;
}

.rating-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--v-primary-base);
}

.winrate-container {
  margin: 4px 0;
}

.games-count {
  font-size: 0.8rem;
  opacity: 0.7;
}

.top-player-skeleton {
  height: 80px;
}

.no-data-card {
  cursor: default;
}

.no-data-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.no-data-text {
  font-style: italic;
  opacity: 0.7;
}
</style>
