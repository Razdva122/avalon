<template>
  <aside class="giveaway-banner">
    <div>
      <strong>{{ $t('giveaway.bannerTitle') }}</strong>
      <p>{{ $t('giveaway.timing') }}</p>
    </div>
    <nav :aria-label="$t('giveaway.title')">
      <LocaleLink :to="{ name: 'community_solo' }">{{ $t('giveaway.soloCTA') }} →</LocaleLink>
      <LocaleLink :to="{ name: 'community_group' }">{{ $t('giveaway.groupCTA') }} →</LocaleLink>
      <LocaleLink :to="{ name: 'support', hash: '#giveaway' }">{{ $t('giveaway.rulesTitle') }}</LocaleLink>
    </nav>
  </aside>
</template>
<script setup lang="ts">
import LocaleLink from '@/components/feedback/LocaleLink.vue';
</script>
<style scoped lang="scss">
.giveaway-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  margin: 0 0 20px;
  padding: 14px 18px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 12px;
  background: rgba(var(--v-theme-support-accent), 0.06);
}
strong {
  font-size: 16px;
}
p {
  font-size: 13px;
  margin: 4px 0 0;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
}
a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
a:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
</style>
