<template>
  <aside class="giveaway-banner">
    <GiveawayEmblem class="banner-emblem" />
    <div class="banner-copy">
      <strong>{{ $t('giveaway.bannerTitle') }}</strong>
      <p><GiveawayTime compact /></p>
    </div>
    <nav :aria-label="$t('giveaway.title')">
      <LocaleLink class="entry-link" :to="{ name: 'community_solo' }"
        ><span class="material-icons" aria-hidden="true">person</span>{{ $t('giveaway.soloShortCTA') }}</LocaleLink
      >
      <LocaleLink class="entry-link" :to="{ name: 'community_group' }"
        ><span class="material-icons" aria-hidden="true">groups</span>{{ $t('giveaway.groupShortCTA') }}</LocaleLink
      >
      <LocaleLink class="rules-link" :to="{ name: 'support', hash: '#giveaway' }">{{ $t('wiki.rules') }}</LocaleLink>
    </nav>
  </aside>
</template>
<script setup lang="ts">
import LocaleLink from '@/components/feedback/LocaleLink.vue';
import GiveawayEmblem from './GiveawayEmblem.vue';
import GiveawayTime from './GiveawayTime.vue';
</script>
<style scoped lang="scss">
.giveaway-banner {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
  padding: 10px 16px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 12px;
  background: rgba(var(--v-theme-support-accent), 0.06);
}
strong {
  font-size: 16px;
  line-height: 1.35;
}
p {
  font-size: 12px;
  line-height: 1.4;
  margin: 3px 0 0;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
}
a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  color: rgb(var(--v-theme-support-accent));
  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.material-icons {
  font-size: 18px;
}
a:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .giveaway-banner {
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 0 10px;
    padding: 10px 12px;
  }
  nav {
    grid-column: 1 / -1;
  }
}
</style>
