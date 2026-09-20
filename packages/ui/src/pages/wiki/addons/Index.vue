<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>{{ $t('wiki.addonsTitle') }}</h1>
    <div>
      <LocalizedTextWrapper keypath="wiki.addonsInfo" />
    </div>
    <nav class="wiki-nav" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'rules' }">{{ $t('wiki.rules') }}</LocaleLink>
      <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.roles') }}</LocaleLink>
      <LocaleLink :to="{ name: 'expansions' }">{{ $t('wiki.addons') }}</LocaleLink>
    </nav>
    <div class="addons-container">
      <LocaleLink class="addon" :to="{ name: 'lady_of_lake' }">
        <h2>{{ $t('addons.ladyOfLake') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'lady_of_lake')"
          :alt="$t('addons.ladyOfLake')"
          :description="$t('addons.ladyOfLake')"
        />
      </LocaleLink>
      <LocaleLink class="addon" :to="{ name: 'excalibur' }">
        <h2>{{ $t('addons.excalibur') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'excalibur')"
          :alt="$t('addons.excalibur')"
          :description="$t('addons.excalibur')"
        />
      </LocaleLink>
      <LocaleLink class="addon" :to="{ name: 'plot_cards' }">
        <h2>{{ $t('addons.plotCards') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'plot_cards')"
          :alt="$t('addons.plotCards')"
          :description="$t('addons.plotCards')"
        />
      </LocaleLink>
      <LocaleLink class="addon" :to="{ name: 'lady_of_sea' }">
        <h2>{{ $t('addons.ladyOfSea') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'lady_of_sea')"
          :alt="$t('addons.ladyOfSea')"
          :description="$t('addons.ladyOfSea')"
        />
      </LocaleLink>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import { getImagePathByID } from '@/helpers/images';

export default defineComponent({
  components: {
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
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  h2 {
    text-align: center;
  }
}

.addon {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 210px;
  max-width: 40%;
}

.addon-image {
  width: 67%;
  border: 2px solid black;
}
</style>
