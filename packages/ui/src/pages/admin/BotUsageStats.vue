<template>
  <section class="usage" aria-labelledby="usage-heading">
    <header class="usage-heading">
      <div>
        <h2 id="usage-heading">{{ $t('aiArena.usageTitle') }}</h2>
        <p class="usage-secondary">{{ $t('aiArena.usagePeriod') }}</p>
      </div>
      <label class="account-filter"
        >{{ $t('aiArena.usageAccount') }}
        <select v-model="account">
          <option value="">{{ $t('aiArena.usageAll') }}</option>
          <option v-for="id in accounts" :key="id" :value="id">{{ id }}</option>
        </select>
      </label>
    </header>

    <details class="usage-help">
      <summary>{{ $t('aiArena.usageHelp') }}</summary>
      <p>{{ $t('aiArena.usageHint') }}</p>
      <p>{{ $t('aiArena.usageLive') }}</p>
    </details>

    <p v-if="!visible.length" class="usage-empty" role="status">{{ $t('aiArena.usageEmpty') }}</p>
    <template v-if="visible.length || visibleUsage.length">
      <section v-if="visibleUsage.length" class="account-overview" aria-labelledby="usage-accounts-heading">
        <h3 id="usage-accounts-heading">{{ $t('aiArena.usageByAccount') }}</h3>
        <article
          v-for="usage in visibleUsage"
          :key="usage.instanceID"
          class="account-row"
          :data-account="usage.instanceID"
        >
          <div class="account-name">
            <strong>{{ usage.instanceID }}</strong>
            <span class="usage-secondary">{{ $t('aiArena.usageGameCount', { count: usage.gameCount }) }}</span>
          </div>
          <dl class="account-metrics">
            <div>
              <dt>{{ $t('aiArena.usageTokens') }}</dt>
              <dd>{{ usage.tokens === null ? $t('aiArena.usageNoData') : number(usage.tokens) }}</dd>
            </div>
            <div>
              <dt>{{ $t('aiArena.usageWeekly') }}</dt>
              <dd>{{ atLeast(percent(usage.weeklySpent), usage.weeklySpent !== null && usage.weeklyIncomplete) }}</dd>
            </div>
            <div>
              <dt>{{ $t('aiArena.usageShortTerm') }}</dt>
              <dd>
                {{ atLeast(percent(usage.shortTermSpent), usage.shortTermSpent !== null && usage.shortTermIncomplete) }}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section v-if="visible.length" class="game-history" aria-labelledby="usage-games-heading">
        <header class="history-heading">
          <h3 id="usage-games-heading">{{ $t('aiArena.usageGames') }}</h3>
          <span class="usage-secondary" role="status">{{
            $t('aiArena.usageGameCount', { count: visible.length })
          }}</span>
        </header>
        <details v-for="game in visible" :key="game.roomID" class="game-entry" :data-account="game.instanceID">
          <summary>
            <div class="game-summary">
              <div class="game-identity">
                <time :datetime="new Date(game.startedAt).toISOString()">{{ date(game.startedAt) }}</time>
                <span class="usage-secondary">{{ game.instanceID }}</span>
                <div class="game-badges">
                  <span class="game-badge" :class="`status-${game.status}`">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="statusIcons[game.status]" /></svg>
                    {{ $t(`aiArena.${game.status}`) }}
                  </span>
                  <span
                    class="game-badge language-badge"
                    :title="`${$t('aiArena.usageLanguage')}: ${language(game.language)}`"
                  >
                    <img
                      v-if="game.language"
                      :src="`/flags/${game.language}.svg`"
                      alt=""
                      width="24"
                      height="16"
                      class="language-flag"
                    />
                    <span>{{ game.language ? game.language.toUpperCase() : $t('aiArena.usageNoData') }}</span>
                  </span>
                </div>
                <span class="details-label"
                  ><span class="when-closed">{{ $t('aiArena.usageDetails') }}</span
                  ><span class="when-open">{{ $t('aiArena.usageCollapse') }}</span></span
                >
              </div>
              <div class="game-players">
                <strong
                  class="game-badge bot-badge"
                  :title="`${$t('aiArena.usageModel')}: ${
                    game.settings
                      .map((setting) => setting.model)
                      .filter(Boolean)
                      .join(', ') || $t('aiArena.usageNoData')
                  }`"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path :d="botIcons[game.mode] || botIcons.regular" />
                  </svg>
                  {{ mode(game) }}
                </strong>
                <span>{{ $t('aiArena.usageHumanCount', { count: game.humanCount }) }}</span>
                <span>{{ $t('aiArena.usageBotCount', { count: game.botCount }) }}</span>
              </div>
              <div class="game-tokens">
                <span class="metric-label">{{ $t('aiArena.usageTokens') }}</span>
                <strong>{{ tokenTotal([game]) }}</strong>
              </div>
              <dl class="game-quota">
                <div>
                  <dt>{{ $t('aiArena.usageWeekly') }}</dt>
                  <dd>{{ percent(game.weeklySpent) }}</dd>
                </div>
                <div>
                  <dt>{{ $t('aiArena.usageShortTerm') }}</dt>
                  <dd>{{ percent(game.shortTermSpent) }}</dd>
                </div>
              </dl>
            </div>
          </summary>

          <div class="game-detail">
            <div class="detail-grid">
              <section>
                <h4>{{ $t('aiArena.usageBreakdown') }}</h4>
                <p v-if="game.unknownUsageRequests" class="usage-warning">{{ $t('aiArena.usageIncomplete') }}</p>
                <dl class="detail-list">
                  <div>
                    <dt>{{ $t('aiArena.usageInput') }}</dt>
                    <dd>{{ number(game.inputTokens) }}</dd>
                  </div>
                  <div>
                    <dt>{{ $t('aiArena.usageCached') }}</dt>
                    <dd>{{ number(game.cachedTokens) }}</dd>
                  </div>
                  <div>
                    <dt>{{ $t('aiArena.usageOutput') }}</dt>
                    <dd>{{ number(game.outputTokens) }}</dd>
                  </div>
                  <div>
                    <dt>{{ $t('aiArena.usageReasoning') }}</dt>
                    <dd>{{ number(game.reasoningTokens) }}</dd>
                  </div>
                  <div>
                    <dt>{{ $t('aiArena.usageRequests') }}</dt>
                    <dd>{{ number(game.requests) }}</dd>
                  </div>
                </dl>
                <p class="usage-secondary">{{ $t('aiArena.usageTokenHint') }}</p>
              </section>
              <section>
                <h4>{{ $t('aiArena.usageSettings') }}</h4>
                <dl class="detail-list">
                  <template v-for="(setting, index) in game.settings" :key="index">
                    <div>
                      <dt>{{ $t('aiArena.usageModel') }}</dt>
                      <dd>{{ setting.model || $t('aiArena.usageNoData') }}</dd>
                    </div>
                    <div>
                      <dt>{{ $t('aiArena.usageEffort') }}</dt>
                      <dd>{{ setting.reasoning || $t('aiArena.usageNoData') }}</dd>
                    </div>
                  </template>
                  <div>
                    <dt>{{ $t('aiArena.usageLanguage') }}</dt>
                    <dd>{{ language(game.language) }}</dd>
                  </div>
                </dl>
                <dl class="game-options">
                  <div>
                    <dt>{{ $t('options.roles') }}</dt>
                    <dd>{{ optionList(game.options?.roles, 'roles', true) }}</dd>
                  </div>
                  <div>
                    <dt>{{ $t('options.addons') }}</dt>
                    <dd>{{ optionList(game.options?.addons, 'addons') }}</dd>
                  </div>
                  <div>
                    <dt>{{ $t('options.features') }}</dt>
                    <dd>{{ optionList(game.options?.features, 'options') }}</dd>
                  </div>
                  <div v-if="game.options?.features">
                    <dt>{{ $t('aiArena.usageTimers') }}</dt>
                    <dd>{{ game.options.features.useCustomTimer ? $t('timerUi.manual') : timers(game) }}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <footer class="detail-footer">
              <RouterLink :to="{ name: 'room', params: { uuid: game.roomID } }">{{
                $t('aiArena.usageOpenGame')
              }}</RouterLink>
              <span class="usage-secondary game-id">ID: {{ game.roomID }}</span>
              <span v-if="game.checkedAt" class="usage-secondary">{{
                $t('aiArena.usageMeasured', { date: date(game.checkedAt) })
              }}</span>
            </footer>
          </div>
        </details>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AiGameUsage, AiAccountUsage } from '@avalon/types';
const props = defineProps<{ games: AiGameUsage[]; accountUsage: AiAccountUsage[] }>();
const { locale, t, te } = useI18n();
const account = ref('');
const accounts = computed(() =>
  [
    ...new Set([
      ...(props.games ?? []).map((game) => game.instanceID),
      ...(props.accountUsage ?? []).map((usage) => usage.instanceID),
    ]),
  ].sort(),
);
watch(accounts, (ids) => {
  if (account.value && !ids.includes(account.value)) account.value = '';
});
const visible = computed(() =>
  (props.games ?? []).filter((game) => !account.value || game.instanceID === account.value),
);
const visibleUsage = computed(() =>
  (props.accountUsage ?? []).filter((usage) => !account.value || usage.instanceID === account.value),
);
const statusIcons: Record<AiGameUsage['status'], string> = {
  ready: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
  running: 'M8 4v16l12-8Z',
  paused: 'M8 5v14M16 5v14',
  finished: 'M20 11v1a8 8 0 1 1-5-7M8 11l4 4 9-10',
  stopped: 'M5 5h14v14H5Z',
};
const botIcons: Record<string, string> = {
  beginner: 'M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1ZM12 6v15',
  regular: 'M12 3v3M9 3h6M5 7h14v13H5zM2 11v5M22 11v5M9 16h6M9 11h.01M15 11h.01',
  smart:
    'M12 18V5a3 3 0 0 0-5.9-.8 4 4 0 0 0-2.4 6.5 4 4 0 0 0 .5 7.1A4 4 0 0 0 12 18Zm0 0V5a3 3 0 0 1 5.9-.8 4 4 0 0 1 2.4 6.5 4 4 0 0 1-.5 7.1A4 4 0 0 1 12 18ZM8 8c0 2-1 3-3 3M16 8c0 2 1 3 3 3M7 16c2-1 3 0 3 1M17 16c-2-1-3 0-3 1',
  custom: 'M4 7h6M14 7h6M4 17h10M18 17h2M10 4v6M14 14v6',
};
const number = (value: number) => value.toLocaleString(locale.value);
const date = (timestamp: number) =>
  new Date(timestamp).toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
const percent = (value: number | null) =>
  value === null
    ? t('aiArena.usageNoData')
    : t('aiArena.usagePercent', { value: value.toLocaleString(locale.value, { maximumFractionDigits: 4 }) });
const atLeast = (value: string, incomplete: boolean) => (incomplete ? t('aiArena.usageAtLeast', { value }) : value);
const tokenTotal = (games: AiGameUsage[]) =>
  number(games.reduce((total, game) => total + game.inputTokens + game.outputTokens, 0));
const mode = (game: AiGameUsage) =>
  t(`aiArena.${game.mode === 'custom' ? 'usageCustom' : `dashboardMode${game.mode}`}`);
const language = (value?: string) =>
  value ? new Intl.DisplayNames([locale.value], { type: 'language' }).of(value) : t('aiArena.usageNoData');
function optionList(options: object | undefined, group: string, counts = false) {
  return (
    Object.entries(options ?? {})
      .filter(([key, value]) =>
        counts ? typeof value === 'number' && value > 0 : value === true && key !== 'useCustomTimer',
      )
      .map(
        ([key, value]) =>
          `${te(`${group}.${key}`) ? t(`${group}.${key}`) : key}${counts && Number(value) > 1 ? ` ×${value}` : ''}`,
      )
      .join(', ') || t('aiArena.usageNone')
  );
}
function timers(game: AiGameUsage) {
  return (
    Object.entries(game.options?.features?.timerDurations ?? {})
      .map(([key, timer]) => {
        const translation = `options.stage${key[0].toUpperCase()}${key.slice(1)}`;
        const label = te(translation) ? t(translation) : key;
        return `${label}: ${timer.enabled !== true ? t('aiArena.usageDisabled') : timer.duration === undefined || timer.duration <= 0 ? t('aiArena.usageDefault') : t('aiArena.usageSeconds', { count: timer.duration })}`;
      })
      .join(', ') || t('aiArena.usageDisabled')
  );
}
</script>

<style scoped>
.usage {
  margin-top: 2rem;
  font-variant-numeric: tabular-nums;
}
.usage h2,
.usage h3,
.usage h4,
.usage p,
.usage dl,
.usage dd {
  margin: 0;
}
.usage h2 {
  font-size: 1.35rem;
}
.usage h3 {
  font-size: 1rem;
  font-weight: 600;
}
.usage h4 {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}
.usage-heading,
.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.usage-heading p {
  margin-top: 0.35rem;
}
.usage-secondary,
.metric-label,
dt {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 0.875rem;
}
.account-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}
select {
  color: inherit;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 0.4rem;
  padding: 0.5rem 0.75rem;
  min-height: 44px;
  max-width: 100%;
  font: inherit;
}
.usage-help {
  margin: 1rem 0 1.75rem;
  font-size: 0.875rem;
}
.usage-help summary {
  color: rgb(var(--v-theme-primary));
  width: fit-content;
  padding: 0.4rem 0;
  cursor: pointer;
}
.usage-help p {
  max-width: 70ch;
  margin: 0.5rem 0;
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.account-row {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) 3fr;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
.account-name,
.game-identity,
.game-players,
.game-tokens {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  min-width: 0;
}
.account-name strong,
.game-identity span {
  overflow-wrap: anywhere;
}
.account-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.account-metrics dd {
  margin-top: 0.3rem;
  overflow-wrap: anywhere;
}
.game-history {
  margin-top: 2rem;
}
.history-heading {
  margin-bottom: 0.5rem;
}
.game-entry {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}
.game-entry > summary {
  list-style: none;
  cursor: pointer;
  border-radius: 0.35rem;
}
.game-entry > summary::-webkit-details-marker {
  display: none;
}
.game-entry > summary:hover {
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.game-entry > summary:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.game-summary {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.9fr 1.1fr;
  align-items: start;
  gap: 1rem;
  padding: 1.1rem 0.3rem;
}
.game-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.2rem 0;
}
.game-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 0.35rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 0.8rem;
  line-height: 1.4;
}
.language-flag {
  flex-shrink: 0;
  border-radius: 2px;
  object-fit: cover;
}
.game-badge svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.status-finished {
  color: rgb(var(--v-theme-success));
}
.status-running {
  color: rgb(var(--v-theme-primary));
}
.status-paused {
  color: rgb(var(--v-theme-warning));
}
.status-stopped,
.status-ready,
.language-badge {
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.game-identity time {
  font-weight: 600;
}
.game-players span {
  font-size: 0.875rem;
}
.game-tokens strong {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.game-quota > div + div {
  margin-top: 0.45rem;
}
.game-quota dd {
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}
.details-label {
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.when-open,
.game-entry[open] .when-closed {
  display: none;
}
.game-entry[open] .when-open {
  display: inline;
}
.game-detail {
  padding: 0.25rem 0.3rem 1.25rem;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 1.25rem;
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.detail-list > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  margin-bottom: 0.5rem;
}
.detail-list dd,
.game-options dd {
  overflow-wrap: anywhere;
  font-size: 0.875rem;
}
.detail-grid .usage-secondary {
  margin-top: 0.75rem;
}
.game-options > div {
  margin-top: 0.75rem;
}
.usage-warning {
  margin-bottom: 0.75rem !important;
  font-size: 0.875rem;
}
.detail-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}
.game-id {
  overflow-wrap: anywhere;
}
.usage-empty {
  padding: 1.5rem 0;
}
@media (max-width: 680px) {
  .account-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .account-name {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .account-metrics {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem 1rem;
  }
  .account-metrics > div:first-child {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
  }
  .account-metrics > div:first-child dd {
    margin-top: 0;
  }
  .game-summary {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .game-identity {
    grid-column: 1 / -1;
  }
  .game-quota {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .game-quota > div + div {
    margin-top: 0;
  }
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1rem;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .game-entry > summary {
    transition: background-color 0.12s ease;
  }
}
</style>
