<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('wiki.addons') }}</h1>
    <div class="addons-container">
      <router-link class="addon" :to="{ name: 'lady_of_lake' }">
        <h2>{{ $t('addons.ladyOfLake') }}</h2>
        <img class="addon-image" src="@/assets/features/lady_of_lake.webp" alt="lady" />
      </router-link>
      <router-link class="addon" :to="{ name: 'excalibur' }">
        <h2>{{ $t('addons.excalibur') }}</h2>
        <img class="addon-image" src="@/assets/features/excalibur.webp" alt="excalibur" />
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
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
