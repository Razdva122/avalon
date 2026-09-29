<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('servant.seoHeading') }}
    </h1>

    <WikiRoleGuide role="servant" />

    <TopRolePlayer role="servant" class="my-4" />

    <h2>{{ $t('servant.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('servant.tipActiveObservationTitle') }}</strong>
        {{ $t('servant.tipActiveObservationText') }}
      </li>
      <li>
        <strong>{{ $t('servant.tipCommunicationTitle') }}</strong>
        {{ $t('servant.tipCommunicationText') }}
      </li>
      <li>
        <strong>{{ $t('servant.tipVotingStrategyTitle') }}</strong>
        {{ $t('servant.tipVotingStrategyText') }}
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
