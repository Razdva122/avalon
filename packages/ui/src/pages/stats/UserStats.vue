<template>
  <div class="info-page-content stats-page">
    <h1>{{ $t('userStats.userStatsTitle') }}</h1>
    <UserProfileHeader :uuid="$props.uuid" :gameStats="state" />
    <div v-if="loading" class="py-8 text-center" role="status" aria-live="polite">
      <v-progress-circular indeterminate color="primary" class="mr-3" />
      {{ $t('mainPage.loading') }}
    </div>
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="my-4">
      {{ $t('userStats.loadError') }}
      <v-btn variant="text" @click="retry">{{ $t('userStats.retry') }}</v-btn>
    </v-alert>
    <template v-else>
      <h2>{{ $t('stats.generalStatsTitle') }}</h2>
      <v-data-table
        class="general-table"
        :headers="generalTable.headers"
        :items="generalTable.data"
        hide-default-footer
        disable-sort
      >
        <template v-slot:item.side="{ value }">
          <span v-if="value === 'good'" class="good-loyalty-icon"></span>
          <span v-if="value === 'evil'" class="evil-loyalty-icon"></span>
          {{ $t('userStats.side' + value) }}
        </template>
      </v-data-table>

      <h2>{{ $t('userStats.lastGamesStatsTitle') }}</h2>
      <v-data-table :headers="lastGamesHeaders" :items="lastGames" hide-default-footer disable-sort>
        <template v-slot:item="{ item }">
          <tr class="game-row" @click="navigateToGame(item.gameID)">
            <td>
              <PreviewLink :target="item.role" />
            </td>
            <td>
              <v-chip v-if="item.isWin" color="green"> {{ $t('userStats.winResult') }}</v-chip>
              <v-chip v-else color="red"> {{ $t('userStats.loseResult') }}</v-chip>
            </td>
            <td>
              <v-chip v-if="item.ratingChange?.change > 0" color="success" variant="flat" size="small">{{
                item.ratingChange.string
              }}</v-chip>
              <v-chip v-else-if="item.ratingChange?.change < 0" color="error" variant="flat" size="small">{{
                item.ratingChange.string
              }}</v-chip>
              <span v-else>—</span>
            </td>
            <td v-if="!isMobile">
              {{ item.gameID }}
            </td>
          </tr>
        </template>
      </v-data-table>

      <UserRatings :userID="uuid" />

      <div class="stats-container d-flex flex-column flex-md-row justify-space-between">
        <div class="teammates-container">
          <h2>{{ $t('userStats.teammatesStatsTitle') }}</h2>
          <v-data-table
            class="teammates-table"
            :headers="simplifiedHeaders"
            :items="teammates"
            hide-default-footer
            disable-sort
          >
            <template v-slot:item="{ item }">
              <tr class="teammate-row" @click="navigateToPlayerStats(item.id)">
                <td>
                  <TeammateProfile :teammateID="item.id" />
                </td>
                <td>{{ item.gamesCount }}</td>
                <td>
                  <WinrateDisplay :winrate="item.winrate" />
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>

        <div class="enemies-container">
          <h2>{{ $t('userStats.enemiesStatsTitle') }}</h2>
          <v-data-table
            class="enemies-table"
            :headers="simplifiedHeaders"
            :items="enemies"
            hide-default-footer
            disable-sort
          >
            <template v-slot:item="{ item }">
              <tr class="enemy-row" @click="navigateToPlayerStats(item.id)">
                <td>
                  <TeammateProfile :teammateID="item.id" />
                </td>
                <td>{{ item.gamesCount }}</td>
                <td>
                  <WinrateDisplay :winrate="item.winrate" />
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useResponsive } from '@/helpers/composables';
import {
  TGameView,
  TUserStats,
  TTeammateStats,
  prepareUserStats,
  prepareGamesForView,
  preparePlayerStats,
} from '@/helpers/stats';

import { socket } from '@/api/socket';
import type { PlayerGameSummary, GameTrueSkillResult } from '@avalon/types';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import UserRatings from '@/components/stats/UserRatings.vue';
import Avatar from '@/components/user/Avatar.vue';
import UserProfileHeader from '@/components/stats/UserProfileHeader.vue';

