<template>
  <template v-if="remainingTime > 0">
    <span class="time" :class="{ 'low-time': Number(timeInString) < 10, 'critical-time': Number(timeInString) < 5 }">
      {{ timeInString }}
    </span>
  </template>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, watch } from 'vue';

export default defineComponent({
  props: {
    endTime: {
      required: true,
      type: Number,
    },
  },
  emits: ['timerEnd'],
  setup(props, { emit }) {
    const displaySeconds = ref(Math.floor((props.endTime - Date.now()) / 1000));
    let intervalId: number | undefined;

    const remainingTime = computed(() => {
      const remaining = props.endTime - Date.now();
      return Math.max(0, remaining);
    });

    const timeInString = computed(() => {
      const totalSeconds = Math.max(0, displaySeconds.value);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return seconds.toString();
    });

    onMounted(() => {
      // Initial check
      if (remainingTime.value <= 0) {
        emit('timerEnd');
        return;
      }

      intervalId = window.setInterval(() => {
        const newSeconds = Math.floor((props.endTime - Date.now()) / 1000);

        // Only update if seconds changed
        if (newSeconds !== displaySeconds.value) {
          displaySeconds.value = newSeconds;
        }

        if (newSeconds < 0 && intervalId) {
          window.clearInterval(intervalId);
          intervalId = undefined;
          emit('timerEnd');
        }
      }, 500); // Check every 500ms but only update when seconds change
    });

    onUnmounted(() => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    });

    // Watch for endTime changes to reset timer
    watch(
      () => props.endTime,
      (newEndTime, oldEndTime) => {
        if (newEndTime !== oldEndTime) {
          // Clear existing interval
          if (intervalId) {
            window.clearInterval(intervalId);
          }

          // Reset display seconds
          displaySeconds.value = Math.floor((newEndTime - Date.now()) / 1000);

          // Start new interval if there's time remaining
          if (displaySeconds.value >= 0) {
            intervalId = window.setInterval(() => {
              const newSeconds = Math.floor((props.endTime - Date.now()) / 1000);

              // Only update if seconds changed
              if (newSeconds !== displaySeconds.value) {
                displaySeconds.value = newSeconds;
              }

              if (newSeconds < 0 && intervalId) {
                window.clearInterval(intervalId);
                intervalId = undefined;
                emit('timerEnd');
              }
            }, 500);
          }
        }
      },
    );

    return {
      remainingTime,
      timeInString,
    };
  },
});
</script>

<style scoped lang="scss">
.time {
  color: rgb(var(--v-theme-text-primary));
}

.low-time {
  color: rgb(var(--v-theme-warning));
}

.critical-time {
  color: rgb(var(--v-theme-error));
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
</style>
