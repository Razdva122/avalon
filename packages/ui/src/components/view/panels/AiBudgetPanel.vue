<template>
  <div class="ai-budget" aria-live="polite">
    <strong>{{ $t(budget.periodDays ? 'aiArena.periodBudget' : 'aiArena.experimentBudget') }}</strong>
    <p>{{ $t('aiArena.budgetUsed', { used: budget.usedRub.toFixed(2), limit: budget.limitRub }) }}</p>
    <progress :value="budget.usedRub" :max="budget.limitRub" :aria-label="$t('aiArena.periodBudget')" />
    <p>{{ $t('aiArena.budgetRemaining', { amount: budget.remainingRub.toFixed(2) }) }}</p>
    <p v-if="budget.periodStart && budget.periodEnd">
      {{ date(budget.periodStart) }} — {{ date(budget.periodEnd) }} (MSK)
    </p>
    <p v-if="resetIn" class="ai-budget-countdown">
      {{ $t(resetIn.expired ? 'aiArena.budgetResetPending' : 'aiArena.budgetResetIn', resetIn) }}
    </p>
    <p>
      {{ $t('aiArena.gameBudget', { limit: matchLimit ?? budget.matchLimitRub })
      }}<span v-if="cost !== undefined"> · {{ cost.toFixed(2) }} ₽</span>
    </p>
    <small>{{ $t('aiArena.budgetReserved') }}</small>
  </div>
</template>
<script setup lang="ts">
import type { AiBudgetSnapshot } from '@avalon/types';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
const props = defineProps<{ budget: AiBudgetSnapshot; cost?: number; matchLimit?: number }>();
const { locale } = useI18n();
const now = useNow({ interval: 1000 });
const resetIn = computed(() => {
  const end = Date.parse(props.budget.periodEnd || '');
  if (!Number.isFinite(end)) return null;
  const minutes = Math.max(0, Math.ceil((end - now.value.getTime()) / 60000));
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
    expired: minutes === 0,
  };
});
const date = (value: string) =>
  new Date(value).toLocaleDateString(locale.value.replace('_', '-'), { timeZone: 'Europe/Moscow' });
</script>
<style scoped>
.ai-budget {
  margin: 8px 0;
  padding: 8px;
  border: 1px solid currentColor;
  border-radius: 8px;
  font-size: 12px;
}
p {
  margin: 4px 0;
}
progress {
  width: 100%;
}
</style>