export default defineComponent({
  name: 'UserStats',
  components: {
    PreviewLink,
    Avatar,
    TeammateProfile,
    WinrateDisplay,
    UserRatings,
    UserProfileHeader,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const state = ref<TUserStats>();
    const lastGames = ref<(TGameView & { ratingChange?: { string: string; change: number } })[]>();
    const teammates = ref<TTeammateStats[]>();
    const enemies = ref<TTeammateStats[]>();
    const { t } = useI18n();
    const { isMobile } = useResponsive();

    const loading = ref(true);
    const loadError = ref(false);
    let requestId = 0;
    onUnmounted(() => {
      requestId++;
    });

    const initState = async (uuid: string) => {
      const currentRequest = ++requestId;
      loading.value = true;
      loadError.value = false;
      state.value = undefined;
      lastGames.value = [];
      teammates.value = [];
      enemies.value = [];
      try {
        const games: PlayerGameSummary[] | null = await socket
          .timeout(20000)
          .emitWithAck('getPlayerGameSummaries', uuid);
        if (currentRequest !== requestId) return;
        if (!games) throw new Error('Player statistics unavailable');
        state.value = prepareUserStats(games, uuid);
        lastGames.value = prepareGamesForView(games, uuid, 5);
        teammates.value = preparePlayerStats(games, uuid, 'teammate');
        enemies.value = preparePlayerStats(games, uuid, 'enemy');
        loading.value = false;

        // Ratings are optional: show the statistics before these requests finish.
        void Promise.all(
          lastGames.value.map(async (game) => {
            try {
              const result: { gameResult?: GameTrueSkillResult } = await socket
                .timeout(10000)
                .emitWithAck('getMatchTrueSkillChanges', game.gameID);
              if (currentRequest !== requestId) return;
              const change = result.gameResult?.playerChanges.find((player) => player.userID === uuid);
              if (!change) return;
              const row = lastGames.value?.find((row) => row.gameID === game.gameID);
              if (row)
                row.ratingChange = {
                  string: `${Math.round(change.newMu)} (${change.muChange > 0 ? '+' : ''}${Math.round(change.muChange)})`,
                  change: change.muChange,
                };
            } catch {
              // Keep the game visible when its rating history is unavailable.
            }
          }),
        );
      } catch {
        if (currentRequest === requestId) loadError.value = true;
      } finally {
        if (currentRequest === requestId) loading.value = false;
      }
    };

    watch(
      () => props.uuid,
      (uuid) => {
        void initState(uuid);
      },
      { immediate: true },
    );
    const retry = () => {
      void initState(props.uuid);
    };

    const router = useRouter();

    const navigateToPlayerStats = (playerID: string) => {
      router.push({ name: 'user_stats', params: { uuid: playerID } });
    };

    const navigateToGame = (gameID: string) => {
      router.push({ name: 'room', params: { uuid: gameID } });
    };

    const generalTable = computed(() => {
      const stateData = state.value || prepareUserStats([], props.uuid);
      return {
        headers: [
          { title: t('userStats.side'), key: 'side' },
          { title: t('userStats.gamesCount'), key: 'gamesCount' },
          { title: t('userStats.wins'), key: 'wins' },
        ],
        data: Object.entries(stateData.teams)
          .filter(([name]) => name !== 'total')
          .map(([name, value]) => {
            return {
              side: name,
              gamesCount: value.total,
              wins: `${value.wins} (${value.winrate} %)`,
            };
          }),
      };
    });

    const lastGamesHeaders = computed(() => {
      const baseHeaders = [
        { title: t('userStats.role'), key: 'role' },
        { title: t('userStats.result'), key: 'isWin' },
        { title: t('userStats.rating'), key: 'ratingChange' },
      ];

      if (!isMobile.value) {
        baseHeaders.push({ title: t('userStats.game'), key: 'gameID' });
      }

      return baseHeaders;
    });

    const teammatesHeaders = computed(() => {
      return [
        { title: t('userStats.playerName'), key: 'id' },
        { title: t('userStats.gamesCount'), key: 'gamesCount' },
        { title: t('userStats.wins'), key: 'wins' },
        { title: t('userStats.lose'), key: 'lose' },
        { title: t('userStats.winrate'), key: 'winrate' },
      ];
    });

    const simplifiedHeaders = computed(() => {
      return [
        { title: t('userStats.playerName'), key: 'id' },
        { title: t('userStats.gamesCount'), key: 'gamesCount' },
        { title: t('userStats.winrate'), key: 'winrate' },
      ];
    });

    return {
      state,
      loading,
      loadError,
      retry,
      lastGames,
      lastGamesHeaders,
      generalTable,
      navigateToPlayerStats,
      navigateToGame,
      enemies,
      teammates,
      teammatesHeaders,
      simplifiedHeaders,
      isMobile,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.stats-page {
  .good-loyalty-icon,
  .evil-loyalty-icon {
    width: 36px;
    height: 36px;
  }
}

.general-table {
  .good-loyalty-icon,
  .evil-loyalty-icon {
    width: 24px;
    height: 24px;
  }
}

.stats-container {
  gap: 20px;

  @media (max-width: 600px) {
    gap: 30px;
  }
}

.teammates-container,
.enemies-container {
  width: 100%;
}

@media (min-width: 960px) {
  .teammates-container,
  .enemies-container {
    width: 48%;
  }
}

.teammates-table,
.enemies-table {
  margin-bottom: 20px;
}

.teammate-row,
.enemy-row,
.game-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.teammate-row:hover,
.enemy-row:hover,
.game-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.teammates-table :deep(td),
.enemies-table :deep(td) {
  height: 70px;
  padding: 8px 16px;

  @media (max-width: 600px) {
    height: 60px;
    padding: 6px 8px;
  }
}

.teammates-table :deep(td:first-child),
.enemies-table :deep(td:first-child) {
  width: 250px;
  min-width: 250px;

  @media (max-width: 600px) {
    width: 140px;
    min-width: 140px;
  }
}

.teammates-table :deep(td:nth-child(2)),
.enemies-table :deep(td:nth-child(2)) {
  width: 100px;

  @media (max-width: 600px) {
    width: 30px;
    font-size: 14px;
  }
}

.teammates-table :deep(td:nth-child(3)),
.enemies-table :deep(td:nth-child(3)) {
  width: 100px;

  @media (max-width: 600px) {
    width: 80px;
    font-size: 14px;
    text-align: center;
  }
}

.gameID {
  cursor: pointer;
}
</style>
