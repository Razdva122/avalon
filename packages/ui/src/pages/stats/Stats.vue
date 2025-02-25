<template>
  <div class="">
    <template v-if="state">
      <div class="total-stats">
        <h2>Общая Статистика</h2>
        <table>
          <thead>
            <tr>
              <th>Параметр</th>
              <th>Значение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Всего игр:</td>
              <td>{{ state.total.gamesCount }}</td>
            </tr>
            <tr>
              <td>Побед "good":</td>
              <td>{{ state.total.goodWins }} ({{ state.total.goodWinPercentage }}%)</td>
            </tr>
            <tr>
              <td>Побед "evil":</td>
              <td>{{ state.total.evilWins }} ({{ state.total.evilWinPercentage }}%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <PlayerCountsStats :statsByPlayer="state.byPlayers" />
      </div>

      <div class="player-stats" v-if="state.byPlayers.length > 0">
        <h2>Статистика по Количество Игроков</h2>
        <table>
          <thead>
            <tr>
              <th>Кол-во Игроков</th>
              <th>Всего Игры</th>
              <th>Побед "good"</th>
              <th>Побед "evil"</th>
              <th>% Побед "good"</th>
              <th>% Побед "evil"</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stats, index) in state.byPlayers" :key="index">
              <td>{{ stats.playerCount }}</td>
              <td>{{ stats.gamesCount }}</td>
              <td>{{ stats.goodWins }}</td>
              <td>{{ stats.evilWins }}</td>
              <td>{{ stats.goodWinPercentage }}%</td>
              <td>{{ stats.evilWinPercentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import type { TTotalWinrateStats } from '@avalon/types';
import { socket } from '@/api/socket';
import PlayerCountsStats from '@/components/stats/PlayerCountsStats.vue';

export default defineComponent({
  name: 'Stats',
  components: {
    PlayerCountsStats,
  },
  async setup() {
    const state = ref<TTotalWinrateStats>();

    const initState = async () => {
      const stateFromBackend = await socket.emitWithAck('getTotalStats');

      state.value = stateFromBackend;
    };

    await initState();

    return {
      state,
    };
  },
});
</script>

<style scoped lang="scss">
.statistics-container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.total-stats table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.total-stats table th,
.total-stats table td {
  padding: 10px;
  border: 1px solid #ddd;
}

.total-stats table th {
  text-align: left;
}

.player-stats table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.player-stats table thead th {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center;
}

.player-stats table tbody td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center;
}

.player-stats table tbody tr:hover {
  background-color: #f1f1f1;
}
</style>
