<template>
  <div class="info-page-content lancelots">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.lancelots') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('evilLancelot')"
      :alt="$t('roles.lancelots')"
      :description="$t('roles.lancelots')"
    />
    <img class="preview-image" :src="calculateRoleUrl('goodLancelot')" alt="good lancelot" />

    <h2>{{ $t('lancelots.generalInformationTitle') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="lancelots.introduction" />
      <LocalizedTextWrapper keypath="lancelots.loyaltyTides" />
      <LocalizedTextWrapper keypath="lancelots.goodAndEvilRecognition" />
      <LocalizedTextWrapper keypath="lancelots.guinevereKnowledge" />
    </p>
    <p>
      <span v-html="$t('lancelots.gameplayKeyConcept')"></span>
      <span v-html="$t('lancelots.loyaltyChangeMechanism')"></span>
      <span v-html="$t('lancelots.deckComposition')"></span>
    </p>
    <p>
      <LocalizedTextWrapper keypath="lancelots.possibleResults" />
    </p>

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
      <li>
        <strong>{{ $t('lancelots.subtlePlaysTitle') }}</strong>
        {{ $t('lancelots.subtlePlaysDescription') }}
      </li>
    </ul>

    <h2>{{ $t('lancelots.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('lancelots.merlinsPerceptionTitle') }}</strong>
        <LocalizedTextWrapper keypath="lancelots.merlinsPerceptionDescription" />
      </li>
      <li>
        <strong>{{ $t('lancelots.balanceTheScalesTitle') }}</strong>
        {{ $t('lancelots.balanceTheScalesDescription') }}
      </li>
      <li>
        <strong>{{ $t('lancelots.maintainYourCoverTitle') }}</strong>
        {{ $t('lancelots.maintainYourCoverDescription') }}
      </li>
    </ul>

    <p>
      {{ $t('lancelots.servingAsLancelotDescription') }}
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

.lancelots {
  .preview-image {
    width: 25%;
    max-width: 350px;
  }
}
</style>
