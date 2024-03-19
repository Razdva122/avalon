<template>
  <div class="container">
    <router-link class="bread-crumb" v-for="(item, index) in items" :to="item.to">
      <span>{{ item.title }}</span>
      <span class="divider" v-if="index !== items.length - 1">/</span>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  computed: {
    items() {
      return new URL(window.location.href).pathname
        .split('/')
        .slice(1)
        .filter(Boolean)
        .map((el) => ({
          to: { name: el },
          title: el,
        }));
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
