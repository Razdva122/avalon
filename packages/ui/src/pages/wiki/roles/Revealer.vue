<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('revealer.seoHeading') }}
    </h1>
    <WikiRoleGuide role="revealer" />

    <TopRolePlayer role="revealer" class="my-4" />

    <h2>{{ $t('revealer.commonAdviceTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('revealer.commonAdviceTakeResponsibilityHeading') }}</strong>
        {{ $t('revealer.commonAdviceTakeResponsibilityText') }}
      </li>
      <li>
        <strong>{{ $t('revealer.commonAdviceConfuseOpponentsHeading') }}</strong>
        {{ $t('revealer.commonAdviceConfuseOpponentsText') }}
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
