<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.merlinPure') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('merlinPure')"
      :alt="$t('roles.merlinpure')"
      :description="$t('roles.merlinpure')"
    />

    <h2>{{ $t('merlinPure.generalInformationTitle') }}</h2>
    <p><LocalizedTextWrapper keypath="merlinPure.generalInformationText" /></p>

    <h2>{{ $t('merlinPure.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('merlinPure.tipDiscretionTitle') }}</strong>
        {{ $t('merlinPure.tipDiscretionText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipNuancedHintsTitle') }}</strong>
        {{ $t('merlinPure.tipNuancedHintsText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipAvoidAccusationsTitle') }}</strong>
        <LocalizedTextWrapper keypath="merlinPure.tipAvoidAccusationsText" />
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipBalanceIntelTitle') }}</strong>
        {{ $t('merlinPure.tipBalanceIntelText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipWatchAssassinTitle') }}</strong>
        {{ $t('merlinPure.tipWatchAssassinText') }}
      </li>
    </ul>

    <h2>{{ $t('merlinPure.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('merlinPure.tipAmbiguityTitle') }}</strong>
        {{ $t('merlinPure.tipAmbiguityText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipGradualRevealTitle') }}</strong>
        {{ $t('merlinPure.tipGradualRevealText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipHintNotDeclareTitle') }}</strong>
        {{ $t('merlinPure.tipHintNotDeclareText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipAddressWithoutConfirmTitle') }}</strong>
        {{ $t('merlinPure.tipAddressWithoutConfirmText') }}
      </li>
      <li>
        <strong>{{ $t('merlinPure.tipSupportDiscoveryTitle') }}</strong>
        {{ $t('merlinPure.tipSupportDiscoveryText') }}
      </li>
    </ul>

    <p><LocalizedTextWrapper keypath="merlinPure.conclusionText" /></p>
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
