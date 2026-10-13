<template>
  <div class="bot-game-timer" :class="{ 'bot-timer-compact': compact }">
    <details v-if="compact && phase === 'action'" class="bot-timer-details">
      <summary>
        <span role="timer">{{ $t(actionKey, { seconds, name: playerName }) }}</span>
        <span class="bot-timer-info" aria-hidden="true">ⓘ</span>
      </summary>
      <div class="bot-timer-explanation">
        <p v-if="usingReserve" class="bot-reserve">{{ $t('aiArena.botReserveTime', { seconds }) }}</p>
        <p v-if="timeBankMs !== undefined" class="bot-reserve">
          {{ $t('aiArena.botTimeBankRemaining', { seconds: reserveSeconds }) }}
        </p>
        <p class="bot-action-hint">
          {{
            $t(
              withFriend
                ? 'aiArena.botFriendDeadlineHint'
                : discussion
                  ? 'aiArena.botDiscussionDeadlineHint'
                  : 'aiArena.botActionDeadlineHint',
            )
          }}
        </p>
      </div>
    </details>
    <p v-else class="bot-countdown" role="timer">
      {{
        $t(compact && phase === 'preparation' ? 'aiArena.botLaunchTimeShort' : countdownKey, {
          seconds,
          time: preparationTime,
          name: playerName,
        })
      }}
    </p>
    <p v-if="phase === 'action' && timeBankMs !== undefined && !compact" class="bot-reserve">
      {{ $t('aiArena.botTimeBankRemaining', { seconds: reserveSeconds }) }}
    </p>
    <p v-if="phase === 'action' && !compact" class="bot-action-hint">
      {{
        $t(
          withFriend
            ? 'aiArena.botFriendDeadlineHint'
            : discussion
              ? 'aiArena.botDiscussionDeadlineHint'
              : 'aiArena.botActionDeadlineHint',
        )
      }}
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
  withFriend?: boolean;
  playerName?: string;
  phase: 'preparation' | 'action';
  compact?: boolean;
}>();
const now = ref(Date.now());
const usingReserve = computed(
  () => props.phase === 'action' && props.baseExpiresAt !== undefined && now.value >= props.baseExpiresAt,
);
const actionKey = computed(() =>
  props.playerName !== undefined
    ? props.discussion
      ? 'aiArena.playerDiscussionTime'
      : 'aiArena.playerActionTime'
    : props.discussion
      ? 'aiArena.botDiscussionTime'
      : 'aiArena.botActionTime',
);
const countdownKey = computed(() =>
  props.phase === 'preparation'
    ? 'aiArena.botLaunchTime'
    : usingReserve.value
      ? 'aiArena.botReserveTime'
      : actionKey.value,
);
const seconds = computed(() =>
  Math.max(
    0,
    Math.ceil(((usingReserve.value ? props.expiresAt : props.baseExpiresAt || props.expiresAt) - now.value) / 1000),
  ),
);
const preparationTime = computed(
  () => `${Math.floor(seconds.value / 60)}:${String(seconds.value % 60).padStart(2, '0')}`,
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
.bot-timer-compact {
  margin: 0;
  font-size: 12px;
}
.bot-timer-details {
  position: relative;
  pointer-events: auto;
}
.bot-timer-details summary {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
  cursor: pointer;
  list-style: none;
}
.bot-timer-details summary::after {
  content: '';
  position: absolute;
  inset: -12px -9px;
}
.bot-timer-details summary:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
  border-radius: 3px;
}
.bot-timer-info {
  opacity: 0.7;
}
.bot-timer-details summary::-webkit-details-marker {
  display: none;
}
.bot-timer-explanation {
  position: absolute;
  bottom: calc(100% + 10px);
  left: -9px;
  right: -9px;
  margin: 0;
  padding: 8px 10px;
  border: 1px solid #a78b52;
  border-radius: 10px;
  background: #202b34;
  color: #e6e3da;
  white-space: normal;
  font-weight: 400;
}
</style>
