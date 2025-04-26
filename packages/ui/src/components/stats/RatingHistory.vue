<template>
  <div class="rating-history">
    <h3 class="mb-4">{{ $t('stats.ratingHistory', { role: formatRoleName(role) }) }}</h3>

    <div v-if="loading" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="!hasData" class="text-center">
      {{ $t('stats.noRatingHistory') }}
    </div>

    <div v-else class="chart-container">
      <LineChart :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';
import { socket } from '@/api/socket';
import { TRoles } from '@avalon/types';
import { Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default defineComponent({
  name: 'RatingHistory',
  components: {
    LineChart,
  },
  props: {
    userID: {
      type: String,
      required: true,
    },
    role: {
      type: String as () => TRoles,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const theme = useTheme();

    interface HistoryItem {
      date: Date;
      rating: number | null;
      rank: number | null;
    }

    const history = ref<HistoryItem[]>([]);
    const loading = ref(true);

    const hasData = computed(
      () => history.value.length > 0 && history.value.some((h) => h.rating !== null && h.rating > 0),
    );

    const chartData = computed(() => {
      // Filter out entries with zero or null ratings to start from the first actual rating
      const filteredHistory = history.value.filter((h) => h.rating !== null && h.rating > 0);

      const labels = filteredHistory.map((h) => {
        const date = new Date(h.date);
        return date.toLocaleDateString();
      });

      const ratings = filteredHistory.map((h) => h.rating);

      // Create a second dataset for rank (if we have rank data)
      const hasRankData = filteredHistory.some((h) => h.rank !== null);

      // Use direct color values for better visibility in both themes
      const primaryColor = '#1E88E5'; // Bright blue
      const errorColor = '#FF5252'; // Bright red
      const surfaceColor = '#FFFFFF'; // White

      const datasets = [
        {
          label: t('stats.rating'),
          data: ratings,
          borderColor: primaryColor,
          backgroundColor: 'rgba(30, 136, 229, 0.1)', // Transparent blue
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
          pointBackgroundColor: primaryColor, // Ensure points are filled with the same color
          pointBorderColor: surfaceColor,
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ];

      // Add rank dataset if we have rank data
      if (hasRankData) {
        const ranks = filteredHistory.map((h) => h.rank);
        datasets.push({
          label: t('stats.rank'),
          data: ranks,
          borderColor: errorColor,
          backgroundColor: 'rgba(255, 82, 82, 0.1)', // Transparent red
          fill: false,
          tension: 0.4,
          yAxisID: 'y1',
          pointBackgroundColor: errorColor, // Ensure points are filled with the same color
          pointBorderColor: surfaceColor,
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          // Don't hide on mobile as per user request
        });
      }

      return {
        labels,
        datasets,
      };
    });

    const chartOptions = computed(() => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            beginAtZero: false,
            title: {
              display: window.innerWidth >= 600,
              text: t('stats.rating'),
              color: '#1E88E5', // Bright blue
            },
            ticks: {
              // Make the ticks more readable on small screens
              maxTicksLimit: window.innerWidth < 600 ? 5 : 10,
              font: {
                size: window.innerWidth < 600 ? 10 : 12,
              },
              color: '#64B5F6', // Lighter blue
            },
            grid: {
              color: 'rgba(30, 136, 229, 0.2)', // Semi-transparent blue
            },
          },
          y1: {
            type: 'linear' as const,
            display: window.innerWidth >= 600,
            position: 'right' as const,
            beginAtZero: false,
            reverse: true, // Lower rank is better, so reverse the axis
            // Add padding to ensure we show ranks beyond the data range
            grace: '50%', // Add 50% padding to both ends of the axis
            // This ensures we see at least ±5 ranks from any data point
            title: {
              display: window.innerWidth >= 600,
              text: t('stats.rank'),
              color: '#FF5252', // Bright red
            },
            ticks: {
              maxTicksLimit: window.innerWidth < 600 ? 5 : 10,
              precision: 0, // Only show integer values for ranks
              font: {
                size: window.innerWidth < 600 ? 10 : 12,
              },
              color: '#FF8A80', // Lighter red
            },
            grid: {
              drawOnChartArea: false, // Only show grid lines for the primary y-axis
            },
          },
          x: {
            ticks: {
              maxTicksLimit: window.innerWidth < 600 ? 5 : 10,
              maxRotation: 45,
              minRotation: 0,
              font: {
                size: window.innerWidth < 600 ? 10 : 12,
              },
              color: theme.current.value.colors.textPrimary,
            },
          },
        },
        plugins: {
          legend: {
            display: window.innerWidth >= 600,
            onClick: () => {}, // Empty function to disable toggling datasets by clicking on legend
            labels: {
              font: {
                size: 14,
              },
              // Removed color specification to use default text color
              boxWidth: 16,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#FFFFFF', // White
            borderColor: '#1E88E5', // Blue
            borderWidth: 1,
            titleColor: '#1E88E5', // Blue
            bodyColor: '#424242', // Dark gray
            titleFont: {
              size: 14,
              weight: 'bold' as const,
            },
            bodyFont: {
              size: 13,
            },
            padding: 10,
            callbacks: {
              label: function (context: any) {
                let value = context.raw !== null ? context.raw : t('stats.noData');

                // Format values as integers for ranks
                if (context.dataset.label === t('stats.rating')) {
                  return `${t('stats.rating')}: ${value}`;
                } else if (context.dataset.label === t('stats.rank')) {
                  // Ensure rank is displayed as an integer
                  if (typeof value === 'number') {
                    value = Math.round(value);
                  }
                  return `${t('stats.rank')}: ${value}`;
                }
                return `${context.dataset.label}: ${value}`;
              },
            },
          },
        },
        interaction: {
          mode: 'nearest' as const,
          intersect: false,
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6,
            backgroundColor: 'currentColor', // Use the same color as the line
            borderWidth: 1.5,
            borderColor: 'white', // White border around points
          },
          line: {
            tension: 0.4,
            borderWidth: 2,
          },
        },
      };
    });

    const fetchRatingHistory = () => {
      loading.value = true;

      socket.emit('getRatingHistory', props.userID, props.role, (response) => {
        if ('error' in response) {
          console.error('Error from API:', response.error);
        } else {
          history.value = response as HistoryItem[];
        }

        loading.value = false;
      });
    };

    const formatRoleName = (role: TRoles) => {
      return t(`roles.${role}`);
    };

    watch([() => props.userID, () => props.role], () => {
      fetchRatingHistory();
    });

    // Initial fetch
    fetchRatingHistory();

    return {
      history,
      loading,
      hasData,
      chartData,
      chartOptions,
      formatRoleName,
    };
  },
});
</script>

<style scoped lang="scss">
.rating-history {
  margin-top: 16px;
  margin-bottom: 16px;
}

.chart-container {
  height: 300px;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .rating-history {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .chart-container {
    height: 200px;
  }

  h3 {
    font-size: 1rem;
  }
}
</style>
