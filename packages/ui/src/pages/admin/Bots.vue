<template>
  <main class="bot-admin">
    <header class="page-heading">
      <div>
        <h1>{{ $t('aiArena.botDashboard') }}</h1>
        <p class="muted page-intro">{{ $t('aiArena.botDashboardIntro') }}</p>
      </div>
      <div v-if="!denied" class="page-actions">
        <v-dialog
          v-if="data"
          v-model="settingsOpen"
          :persistent="saving"
          max-width="920"
          aria-labelledby="bot-settings-title"
          scrollable
        >
          <template #activator="{ props: activatorProps }">
            <v-btn v-bind="activatorProps" color="primary" variant="outlined" data-admin-settings>
              <v-icon icon="settings" start aria-hidden="true" />{{ $t('menu.settings') }}
            </v-btn>
          </template>
          <div class="settings-dialog">
            <header class="settings-heading">
              <h2 id="bot-settings-title">{{ $t('menu.settings') }}</h2>
              <v-btn
                icon="close"
                color="primary"
                variant="text"
                :aria-label="$t('infoMessage.close')"
                :disabled="saving"
                @click="settingsOpen = false"
              />
            </header>
            <div class="settings-body">
              <BotQuotaSettings
                :thresholds="data.thresholds"
                :initial-draft="draftThresholds"
                :saving="saving"
                :loading="loading"
                :error="saveError"
                :saved="saved"
                @save="save"
                @draft="draftThresholds = $event"
              />
            </div>
          </div>
        </v-dialog>
        <v-btn color="primary" variant="text" :loading="loading" :disabled="saving" @click="refresh">
          <v-icon icon="refresh" start aria-hidden="true" />{{ $t('aiArena.dashboardRefresh') }}
        </v-btn>
      </div>
    </header>

    <p v-if="denied" class="notice" role="alert">{{ $t('aiArena.dashboardDenied') }}</p>
    <p v-else-if="error" class="notice" role="alert">{{ $t('aiArena.dashboardError') }}</p>
    <p v-else-if="!data" role="status">{{ $t('mainPage.loading') }}</p>

    <template v-if="data && !denied">
      <div class="freshness muted" role="status">
        <span>{{ $t('aiArena.dashboardUpdated', { date: formatDate(data.checkedAt) }) }}</span>
        <span>{{ $t('aiArena.dashboardPolling') }}</span>
        <strong v-if="error">{{ $t('aiArena.dashboardStale') }}</strong>
      </div>
      <dl class="summary-grid">
        <div v-for="item in summary" :key="item.label" class="summary-card" :class="item.status">
          <dt>{{ $t(item.label) }}</dt>
          <dd>{{ item.count }}</dd>
        </div>
      </dl>

      <p v-if="!data.instances.length" class="notice">{{ $t('aiArena.dashboardEmpty') }}</p>
      <div class="instance-grid">
        <article v-for="bot in data.instances" :key="bot.id" class="instance-card" :aria-labelledby="`bot-${bot.id}`">
          <header class="instance-heading">
            <h2 :id="`bot-${bot.id}`">{{ bot.id }}</h2>
            <span class="status-badge" :class="bot.status">
              <span class="status-dot" aria-hidden="true" />{{ $t(`aiArena.instance${bot.status}`) }}
            </span>
          </header>

          <div class="quotas">
            <section v-for="window in quotaWindows(bot)" :key="window.label" class="quota-window">
              <div class="quota-heading">
                <span>{{ $t(window.label) }}</span>
                <strong>{{
                  window.value
                    ? $t('aiArena.codexWeeklyRemaining', { percent: Math.round(window.value.remainingPercent) })
                    : '—'
                }}</strong>
              </div>
              <progress
                v-if="window.value"
                :value="window.value.remainingPercent"
                max="100"
                :class="{ low: window.value.remainingPercent <= 20 }"
                :aria-label="$t(window.label)"
              />
              <div v-else class="quota-missing" aria-hidden="true" />
              <p class="muted quota-hint">
                {{
                  window.value?.resetsAt
                    ? $t('aiArena.codexWeeklyReset', { date: formatDate(window.value.resetsAt * 1000) })
                    : $t(window.value ? 'aiArena.dashboardResetUnknown' : 'aiArena.dashboardQuotaUnavailable')
                }}
              </p>
            </section>
          </div>
          <p v-if="bot.quota" class="muted quota-hint">
            {{ $t('aiArena.dashboardQuotaChecked', { date: formatDate(bot.quota.checkedAt) }) }}
          </p>

          <div class="instance-activity">
            <template v-if="bot.roomID">
              <p class="activity-label">{{ $t('aiArena.dashboardCurrentRoom') }}</p>
              <RouterLink class="room-link" :to="{ name: 'room', params: { uuid: bot.roomID } }">
                {{ bot.room?.title || bot.roomID }} <span aria-hidden="true">↗</span>
              </RouterLink>
              <template v-if="bot.room">
                <p>
                  {{ $t(`aiArena.${bot.room.status}`) }} ·
                  {{ $t('aiArena.dashboardPlayers', { count: bot.room.playerCount }) }}
                </p>
                <p v-if="bot.room.codex" class="muted">{{ bot.room.codex.model }} · {{ bot.room.codex.reasoning }}</p>
                <p v-if="bot.room.thinking">{{ $t('aiArena.dashboardThinking') }}</p>
                <p v-else-if="bot.room.waitingForHuman">{{ $t('aiArena.dashboardWaiting') }}</p>
              </template>
              <p v-else class="muted">{{ $t('aiArena.dashboardRemoteRoom') }}</p>
            </template>
            <p v-else>{{ $t(bot.status === 'busy' ? 'aiArena.dashboardAllocating' : 'aiArena.dashboardNoRoom') }}</p>
          </div>

          <footer class="instance-footer">
            <p class="activity-label">{{ $t('aiArena.dashboardModes') }}</p>
            <div class="mode-list">
              <span v-for="mode in availableModes(bot)" :key="mode" class="mode-chip">{{
                $t(`aiArena.dashboardMode${mode}`)
              }}</span>
              <span v-if="!availableModes(bot).length" class="muted">{{ $t('aiArena.dashboardNoModes') }}</span>
            </div>
          </footer>
        </article>
      </div>
      <BotUsageStats :games="data.games" />
      <p class="muted shared-hint">{{ $t('aiArena.codexWeeklyShared') }}</p>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAdminBotMessages } from './locales';
