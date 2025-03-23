<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.troublemaker') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('troublemaker')"
      :alt="$t('roles.troublemaker')"
      :description="$t('roles.troublemaker')"
    />

    <h2>{{ $t('troublemaker.generalInformation') }}</h2>
    <p><LocalizedTextWrapper keypath="troublemaker.intro" /></p>

    <h2>{{ $t('troublemaker.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('troublemaker.generalTipsRevealTitle') }}:</strong>
        <LocalizedTextWrapper keypath="troublemaker.generalTipsRevealDesc" />
      </li>
      <li>
        <strong>{{ $t('troublemaker.generalTipsCounteractTitle') }}:</strong>
        <LocalizedTextWrapper keypath="troublemaker.generalTipsCounteractDesc" />
      </li>
    </ul>

    <h2>{{ $t('troublemaker.strategicTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('troublemaker.strategicTipsMonitorTitle') }}:</strong>
        {{ $t('troublemaker.strategicTipsMonitorDesc') }}
      </li>
      <li>
        <strong>{{ $t('troublemaker.strategicTipsControlTitle') }}:</strong>
        <LocalizedTextWrapper keypath="troublemaker.strategicTipsControlDesc" />
      </li>
      <li>
        <strong>{{ $t('troublemaker.strategicTipsAlliancesTitle') }}:</strong>
        {{ $t('troublemaker.strategicTipsAlliancesDesc') }}
      </li>
      <li>
        <strong>{{ $t('troublemaker.strategicTipsAdaptTitle') }}:</strong>
        {{ $t('troublemaker.strategicTipsAdaptDesc') }}
      </li>
    </ul>

    <p><LocalizedTextWrapper keypath="troublemaker.conclusion" /></p>
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
