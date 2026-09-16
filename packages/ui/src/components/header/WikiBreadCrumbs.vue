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
