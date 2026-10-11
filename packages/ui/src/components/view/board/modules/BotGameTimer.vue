<template>
  <div class="bot-game-timer">
    <p class="bot-countdown" role="timer">
      {{
        $t(
          phase === 'preparation'
            ? 'aiArena.botLaunchTime'
            : discussion
              ? 'aiArena.botDiscussionTime'
              : usingReserve
                ? 'aiArena.botReserveTime'
                : 'aiArena.botActionTime',
          { seconds },
        )
      }}
    </p>
    <p v-if="phase === 'action' && !discussion && timeBankMs !== undefined" class="bot-reserve">
      {{ $t('aiArena.botTimeBankRemaining', { seconds: reserveSeconds }) }}
    </p>
    <p v-if="phase === 'action'" class="bot-action-hint">
      {{ $t(discussion ? 'aiArena.botDiscussionDeadlineHint' : 'aiArena.botActionDeadlineHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
const props = defineProps<{
  expiresAt: number;
  baseExpiresAt?: number;
  timeBankMs?: number;
  discussion?: boolean;
  phase: 'preparation' | 'action';
}>();
const now = ref(Date.now());
const usingReserve = computed(
  () =>
    props.phase === 'action' &&
    !props.discussion &&
    props.baseExpiresAt !== undefined &&
    now.value >= props.baseExpiresAt,
);
const seconds = computed(() =>
  Math.max(
    0,
    Math.ceil(((usingReserve.value ? props.expiresAt : props.baseExpiresAt || props.expiresAt) - now.value) / 1000),
  ),
);
const reserveSeconds = computed(() =>
  Math.max(
    0,
    Math.ceil(
      ((props.timeBankMs || 0) - (props.baseExpiresAt ? Math.max(0, now.value - props.baseExpiresAt) : 0)) / 1000,
    ),
  ),
);
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
.bot-countdown,
.bot-reserve {
  margin: 0;
}
.bot-action-hint {
  margin: 4px 0 0;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.3;
}
</style>
