<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>{{ $t('trapperGuide.heading') }}</h1>
    <div class="addon-overview">
      <SchemaImage
        class="addon-image"
        :src="getImagePathByID('features', 'trapper')"
        :alt="$t('trapper.name')"
        :description="$t('trapper.name')"
      />
      <p>{{ $t('trapperGuide.intro') }}</p>
    </div>
    <section class="wiki-panel">
      <h2>{{ $t('trapperGuide.limits') }}</h2>
      <p><LocalizedTextWrapper keypath="trapperGuide.limitText" /></p>
    </section>
    <section>
      <h2>{{ $t('trapperGuide.order') }}</h2>
      <ol>
        <li v-for="number in 5" :key="number"><LocalizedTextWrapper :keypath="`trapperGuide.step${number}`" /></li>
      </ol>
      <p>{{ $t('trapperGuide.timer') }}</p>
    </section>
    <section>
      <h2>{{ $t('trapperGuide.swordTitle') }}</h2>
      <p><LocalizedTextWrapper keypath="trapperGuide.swordText" /></p>
    </section>
    <section>
      <h2>{{ $t('trapperGuide.visibilityTitle') }}</h2>
      <p>{{ $t('trapperGuide.visibilityText') }}</p>
    </section>
    <section>
      <h2>{{ $t('trapperGuide.examples') }}</h2>
      <ul>
        <li v-for="number in 3" :key="number">{{ $t(`trapperGuide.example${number}`) }}</li>
      </ul>
    </section>
    <nav class="wiki-nav" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'rules' }">{{ $t('wiki.rules') }}</LocaleLink>
      <LocaleLink :to="{ name: 'expansions' }">{{ $t('wiki.addonsTitle') }}</LocaleLink>
    </nav>
    <WikiPlayCta />
  </div>
</template>

<script setup lang="ts">
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import WikiPlayCta from '@/components/view/information/WikiPlayCta.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import { getImagePathByID } from '@/helpers/images';
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';
@import '@/styles/wiki-addon.scss';
</style>
