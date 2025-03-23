<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('addons.excalibur') }}</h1>
    <SchemaImage
      class="preview-image"
      :src="getImagePathByID('features', 'excalibur')"
      :alt="$t('addons.excalibur')"
      :description="$t('addons.excalibur')"
    />
    <p><LocalizedTextWrapper keypath="excalibur.intro" /></p>

    <h2>{{ $t('excalibur.title') }}</h2>

    <ol>
      <li>
        <strong>{{ $t('excalibur.assign') }}</strong>
        <LocalizedTextWrapper keypath="excalibur.leaderInstructions" />
      </li>
      <li>
        <strong>{{ $t('excalibur.voting') }}</strong>
        <LocalizedTextWrapper keypath="excalibur.votingInstructions" />
      </li>
      <li>
        <strong>{{ $t('excalibur.usage') }}</strong>
        <LocalizedTextWrapper keypath="excalibur.usageInstructions" />
      </li>
      <li>
        <strong>{{ $t('excalibur.transparency') }}</strong>
        <LocalizedTextWrapper keypath="excalibur.transparencyInstructions" />
      </li>
      <li>
        <strong>{{ $t('excalibur.strategicValue') }}</strong>
        <LocalizedTextWrapper keypath="excalibur.strategicInstructions" />
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
