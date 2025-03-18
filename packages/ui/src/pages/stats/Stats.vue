<template>
  <div class="info-page-content stats-page">
    <template v-if="state">
      <div class="total-stats">
        <h1>{{ $t('stats.title') }}</h1>
        <h2>{{ $t('stats.generalStatsTitle') }}</h2>
        <v-data-table :headers="generalTable.headers" :items="generalTable.data" hide-default-footer> </v-data-table>
      </div>
      <div class="d-flex justify-center">
        <PlayerCountsStats class="chart" :statsByPlayer="state.byPlayers" />
      </div>
      <div class="player-stats" v-if="state.byPlayers.length > 0">
        <h2>{{ $t('stats.playerCountStatsTitle') }}</h2>
        <v-data-table :headers="byPlayersTable.headers" :items="byPlayersTable.data" hide-default-footer>
        </v-data-table>
      </div>
      <div v-for="side in <const>['good', 'evil']" :key="side">
        <h2 v-if="side === 'good'"><span class="good-loyalty-icon"></span> {{ $t('stats.goodRolesStatsTitle') }}</h2>
        <h2 v-else><span class="evil-loyalty-icon"></span> {{ $t('stats.evilRolesStatsTitle') }}</h2>

        <v-data-table :headers="rolesTables.headers" :items="rolesTables[side]" hide-default-footer>
          <template v-slot:item.role="{ value }">
            <PreviewLink :target="value" />
          </template>
          <template v-slot:item.winrate="{ value }"> {{ prettifyPercent(value) }} %</template>
          <template v-slot:item.diff="{ value }">
            <v-chip :color="getColorWinrate(value)"> {{ value > 0 ? '+' : '' }}{{ prettifyPercent(value) }} %</v-chip>
          </template>
        </v-data-table>
      </div>
      <div>
        <h2>{{ $t('stats.addonsStatsTitle') }}</h2>
        <v-data-table :headers="addonsTable.headers" :items="addonsTable.data" hide-default-footer>
          <template v-slot:item.addon="{ value }">
            <PreviewLink :target="value" />
          </template>
        </v-data-table>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TTotalWinrateStats, goodRolesImportance, TRoleStats } from '@avalon/types';
import { socket } from '@/api/socket';
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
  async setup() {
    const state = ref<TTotalWinrateStats>();

    const { t } = useI18n();

    const initState = async () => {
      const stateFromBackend = await socket.emitWithAck('getTotalStats');
      state.value = stateFromBackend;
    };

    await initState();

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
        data: state
          .value!.addonsStats.filter((el) => el.gamesCount >= 10)
          .map((el) => ({
            addon: el.addon,
            gamesCount: el.gamesCount,
            goodWins: `${el.goodWins} (${prettifyPercent(el.goodWinPercentage)} %)`,
            evilWins: `${el.evilWins} (${prettifyPercent(el.evilWinPercentage)} %)`,
          }))
          .sort((a, b) => b.gamesCount - a.gamesCount),
      };
    });

    const generalTable = computed(() => {
      const stateData = state.value!;
      return {
        headers: [
          { title: t('stats.totalGames'), key: 'gamesCount' },
          { title: t('stats.goodWins'), key: 'goodWins' },
          { title: t('stats.evilWins'), key: 'evilWins' },
        ],
        data: [
          {
            gamesCount: stateData.total.gamesCount,
            goodWins: `${stateData.total.goodWins} (${prettifyPercent(stateData.total.goodWinPercentage)}%)`,
            evilWins: `${stateData.total.evilWins} (${prettifyPercent(stateData.total.evilWinPercentage)}%)`,
          },
        ],
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
      data: state.value!.byPlayers.map((el) => ({
        playerCount: el.playerCount,
        gamesCount: el.gamesCount,
        goodWins: `${el.goodWins} (${prettifyPercent(el.goodWinPercentage)} %)`,
        evilWins: `${el.evilWins} (${prettifyPercent(el.evilWinPercentage)} %)`,
      })),
    }));

    return {
      state,
      rolesTables,
      byPlayersTable,
      generalTable,
      addonsTable,
      prettifyPercent,
      getColorWinrate,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.chart {
  max-width: 700px;
  height: 400px;
}

.stats-page {
  .good-loyalty-icon,
  .evil-loyalty-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
