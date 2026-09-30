<template>
  <div class="stats-page">
    <h1>{{ $t('stats.title') }}</h1>
    <p v-if="error" role="alert" class="stats-state">{{ $t('errors.' + error) }}</p>
    <v-btn v-if="error" @click="initState">{{ $t('mainPage.retryAi') }}</v-btn>
    <p v-if="!state && !error" role="status" class="stats-state">{{ $t('mainPage.loading') }}</p>
    <template v-if="state">
      <section class="stats-section total-stats" aria-labelledby="general-stats-title">
        <h2 id="general-stats-title">{{ $t('stats.generalStatsTitle') }}</h2>
        <dl class="stats-summary">
          <div class="summary-item summary-total">
            <dt>{{ $t('stats.totalGames') }}</dt>
            <dd>{{ formatCount(state.total.gamesCount) }}</dd>
          </div>
          <div class="summary-item">
            <dt>{{ $t('stats.goodWins') }}</dt>
            <dd>{{ formatCount(state.total.goodWins) }}</dd>
            <dd class="summary-percent">{{ prettifyPercent(state.total.goodWinPercentage) }} %</dd>
          </div>
          <div class="summary-item">
            <dt>{{ $t('stats.evilWins') }}</dt>
            <dd>{{ formatCount(state.total.evilWins) }}</dd>
            <dd class="summary-percent">{{ prettifyPercent(state.total.evilWinPercentage) }} %</dd>
          </div>
        </dl>
      </section>
      <section v-if="state.byPlayers.length" class="stats-section" aria-labelledby="player-stats-title">
        <h2 id="player-stats-title">{{ $t('stats.playerCountStatsTitle') }}</h2>
        <div class="chart-panel">
          <PlayerCountsStats class="chart" :statsByPlayer="state.byPlayers" />
        </div>
        <v-data-table
          class="stats-table"
          :headers="byPlayersTable.headers"
          :items="byPlayersTable.data"
          :mobile="null"
          :mobile-breakpoint="600"
          :items-per-page="-1"
          hide-default-footer
          disable-sort
          :hide-default-header="isMobile"
        >
          <template #item.gamesCount="{ value }"
            ><span class="stat-number">{{ formatCount(value) }}</span></template
          >
          <template #item.goodWins="{ item }">
            <span class="stat-number">{{ formatCount(item.goodWins) }}</span>
            <span class="stat-percent">{{ prettifyPercent(item.goodWinPercentage) }} %</span>
          </template>
          <template #item.evilWins="{ item }">
            <span class="stat-number">{{ formatCount(item.evilWins) }}</span>
            <span class="stat-percent">{{ prettifyPercent(item.evilWinPercentage) }} %</span>
          </template>
        </v-data-table>
      </section>
      <section
        v-for="side in <const>['good', 'evil']"
        :key="side"
        class="stats-section"
        :aria-labelledby="`${side}-stats-title`"
      >
        <h2 :id="`${side}-stats-title`" class="side-title">
          <span :class="`${side}-loyalty-icon`" aria-hidden="true"></span>
          <span>{{ $t(side === 'good' ? 'stats.goodRolesStatsTitle' : 'stats.evilRolesStatsTitle') }}</span>
        </h2>
        <v-data-table
          class="stats-table entity-stats-table"
          :headers="rolesTables.headers"
          :items="rolesTables[side]"
          :mobile="null"
          :mobile-breakpoint="600"
          :items-per-page="-1"
          hide-default-footer
          disable-sort
          :hide-default-header="isMobile"
        >
          <template #item.role="{ value }"><PreviewLink :target="value" /></template>
          <template #item.gamesCount="{ value }"
            ><span class="stat-number">{{ formatCount(value) }}</span></template
          >
          <template #item.winrate="{ value }"
            ><span class="stat-number">{{ prettifyPercent(value) }} %</span></template
          >
          <template #item.diff="{ value }">
            <v-chip :color="getColorWinrate(value)" size="small"
              >{{ value > 0 ? '+' : '' }}{{ prettifyPercent(value) }} %</v-chip
            >
          </template>
        </v-data-table>
      </section>
      <section class="stats-section" aria-labelledby="addons-stats-title">
        <h2 id="addons-stats-title">{{ $t('stats.addonsStatsTitle') }}</h2>
        <v-data-table
          class="stats-table entity-stats-table"
          :headers="addonsTable.headers"
          :items="addonsTable.data"
          :mobile="null"
          :mobile-breakpoint="600"
          :items-per-page="-1"
          hide-default-footer
          disable-sort
          :hide-default-header="isMobile"
        >
          <template #item.addon="{ value }"><PreviewLink :target="value" /></template>
          <template #item.gamesCount="{ value }"
            ><span class="stat-number">{{ formatCount(value) }}</span></template
          >
          <template #item.goodWins="{ item }">
            <span class="stat-number">{{ formatCount(item.goodWins) }}</span>
            <span class="stat-percent">{{ prettifyPercent(item.goodWinPercentage) }} %</span>
          </template>
          <template #item.evilWins="{ item }">
            <span class="stat-number">{{ formatCount(item.evilWins) }}</span>
            <span class="stat-percent">{{ prettifyPercent(item.evilWinPercentage) }} %</span>
          </template>
        </v-data-table>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TTotalWinrateStats, TRoleStats } from '@avalon/types';
