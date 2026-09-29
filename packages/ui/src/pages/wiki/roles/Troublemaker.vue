<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('troublemaker.seoHeading') }}
    </h1>
    <WikiRoleGuide role="troublemaker" />

    <TopRolePlayer role="troublemaker" class="my-4" />

    <h2>{{ $t('troublemaker.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('troublemaker.generalTipsRevealTitle') }}:</strong>
        <LocalizedTextWrapper keypath="troublemaker.generalTipsRevealDesc" />
      </li>
      <li>
        <strong>{{ $t('troublemaker.generalTipsCounteractTitle') }}:</strong>
        <LocalizedTextWrapper keypath="troublemaker.generalTipsCounteractDesc" />
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
