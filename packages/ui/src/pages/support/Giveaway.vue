<template>
  <section id="giveaway" class="giveaway" aria-labelledby="giveaway-title">
    <header class="giveaway-heading">
      <div>
        <span class="prize-badge"
          ><span class="material-icons" aria-hidden="true">all_inclusive</span>{{ t('support.lifetimePremium') }}</span
        >
        <h2 id="giveaway-title">{{ t('giveaway.title') }}</h2>
        <p>{{ t('giveaway.intro') }}</p>
        <p class="timing">
          <span class="material-icons" aria-hidden="true">schedule</span><GiveawayTime :at="data?.nextDrawAt" />
        </p>
      </div>
      <GiveawayEmblem class="prize-emblem" />
    </header>
    <div class="giveaway-links">
      <LocaleLink :to="{ name: 'community_solo' }"
        ><span class="material-icons" aria-hidden="true">person</span>{{ t('giveaway.soloCTA') }}</LocaleLink
      >
      <LocaleLink :to="{ name: 'community_group' }"
        ><span class="material-icons" aria-hidden="true">groups</span>{{ t('giveaway.groupCTA') }}</LocaleLink
      >
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
        <p class="next-draw">
          <span class="material-icons" aria-hidden="true">event</span
          >{{ t('giveaway.nextDraw', { date: date(data.nextDrawAt) }) }}
        </p>
        <template v-if="data.latestDraw">
          <h3>{{ t('giveaway.latestDraw', { date: date(data.latestDraw.drawAt) }) }}</h3>
          <ul class="winner-list">
            <li v-for="category in ['solo', 'group'] as const" :key="category">
              <strong class="winner-category"
                ><span class="material-icons" aria-hidden="true">{{ category === 'solo' ? 'person' : 'groups' }}</span
                >{{ t(`giveaway.${category}Prize`) }}</strong
              >
              <template v-if="data.latestDraw[category]">
                <div class="winner-profile">
                  <Avatar
                    :avatarID="data.latestDraw[category]!.avatar"
                    class="winner-avatar"
                    alt=""
                    loading="lazy"
                    width="64"
                    height="64"
                  />
                  <div>
                    <LocaleLink :to="{ name: 'user_stats', params: { uuid: data.latestDraw[category]!.userID } }">{{
                      data.latestDraw[category]!.name
                    }}</LocaleLink>
                    <span v-if="category === 'group'" class="winner-group">{{ data.latestDraw.group!.groupName }}</span>
                  </div>
                </div>
                <span class="winner-reward"
                  ><span class="material-icons" aria-hidden="true">workspace_premium</span
                  >{{ t('support.lifetimePremium') }}</span
                >
              </template>
              <span v-else>{{ t('giveaway.noWinner') }}</span>
            </li>
          </ul>
        </template>
        <p v-else class="first-draw">
          <span class="material-icons" aria-hidden="true">emoji_events</span>{{ t('giveaway.noDraw') }}
        </p>
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
import Avatar from '@/components/user/Avatar.vue';
import GiveawayEmblem from './GiveawayEmblem.vue';
import GiveawayTime from './GiveawayTime.vue';
import { formatGiveawayTime } from './giveaway-time';
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
  return formatGiveawayTime(value, locale.value, undefined, true);
}
onMounted(load);
onBeforeUnmount(() => {
  ++revision;
});
</script>
<style scoped lang="scss">
.giveaway {
  margin: 24px 0;
  padding: 28px;
  border: 1px solid rgba(var(--v-theme-support-accent), 0.45);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(var(--v-theme-support-accent), 0.1), transparent 55%), rgb(var(--v-theme-surface));
  scroll-margin-top: 90px;
}
.giveaway-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 24px;
  align-items: center;
}
.prize-badge,
.winner-reward {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-support-accent));
  font-size: 13px;
  font-weight: 650;
}
.prize-badge {
  padding: 5px 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(var(--v-theme-support-accent), 0.35);
  border-radius: 6px;
}
.material-icons {
  font-size: 21px;
}
h2 {
  font-size: clamp(24px, 3vw, 30px);
  line-height: 1.2;
  text-wrap: balance;
}
p {
  margin: 10px 0;
  line-height: 1.6;
}
.timing {
  font-weight: 600;
}
.timing,
.next-draw,
.first-draw,
.winner-category {
  display: flex;
  align-items: center;
  gap: 10px;
}
.timing .material-icons,
.next-draw .material-icons,
.first-draw .material-icons,
.winner-category .material-icons {
  flex-shrink: 0;
  color: rgb(var(--v-theme-support-accent));
}
.giveaway-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0 10px;
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
.giveaway-links a {
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #b38637;
  border-radius: 8px;
  background: #e7c675;
  color: #382a0c;
  font-weight: 650;
  text-decoration: none;
}
.giveaway-links a:hover {
  background: #f0d791;
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
  gap: 16px;
  padding: 20px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 12px;
  background: rgba(var(--v-theme-support-accent), 0.05);
  overflow-wrap: anywhere;
}
.winner-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}
.winner-profile > div {
  min-width: 0;
}
.winner-profile a {
  font-size: 18px;
  font-weight: 650;
}
.winner-avatar {
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-support-accent), 0.5);
  background: rgb(var(--v-theme-surface));
}
.winner-group {
  display: block;
  margin-top: 4px;
  font-size: 13px;
}
.first-draw {
  padding: 14px 0 0;
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
  .giveaway-heading {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .prize-emblem {
    grid-row: 1;
    width: 126px;
    margin: 0 auto;
  }
  .giveaway-links a {
    width: 100%;
  }
  .winner-list {
    grid-template-columns: 1fr;
  }
}
</style>
