<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.lunatic') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('lunatic')"
      :alt="$t('roles.lunatic')"
      :description="$t('roles.lunatic')"
    />

    <h2>{{ $t('lunatic.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="lunatic.roleDescription" />
    </p>

    <h2>{{ $t('lunatic.generalTipsHeader') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('lunatic.strategicFailure') }}</strong>
        {{ $t('lunatic.strategicFailureDetails') }}
      </li>
      <li>
        <strong>{{ $t('lunatic.deceiveWithBluff') }}</strong>
        {{ $t('lunatic.bluffTechnique') }}
      </li>
      <li>
        <strong>{{ $t('lunatic.covertSupportAllies') }}</strong>
        {{ $t('lunatic.subtleAlignment') }}
      </li>
    </ul>

    <h2>{{ $t('lunatic.strategicAdviceHeader') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('lunatic.monitorGameFlow') }}</strong>
        {{ $t('lunatic.disruptiveTiming') }}
      </li>
      <li>
        <strong>{{ $t('lunatic.avoidBehaviorPatterns') }}</strong>
        {{ $t('lunatic.confuseThroughInconsistency') }}
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="lunatic.roleConclusion" />
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
