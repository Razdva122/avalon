<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Addons</h1>
    <div class="addons-container">
      <a class="addon" @click="$router.push({ name: 'lady' })">
        <h2>Lady of the Lake</h2>
        <img class="addon-image" src="@/assets/features/lady_of_lake.png" alt="lady" />
      </a>
      <a class="addon" @click="$router.push({ name: 'excalibur' })">
        <h2>Excalibur</h2>
        <img class="addon-image" src="@/assets/features/excalibur.png" alt="excalibur" />
      </a>
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
