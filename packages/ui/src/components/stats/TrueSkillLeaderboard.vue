<template>
  <div class="trueskill-leaderboard">
    <v-data-table :headers="headers" :items="leaderboard" :loading="loading" class="elevation-1" :items-per-page="10">
      <template v-slot:item.rank="{ item }">
        <div class="rank-cell">{{ item.rank }}</div>
      </template>

      <template v-slot:item.userID="{ item }">
        <div :class="{ 'teammate-profile-cell': isMobile }">
          <router-link :to="{ name: 'user_stats', params: { uuid: item.userID } }">
            <TeammateProfile :teammateID="item.userID" />
          </router-link>
        </div>
      </template>

      <template v-slot:item.mu="{ item }">
        <div class="rating-cell">{{ Math.round(item.mu) }}</div>
      </template>

      <template v-slot:item.confidence="{ item }">
        <div class="confidence-cell">
          <ConfidenceDisplay :sigma="item.sigma" />
        </div>
      </template>

      <template v-slot:item.winrate="{ item }">
        <div class="winrate-cell">
          <WinrateDisplay :winrate="calculateWinrate(item)" />
        </div>
      </template>

      <template v-slot:item.gamesCount="{ item }">
        <div class="games-count-cell">{{ item.gamesCount }}</div>
      </template>
    </v-data-table>

    <div v-if="error" class="error-message text-center my-5">
      {{ $t('leaderboard.error') }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import { TrueSkillLeaderboardEntry } from '@avalon/types/api/trueskill-sockets';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import ConfidenceDisplay from '@/components/stats/ConfidenceDisplay.vue';
import { useResponsive } from '@/helpers/composables';

export default defineComponent({
  name: 'TrueSkillLeaderboard',
  components: {
    TeammateProfile,
    WinrateDisplay,
    ConfidenceDisplay,
  },
  setup() {
    const { t } = useI18n();
    const leaderboard = ref<TrueSkillLeaderboardEntry[]>([]);
    const loading = ref(true);
    const error = ref(false);
    const { isMobile } = useResponsive();
    const headers = computed(() => {
      const userIDHeader = {
        title: t('leaderboard.player'),
        value: 'userID',
        ...(isMobile.value && { width: '130px' }),
      };

      const ratingHeader = {
        title: t('leaderboard.rating'),
        value: 'mu',
        width: '100px',
      };

      const winrateHeader = {
        title: t('leaderboard.winRate'),
        value: 'winrate',
        width: '100px',
      };

      const confidenceHeader = {
        title: t('leaderboard.confidence'),
        value: 'confidence',
        width: '180px',
      };

      const gamesCountHeader = {
        title: t('leaderboard.games'),
        value: 'gamesCount',
        width: '100px',
      };

      const baseHeaders = [{ title: '#', value: 'rank', width: '40px' }, userIDHeader, ratingHeader, winrateHeader];

      // Add confidence and gamesCount columns only on desktop
      if (!isMobile.value) {
        baseHeaders.splice(3, 0, confidenceHeader);
        baseHeaders.push(gamesCountHeader);
      }

      return baseHeaders;
    });

    const fetchLeaderboard = () => {
      loading.value = true;
      error.value = false;

      socket.emit('getTrueSkillLeaderboard', (response) => {
        if (response.success && Array.isArray(response.leaderboard)) {
          leaderboard.value = response.leaderboard;
        } else {
          error.value = true;
        }
        loading.value = false;
      });
    };

    const calculateWinrate = (item: TrueSkillLeaderboardEntry): string => {
      if (item.gamesCount === 0) return '0.00';
      const winrate = (item.wins / item.gamesCount) * 100;
      return winrate.toFixed(2);
    };

    onMounted(() => {
      fetchLeaderboard();
    });

    return {
      t,
      leaderboard,
      loading,
      error,
      headers,
      calculateWinrate,
      isMobile,
    };
  },
});
</script>

<style scoped lang="scss">
.trueskill-leaderboard {
  margin-top: 16px;
}

.rank-cell {
  font-weight: bold;
  text-align: center;
}

.rating-cell {
  font-weight: bold;
  color: var(--v-primary-base);
  text-align: center;
}

.winrate-cell {
  text-align: center;
}

.confidence-cell {
  text-align: center;
}

.games-count-cell {
  text-align: center;
}

.error-message {
  color: red;
  font-weight: bold;
}

@media (max-width: 700px) {
  .trueskill-leaderboard {
    overflow-x: auto;
  }

  .teammate-profile-cell {
    width: 130px;
    max-width: 130px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
