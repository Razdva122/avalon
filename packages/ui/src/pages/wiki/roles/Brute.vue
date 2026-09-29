<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('brute.seoHeading') }}
    </h1>
    <WikiRoleGuide role="brute" />

    <TopRolePlayer role="brute" class="my-4" />

    <h2>{{ $t('brute.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('brute.earlyMissionFlexibility') }}</strong>
        <LocalizedTextWrapper keypath="brute.earlyMissionFlexibilityDescription" />
      </li>
      <li>
        <strong>{{ $t('brute.maintainUnpredictability') }}</strong>
        <LocalizedTextWrapper keypath="brute.maintainUnpredictabilityDescription" />
      </li>
      <li>
        <strong>{{ $t('brute.strategicSuccessLater') }}</strong>
        <LocalizedTextWrapper keypath="brute.strategicSuccessLaterDescription" />
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
