<template>
  <div class="info-page-content">
    <h1 class="title">{{ $t('notFound.error') }}</h1>
    <div class="container">
      <img class="switch" :src="getImagePathByID('features', 'excalibur')" alt="excalibur" />
      <v-btn size="x-large" @click="$router.push({ name: 'lobby' })">{{ $t('notFound.switch') }}</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getImagePathByID } from '@/helpers/images';

export default defineComponent({
  data() {
    return {
      getImagePathByID,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.switch {
  max-width: 30%;
  margin-bottom: 10px;
  border: 5px solid black;
}
</style>
