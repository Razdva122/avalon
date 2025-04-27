<template>
  <div class="confidence-display">
    <div class="confidence-bar-container">
      <div class="confidence-bar" :style="{ width: `${confidencePercentage}%` }" :class="barColorClass"></div>
    </div>
    <span class="confidence-text ml-2">{{ confidencePercentage }}%</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  props: {
    sigma: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    // Calculate confidence percentage: 100% at sigma=100, 0% at sigma=1500
    const confidencePercentage = computed(() => {
      return Math.max(0, Math.min(100, Math.round(100 - ((props.sigma - 100) / 1400) * 100)));
    });

    // Determine color class based on confidence level
    const barColorClass = computed(() => {
      const confidence = confidencePercentage.value;

      if (confidence >= 75) {
        return 'confidence-high';
      } else if (confidence >= 40) {
        return 'confidence-medium';
      } else {
        return 'confidence-low';
      }
    });

    return {
      confidencePercentage,
      barColorClass,
    };
  },
});
</script>

<style scoped>
.confidence-display {
  display: flex;
  align-items: center;
}

.confidence-bar-container {
  width: 100px;
  height: 12px;
  background-color: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.confidence-bar {
  height: 100%;
  border-radius: 6px;
}

.confidence-high {
  background-color: rgb(var(--v-theme-success));
}

.confidence-medium {
  background-color: rgb(var(--v-theme-warning));
}

.confidence-low {
  background-color: rgb(var(--v-theme-error));
}

.confidence-text {
  font-size: 0.875rem;
  min-width: 40px;
}
</style>
