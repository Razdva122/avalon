<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.cleric') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('cleric')"
      :alt="$t('roles.cleric')"
      :description="$t('roles.cleric')"
    />

    <section>
      <h2>{{ $t('cleric.informationHeader') }}</h2>
      <p><LocalizedTextWrapper keypath="cleric.generalInformation" /></p>
    </section>

    <section>
      <h2>{{ $t('cleric.generalTipsHeader') }}</h2>
      <ul>
        <li>
          <strong>{{ $t('cleric.generalTipsRoleUnderstandingHeading') }}</strong>
          {{ $t('cleric.generalTipsRoleUnderstandingText') }}
        </li>
        <li>
          <strong>{{ $t('cleric.generalTipsLoyaltyCautionHeading') }}</strong>
          {{ $t('cleric.generalTipsLoyaltyCautionText') }}
        </li>
        <li>
          <strong>{{ $t('cleric.generalTipsStealthHeading') }}</strong>
          {{ $t('cleric.generalTipsStealthText') }}
        </li>
      </ul>
    </section>

    <section>
      <h2>{{ $t('cleric.strategicTipsHeader') }}</h2>
      <ul>
        <li>
          <strong>{{ $t('cleric.informationSafetyHeading') }}</strong>
          {{ $t('cleric.informationSafetyText') }}
        </li>
        <li>
          <strong>{{ $t('cleric.tacticalRevealHeading') }}</strong>
          {{ $t('cleric.tacticalRevealText') }}
        </li>
        <li>
          <strong>{{ $t('cleric.actionCommunicationHeading') }}</strong>
          {{ $t('cleric.actionCommunicationText') }}
        </li>
      </ul>
    </section>

    <section>
      <p><LocalizedTextWrapper keypath="cleric.conclusion" /></p>
    </section>
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