import type { AiBotInstanceStatus, AiBotMode } from '@avalon/types';
import type { BotQuotaThresholds } from '@avalon/types';
import BotQuotaSettings from './BotQuotaSettings.vue';
import BotUsageStats from './BotUsageStats.vue';
import { useBotDashboard } from '@/helpers/composables/useBotDashboard';

const { locale } = useAdminBotMessages();
const { data, draftThresholds, loading, denied, error, refresh, saving, saveError, saved, saveThresholds } =
  useBotDashboard();
const settingsOpen = ref(false);
watch([data, denied], () => {
  if (!data.value || denied.value) settingsOpen.value = false;
});
async function save(thresholds: BotQuotaThresholds) {
  if (await saveThresholds(thresholds)) void refresh();
}
const summary = computed(() => [
  { label: 'aiArena.dashboardTotal', count: data.value?.instances.length ?? 0, status: '' },
  ...(['free', 'busy', 'unavailable'] as const).map((status) => ({
    label: `aiArena.instance${status}`,
    count: data.value?.instances.filter((bot) => bot.status === status).length ?? 0,
    status,
  })),
]);
const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString(locale.value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
const availableModes = (bot: AiBotInstanceStatus) =>
  (Object.keys(bot.modes) as AiBotMode[]).filter((mode) => bot.modes[mode]);
const quotaWindows = (bot: AiBotInstanceStatus) => [
  ...(bot.quota?.shortTerm === null ? [] : [{ label: 'aiArena.codexShortTermLimit', value: bot.quota?.shortTerm }]),
  { label: 'aiArena.codexWeeklyLimit', value: bot.quota },
];
</script>

<style scoped lang="scss">
.bot-admin {
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  padding: 82px 24px 56px;
  color: rgb(var(--v-theme-text-primary));
}
.page-heading,
.instance-heading,
.quota-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.page-heading :deep(.v-btn) {
  min-height: 44px;
}
h1 {
  font-size: clamp(24px, 4vw, 30px);
  line-height: 1.2;
  margin: 0 0 6px;
}
h2 {
  font-size: 20px;
  overflow-wrap: anywhere;
  min-width: 0;
}
.activity-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.page-intro {
  font-size: 13px;
}
.page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.settings-dialog {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100dvh - 48px);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-text-primary));
  overflow: hidden;
}
.settings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px 12px 24px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.16);
}
.settings-body {
  overflow-y: auto;
  min-height: 0;
}
.settings-body :deep(.quota-settings) {
  margin: 0;
  border: 0;
  border-radius: 0;
}

