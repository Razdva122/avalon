<template>
  <section class="usage" aria-labelledby="usage-heading">
    <header class="usage-heading">
      <h2 id="usage-heading">{{ $t('aiArena.usageTitle') }}</h2>
      <label
        >{{ $t('aiArena.usageAccount') }}
        <select v-model="account">
          <option value="">{{ $t('aiArena.usageAll') }}</option>
          <option v-for="id in accounts" :key="id" :value="id">{{ id }}</option>
        </select>
      </label>
    </header>
    <p class="muted">{{ $t('aiArena.usageHint') }}</p>
    <p class="muted">{{ $t('aiArena.usageLive') }}</p>
    <p v-if="!visible.length">{{ $t('aiArena.usageEmpty') }}</p>
    <div v-else class="usage-scroll" tabindex="0" :aria-label="$t('aiArena.usageTitle')">
      <table>
        <caption>
          {{
            $t('aiArena.usageAccount')
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ $t('aiArena.usageAccount') }}</th>
            <th scope="col">{{ $t('aiArena.usageGames') }}</th>
            <th scope="col">{{ $t('aiArena.usageTokens') }}</th>
            <th scope="col">{{ $t('aiArena.usageQuota') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="id in visibleAccounts" :key="id">
            <th scope="row">{{ id }}</th>
            <td>{{ forAccount(id).length }}</td>
            <td>{{ tokenTotal(forAccount(id)) }}</td>
            <td>
              {{ quotaTotal(forAccount(id), 'weeklySpent') }} / {{ quotaTotal(forAccount(id), 'shortTermSpent') }}
            </td>
          </tr>
        </tbody>
      </table>
      <table>
        <caption>
          {{
            $t('aiArena.usageGame')
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ $t('aiArena.usageGame') }}</th>
            <th scope="col">{{ $t('aiArena.usageAccount') }}</th>
            <th scope="col">{{ $t('aiArena.usagePlayers') }}</th>
            <th scope="col">{{ $t('aiArena.usageSettings') }}</th>
            <th scope="col">{{ $t('aiArena.usageTokens') }}</th>
            <th scope="col">{{ $t('aiArena.usageQuota') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="game in visible" :key="game.roomID">
            <th scope="row">
              <RouterLink :to="{ name: 'room', params: { uuid: game.roomID } }">{{ game.roomID }}</RouterLink>
              <small>{{ new Date(game.startedAt).toLocaleString(locale) }}</small>
              <small>{{ $t(`aiArena.${game.status}`) }}</small>
            </th>
            <td>{{ game.instanceID }}</td>
            <td>{{ game.humanCount }} / {{ game.botCount }}</td>
            <td>
              <span v-for="(setting, index) in game.settings" :key="index" class="setting">
                {{ setting.model || '—' }} · {{ setting.reasoning || '—' }}
              </span>
              <small
                >{{ game.mode === 'custom' ? '—' : $t(`aiArena.dashboardMode${game.mode}`) }} ·
                {{ game.language }}</small
              >
              <details>
                <summary>{{ $t('aiArena.usageOptions') }}</summary>
                <pre>{{ JSON.stringify(game.options, null, 2) }}</pre>
              </details>
            </td>
            <td>
              <strong>{{ tokenTotal([game]) }}</strong>
              <details>
                <summary>{{ $t('aiArena.usageBreakdown') }}</summary>
                <small
                  >{{ number(game.inputTokens) }} / {{ number(game.cachedTokens) }} / {{ number(game.outputTokens) }} /
                  {{ number(game.reasoningTokens) }}</small
                >
                <small>{{ $t('aiArena.usageRequests') }}: {{ game.requests }}</small>
              </details>
            </td>
            <td>
              {{ percent(game.weeklySpent) }} / {{ percent(game.shortTermSpent) }}
              <small v-if="game.checkedAt">{{ new Date(game.checkedAt).toLocaleString(locale) }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AiGameUsage } from '@avalon/types';
const props = defineProps<{ games: AiGameUsage[] }>();
const { locale } = useI18n();
const account = ref('');
const accounts = computed(() => [...new Set((props.games ?? []).map((game) => game.instanceID))].sort());
const visible = computed(() =>
  (props.games ?? []).filter((game) => !account.value || game.instanceID === account.value),
);
const visibleAccounts = computed(() =>
  account.value ? accounts.value.filter((id) => id === account.value) : accounts.value,
);
const forAccount = (id: string) => visible.value.filter((game) => game.instanceID === id);
const number = (value: number) => value.toLocaleString(locale.value);
const percent = (value: number | null) =>
  value === null ? '—' : value.toLocaleString(locale.value, { maximumFractionDigits: 4 });
const tokenTotal = (games: AiGameUsage[]) =>
  (games.some((game) => game.unknownUsageRequests > 0) ? '≥ ' : '') +
  number(games.reduce((total, game) => total + game.inputTokens + game.outputTokens, 0));
function quotaTotal(games: AiGameUsage[], key: 'weeklySpent' | 'shortTermSpent') {
  const known = games.filter((game) => game[key] !== null);
  return known.length
    ? (known.length < games.length ? '≥ ' : '') + percent(known.reduce((sum, game) => sum + game[key]!, 0))
    : '—';
}
</script>

<style scoped>
.usage {
  margin-top: 2rem;
}
.usage-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
select {
  color: inherit;
  background: rgb(var(--v-theme-surface));
  border: 1px solid currentColor;
  border-radius: 0.4rem;
  padding: 0.5rem;
  min-height: 44px;
}
.usage-scroll {
  overflow-x: auto;
  margin-top: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  text-align: left;
}
caption {
  text-align: left;
  font-weight: 600;
  padding: 0.5rem;
}
th,
td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  vertical-align: top;
}
tbody th {
  font-weight: 400;
  max-width: 18rem;
  overflow-wrap: anywhere;
}
small,
.setting {
  display: block;
  margin-top: 0.3rem;
}
small {
  opacity: 0.75;
}
summary {
  cursor: pointer;
  padding: 0.5rem 0;
}
pre {
  max-width: 22rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.8rem;
}
</style>
