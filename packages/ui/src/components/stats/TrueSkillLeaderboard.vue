<template>
  <div class="trueskill-leaderboard">
    <v-data-table :headers="headers" :items="leaderboard" :loading="loading" class="elevation-1" :items-per-page="10">
      <template v-slot:item.rank="{ item }">
        <div class="rank-cell">{{ item.rank }}</div>
      </template>

      <template v-slot:item.userID="{ item }">
        <router-link :to="{ name: 'user_stats', params: { uuid: item.userID } }">
          <TeammateProfile :teammateID="item.userID" />
        </router-link>
      </template>

      <template v-slot:item.mu="{ item }">
        {{ item.mu.toFixed(2) }}
      </template>

      <template v-slot:item.confidence="{ item }">
        <ConfidenceDisplay :sigma="item.sigma" />
      </template>

      <template v-slot:item.winrate="{ item }">
        <WinrateDisplay :winrate="calculateWinrate(item)" />
      </template>

      <template v-slot:item.gamesCount="{ item }">
        {{ item.gamesCount }}
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

    const headers = computed(() => [
      { title: '#', value: 'rank' },
      { title: t('leaderboard.player'), value: 'userID' },
      { title: t('leaderboard.rating'), value: 'mu' },
      { title: t('leaderboard.confidence'), value: 'confidence' },
      { title: t('leaderboard.winRate'), value: 'winrate' },
      { title: t('leaderboard.games'), value: 'gamesCount' },
    ]);

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
}

.error-message {
  color: red;
  font-weight: bold;
}
</style>
