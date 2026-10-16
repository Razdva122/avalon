<template>
  <section class="game-guides" aria-labelledby="game-guides-title">
    <h2 id="game-guides-title">{{ $t('wiki.gameGuides') }}</h2>
    <p>{{ $t('wiki.compareGames') }}</p>
    <nav :aria-label="$t('wiki.gameGuides')">
      <LocaleLink :to="{ name: 'social_deduction_games_online' }">
        <span>{{ $t('wiki.guideSocialDeduction') }}</span
        ><span aria-hidden="true">→</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'games_like_secret_hitler' }">
        <span>{{ $t('wiki.guideSecretHitler') }}</span
        ><span aria-hidden="true">→</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'avalon_vs_werewolf' }">
        <span>{{ $t('wiki.guideWerewolf') }}</span
        ><span aria-hidden="true">→</span>
      </LocaleLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
import LocaleLink from '@/components/feedback/LocaleLink.vue';
</script>

<style scoped lang="scss">
.game-guides {
  margin: 32px 0;
  h2 {
    margin: 0 0 10px;
    font-size: 24px;
    line-height: 1.35;
  }
  p {
    margin: 0 0 18px;
    line-height: 1.65;
  }
  nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    min-height: 72px;
    padding: 16px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
    border-radius: 12px;
    color: inherit;
    background: rgb(var(--v-theme-surface));
    font-size: 16px;
    line-height: 1.5;
    text-decoration: none;
    overflow-wrap: anywhere;
    &:hover {
      border-color: rgb(var(--v-theme-primary));
      background: rgba(var(--v-theme-primary), 0.06);
    }
    &:focus-visible {
      outline: 3px solid rgb(var(--v-theme-primary));
      outline-offset: 3px;
    }
  }
  @media (max-width: 700px) {
    nav {
      grid-template-columns: 1fr;
    }
    a {
      min-height: 56px;
    }
  }
}
</style>
