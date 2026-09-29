<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('lovers.seoHeading') }}
    </h1>
    <WikiRoleGuide role="lovers" />

    <div class="d-flex flex-wrap">
      <div class="flex-grow-1">
        <TopRolePlayer role="tristan" :displayRole="true" class="my-4" />
      </div>
      <div class="flex-grow-1">
        <TopRolePlayer role="isolde" :displayRole="true" class="my-4" />
      </div>
    </div>

    <h2>{{ $t('lovers.generalTips') }}</h2>
    <ul>
      <li v-html="$t('lovers.maintainIndividualPersonas')"></li>
      <li v-html="$t('lovers.protectEachOther')"></li>
      <li v-html="$t('lovers.disguiseYourGameplay')"></li>
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
