<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('addons.ladyOfLake') }}</h1>
    <img class="preview-image" src="@/assets/features/lady_of_lake.webp" alt="lady" />
    <p>
      <strong>{{ $t('addons.ladyOfLake') }}</strong>
      <span v-html="$t('lady.intro')"></span>
    </p>

    <h2>{{ $t('lady.title') }}</h2>

    <ol>
      <li>
        <strong>{{ $t('lady.whenToUseIt') }}</strong>
        <LocalizedTextWrapper keypath="lady.comesIntoPlay" />
      </li>
      <li>
        <strong>{{ $t('lady.selectingTheHolder') }}</strong>
        <LocalizedTextWrapper keypath="lady.initiallyGetsPlayer" />
      </li>
      <li>
        <strong>{{ $t('lady.applyingTheAbility') }}</strong>
        <LocalizedTextWrapper keypath="lady.choosesPlayer" />
      </li>
      <li>
        <strong>{{ $t('lady.passingTheLady') }}</strong>
        <LocalizedTextWrapper keypath="lady.passesToChecked" />
      </li>
      <li>
        <strong>{{ $t('lady.restrictionRecurrent') }}</strong>
        <LocalizedTextWrapper keypath="lady.cannotCheckAgain" />
      </li>
      <li>
        <strong>{{ $t('lady.strategicUse') }}</strong>
        <LocalizedTextWrapper keypath="lady.strategicPossibilities" />
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
