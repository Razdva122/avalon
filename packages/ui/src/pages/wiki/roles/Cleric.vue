<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('cleric.seoHeading') }}
    </h1>
    <WikiRoleGuide role="cleric" />

    <TopRolePlayer role="cleric" class="my-4" />

    <h2>{{ $t('cleric.generalTipsHeader') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('cleric.generalTipsRoleUnderstandingHeading') }}</strong>
        {{ $t('cleric.generalTipsRoleUnderstandingText') }}
      </li>
      <li>
        <strong>{{ $t('cleric.generalTipsLoyaltyCautionHeading') }}</strong>
        {{ $t('cleric.generalTipsLoyaltyCautionText') }}
      </li>
      <li>
        <strong>{{ $t('cleric.generalTipsStealthHeading') }}</strong>
        {{ $t('cleric.generalTipsStealthText') }}
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
