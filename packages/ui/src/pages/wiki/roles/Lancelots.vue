<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      <div class="evil-loyalty-icon"></div>
      {{ $t('lancelots.seoHeading') }}
    </h1>
    <WikiRoleGuide role="lancelots" />

    <div class="d-flex flex-wrap">
      <div class="flex-grow-1">
        <TopRolePlayer role="goodLancelot" :displayRole="true" class="my-4" />
      </div>
      <div class="flex-grow-1">
        <TopRolePlayer role="evilLancelot" :displayRole="true" class="my-4" />
      </div>
    </div>

    <h2>{{ $t('lancelots.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('lancelots.embraceUnpredictabilityTitle') }}</strong>
        {{ $t('lancelots.embraceUnpredictabilityDescription') }}
      </li>
      <li>
        <strong>{{ $t('lancelots.dualityOfRolesTitle') }}</strong>
        {{ $t('lancelots.dualityOfRolesDescription') }}
      </li>
      <li>
        <strong>{{ $t('lancelots.observeAndAdaptTitle') }}</strong>
        {{ $t('lancelots.observeAndAdaptDescription') }}
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
