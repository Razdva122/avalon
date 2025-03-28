<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('wiki.addonsTitle') }}</h1>
    <div>
      <LocalizedTextWrapper keypath="wiki.addonsInfo" />
    </div>
    <div class="addons-container">
      <router-link class="addon" :to="{ name: 'lady_of_lake' }">
        <h2>{{ $t('addons.ladyOfLake') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'lady_of_lake')"
          :alt="$t('addons.ladyOfLake')"
          :description="$t('addons.ladyOfLake')"
        />
      </router-link>
      <router-link class="addon" :to="{ name: 'excalibur' }">
        <h2>{{ $t('addons.excalibur') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'excalibur')"
          :alt="$t('addons.excalibur')"
          :description="$t('addons.excalibur')"
        />
      </router-link>
      <router-link class="addon" :to="{ name: 'plot_cards' }">
        <h2>{{ $t('addons.plotCards') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'plot_cards')"
          :alt="$t('addons.plotCards')"
          :description="$t('addons.plotCards')"
        />
      </router-link>
      <router-link class="addon" :to="{ name: 'lady_of_sea' }">
        <h2>{{ $t('addons.ladyOfSea') }}</h2>
        <SchemaImage
          class="addon-image"
          :src="getImagePathByID('features', 'lady_of_sea')"
          :alt="$t('addons.ladyOfSea')"
          :description="$t('addons.ladyOfSea')"
        />
      </router-link>
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
