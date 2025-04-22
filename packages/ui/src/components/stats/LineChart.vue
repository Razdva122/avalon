<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch, ref, PropType } from 'vue';
import Chart from 'chart.js/auto';

export default defineComponent({
  name: 'LineChart',
  props: {
    chartData: {
      type: Object as PropType<{
        labels: string[];
        datasets: {
          label: string;
          backgroundColor: string;
          borderColor: string;
          data: (number | null)[];
          fill: boolean;
        }[];
      }>,
      required: true,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chart: Chart | null = null;

    const createChart = () => {
      if (!chartCanvas.value) return;

      const ctx = chartCanvas.value.getContext('2d');
      if (!ctx) return;

      chart = new Chart(ctx, {
        type: 'line',
        data: props.chartData,
        options: props.options,
      });
    };

    const updateChart = () => {
      if (!chart) return;

      chart.data = props.chartData;
      chart.options = props.options;
      chart.update();
    };

    onMounted(() => {
      createChart();
    });

    watch(
      () => props.chartData,
      () => {
        if (chart) {
          updateChart();
        } else {
          createChart();
        }
      },
      { deep: true },
    );

    watch(
      () => props.options,
      () => {
        if (chart) {
          updateChart();
        }
      },
      { deep: true },
    );

    return {
      chartCanvas,
    };
  },
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
</style>
