<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.merlin') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('merlin')" alt="merlin" />

    <h2>{{ $t('merlin.generalInformationTitle') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="merlin.generalInformationText" />
    </p>

    <h2>{{ $t('merlin.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('merlin.cautiousKnowledgeTitle') }}</strong>
        <span>
          <LocalizedTextWrapper keypath="merlin.cautiousKnowledgeText" />
        </span>
      </li>
      <li>
        <strong>{{ $t('merlin.useHintsWiselyTitle') }}</strong>
        <span>
          <LocalizedTextWrapper keypath="merlin.useHintsWiselyText" />
        </span>
      </li>
      <li>
        <strong>{{ $t('merlin.carefulAccusationsTitle') }}</strong>
        <span>{{ $t('merlin.carefulAccusationsText') }}</span>
      </li>
      <li>
        <strong>{{ $t('merlin.maintainBalanceTitle') }}</strong>
        <span>{{ $t('merlin.maintainBalanceText') }}</span>
      </li>
      <li>
        <strong>{{ $t('merlin.attentionAssassinTitle') }}</strong>
        <span>
          <LocalizedTextWrapper keypath="merlin.attentionAssassinText" />
        </span>
      </li>
    </ul>

    <h2>{{ $t('merlin.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('merlin.strategizeSilenceTitle') }}</strong> {{ $t('merlin.strategizeSilence') }}
      </li>
      <li>
        <strong>{{ $t('merlin.revealEvilsTitle') }}</strong> {{ $t('merlin.revealEvils') }}
      </li>
      <li>
        <strong>{{ $t('merlin.utilizeAmbiguityTitle') }}</strong> {{ $t('merlin.utilizeAmbiguity') }}
      </li>
      <li>
        <strong>{{ $t('merlin.buildTrustTitle') }}</strong> {{ $t('merlin.buildTrust') }}
      </li>
      <li>
        <strong>{{ $t('merlin.supportAlliesTitle') }}</strong> {{ $t('merlin.supportAllies') }}
      </li>
    </ul>

    <p>
      <localized-text-wrapper keypath="merlin.playingAsMerlin"></localized-text-wrapper>
    </p>
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
</style>