.muted {
  color: rgba(var(--v-theme-on-surface), 0.72);
}
.freshness {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  font-size: 13px;
  margin: 16px 0 12px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 12px;
  overflow: hidden;
}
.instance-card,
.notice {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 16px;
}
.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-inline-start: 1px solid rgba(var(--v-theme-on-surface), 0.16);
}
.summary-card:first-child {
  border-inline-start: 0;
}
dt {
  font-size: 14px;
}
dd {
  font-size: 24px;
  font-weight: 650;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.instance-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.instance-card {
  padding: 24px;
  min-width: 0;
}
.instance-heading {
  align-items: start;
  margin-bottom: 24px;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  border: 1px solid currentColor;
  border-radius: 100px;
  padding: 4px 10px;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.free {
  color: rgb(var(--v-theme-text-primary));
}
.status-badge.free .status-dot {
  background: rgb(var(--v-theme-success));
}
.busy {
  color: rgb(var(--v-theme-primary));
}
.unavailable {
  color: rgba(var(--v-theme-on-surface), 0.72);
}
.quotas {
  display: grid;
  gap: 18px;
}
.quota-heading {
  gap: 8px;
  font-size: 14px;
}
.quota-heading strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
progress,
.quota-missing {
  display: block;
  width: 100%;
  height: 8px;
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
}
progress {
  appearance: none;
  border: 0;
  background: rgb(var(--v-theme-inset-hover));
  accent-color: rgb(var(--v-theme-primary));
}
progress::-webkit-progress-bar {
  background: rgb(var(--v-theme-inset-hover));
}
progress::-webkit-progress-value {
  background: rgb(var(--v-theme-primary));
  border-radius: 8px;
}
progress::-moz-progress-bar {
  background: rgb(var(--v-theme-primary));
  border-radius: 8px;
}
progress.low::-webkit-progress-value {
  background: rgb(var(--v-theme-warning));
}
progress.low::-moz-progress-bar {
  background: rgb(var(--v-theme-warning));
}
.quota-missing {
  background: rgb(var(--v-theme-inset-hover));
}
.quota-hint {
  font-size: 12px;
  line-height: 1.5;
}
.instance-activity {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  margin-top: 20px;
  padding-top: 18px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.activity-label {
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin-bottom: 6px;
}
.room-link {
  color: rgb(var(--v-theme-primary));
  display: inline-block;
  padding: 6px 0;
  min-height: 44px;
}
.room-link:hover {
  text-decoration: underline;
}
.instance-footer {
  margin-top: 18px;
}
.mode-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
}
.mode-chip {
  background: rgb(var(--v-theme-inset-hover));
  border-radius: 6px;
  padding: 3px 8px;
}
.notice {
  padding: 20px;
  margin-top: 24px;
}
.shared-hint {
  font-size: 13px;
  margin-top: 24px;
}
@media (max-width: 700px) {
  .bot-admin {
    padding: 74px 16px 40px;
  }
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .summary-card:nth-child(3) {
    border-inline-start: 0;
  }
  .summary-card:nth-child(n + 3) {
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  }
  .instance-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .instance-card {
    padding: 20px;
  }
}
</style>
