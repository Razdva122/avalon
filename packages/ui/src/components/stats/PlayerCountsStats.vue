<template>
  <Bar id="my-chart-id" :options="chartOptions" :data="chartData" />
</template>

<script lang="ts">
import { Bar, ChartProps } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { defineComponent, PropType } from 'vue';
import { useTheme } from 'vuetify';
import type { TTotalWinrateStats } from '@avalon/types';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  LineElement,
);

export default defineComponent({
  name: 'BarChart',
  components: { Bar },
  props: {
    statsByPlayer: {
      required: true,
      type: Object as PropType<TTotalWinrateStats['byPlayers']>,
    },
  },
  data() {
    const theme = useTheme();

    const settings: { chartData: ChartProps<'bar'>['data']; chartOptions: ChartProps<'bar'>['options'] } = {
      chartData: {
        labels: this.statsByPlayer.map((el) => `${el.playerCount} players`),
        datasets: [
          {
            type: 'bar',
            label: 'Evil winrate',
            data: this.statsByPlayer.map((el) => el.evilWinPercentage),
            backgroundColor: theme.current.value.colors.error,
          },
          {
            type: 'bar',
            label: 'Good winrate',
            data: this.statsByPlayer.map((el) => el.goodWinPercentage),
            backgroundColor: theme.current.value.colors.info,
          },
        ],
      },
      chartOptions: {
        plugins: {
          title: {
            display: true,
            text: 'Winrates by team size',
          },
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                yMin: 50,
                yMax: 50,
                borderColor: theme.current.value.colors.warning,
                borderDash: [25],
                borderWidth: 2,
                label: {
                  backgroundColor: theme.current.value.colors.warning,
                  content: '50% winrate',
                  display: true,
                },
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: {
              stepSize: 10,
            },
          },
        },
      },
    };

    return settings;
  },
});
</script>
