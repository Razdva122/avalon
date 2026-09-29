<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>{{ $t('expansions.seoHeading') }}</h1>
    <div>
      <LocalizedTextWrapper keypath="expansions.intro" />
    </div>
    <nav class="wiki-nav" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'rules' }">{{ $t('wiki.rules') }}</LocaleLink>
      <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.roles') }}</LocaleLink>
      <LocaleLink :to="{ name: 'expansions' }">{{ $t('wiki.addons') }}</LocaleLink>
    </nav>
    <h2>{{ $t('expansions.chooseTitle') }}</h2>
    <p><LocalizedTextWrapper keypath="expansions.chooseText" /></p>
    <div class="addons-container">
      <LocaleLink class="addon" :to="{ name: 'lady_of_lake' }">
        <h2>{{ $t('addons.ladyOfLake') }}</h2>
        <p>{{ $t('expansions.ladyText') }}</p>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'lady_of_lake')"
          :alt="$t('addons.ladyOfLake')"
          :description="$t('addons.ladyOfLake')"
        />
      </LocaleLink>
      <LocaleLink class="addon" :to="{ name: 'excalibur' }">
        <h2>{{ $t('addons.excalibur') }}</h2>
        <p>{{ $t('expansions.excaliburText') }}</p>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'excalibur')"
          :alt="$t('addons.excalibur')"
          :description="$t('addons.excalibur')"
        />
      </LocaleLink>
      <LocaleLink class="addon" :to="{ name: 'plot_cards' }">
        <h2>{{ $t('addons.plotCards') }}</h2>
        <p>{{ $t('expansions.plotCardsText') }}</p>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'plot_cards')"
          :alt="$t('addons.plotCards')"
          :description="$t('addons.plotCards')"
        />
      </LocaleLink>
      <LocaleLink class="addon" :to="{ name: 'lady_of_sea' }">
        <h2>{{ $t('addons.ladyOfSea') }}</h2>
        <p>{{ $t('expansions.ladySeaText') }}</p>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'lady_of_sea')"
          :alt="$t('addons.ladyOfSea')"
          :description="$t('addons.ladyOfSea')"
        />
      </LocaleLink>
    </div>
    <section class="wiki-panel">
      <h2>{{ $t('expansions.compatibilityTitle') }}</h2>
      <p><LocalizedTextWrapper keypath="expansions.compatibilityText" /></p>
    </section>
    <WikiPlayCta />
  </div>
</template>

<script lang="ts">
import WikiPlayCta from '@/components/view/information/WikiPlayCta.vue';
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import { getImagePathByID } from '@/helpers/images';

export default defineComponent({
  components: {
    WikiPlayCta,
    WikiBreadCrumbs,
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
@import '@/styles/wiki-page.scss';

.addons-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}
.addon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 16px;
  color: inherit;
  text-decoration: none;
  h2 {
    text-align: center;
    margin-top: 0;
  }
  p {
    flex: 1;
  }
  &:hover {
    background: rgba(var(--v-theme-primary), 0.06);
  }
}
.addon-image {
  width: 160px;
  max-width: 100%;
  border-radius: 12px;
  overflow: hidden;
}
@media (max-width: 700px) {
  .addons-container {
    grid-template-columns: 1fr;
  }
}
</style>
