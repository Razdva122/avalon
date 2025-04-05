<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.servant') }} {{ $t('roles.role') }}
    </h1>

    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('servant')"
      :alt="$t('roles.servant')"
      :description="$t('roles.servant')"
    />

    <h2>{{ $t('servant.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('servant.tipRoleTitle') }}</strong>
        {{ $t('servant.tipRoleText') }}
      </li>
      <li>
        <strong>{{ $t('servant.tipKnowledgeTitle') }}</strong>
        {{ $t('servant.tipKnowledgeText') }}
      </li>
      <li>
        <strong>{{ $t('servant.tipObjectiveTitle') }}</strong>
        {{ $t('servant.tipObjectiveText') }}
      </li>
    </ul>

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
      <li>
        <strong>{{ $t('servant.tipBalancedActivityTitle') }}</strong>
        {{ $t('servant.tipBalancedActivityText') }}
      </li>
      <li>
        <strong>{{ $t('servant.tipFormAlliancesTitle') }}</strong>
        {{ $t('servant.tipFormAlliancesText') }}
      </li>
      <li>
        <strong>{{ $t('servant.tipUseExclusionsTitle') }}</strong>
        {{ $t('servant.tipUseExclusionsText') }}
      </li>
    </ul>

    <p><LocalizedTextWrapper keypath="servant.conclusionText" /></p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
    TopRolePlayer,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
