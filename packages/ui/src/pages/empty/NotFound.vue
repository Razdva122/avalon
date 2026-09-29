<template>
  <div class="info-page-content not-found-page">
    <h1 class="title">{{ $t('notFound.error') }}</h1>
    <div class="container">
      <img class="switch" :src="getImagePathByID('features', 'excalibur')" alt="" />
      <LocaleLink class="return-link" :to="{ name: 'lobby' }">{{ $t('notFound.switch') }}</LocaleLink>
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

.not-found-page {
  max-width: 720px;
  h1 {
    text-align: center;
  }
}
.return-link {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin-top: 16px;
  padding: 12px 24px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.switch {
  width: min(260px, 65vw);
  max-width: 100%;
  border-radius: 18px;
  margin-bottom: 10px;
  border: 1px solid rgb(var(--v-theme-surface-border));
}
</style>
