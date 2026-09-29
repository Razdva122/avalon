<template>
  <nav class="wiki-breadcrumbs" :aria-label="$t('wiki.title')">
    <router-link
      class="bread-crumb"
      v-for="(item, index) in items"
      :key="item.to"
      :to="item.to"
      :aria-current="index === items.length - 1 ? 'page' : undefined"
    >
      <span>{{ item.title }}</span>
      <span class="divider" aria-hidden="true" v-if="index !== items.length - 1">/</span>
    </router-link>
  </nav>
</template>

<script lang="ts">
import { defineComponent, unref } from 'vue';
import { wikiBreadcrumbs } from '@/router/breadcrumbs';

export default defineComponent({
  computed: {
    items() {
      return wikiBreadcrumbs(this.$route.path, unref(this.$i18n.locale), (key) => this.$t(key));
    },
  },
});
</script>

<style scoped lang="scss">
.wiki-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin: 0 0 10px;
}
.bread-crumb {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  font-size: 14px;
  line-height: 1.5;
  color: rgb(var(--v-theme-text-secondary));
}
.bread-crumb:hover {
  color: rgb(var(--v-theme-primary));
}
.router-link-exact-active {
  color: rgb(var(--v-theme-text-primary));
}
.divider {
  margin: 0 10px;
  opacity: 0.6;
}
</style>
