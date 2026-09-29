<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>{{ $t('lady.seoHeading') }}</h1>
    <div class="addon-overview">
      <SchemaImage
        class="addon-image"
        :src="getImagePathByID('features', 'lady_of_lake')"
        :alt="$t('addons.ladyOfLake')"
        :description="$t('addons.ladyOfLake')"
      />
      <p><LocalizedTextWrapper keypath="lady.seoIntro" /></p>
    </div>
    <section class="addon-rules">
      <h2>{{ $t('wiki.rules') }}</h2>
      <ol>
        <li v-for="number in 3" :key="number"><LocalizedTextWrapper :keypath="`lady.seoRule${number}`" /></li>
      </ol>
    </section>
    <section class="wiki-panel addon-limits">
      <h2>{{ $t('wiki.roleLimit') }}</h2>
      <p><LocalizedTextWrapper keypath="lady.seoLimit1" /></p>
      <p><LocalizedTextWrapper keypath="lady.seoLimit2" /></p>
    </section>
    <section class="addon-scenarios">
      <h2>{{ $t('wiki.roleScenarios') }}</h2>
      <ul>
        <li v-for="number in 2" :key="number"><LocalizedTextWrapper :keypath="`lady.seoScenario${number}`" /></li>
      </ul>
    </section>
    <nav class="wiki-nav" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'expansions' }">{{ $t('wiki.addonsTitle') }}</LocaleLink>
      <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.rolesTitle') }}</LocaleLink>
    </nav>

    <WikiPlayCta />
  </div>
</template>

<script setup lang="ts">
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import WikiPlayCta from '@/components/view/information/WikiPlayCta.vue';
import { getImagePathByID } from '@/helpers/images';
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';
@import '@/styles/wiki-addon.scss';
</style>
