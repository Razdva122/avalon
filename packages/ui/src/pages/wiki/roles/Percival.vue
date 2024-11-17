<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.percival') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('percival')" alt="percival" />

    <h2>{{ $t('percival.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="percival.percivalRole" />
    </p>

    <h2>{{ $t('percival.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('percival.understandYourRole') }}</strong>
        <LocalizedTextWrapper keypath="percival.youAreProtector" />
      </li>
      <li>
        <strong>{{ $t('percival.payAttentionToBehavior') }}</strong>
        <LocalizedTextWrapper keypath="percival.observeBehaviors" />
      </li>
      <li>
        <strong>{{ $t('percival.beSubtle') }}</strong>
        <LocalizedTextWrapper keypath="percival.beCarefulWithDefense" />
      </li>
    </ul>

    <h2>{{ $t('percival.strategicTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('percival.createAmbiguity') }}</strong>
        <LocalizedTextWrapper keypath="percival.actingUnsure" />
      </li>
      <li>
        <strong>{{ $t('percival.communicateThroughVotes') }}</strong>
        <LocalizedTextWrapper keypath="percival.votingPatterns" />
      </li>
      <li>
        <strong>{{ $t('percival.guideQuietly') }}</strong>
        <LocalizedTextWrapper keypath="percival.subtlyGuide" />
      </li>
      <li>
        <strong>{{ $t('percival.protectMerlinToTheEnd') }}</strong>
        <LocalizedTextWrapper keypath="percival.takingSuspicion" />
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="percival.playingAsPercival" />
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