import { goodRolesImportance } from '@avalon/types/consts';
import { socket } from '@/api/socket';
import { isSocketError } from '@/helpers/socket-errors';
import { useResponsive } from '@/helpers/composables/useResponsive';
import { prettifyPercent } from '@/helpers/stats';
import PlayerCountsStats from '@/components/stats/PlayerCountsStats.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';

type TRolesStatsWithDiff = TRoleStats & { diff: number; winrate: number };

export default defineComponent({
  name: 'Stats',
  components: {
    PlayerCountsStats,
    PreviewLink,
  },
  setup() {
    const state = ref<TTotalWinrateStats>();
    const error = ref('');
    const { isMobile } = useResponsive(600);

    const { t, locale } = useI18n();
    const formatCount = (count: number) => new Intl.NumberFormat(locale.value.replace('_', '-')).format(count);

    const initState = async () => {
      error.value = '';
      try {
        const result = await socket.timeout(10000).emitWithAck('getTotalStats');
        if (isSocketError(result)) {
          error.value = result.error;
          return;
        }
        state.value = result;
      } catch {
        error.value = 'requestFailed';
      }
    };

    void initState();

    const rolesTables = computed(() => {
      const sideStats = state.value!.roleStats.reduce<{
        headers: { title: string; key: string }[];
        good: TRolesStatsWithDiff[];
        evil: TRolesStatsWithDiff[];
      }>(
        (acc, el) => {
          if (el.gamesCount >= 10) {
            if (el.role in goodRolesImportance) {
              acc.good.push({
                ...el,
                diff: el.goodWinPercentage - state.value!.total.goodWinPercentage,
                winrate: el.goodWinPercentage,
              });
            } else {
              acc.evil.push({
                ...el,
                diff: el.evilWinPercentage - state.value!.total.evilWinPercentage,
                winrate: el.evilWinPercentage,
              });
            }
          }
          return acc;
        },
        {
          headers: [
            { title: t('stats.role'), key: 'role' },
            { title: t('stats.gamesCount'), key: 'gamesCount' },
            { title: t('stats.winrate'), key: 'winrate' },
            { title: t('stats.winrateImpact'), key: 'diff' },
          ],
          good: [],
          evil: [],
        },
      );
      sideStats.evil.sort((a, b) => b.gamesCount - a.gamesCount);
      sideStats.good.sort((a, b) => b.gamesCount - a.gamesCount);
      return sideStats;
    });

    const addonsTable = computed(() => {
      return {
        headers: [
          { title: t('stats.addon'), key: 'addon' },
          { title: t('stats.totalGames'), key: 'gamesCount' },
          { title: t('stats.goodWins'), key: 'goodWins' },
          { title: t('stats.evilWins'), key: 'evilWins' },
        ],
        data: state.value!.addonsStats.filter((el) => el.gamesCount >= 10).sort((a, b) => b.gamesCount - a.gamesCount),
      };
    });

    const getColorWinrate = (winrate: number) => {
      if (winrate === 0) {
        return 'orange';
      }
      if (winrate > 0) {
        return 'green';
      }
      return 'red';
    };

    const byPlayersTable = computed(() => ({
      headers: [
        { title: t('stats.playerCount'), key: 'playerCount' },
        { title: t('stats.totalGames'), key: 'gamesCount' },
        { title: t('stats.goodWins'), key: 'goodWins' },
        { title: t('stats.evilWins'), key: 'evilWins' },
      ],
      data: state.value!.byPlayers,
    }));

    return {
      state,
      isMobile,
      error,
      initState,
      rolesTables,
      byPlayersTable,
      formatCount,
      addonsTable,
      prettifyPercent,
      getColorWinrate,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/loyalty-icons.scss';

.stats-page {
  width: 100%;
  max-width: 1180px;
  min-width: 0;
  margin-inline: auto;
  padding: 82px 28px 64px;
  color: rgb(var(--v-theme-text-primary));
  line-height: 1.5;

  h1 {
    margin-bottom: 28px;
    font-size: clamp(28px, 3.2vw, 40px);
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  h2 {
    margin-bottom: 16px;
    font-size: clamp(20px, 2.3vw, 27px);
    line-height: 1.35;
  }
}

.stats-section + .stats-section {
  margin-top: 36px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 14px;
  background: rgba(var(--v-theme-text-primary), 0.12);
}

.summary-item {
  padding: 20px;
  background: rgb(var(--v-theme-surface));

  dt {
    margin-bottom: 8px;
    font-size: 14px;
  }

  dd {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.3;
  }

  .summary-percent {
    margin-top: 4px;
    font-size: 14px;
    font-weight: 400;
    opacity: 0.75;
  }
}

.chart-panel {
  width: 100%;
  max-width: 760px;
  margin: 0 auto 24px;
}

.chart {
  width: 100%;
  height: clamp(280px, 55vw, 380px);
}

.side-title {
  display: flex;
  align-items: center;
  gap: 10px;

  .good-loyalty-icon,
  .evil-loyalty-icon {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
  }
}

.stats-table {
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 12px;
  overflow: hidden;
  font-variant-numeric: tabular-nums;

  :deep(th) {
    background: rgba(var(--v-theme-text-primary), 0.04);
    font-size: 13px;
    line-height: 1.4;
  }

  :deep(td) {
    padding-block: 10px;
  }

  :deep(.preview-link) {
    min-height: 44px;
    align-items: center;
    line-height: 1.4;
  }

  :deep(.icon-in-link) {
    flex-shrink: 0;
  }
}

.stat-number {
  white-space: nowrap;
}

.stat-percent {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.75;
  white-space: nowrap;
}

.stats-state {
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  background: rgb(var(--v-theme-surface));
}

@media (max-width: 700px) {
  .stats-page {
    padding: 72px 16px 40px;
  }
}

@media (max-width: 599px) {
  .stats-page h1 {
    margin-bottom: 24px;
  }

  .stats-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item {
    padding: 16px;
  }

  .summary-total {
    grid-column: 1 / -1;
  }

  .stats-section + .stats-section {
    margin-top: 28px;
  }

  // Outrank App.vue's global table surface, including its !important background.
  .stats-page .stats-table {
    background: transparent !important;
    border: 0;
    border-radius: 0;
    overflow: visible;

    :deep(.v-table__wrapper) {
      overflow: visible;
    }

    :deep(table),
    :deep(tbody) {
      display: block;
    }

    :deep(.v-data-table__tr--mobile) {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px 8px;
      margin-bottom: 12px;
      padding: 12px;
      border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
      border-radius: 12px;
      background: rgb(var(--v-theme-surface));
    }

    :deep(.v-data-table__tr--mobile > td) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 6px;
      height: auto;
      min-height: 0;
      padding: 0;
      border: 0 !important;
      font-size: 14px;
    }

    :deep(.v-data-table__tr--mobile > td:first-child) {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.1) !important;
      font-weight: 600;
    }

    :deep(.v-data-table__td-title) {
      font-size: 12px;
      font-weight: 400;
      line-height: 1.35;
    }

    :deep(.v-data-table__tr--mobile > td:not(:first-child) .v-data-table__td-title) {
      min-height: 2.7em;
    }

    :deep(.v-data-table__td-value) {
      text-align: left;
      line-height: 1.4;
    }

    :deep(.v-chip) {
      padding-inline: 7px;
      font-size: 12px;
    }
  }

  .entity-stats-table :deep(.v-data-table__tr--mobile > td:first-child .v-data-table__td-title) {
    display: none;
  }
}
</style>
