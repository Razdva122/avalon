<template>
  <div class="info-page-content">
    <template v-if="state">
      <div class="total-stats">
        <h1>Avalon - статистика игр</h1>
        <h2>Общая Статистика</h2>
        <v-data-table :headers="generalTable.headers" :items="generalTable.data" hide-default-footer> </v-data-table>
      </div>

      <div class="d-flex justify-center">
        <PlayerCountsStats class="chart" :statsByPlayer="state.byPlayers" />
      </div>

      <div class="player-stats" v-if="state.byPlayers.length > 0">
        <h2>Статистика по Количеству Игроков</h2>
        <v-data-table :headers="byPlayersHeaders" :items="state.byPlayers" hide-default-footer>
          <template v-slot:item.goodWinPercentage="{ value }"> {{ pretifyPercent(value) }} % </template>
          <template v-slot:item.evilWinPercentage="{ value }"> {{ pretifyPercent(value) }} % </template>
        </v-data-table>
      </div>

      <template v-for="side in <const>['good', 'evil']">
        <div>
          <h2 v-if="side === 'evil'">Статистика по ролям Сил Света</h2>
          <h2 v-else>Статистика по ролям Сил Тьмы</h2>
          <v-data-table :headers="rolesTables.headers" :items="rolesTables[side]" hide-default-footer>
            <template v-slot:item.role="{ value }">
              <PreviewLink :target="value" />
            </template>
            <template v-slot:item.diff="{ value }">
              <v-chip :color="getColorWinrate(value)"> {{ value > 0 ? '+' : '' }}{{ pretifyPercent(value) }} % </v-chip>
            </template>
          </v-data-table>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { TTotalWinrateStats, goodRolesImportance, TRoleStats } from '@avalon/types';
import { socket } from '@/api/socket';
import PlayerCountsStats from '@/components/stats/PlayerCountsStats.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';

type TRolesStatsWithDiff = TRoleStats & { diff: number };

export default defineComponent({
  name: 'Stats',
  components: {
    PlayerCountsStats,
    PreviewLink,
  },
  async setup() {
    const state = ref<TTotalWinrateStats>();

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
          if (el.gamesCount > 10) {
            if (el.role in goodRolesImportance) {
              acc.good.push({ ...el, diff: el.goodWinPercentage - state.value!.total.goodWinPercentage });
            } else {
              acc.evil.push({ ...el, diff: el.evilWinPercentage - state.value!.total.evilWinPercentage });
            }
          }

          return acc;
        },
        {
          headers: [
            { title: 'Роль', key: 'role' },
            { title: 'Кол-во игр', key: 'gamesCount' },
            { title: 'Влияние на победу', key: 'diff' },
          ],
          good: [],
          evil: [],
        },
      );

      sideStats.evil.sort((a, b) => b.gamesCount - a.gamesCount);
      sideStats.good.sort((a, b) => b.gamesCount - a.gamesCount);

      return sideStats;
    });

    const generalTable = computed(() => {
      const stateData = state.value!;
      return {
        headers: [
          { title: 'Всего игр', key: 'gamesCount' },
          { title: 'Побед Сил Света', key: 'goodWins' },
          { title: 'Побед Сил Тьмы', key: 'evilWins' },
        ],
        data: [
          {
            gamesCount: stateData.total.gamesCount,
            goodWins: `${stateData.total.goodWins} (${pretifyPercent(stateData.total.goodWinPercentage)}%)`,
            evilWins: `${stateData.total.evilWins} (${pretifyPercent(stateData.total.evilWinPercentage)}%)`,
          },
        ],
      };
    });

    const pretifyPercent = (percent: number) => percent.toFixed(2);

    const getColorWinrate = (winrate: number) => {
      if (winrate === 0) {
        return 'orange';
      }

      if (winrate > 0) {
        return 'green';
      }

      return 'red';
    };

    const byPlayersHeaders = [
      { title: 'Кол-во Игроков', key: 'playerCount' },
      { title: 'Всего Игр', key: 'gamesCount' },
      { title: 'Побед Сил Света', key: 'goodWins' },
      { title: 'Побед Сил Тьмы', key: 'evilWins' },
      { title: '% Побед Сил Света', key: 'goodWinPercentage' },
      { title: '% Побед Сил Тьмы', key: 'evilWinPercentage' },
    ];

    return {
      state,
      rolesTables,
      byPlayersHeaders,
      generalTable,
      pretifyPercent,
      getColorWinrate,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.chart {
  max-width: 700px;
  max-height: 350px;
}
</style>
