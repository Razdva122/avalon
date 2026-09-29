<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('guinevere.seoHeading') }}
    </h1>
    <WikiRoleGuide role="guinevere" />

    <TopRolePlayer role="guinevere" class="my-4" />

    <h2>{{ $t('guinevere.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('guinevere.cautiousKnowledgeTitle') }}</strong>
        <LocalizedTextWrapper keypath="guinevere.cautiousKnowledgeText" />
      </li>
      <li>
        <strong>{{ $t('guinevere.useHintsTitle') }}</strong>
        <LocalizedTextWrapper keypath="guinevere.useHintsText" />
      </li>
      <li>
        <strong>{{ $t('guinevere.balanceGameplayTitle') }}</strong>
        {{ $t('guinevere.balanceGameplayText') }}
      </li>
    </ul>
    <WikiPlayCta />
  </div>
</template>

<script lang="ts">
import WikiPlayCta from '@/components/view/information/WikiPlayCta.vue';
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import WikiRoleGuide from '@/components/view/information/WikiRoleGuide.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';

export default defineComponent({
  components: {
    WikiPlayCta,
    WikiBreadCrumbs,
    WikiRoleGuide,
    LocalizedTextWrapper,
    TopRolePlayer,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';

h2 {
  margin-top: 20px;
}
</style>
