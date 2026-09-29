<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('trickster.seoHeading') }}
    </h1>
    <WikiRoleGuide role="trickster" />

    <TopRolePlayer role="trickster" class="my-4" />

    <h2>{{ $t('trickster.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('trickster.generalTipsCultivateTrustTitle') }}</strong>
        {{ $t('trickster.generalTipsCultivateTrust') }}
      </li>
      <li>
        <strong>{{ $t('trickster.generalTipsCreateConfusionTitle') }}</strong>
        {{ $t('trickster.generalTipsCreateConfusion') }}
      </li>
      <li>
        <strong>{{ $t('trickster.generalTipsMonitorInfluenceTitle') }}</strong>
        {{ $t('trickster.generalTipsMonitorInfluence') }}
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
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';

export default defineComponent({
  components: {
    WikiPlayCta,
    WikiBreadCrumbs,
    WikiRoleGuide,
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
