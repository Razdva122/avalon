<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('addons.ladyOfSea') }}</h1>
    <img class="preview-image" :src="getImagePathByID('features', 'lady_of_sea')" alt="ladySea" />
    <p>
      <LocalizedTextWrapper keypath="ladySea.intro" />
    </p>

    <h2>{{ $t('ladySea.title') }}</h2>

    <ol>
      <li>
        <strong>{{ $t('ladySea.howToUseTitle') }}</strong>
        <LocalizedTextWrapper keypath="ladySea.howToUseContent" />
      </li>
      <li>
        <strong>{{ $t('ladySea.complicationTitle') }}</strong>
        <LocalizedTextWrapper keypath="ladySea.complicationContent" />
      </li>
      <li>
        <strong>{{ $t('ladySea.additionalInformationTitle') }}</strong>
        <LocalizedTextWrapper keypath="ladySea.additionalInformationContent" />
      </li>
      <li>
        <strong>{{ $t('ladySea.rolesTitle') }}</strong>
        <LocalizedTextWrapper keypath="ladySea.rolesContent" />
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { getImagePathByID } from '@/helpers/images';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
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
