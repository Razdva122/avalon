<template>
  <div class="codex-weekly-limit" aria-live="polite">
    <template v-if="weekly">
      <section v-for="window in windows" :key="window.label" class="quota-window">
        <div class="quota-heading">
          <span>{{ $t(window.label) }}</span>
          <strong>{{ $t('aiArena.codexWeeklyRemaining', { percent: Math.round(window.remainingPercent) }) }}</strong>
        </div>
        <progress :value="window.remainingPercent" max="100" :aria-label="$t(window.label)" />
        <p v-if="window.resetsAt" class="quota-hint">
          {{ $t('aiArena.codexWeeklyReset', { date: formatReset(window.resetsAt) }) }}
        </p>
      </section>
      <p v-if="windows.some((window) => window.remainingPercent === 0)" class="quota-blocked" role="status">
        {{ $t('aiArena.codexLimitReached') }}
      </p>
      <p class="quota-hint">{{ $t('aiArena.codexWeeklyShared') }}</p>
    </template>
    <p v-else>{{ $t(loading ? 'mainPage.loading' : 'aiArena.codexWeeklyUnavailable') }}</p>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CodexWeeklyLimit } from '@avalon/types';
import { socket } from '@/api/socket';
const { locale } = useI18n();
const weekly = ref<CodexWeeklyLimit | null>(null);
const loading = ref(true);
let stopped = false;
let fetching = false;
let timer: ReturnType<typeof setInterval> | undefined;
const windows = computed(() =>
  weekly.value
    ? [
        ...(weekly.value.shortTerm ? [{ ...weekly.value.shortTerm, label: 'aiArena.codexShortTermLimit' }] : []),
        { ...weekly.value, label: 'aiArena.codexWeeklyLimit' },
      ]
    : [],
);
const formatReset = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleString(locale.value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
async function refresh() {
  if (fetching || stopped) return;
  fetching = true;
  try {
    const result = await socket.timeout(15000).emitWithAck('getAiCodexWeeklyLimit');
    if (!stopped) weekly.value = 'error' in result ? null : result.weekly;
  } catch {
    if (!stopped) weekly.value = null;
  } finally {
    if (!stopped) loading.value = false;
    fetching = false;
  }
}
onMounted(() => {
  void refresh();
  timer = setInterval(refresh, 60000);
});
onBeforeUnmount(() => {
  stopped = true;
  if (timer) clearInterval(timer);
});
</script>
<style scoped lang="scss">
.codex-weekly-limit {
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 12px;
}
.quota-window + .quota-window {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
}
.quota-blocked {
  margin: 12px 0 8px;
  font-weight: 600;
}
.quota-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  justify-content: space-between;
}
progress {
  display: block;
  width: 100%;
  height: 8px;
  margin: 10px 0;
  accent-color: rgb(var(--v-theme-primary));
}
.quota-hint {
  font-size: 13px;
  opacity: 0.75;
  margin-top: 4px;
}
</style>
