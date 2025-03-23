<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('addons.ladyOfLake') }}</h1>
    <SchemaImage
      class="preview-image"
      :src="getImagePathByID('features', 'lady_of_lake')"
      :alt="$t('addons.ladyOfLake')"
      :description="$t('addons.ladyOfLake')"
    />
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
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import { getImagePathByID } from '@/helpers/images';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
  },
  data() {
    return {
      getImagePathByID,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
