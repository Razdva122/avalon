<template>
  <div class="info-page-content guinevere">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.guinevere') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('guinevere')" alt="guinevere" />
    <div class="credits">{{ $t('guinevere.credits') }}</div>

    <h2>{{ $t('guinevere.generalInformationTitle') }}</h2>
    <p><LocalizedTextWrapper keypath="guinevere.generalInformationText" /></p>

    <h2>{{ $t('guinevere.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('guinevere.cautiousKnowledgeTitle') }}</strong>
        {{ $t('guinevere.cautiousKnowledgeText') }}
      </li>
      <li>
        <strong>{{ $t('guinevere.useHintsTitle') }}</strong>
        {{ $t('guinevere.useHintsText') }}
      </li>
      <li>
        <strong>{{ $t('guinevere.balanceGameplayTitle') }}</strong>
        {{ $t('guinevere.balanceGameplayText') }}
      </li>
    </ul>

    <h2>{{ $t('guinevere.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('guinevere.determineLancelotLoyaltyTitle') }}</strong>
        <LocalizedTextWrapper keypath="guinevere.determineLancelotLoyaltyText" />
      </li>
      <li>
        <strong>{{ $t('guinevere.strategizeSilenceTitle') }}</strong>
        {{ $t('guinevere.strategizeSilenceText') }}
      </li>
      <li>
        <strong>{{ $t('guinevere.buildTrustTitle') }}</strong>
        {{ $t('guinevere.buildTrustText') }}
      </li>
    </ul>

    <p><LocalizedTextWrapper keypath="guinevere.conclusionText" /></p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
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

.credits {
  float: right;
  clear: right;
  font-size: 14px;
  width: 30%;
  max-width: 450px;
  text-align: center;
  opacity: 0.6;
}
</style>
