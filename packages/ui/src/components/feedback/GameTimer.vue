<template>
  <template v-if="remainingTime > 0">
    <span :class="{ 'low-time': remainingTime < 10000, 'critical-time': remainingTime < 5000 }">
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
    const currentTime = ref(Date.now());
    let intervalId: number | undefined;

    const remainingTime = computed(() => {
      const remaining = props.endTime - currentTime.value;
      return Math.max(0, remaining);
    });

    const timeInString = computed(() => {
      const totalSeconds = Math.floor(remainingTime.value / 1000);
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
        currentTime.value = Date.now();

        if (remainingTime.value <= 0 && intervalId) {
          window.clearInterval(intervalId);
          intervalId = undefined;
          emit('timerEnd');
        }
      }, 100); // Update every 100ms for smoother countdown
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

          // Reset current time
          currentTime.value = Date.now();

          // Start new interval if there's time remaining
          if (remainingTime.value > 0) {
            intervalId = window.setInterval(() => {
              currentTime.value = Date.now();

              if (remainingTime.value <= 0 && intervalId) {
                window.clearInterval(intervalId);
                intervalId = undefined;
                emit('timerEnd');
              }
            }, 100);
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
.low-time {
  color: #ffcc00;
}

.critical-time {
  color: #ff4444;
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
