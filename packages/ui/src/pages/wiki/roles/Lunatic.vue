<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('lunatic.seoHeading') }}
    </h1>
    <WikiRoleGuide role="lunatic" />

    <TopRolePlayer role="lunatic" class="my-4" />

    <h2>{{ $t('lunatic.generalTipsHeader') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('lunatic.strategicFailure') }}</strong>
        {{ $t('lunatic.strategicFailureDetails') }}
      </li>
      <li>
        <strong>{{ $t('lunatic.deceiveWithBluff') }}</strong>
        {{ $t('lunatic.bluffTechnique') }}
      </li>
      <li>
        <strong>{{ $t('lunatic.covertSupportAllies') }}</strong>
        {{ $t('lunatic.subtleAlignment') }}
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
