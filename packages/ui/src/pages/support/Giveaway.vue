<template>
  <section id="giveaway" class="giveaway" aria-labelledby="giveaway-title">
    <h2 id="giveaway-title">{{ t('giveaway.title') }}</h2>
    <p>{{ t('giveaway.intro') }}</p>
    <p class="timing">{{ t('giveaway.timing') }}</p>
    <div class="giveaway-links">
      <LocaleLink :to="{ name: 'community_solo' }">{{ t('giveaway.soloCTA') }} →</LocaleLink>
      <LocaleLink :to="{ name: 'community_group' }">{{ t('giveaway.groupCTA') }} →</LocaleLink>
    </div>
    <details class="giveaway-rules">
      <summary>{{ t('giveaway.rulesTitle') }}</summary>
      <p v-for="rule in ['eligibility', 'premiumRule', 'partyRule', 'chancesRule', 'liveRule']" :key="rule">
        {{ t(`giveaway.${rule}`) }}
      </p>
    </details>
    <div class="giveaway-results" :aria-busy="loading">
      <p v-if="loading" role="status">{{ t('giveaway.loading') }}</p>
      <div v-else-if="error" role="alert">
        <p>{{ t('giveaway.error') }}</p>
        <button type="button" @click="load">{{ t('giveaway.retry') }}</button>
      </div>
      <template v-else-if="data">
        <p>{{ t('giveaway.nextDraw', { date: date(data.nextDrawAt) }) }}</p>
        <template v-if="data.latestDraw">
          <h3>{{ t('giveaway.latestDraw', { date: date(data.latestDraw.drawAt) }) }}</h3>
          <ul class="winner-list">
            <li v-for="category in ['solo', 'group'] as const" :key="category">
              <strong>{{ t(`giveaway.${category}Prize`) }}</strong>
              <template v-if="data.latestDraw[category]">
                <LocaleLink :to="{ name: 'user_stats', params: { uuid: data.latestDraw[category]!.userID } }">{{
                  data.latestDraw[category]!.name
                }}</LocaleLink>
                <span v-if="category === 'group'">{{ data.latestDraw.group!.groupName }}</span>
              </template>
              <span v-else>{{ t('giveaway.noWinner') }}</span>
            </li>
          </ul>
        </template>
        <p v-else>{{ t('giveaway.noDraw') }}</p>
      </template>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GiveawayState } from '@avalon/types/giveaway';
import { giveawayRequest } from '@/api/support';
import LocaleLink from '@/components/feedback/LocaleLink.vue';
const { t, locale } = useI18n();
const data = ref<GiveawayState | null>(null);
const loading = ref(true);
const error = ref(false);
let revision = 0;
async function load() {
  const request = ++revision;
  loading.value = true;
  error.value = false;
  try {
    const response = await giveawayRequest();
    if (request === revision) data.value = response;
  } catch {
    if (request === revision) error.value = true;
  } finally {
    if (request === revision) loading.value = false;
  }
}
function date(value: string) {
  return (
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Yekaterinburg',
    }).format(new Date(value)) + ' (UTC+5)'
  );
}
onMounted(load);
onBeforeUnmount(() => {
  ++revision;
});
</script>
<style scoped lang="scss">
.giveaway {
  margin: 24px 0;
  padding: 24px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  scroll-margin-top: 90px;
}
h2 {
  font-size: 22px;
}
p {
  margin: 10px 0;
  line-height: 1.6;
}
.timing {
  font-weight: 600;
}
.giveaway-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 12px 0;
}
a {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 3px;
}
.giveaway-links a,
summary {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
summary {
  display: list-item;
  padding: 10px 0;
  cursor: pointer;
}
.giveaway-results {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(var(--v-theme-surface-border));
  min-height: 88px;
}
h3 {
  font-size: 17px;
}
.winner-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}
.winner-list li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-wrap: anywhere;
}
button {
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 6px;
}
:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
@media (max-width: 560px) {
  .giveaway {
    padding: 16px;
  }
  .winner-list {
    grid-template-columns: 1fr;
  }
}
</style>
