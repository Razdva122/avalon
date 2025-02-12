<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.revealer') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('revealer')" alt="revealer" />

    <section>
      <h2>{{ $t('revealer.informationHeader') }}</h2>
      <p><LocalizedTextWrapper keypath="revealer.generalInformation" /></p>
    </section>

    <section>
      <h2>{{ $t('revealer.commonAdviceTitle') }}</h2>
      <ul>
        <li>
          <strong>{{ $t('revealer.commonAdviceTakeResponsibilityHeading') }}</strong>
          {{ $t('revealer.commonAdviceTakeResponsibilityText') }}
        </li>
        <li>
          <strong>{{ $t('revealer.commonAdviceConfuseOpponentsHeading') }}</strong>
          {{ $t('revealer.commonAdviceConfuseOpponentsText') }}
        </li>
      </ul>
    </section>

    <section>
      <h2>{{ $t('revealer.strategicAdviceTitle') }}</h2>
      <ul>
        <li>
          <strong>{{ $t('revealer.strategicAdviceControlMissionsHeading') }}</strong>
          {{ $t('revealer.strategicAdviceControlMissionsText') }}
        </li>
        <li>
          <strong>{{ $t('revealer.strategicAdvicePlanAheadHeading') }}</strong>
          {{ $t('revealer.strategicAdvicePlanAheadText') }}
        </li>
      </ul>
    </section>

    <section>
      <p><LocalizedTextWrapper keypath="revealer.description" /></p>
    </section>
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
