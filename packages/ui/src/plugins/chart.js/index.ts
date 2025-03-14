import { vuetify } from '@/plugins/vuetify';

import { watch } from 'vue';

import { Chart } from 'chart.js';

const updateChartColors = () => {
  const isDark = vuetify.theme.global.current.value.dark;

  Chart.defaults.color = vuetify.theme.global.current.value.colors['text-primary'];
  Chart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  Chart.defaults.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';

  Object.values(Chart.instances || {}).forEach((chart) => {
    if (chart) {
      chart.update();
    }
  });
};

updateChartColors();

watch(
  () => vuetify.theme.global.name.value,
  () => {
    updateChartColors();
  },
);
