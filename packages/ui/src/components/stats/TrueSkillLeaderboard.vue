<template>
  <div class="trueskill-leaderboard">
    <v-data-table
      :headers="headers"
      :items="leaderboard"
      :loading="loading"
      class="leaderboard-table"
      :items-per-page="10"
      :mobile="false"
      :hide-default-header="isMobile"
      disable-sort
    >
      <template #item="{ item }">
        <tr class="leaderboard-row">
          <td class="leaderboard-rank">
            <div class="rank-cell">{{ item.rank }}</div>
          </td>
          <td class="leaderboard-player">
            <router-link :to="{ name: 'user_stats', params: { uuid: item.userID } }">
              <TeammateProfile :teammateID="item.userID" />
            </router-link>
          </td>
          <td class="leaderboard-rating">
            <span v-if="isMobile" class="mobile-metric-label">{{ $t('leaderboard.rating') }}</span>
            <div class="rating-cell">{{ Math.round(item.mu) }}</div>
          </td>
          <td v-if="!isMobile"><ConfidenceDisplay :sigma="item.sigma" /></td>
          <td class="leaderboard-winrate">
            <span v-if="isMobile" class="mobile-metric-label">{{ $t('leaderboard.winRate') }}</span>
            <div class="winrate-cell"><WinrateDisplay :winrate="calculateWinrate(item)" /></div>
          </td>
          <td v-if="!isMobile">
            <div class="games-count-cell">{{ item.gamesCount }}</div>
          </td>
        </tr>
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
    const { isMobile } = useResponsive(960);
    const headers = computed(() => {
      const userIDHeader = {
        title: t('leaderboard.player'),
        value: 'userID',
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
  color: rgb(var(--v-theme-primary));
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
</style>
