<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.trickster') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('trickster')"
      :alt="$t('roles.trickster')"
      :description="$t('roles.trickster')"
    />

    <h2>{{ $t('trickster.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="trickster.intro" />
    </p>

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

    <h2>{{ $t('trickster.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('trickster.strategicTipsManipulateVotingTitle') }}</strong>
        {{ $t('trickster.strategicTipsManipulateVoting') }}
      </li>
      <li>
        <strong>{{ $t('trickster.strategicTipsControlInformationFlowTitle') }}</strong>
        {{ $t('trickster.strategicTipsControlInformationFlow') }}
      </li>
      <li>
        <strong>{{ $t('trickster.strategicTipsPrepareDefenseTitle') }}</strong>
        {{ $t('trickster.strategicTipsPrepareDefense') }}
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="trickster.conclusion" />
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
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
