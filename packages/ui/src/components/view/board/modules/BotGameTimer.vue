<template>
  <div class="bot-game-timer">
    <p class="bot-countdown" role="timer">
      {{ $t(phase === 'preparation' ? 'aiArena.botLaunchTime' : 'aiArena.botActionTime', { seconds }) }}
    </p>
    <p v-if="phase === 'action'" class="bot-action-hint">{{ $t('aiArena.botActionDeadlineHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
const props = defineProps<{ expiresAt: number; phase: 'preparation' | 'action' }>();
const now = ref(Date.now());
const seconds = computed(() => Math.max(0, Math.ceil((props.expiresAt - now.value) / 1000)));
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.bot-game-timer {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.bot-countdown {
  margin: 0;
}
.bot-action-hint {
  margin: 4px 0 0;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.3;
}
</style>
