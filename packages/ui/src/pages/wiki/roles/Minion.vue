<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('minion.seoHeading') }}
    </h1>
    <WikiRoleGuide role="minion" />

    <TopRolePlayer role="minion" class="my-4" />

    <h2>{{ $t('minion.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('minion.tipDiscreetCollaborationTitle') }}</strong>
        {{ $t('minion.tipDiscreetCollaborationText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipDeceptionTitle') }}</strong>
        {{ $t('minion.tipDeceptionText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipPublicDemeanorTitle') }}</strong>
        {{ $t('minion.tipPublicDemeanorText') }}
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
