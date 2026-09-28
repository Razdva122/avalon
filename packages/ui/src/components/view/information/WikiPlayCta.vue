<template>
  <aside class="wiki-play-cta" :aria-label="$t('wikiPlay.title')">
    <div>
      <strong>{{ $t('wikiPlay.title') }}</strong>
      <p>{{ $t('wikiPlay.description') }}</p>
    </div>
    <nav :aria-label="$t('wikiPlay.title')">
      <LocaleLink class="play-link" :to="{ name: 'lobby' }">{{ $t('wikiPlay.play') }}</LocaleLink>
      <LocaleLink v-if="showRules" :to="{ name: 'rules' }">{{ $t('wikiPlay.rules') }}</LocaleLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import LocaleLink from '@/components/feedback/LocaleLink.vue';
withDefaults(defineProps<{ showRules?: boolean }>(), { showRules: true });
</script>

<style scoped lang="scss">
.wiki-play-cta {
  margin-top: 36px;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  font-size: 16px;
  line-height: 1.6;

  strong {
    font-size: 18px;
  }

  p {
    margin: 6px 0 16px;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 8px 16px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 10px;
    color: inherit;
    text-decoration: none;
  }

  .play-link {
    font-weight: 700;
    background: rgba(var(--v-theme-primary), 0.1);
  }

  a:hover {
    background: rgba(var(--v-theme-primary), 0.16);
  }

  a:focus-visible {
    outline: 3px solid rgb(var(--v-theme-primary));
    outline-offset: 4px;
  }
}
</style>
