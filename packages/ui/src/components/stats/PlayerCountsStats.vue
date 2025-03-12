<template>
  <Bar id="my-chart-id" :options="settings.chartOptions" :data="settings.chartData" />
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
import { computed, defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
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
  setup(props) {
    const theme = useTheme();
    const { t } = useI18n();

    const settings = computed(
      () =>
        <{ chartData: ChartProps<'bar'>['data']; chartOptions: ChartProps<'bar'>['options'] }>{
          chartData: {
            labels: props.statsByPlayer.map((el) => t('chartStats.countPlayer', { playerCount: el.playerCount })),
            datasets: [
              {
                type: 'bar',
                label: t('chartStats.evilWinrate'),
                data: props.statsByPlayer.map((el) => el.evilWinPercentage),
                backgroundColor: theme.current.value.colors.error,
              },
              {
                type: 'bar',
                label: t('chartStats.goodWinrate'),
                data: props.statsByPlayer.map((el) => el.goodWinPercentage),
                backgroundColor: theme.current.value.colors.info,
              },
            ],
          },
          chartOptions: {
            plugins: {
              title: {
                display: true,
                text: t('chartStats.winrateByTeamSize'),
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
                      backgroundColor: 'rgba(251, 140, 0, 0.75)',
                      content: t('chartStats.halfWinrate'),
                      display: true,
                    },
                  },
                },
              },
            },
            maintainAspectRatio: false,
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
        },
    );

    return { settings };
  },
});
</script>
