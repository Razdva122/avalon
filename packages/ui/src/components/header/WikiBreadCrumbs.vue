<template>
  <div class="container">
    <router-link class="bread-crumb" v-for="(item, index) in items" :key="item.to" :to="item.to">
      <span>{{ item.title }}</span>
      <span class="divider" v-if="index !== items.length - 1">/</span>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, unref } from 'vue';
import { basePath, localizedPath } from '@/router/paths';

export default defineComponent({
  computed: {
    items() {
      const parts = basePath(this.$route.path).split('/').filter(Boolean);
      return parts.map((el, index) => ({
        to: localizedPath('/' + parts.slice(0, index + 1).join('/'), unref(this.$i18n.locale)),
        title: this.$t(`breadCrumbs.${el}`),
      }));
    },
  },
  watch: {
    items: {
      immediate: true,
      handler() {
        document.querySelector('script[type="application/ld+json"]')!.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: this.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            item: 'https://avalon-game.com' + item.to,
          })),
        });
      },
    },
  },
  beforeUnmount() {
    document.querySelector('script[type="application/ld+json"]')!.innerHTML = ``;
  },
});
</script>

<style scoped lang="scss">
.bread-crumb {
  font-size: 22px;
  text-transform: capitalize;
}

.router-link-exact-active {
  opacity: 0.4;
}

.divider {
  margin: 0 8px;
}

.container {
  padding: 16px 12px;
}
</style>
