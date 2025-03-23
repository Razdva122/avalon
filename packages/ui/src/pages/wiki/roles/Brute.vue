<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.brute') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('brute')"
      :alt="$t('roles.brute')"
      :description="$t('roles.brute')"
    />

    <h2>{{ $t('brute.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="brute.roleDescription" />
    </p>

    <h2>{{ $t('brute.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('brute.earlyMissionFlexibility') }}</strong>
        <LocalizedTextWrapper keypath="brute.earlyMissionFlexibilityDescription" />
      </li>
      <li>
        <strong>{{ $t('brute.maintainUnpredictability') }}</strong>
        <LocalizedTextWrapper keypath="brute.maintainUnpredictabilityDescription" />
      </li>
      <li>
        <strong>{{ $t('brute.strategicSuccessLater') }}</strong>
        <LocalizedTextWrapper keypath="brute.strategicSuccessLaterDescription" />
      </li>
    </ul>

    <h2>{{ $t('brute.strategicTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('brute.earlyMissionAmbiguities') }}</strong>
        {{ $t('brute.earlyMissionAmbiguitiesDescription') }}
      </li>
      <li>
        <strong>{{ $t('brute.buildTrustEndgame') }}</strong>
        {{ $t('brute.buildTrustEndgameDescription') }}
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="brute.embraceCapabilities" />
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
